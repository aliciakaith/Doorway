import type { EvaluationItem } from '../types';

export const SCOPE_LABEL: Record<EvaluationItem['scope'], string> = {
  Session: 'Ending this conversation',
  App: 'Reducing use of the app',
};

/** Corpus view only: how softened the exit was. */
export const MITIGATION_LABEL: Record<'low' | 'high', string> = {
  low: 'Plainly stated',
  high: 'With reluctance and warmth',
};

/** "SELF-BLAME" -> "Self-blame", "CLOSING-SLOT Q" -> "Closing-slot Q". Words of one or two letters keep their case. */
export function formatBehaviour(code: string): string {
  return code
    .split(' ')
    .map((w, i) => (w.length <= 2 ? w : i === 0 ? w.charAt(0) + w.slice(1).toLowerCase() : w.toLowerCase()))
    .join(' ');
}
