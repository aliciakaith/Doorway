import type { ItemResponse } from './session';

export type SaveState = 'idle' | 'saving' | 'saved' | 'failed';

/**
 * Sends one response to /api/responses, which writes it to Supabase. The Supabase key
 * lives only in Vercel's environment variables. A failure never blocks the participant:
 * everything is still in memory and in the final export.
 */
export async function saveResponse(participantId: string, r: ItemResponse): Promise<boolean> {
  try {
    const res = await fetch('/api/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participantId,
        itemId: r.itemId,
        pairId: r.pairId,
        shownOrder: r.shownOrder,
        judgement: r.judgement,
        comment: r.comment,
        timeOnItemSeconds: Math.round(r.timeOnItemSeconds),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
