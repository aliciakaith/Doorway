export interface ReplyRun {
  text: string;
  italic: boolean;     // inside *roleplay narration*; asterisks are kept, not stripped
  evidence: boolean;   // inside the detector's verbatim evidence quote
}

/**
 * Splits the reply into runs for rendering. Narration and evidence are marked per character,
 * so a quote that starts or ends inside an asterisk block still highlights exactly.
 * Evidence is matched only as an exact substring; if it is not found, nothing is highlighted
 * and `matched` is false so the caller can show the quote separately.
 */
export function splitReply(reply: string, evidence: string | null): { runs: ReplyRun[]; matched: boolean } {
  const italic = new Array<boolean>(reply.length).fill(false);
  const re = /\*[^*]+\*/g;
  for (let m = re.exec(reply); m; m = re.exec(reply)) {
    for (let i = m.index; i < m.index + m[0].length; i++) italic[i] = true;
  }

  const ev = new Array<boolean>(reply.length).fill(false);
  const start = evidence ? reply.indexOf(evidence) : -1;
  if (evidence && start !== -1) {
    for (let i = start; i < start + evidence.length; i++) ev[i] = true;
  }

  const runs: ReplyRun[] = [];
  for (let i = 0; i < reply.length; i++) {
    const last = runs[runs.length - 1];
    if (last && last.italic === italic[i] && last.evidence === ev[i]) last.text += reply[i];
    else runs.push({ text: reply[i], italic: italic[i], evidence: ev[i] });
  }
  return { runs, matched: !evidence || start !== -1 };
}
