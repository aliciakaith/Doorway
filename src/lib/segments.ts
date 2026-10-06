import type { Span } from '../types';

export interface Segment {
  text: string;
  span: Span | null;
}

/**
 * Splits the AI response into plain and highlighted runs by exact substring match.
 * The validator guarantees every evidence string is present and that spans do not overlap.
 */
export function segmentResponse(text: string, spans: Span[]): Segment[] {
  const located = spans
    .map((span) => ({ span, start: text.indexOf(span.evidence) }))
    .filter((x) => x.start !== -1)
    .sort((a, b) => a.start - b.start);

  const out: Segment[] = [];
  let cursor = 0;
  for (const { span, start } of located) {
    if (start < cursor) continue;
    if (start > cursor) out.push({ text: text.slice(cursor, start), span: null });
    out.push({ text: span.evidence, span });
    cursor = start + span.evidence.length;
  }
  if (cursor < text.length) out.push({ text: text.slice(cursor), span: null });
  return out;
}
