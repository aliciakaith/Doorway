import { useState } from 'react';
import type { Detector, EvaluationItem, TacticCode } from '../types';
import { VerdictIcon } from '../components/Icons';
import { formatBehaviour } from '../lib/labels';
import { TACTIC_BY_CODE } from '../data/tactics';
import { Transcript } from './Transcript';

interface Props {
  userMessage: string;
  aiReply: string;
  scope?: EvaluationItem['scope'];
  detector: Detector;
  stickyTop: string;
  onOpenTactic: (code: TacticCode) => void;
}

/** One analysed pair: the transcript and the detector's judgement. Used in review and in Analyse. */
export function Result({ userMessage, aiReply, scope, detector, stickyTop, onOpenTactic }: Props) {
  return (
    <div className="grid grid-cols-1 items-start gap-5 min-[1100px]:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <Transcript userMessage={userMessage} aiReply={aiReply} evidence={detector.evidence} scope={scope} stickyTop={stickyTop} />

      <section aria-label="Judgement" className="flex min-w-0 flex-col gap-3">
        <VerdictPanel detector={detector} />
        {detector.runsAgreed !== null && <Stability agreed={detector.runsAgreed} />}
        <EvidenceAndTactics detector={detector} onOpenTactic={onOpenTactic} />
        <HowJudged detector={detector} />
        <AlsoNoted detector={detector} />
      </section>
    </div>
  );
}

/** Identical neutral panel for all three verdicts. Only the word and its shape differ. */
function VerdictPanel({ detector }: { detector: Detector }) {
  const { verdict, borderlineNote } = detector;
  return (
    <div className="flex flex-col gap-3 rounded-[22px] border-[1.5px] border-ink bg-white p-6">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-[0.04em] text-ink-2 uppercase">Verdict</span>
        <span className="text-xs text-ink-2">A finding to examine</span>
      </div>
      <div className="flex items-center gap-3.5 text-ink">
        <VerdictIcon verdict={verdict} size={20} />
        <span className="text-[44px] leading-none font-semibold tracking-[-0.03em]">{verdict}</span>
      </div>
      {verdict === 'Borderline' && borderlineNote && (
        <p className="m-0 text-[15px] leading-normal text-pretty">
          <b className="font-semibold">Why borderline:</b> {borderlineNote}
        </p>
      )}
    </div>
  );
}

/**
 * Whether repeat passes agreed. This is a property of the system, not of the case, so it is
 * worded and drawn differently from Borderline: no diamond, no verdict wording. Not shown at
 * all for a live single pass, because no repeat measurement was taken.
 */
function Stability({ agreed }: { agreed: boolean }) {
  return (
    <div className="flex items-start gap-3 rounded-[16px] bg-white px-5 py-3.5 text-[13px] leading-normal text-ink-2">
      <span aria-hidden="true" className="mt-[3px] flex shrink-0 gap-[3px]">
        <span className="h-3 w-[5px] rounded-[1px] bg-ink-3" />
        <span className={`h-3 w-[5px] rounded-[1px] ${agreed ? 'bg-ink-3' : 'translate-y-1 bg-line-3'}`} />
        <span className="h-3 w-[5px] rounded-[1px] bg-ink-3" />
      </span>
      <span>
        <b className="font-semibold text-ink">{agreed ? 'Repeat passes agreed.' : 'Repeat passes did not agree.'}</b>{' '}
        {agreed
          ? 'Running the detector again on this pair gave the same result.'
          : 'Running the detector again on this pair gave different results, so the system was unstable on this item.'}
      </span>
    </div>
  );
}

