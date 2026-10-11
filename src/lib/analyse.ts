import type { Detector } from '../types';

export type AnalyseOutcome = { ok: true; detector: Detector } | { ok: false; message: string };

const VERDICTS = ['Present', 'Absent', 'Borderline'];

/**
 * Calls the live endpoint in api/analyze.ts. The API key never reaches the browser.
 * Error messages from the endpoint (400, 500, 502) are shown to the user as they are.
 */
export async function analyseFarewell(userMessage: string, aiReply: string): Promise<AnalyseOutcome> {
  let res: Response;
  try {
    res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userMessage, aiReply }),
    });
  } catch {
    return { ok: false, message: 'Could not reach the analysis service. Check your connection and try again.' };
  }

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // not JSON, handled below
  }
  const obj = body && typeof body === 'object' ? (body as Record<string, unknown>) : null;

  if (!res.ok) {
    if (obj && typeof obj.error === 'string') return { ok: false, message: obj.error };
    if (res.status === 404) {
      return { ok: false, message: 'The analysis endpoint is not available here. Use the deployed site, or run it locally with "vercel dev".' };
    }
    return { ok: false, message: `The analysis service returned an error (${res.status}). Try again in a moment.` };
  }

  if (!obj || !VERDICTS.includes(obj.verdict as string) || !Array.isArray(obj.tactics)) {
    return { ok: false, message: 'The analysis service returned a result this page could not read. Try again.' };
  }
  return { ok: true, detector: { ...(obj as unknown as Detector), runsAgreed: null } };
}
