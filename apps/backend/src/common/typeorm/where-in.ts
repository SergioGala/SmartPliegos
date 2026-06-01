import type { WhereExpressionBuilder } from 'typeorm';

/**
 * Aplica un `andWhere(... IN (:...key))` de forma segura:
 *  - normaliza un valor escalar a array (evita el crash `value.map is not a function`
 *    cuando un filtro de un solo valor llega como string en vez de array)
 *  - no añade nada si el valor es null/undefined o el array está vacío
 *
 * @example whereIn(qb, 'l.estado', 'estados', dto.estado)
 */
export function whereIn(
  qb: WhereExpressionBuilder,
  expression: string,
  paramKey: string,
  value: string | string[] | null | undefined,
): void {
  if (value == null) return;
  const values = Array.isArray(value) ? value : [value];
  if (values.length === 0) return;
  qb.andWhere(`${expression} IN (:...${paramKey})`, { [paramKey]: values });
}