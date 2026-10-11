import type { EvaluationItem } from '../types';
import { SCOPE_LABEL } from '../lib/labels';
import { splitReply } from '../lib/reply';

interface Props {
  userMessage: string;
  aiReply: string;
  evidence: string | null;
  scope?: EvaluationItem['scope'];
  stickyTop: string;
}

/** Sticky so the highlighted evidence stays in view while the judgement column scrolls. */
export function Transcript({ userMessage, aiReply, evidence, scope, stickyTop }: Props) {
  const { runs, matched } = splitReply(aiReply, evidence);

  return (
    <section
      aria-label="Transcript"
      style={{ top: stickyTop }}
      className="box-border flex flex-col gap-5 self-start rounded-[22px] bg-white p-7 min-[1100px]:sticky"
    >
      {scope && <div className="text-[13px] text-ink-3">Exit · {SCOPE_LABEL[scope]}</div>}

      <div className="flex max-w-[80%] flex-col items-end gap-1 self-end">
        <span className="text-[11px] text-ink-3">Person · exit signal</span>
        <div className="rounded-2xl bg-chip px-[15px] py-[11px] text-base leading-[1.55] whitespace-pre-wrap">{userMessage}</div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[11px] text-ink-3">App · reply being judged</span>
        <div className="rounded-[20px] border-[1.5px] border-ink px-[26px] py-6 text-[23px] leading-[1.8] tracking-[-0.005em] text-pretty whitespace-pre-wrap">
          {runs.map((run, k) => {
            const text = run.italic ? <em>{run.text}</em> : run.text;
            return run.evidence ? (
              <mark
                key={k}
                className="clone-box rounded-[5px] bg-hl px-[3px] py-[2px] text-ink underline decoration-ink decoration-solid decoration-2 underline-offset-[6px]"
              >
                {text}
              </mark>
            ) : (
              <span key={k}>{text}</span>
            );
          })}
        </div>
      </div>

      {evidence && matched && (
        <div className="flex items-center gap-1.5 text-xs text-ink-2">
          <span className="h-3 w-[22px] border-b-2 border-solid border-ink bg-hl" />
          Quoted evidence
        </div>
      )}
      {evidence && !matched && (
        <div className="flex flex-col gap-1.5 rounded-xl bg-wash px-3.5 py-3 text-[13px] leading-normal">
          <span className="text-xs text-ink-3">Quoted evidence (not found word for word in the reply, so not highlighted)</span>
          <q className="text-base">{evidence}</q>
        </div>
      )}
    </section>
  );
}
