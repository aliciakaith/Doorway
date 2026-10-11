/**
 * Stores one participant response in Supabase.
 *
 * POST /api/responses
 *   { participantId, itemId, shownOrder, judgement, comment, timeOnItemSeconds }
 *
 * Upserts on (participant_id, item_id), so changing an answer updates the same row.
 * Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the Vercel project settings.
 * The service role key stays on the server; the browser never sees it.
 * Table definition: supabase/schema.sql.
 */

const MAX_COMMENT_CHARS = 5000;

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return res.status(500).json({ error: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set on the server" });
  }

  const b = req.body ?? {};
  const participantId = String(b.participantId ?? "").trim();
  const itemId = String(b.itemId ?? "").trim();
  const shownOrder = Number(b.shownOrder);
  const judgement = b.judgement;
  const comment = String(b.comment ?? "");
  const timeOnItemSeconds = Number(b.timeOnItemSeconds ?? 0);

  if (
    !participantId || participantId.length > 64 ||
    !itemId || itemId.length > 64 ||
    !Number.isInteger(shownOrder) || shownOrder < 1 || shownOrder > 50 ||
    (judgement !== "agree" && judgement !== "disagree") ||
    comment.length > MAX_COMMENT_CHARS ||
    !Number.isFinite(timeOnItemSeconds) || timeOnItemSeconds < 0
  ) {
    return res.status(400).json({ error: "Invalid response payload." });
  }

  try {
    const r = await fetch(`${url}/rest/v1/responses?on_conflict=participant_id,item_id`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({
        participant_id: participantId,
        item_id: itemId,
        shown_order: shownOrder,
        judgement,
        comment,
        time_on_item_seconds: Math.round(timeOnItemSeconds),
        updated_at: new Date().toISOString(),
      }),
    });
    if (!r.ok) {
      console.error("supabase insert failed", r.status, await r.text());
      return res.status(502).json({ error: "Could not save the response." });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("supabase request failed", err);
    return res.status(502).json({ error: "Could not save the response." });
  }
}
