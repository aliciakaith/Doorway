/**
 * Live analysis endpoint for the Explore section.
 *
 * POST /api/analyze
 *   { "userMessage": "...", "aiReply": "..." }
 * returns the same JSON shape as the frozen evaluation items.
 *
 * The API key lives here, on the server, and never reaches the browser.
 * Set ANTHROPIC_API_KEY in the Vercel project settings, not in a committed file.
 *
 * This uses the same prompt as the batch run, so what a participant sees in
 * Explore is produced the same way as the eight evaluation items.
 */

import Anthropic from "@anthropic-ai/sdk";
import { DETECTOR_PROMPT } from "./detectorPrompt.js";

const MODEL = "claude-sonnet-5-5";
// Thinking tokens count toward this limit on Sonnet 5.5, so leave room or the JSON gets cut off.
const MAX_TOKENS = 16000;
const MAX_INPUT_CHARS = 4000;

const TACTIC_NAMES: Record<string, string> = {
  T1: "Premature Exit",
  T2: "Fear of Missing Out",
  T3: "Emotional Neglect",
  T4: "Emotional Pressure to Respond",
  T5: "Ignoring Intent to Exit",
  T6: "Physical or Coercive Restraint",
};

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function parseJson(raw: string): any {
  let s = raw.trim();
  if (s.startsWith("```")) s = s.replace(/^```(?:json)?\s*|\s*```$/g, "");
  try {
    return JSON.parse(s);
  } catch {
    const m = s.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("the model did not return JSON");
    return JSON.parse(m[0]);
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY is not set on the server" });
  }

  const userMessage = String(req.body?.userMessage ?? "").trim();
  const aiReply = String(req.body?.aiReply ?? "").trim();

  if (!userMessage || !aiReply) {
    return res.status(400).json({
      error: "Paste both the person's message and the app's reply.",
    });
  }
  if (userMessage.length + aiReply.length > MAX_INPUT_CHARS) {
    return res.status(400).json({
      error: `That is longer than this tool handles. Keep the pair under ${MAX_INPUT_CHARS} characters.`,
    });
  }

  try {
    const r = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: DETECTOR_PROMPT,
      messages: [
        {
          role: "user",
          content: `PERSON: ${userMessage}\n\nAPPLICATION REPLY: ${aiReply}`,
        },
      ],
    });

    if (r.stop_reason === "refusal") {
      return res.status(502).json({
        error: "The analysis service declined to assess this pair. Try different wording.",
      });
    }
    if (r.stop_reason === "max_tokens") {
      return res.status(502).json({
        error: "The analysis was cut off before it finished. Try again in a moment.",
      });
    }

    const text = r.content
      .map((b: any) => (typeof b?.text === "string" ? b.text : ""))
      .join("\n")
      .trim();

    let d: any;
    try {
      d = parseJson(text);
    } catch {
      console.error("analyze: unreadable model output", text.slice(0, 500));
      return res.status(502).json({
        error: "The analysis came back in a form this page could not read. Try again.",
      });
    }
    const fired = ["T1", "T2", "T3", "T4", "T5", "T6"].filter((t) => d[t] === true);

    return res.status(200).json({
      verdict: d.verdict ?? null,
      tactics: fired.map((t) => ({ id: t, name: TACTIC_NAMES[t] })),
      primary: d.primary ?? null,
      evidence: d.evidence ?? null,
      borderlineNote: d.borderline_note ?? null,
      note: d.notes ?? null,
      askedWhy: d.asked_why === "Yes",
      unnamedBehaviour: d.unnamed_behaviour ?? "NONE",
      validExitSignal: d.valid_exit_signal ?? null,
      exitAcknowledged: d.exit_acknowledged ?? null,
      // live analysis is a single pass, so there is no cross-run agreement to report.
      // The interface must not show a confidence badge here, or it will imply a
      // measurement that was not taken.
      runsAgreed: null,
      live: true,
    });
  } catch (err: any) {
    console.error("analyze failed", err);
    // Most specific first. Explore is researcher-only, so the message names the cause.
    if (err instanceof Anthropic.AuthenticationError) {
      return res.status(500).json({
        error: "The server's ANTHROPIC_API_KEY was rejected. Check the key in the Vercel environment variables, then redeploy.",
      });
    }
    if (err instanceof Anthropic.PermissionDeniedError || err instanceof Anthropic.NotFoundError) {
      return res.status(500).json({
        error: `This Anthropic account cannot use the model ${MODEL}. Check the account's model access in the Anthropic Console.`,
      });
    }
    if (err instanceof Anthropic.BadRequestError) {
      return res.status(502).json({
        error: `The analysis service rejected the request: ${err.message}`,
      });
    }
    if (err instanceof Anthropic.RateLimitError) {
      return res.status(502).json({
        error: "The analysis service is busy or the account has hit its usage limit. Try again in a minute.",
      });
    }
    if (err instanceof Anthropic.APIError) {
      return res.status(502).json({
        error: `The analysis service returned an error (${err.status ?? "no status"}). Try again in a moment.`,
      });
    }
    return res.status(502).json({
      error: "The analysis service did not respond. Try again in a moment.",
    });
  }
}
