import type { ConversationItem } from '../types';
import type { ResponseMap } from './storage';

/** Downloads every answer for this participant as a JSON file. */
export function exportResponses(participant: string, items: ConversationItem[], responses: ResponseMap): void {
  const exportedAt = new Date().toISOString();
  const rows = items.map((item, i) => {
    const r = responses[item.id];
    return {
      position: i + 1,
      itemId: item.id,
      platform: item.platform,
      companion: item.companion,
      probeId: item.probeId,
      verdictShown: item.result.verdict,
      judgement: r?.judgement ?? null,
      comment: r?.comment ?? '',
      firstAnsweredAt: r?.firstAnsweredAt ?? null,
      updatedAt: r?.updatedAt ?? null,
      judgementHistory: r?.judgementHistory ?? [],
    };
  });
  const payload = {
    participantCode: participant,
    exportedAt,
    totalItems: items.length,
    answeredCount: rows.filter((r) => r.judgement !== null).length,
    responses: rows,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `doorway-${participant.replace(/[^\w-]+/g, '_')}-${exportedAt.replace(/[:.]/g, '-')}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
