export interface RankedId {
  id: string;
}

/**
 * Reciprocal Rank Fusion. Fusiona N listas ya ordenadas (mejor primero).
 * score(id) = Σ 1 / (k + rank_en_lista_i).  k=60 es el valor canónico.
 * No necesita normalizar escalas (ts_rank vs cosine) — solo posiciones.
 */
export function reciprocalRankFusion(
  lists: RankedId[][],
  k = 60,
): Array<{ id: string; score: number }> {
  const scores = new Map<string, number>();

  for (const list of lists) {
    list.forEach((item, idx) => {
      const prev = scores.get(item.id) ?? 0;
      scores.set(item.id, prev + 1 / (k + idx + 1));
    });
  }

  return [...scores.entries()]
    .map(([id, score]) => ({ id, score }))
    .sort((a, b) => b.score - a.score);
}