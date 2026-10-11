import type { EvaluationItem } from '../types';
import type { ResponseMap } from './session';

/** Downloads every answer for this participant as a JSON file, in the order they saw the items. */
export function exportResponses(participantId: string, order: EvaluationItem[], responses: ResponseMap): void {
  const exportedAt = new Date().toISOString();
  const payload = {
    participantId,
    exportedAt,
    responses: order.map((item, i) => {
      const r = responses[item.id];
      return {
        participantId,
        itemId: item.id,
        pairId: item.pair_id,
        shownOrder: i + 1,
        judgement: r?.judgement ?? null,
        comment: r?.comment ?? '',
        timeOnItemSeconds: Math.round(r?.timeOnItemSeconds ?? 0),
      };
    }),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `doorway-${participantId.replace(/[^\w-]+/g, '_')}-${exportedAt.replace(/[:.]/g, '-')}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
