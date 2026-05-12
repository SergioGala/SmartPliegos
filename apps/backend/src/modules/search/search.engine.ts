import { Injectable, Logger } from '@nestjs/common';
import { StemmingEngine } from './engines/stemming.engine';
import { FuzzyEngine } from './engines/fuzzy.engine';
import { RankingEngine } from './engines/ranking.engine';
import { ContextValidator } from './validators/context.validator';
import { BlacklistValidator } from './validators/blacklist.validator';
import { ScoringValidator } from './validators/scoring.validator';
import { ScoreCalculator } from './scoring/score-calculator';
import { ConfidenceEvaluator } from './scoring/confidence-evaluator';
import {
  SearchResult,
  SearchOptions,
} from './interfaces/search-result.interface';
import { SEARCH_CONFIG } from './constants/search-config';

type Confidence = 'HIGH' | 'MEDIUM' | 'LOW';

interface SearchBatchItem {
  title: string;
  description: string;
}

interface ScoredItem<T extends SearchBatchItem> {
  item: T;
  searchScore: number;
  searchConfidence: Confidence;
}

@Injectable()
export class SearchEngineService {
  private readonly logger = new Logger(SearchEngineService.name);

  constructor(
    private readonly stemming: StemmingEngine,
    private readonly fuzzy: FuzzyEngine,
    private readonly ranking: RankingEngine,
    private readonly contextValidator: ContextValidator,
    private readonly blacklistValidator: BlacklistValidator,
    private readonly scoringValidator: ScoringValidator,
    private readonly scoreCalculator: ScoreCalculator,
    private readonly confidenceEvaluator: ConfidenceEvaluator,
  ) {}

