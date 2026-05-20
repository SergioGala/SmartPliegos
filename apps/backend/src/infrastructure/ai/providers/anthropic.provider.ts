import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { config } from '../../../config/env.config';
import type {
  ILLMProvider,
  LLMCompletionRequest,
  LLMCompletionResult,
} from '../ai.types';

@Injectable()
export class AnthropicProvider implements ILLMProvider {
  public readonly name = 'anthropic' as const;
  private readonly logger = new Logger(AnthropicProvider.name);
  private readonly client: Anthropic | null;
  private readonly model = config.ai.anthropic.model;

  constructor() {
    const apiKey = config.ai.anthropic.apiKey;
    this.client = apiKey ? new Anthropic({ apiKey }) : null;
    if (!this.client) {
      this.logger.warn('AnthropicProvider not configured (ANTHROPIC_API_KEY missing); LLM features disabled');
    }
  }

  get isConfigured(): boolean {
    return this.client !== null;
  }

  async complete(req: LLMCompletionRequest): Promise<LLMCompletionResult> {
    if (!this.client) {
      throw new Error('AnthropicProvider not configured: set ANTHROPIC_API_KEY');
    }

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: req.maxTokens ?? 1024,
      temperature: req.temperature ?? 0.2,
      system: req.system,
      messages: [{ role: 'user', content: req.user }],
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    return {
      text,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      model: response.model,
    };
  }

  async ping(): Promise<boolean> {
    if (!this.client) return false;
    try {
      // Llamada barata: 1 token de output máximo.
      await this.client.messages.create({
        model: this.model,
        max_tokens: 1,
        messages: [{ role: 'user', content: 'ping' }],
      });
      return true;
    } catch (err) {
      this.logger.error(`Anthropic ping failed: ${err instanceof Error ? err.message : 'unknown'}`);
      return false;
    }
  }
}