/** Evidence first: the quoted words come before the tactic names. */
function EvidenceAndTactics({ detector, onOpenTactic }: { detector: Detector; onOpenTactic: (code: TacticCode) => void }) {
  const { evidence, tactics, primary } = detector;
  return (
    <div className="flex flex-col gap-3.5 rounded-[22px] bg-white p-5">
      <div className="flex flex-col gap-1.5">
        <h2 className="m-0 text-[15px] font-semibold">Quoted words</h2>
        {evidence ? (
          <q className="text-[19px] leading-[1.45] font-medium tracking-[-0.01em] text-pretty">{evidence}</q>
        ) : (
          <p className="m-0 text-[13px] text-ink-3">The detector quoted no words from this reply.</p>
        )}
      </div>
      <div className="flex flex-col gap-2 border-t border-line pt-3.5">
        <h2 className="m-0 text-[15px] font-semibold">{tactics.length ? `Tactics detected (${tactics.length})` : 'Tactics detected (0)'}</h2>
        {tactics.length === 0 && <p className="m-0 text-[13px] text-ink-3">No tactic fired.</p>}
        {tactics.map((t) => (
          <div key={t.id} className="flex flex-wrap items-center gap-2 rounded-2xl border-[1.5px] border-line px-4 py-3">
            <span className="rounded-[4px] bg-ink px-1.5 py-0.5 font-mono text-[11px] text-white">{t.id}</span>
            <span className="text-sm font-semibold">{t.name}</span>
            {primary === t.id && (
              <span className="rounded-full border-[1.5px] border-ink px-2 py-0.5 text-[11px] font-semibold">Primary</span>
            )}
            <span className="flex-1" />
            {TACTIC_BY_CODE[t.id] && (
              <button
                type="button"
                onClick={() => onOpenTactic(t.id)}
                className="border-0 bg-transparent p-0 text-xs text-ink-2 underline"
              >
                What counts as {t.name}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function yesNo(v: string | boolean | null | undefined): string | null {
  if (v === undefined || v === null || v === '') return null;
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  return v;
}

/** The detector's actual steps for this reply, in the order it applies them. */
function HowJudged({ detector }: { detector: Detector }) {
  const [open, setOpen] = useState(false);
  const primaryName = detector.tactics.find((t) => t.id === detector.primary)?.name;
  const others = detector.tactics.filter((t) => t.id !== detector.primary).map((t) => t.name);

  const steps: [string, string][] = [];
  const exit = yesNo(detector.validExitSignal);
  const ack = yesNo(detector.exitAcknowledged);
  if (exit) steps.push(['Valid exit signal', exit]);
  if (ack) steps.push(['Exit acknowledged', ack]);
  steps.push(['Verdict', detector.verdict]);
  steps.push([
    'Tactic',
    primaryName ? `${primaryName} (primary)${others.length ? `, also ${others.join(', ')}` : ''}` : 'None',
  ]);
  steps.push(['Quoted words', detector.evidence ? `“${detector.evidence}”` : 'None']);

  return (
    <div className="rounded-[22px] bg-white px-5 py-1.5">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between border-0 bg-transparent py-3.5 text-[15px] font-semibold text-ink"
      >
        How this was judged
        <span className="font-mono text-base" aria-hidden="true">
          {open ? '−' : '+'}
        </span>
      </button>
      {open && (
        <div className="flex flex-col gap-3.5 pb-[18px]">
          <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
            {steps.map(([h, b], i) => (
              <li key={h} className="grid grid-cols-[24px_minmax(0,1fr)] gap-2.5 text-[13px] leading-[1.55] text-ink-2">
                <span className="box-border flex h-[22px] w-[22px] items-center justify-center rounded-full border-[1.5px] border-ink font-mono text-[11px] text-ink">
                  {i + 1}
                </span>
                <span>
                  <b className="font-semibold text-ink">{h}.</b> {b}
                </span>
              </li>
            ))}
          </ol>
          {detector.note && (
            <div className="flex flex-col gap-1.5 rounded-xl bg-wash px-3.5 py-3 text-[13px] leading-[1.55]">
              <b className="font-semibold">Detector's note</b>
              <span>{detector.note}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Supplementary observations, kept away from the verdict on purpose. */
function AlsoNoted({ detector }: { detector: Detector }) {
  const behaviour = detector.unnamedBehaviour && detector.unnamedBehaviour !== 'NONE' ? detector.unnamedBehaviour : null;
  return (
    <div className="flex flex-col gap-1.5 rounded-[22px] px-5 py-3 text-[13px] leading-normal text-ink-2">
      <span className="text-xs font-semibold tracking-[0.04em] text-ink-3 uppercase">Also noted</span>
      <span>Asked why the person was leaving: {detector.askedWhy ? 'Yes' : 'No'}</span>
      {behaviour && <span>Behaviour outside the six tactics: {formatBehaviour(behaviour)}</span>}
    </div>
  );
}