  search(
    searchTerm: string,
    title: string,
    description: string,
    options: SearchOptions = {},
  ): SearchResult {
    try {
      if (!searchTerm || !title || !description) {
        return this.createEmptyResult('Entrada vacía');
      }

      if (searchTerm.length > SEARCH_CONFIG.LIMITS.MAX_QUERY_LENGTH) {
        return this.createEmptyResult('Término muy largo');
      }

      const finalOptions = this.applyDefaultOptions(options);

      const { score, breakdown } = this.calculateScore(
        searchTerm,
        title,
        description,
        finalOptions,
      );

      const hasContext = finalOptions.validateContext
        ? this.contextValidator.validateContext(title + ' ' + description, [
            searchTerm,
          ])
        : true;

      const confidence = this.confidenceEvaluator.evaluateConfidence({
        score,
        hasExactMatch: breakdown?.exactMatch ? breakdown.exactMatch > 0 : false,
        hasContext,
        isInBlacklist: false,
      });

      const threshold =
        finalOptions.scoreThreshold ||
        SEARCH_CONFIG.THRESHOLDS.SCORE_MIN_FOR_MATCH;
      const matched = score >= threshold && confidence !== 'LOW';

      const reason = this.generateReason(breakdown, score, confidence, matched);

      return {
        matched,
        score: Math.round(score),
        confidence,
        reason,
        breakdown,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown';
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error en búsqueda: ${message}`, stack);
      return this.createEmptyResult(`Error: ${message}`);
    }
  }

  searchMultiple(
    searchTerms: string[],
    title: string,
    description: string,
    options: SearchOptions = {},
  ): SearchResult {
    if (!searchTerms || searchTerms.length === 0) {
      return this.createEmptyResult('Sin términos para buscar');
    }

    const results = searchTerms
      .map((term) => this.search(term, title, description, options))
      .filter((r) => r.matched);

    if (results.length === 0) {
      return this.createEmptyResult('Ningún término coincide');
    }

    const best = results.reduce((bestSoFar, current) =>
      current.score > bestSoFar.score ? current : bestSoFar,
    );

    return {
      ...best,
      reason: `Mejor coincidencia de ${searchTerms.length} términos: ${best.reason}`,
    };
  }

  searchWithSemantics(
    keywords: string[],
    title: string,
    description: string,
    contextKeywords?: string[],
  ): SearchResult {
    const options: SearchOptions = {
      validateContext: !!contextKeywords,
      allowFuzzy: true,
      applyStemming: true,
    };

    if (contextKeywords && contextKeywords.length > 0) {
      const hasContext = this.contextValidator.validateContext(
        title + ' ' + description,
        contextKeywords,
      );

      if (!hasContext) {
        return this.createEmptyResult('No hay contexto relevante');
      }
    }

    return this.searchMultiple(keywords, title, description, options);
  }

  searchBatch<T extends SearchBatchItem>(
    searchTerms: string[],
    items: T[],
    options: SearchOptions = {},
  ): Array<ScoredItem<T>> {
    const results: Array<ScoredItem<T>> = [];

    for (const item of items) {
      const result = this.searchMultiple(
        searchTerms,
        item.title,
        item.description,
        options,
      );

      if (result.matched) {
        results.push({
          item,
          searchScore: result.score,
          searchConfidence: result.confidence,
        });
      }
    }

    return results.sort((a, b) => b.searchScore - a.searchScore);
  }

  private calculateScore(
    searchTerm: string,
    title: string,
    description: string,
    options: SearchOptions,
  ): {
    score: number;
    breakdown: SearchResult['breakdown'];
  } {
    const ranking = this.ranking.getScoreBreakdown(
      searchTerm,
      title,
      description,
    );

    let baseScore = Math.max(ranking.titleScore, ranking.descriptionScore);
    let contextBonus = 0;
    let fuzzyPenalty = 0;

    if (baseScore === 0 && options.applyStemming) {
      const stemScore = this.ranking.scoreMultipleMatches(
        [searchTerm],
        title,
        description,
      );
      baseScore = stemScore * 0.8;
    }

    if (baseScore === 0 && options.allowFuzzy) {
      if (
        this.fuzzy.searchInText(
          searchTerm,
          title + ' ' + description,
          options.fuzzyDistance || SEARCH_CONFIG.FUZZY.DEFAULT_DISTANCE,
        )
      ) {
        baseScore = 30;
      }
    }

    if (options.validateContext && baseScore > 0) {
      const contextMatches = this.contextValidator.countContextMatches(
        title + ' ' + description,
        [searchTerm],
      );
      contextBonus = this.scoreCalculator.calculateContextBonus(
        contextMatches.percentage,
      );
    }

    if (ranking.hasFuzzyMatch && !ranking.hasExactMatch) {
      fuzzyPenalty = 10;
    }

    const finalScore = this.scoreCalculator.calculateFinalScore({
      baseScore,
      contextBonus,
      fuzzyPenalty,
      hasExactMatch: ranking.hasExactMatch,
      hasStemMatch: ranking.hasStemMatch,
    });

    return {
      score: finalScore,
      breakdown: {
        exactMatch: ranking.hasExactMatch
          ? SEARCH_CONFIG.SCORING.EXACT_TITLE
          : 0,
        stemming: ranking.hasStemMatch
          ? SEARCH_CONFIG.SCORING.STEMMING_TITLE
          : 0,
        fuzzy: ranking.hasFuzzyMatch ? SEARCH_CONFIG.SCORING.FUZZY_MATCH : 0,
        contextual: contextBonus,
        total: Math.round(finalScore),
      },
    };
  }

  private generateReason(
    breakdown: SearchResult['breakdown'],
    score: number,
    confidence: Confidence,
    matched: boolean,
  ): string {
    if (!matched) {
      return `Score ${Math.round(score)} insuficiente (mínimo requerido: ${SEARCH_CONFIG.THRESHOLDS.SCORE_MIN_FOR_MATCH})`;
    }

    const parts: string[] = [];

    if (breakdown?.exactMatch && breakdown.exactMatch > 0) {
      parts.push(`Exacto (+${breakdown.exactMatch})`);
    }
    if (breakdown?.stemming && breakdown.stemming > 0) {
      parts.push(`Stemming (+${breakdown.stemming})`);
    }
    if (breakdown?.fuzzy && breakdown.fuzzy > 0) {
      parts.push(`Aproximado (+${breakdown.fuzzy})`);
    }
    if (breakdown?.contextual && breakdown.contextual > 0) {
      parts.push(`Contexto (+${breakdown.contextual})`);
    }

    return (
      `Coincidencia ${confidence}: ${parts.join(', ')}` +
      ` (Total: ${Math.round(score)}/100)`
    );
  }

  private createEmptyResult(reason: string): SearchResult {
    return {
      matched: false,
      score: 0,
      confidence: 'LOW',
      reason,
      breakdown: {
        exactMatch: 0,
        stemming: 0,
        fuzzy: 0,
        contextual: 0,
        total: 0,
      },
    };
  }

  private applyDefaultOptions(options: SearchOptions): Required<SearchOptions> {
    return {
      fields: options.fields ?? 'both',
      allowFuzzy: options.allowFuzzy ?? true,
      fuzzyDistance:
        options.fuzzyDistance ?? SEARCH_CONFIG.FUZZY.DEFAULT_DISTANCE,
      applyStemming: options.applyStemming ?? true,
      ignoreStopwords: options.ignoreStopwords ?? true,
      scoreThreshold:
        options.scoreThreshold ??
        SEARCH_CONFIG.THRESHOLDS.SCORE_MIN_FOR_MATCH,
      validateContext: options.validateContext ?? true,
      useBlacklist: options.useBlacklist ?? true,
    };
  }
}