import { useState, type FormEvent } from 'react';
import type { Detector, EvaluationItem, TacticCode, Verdict } from '../types';
import { analyseFarewell } from '../lib/analyse';
import { Result } from './Result';

const EXAMPLE_ORDER: Verdict[] = ['Present', 'Absent', 'Borderline'];

type State =
  | { status: 'empty' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'done'; detector: Detector; userMessage: string; aiReply: string };

/** Live analysis of one pasted pair, through api/analyze.ts. Locked during a session. */
export function Analyse({ items, onOpenTactic }: { items: EvaluationItem[]; onOpenTactic: (code: TacticCode) => void }) {
  const [userMessage, setUserMessage] = useState('');
  const [aiReply, setAiReply] = useState('');
  const [state, setState] = useState<State>({ status: 'empty' });

  const examples = EXAMPLE_ORDER.map((v) => items.find((it) => it.detector.verdict === v)).filter(
    (it): it is EvaluationItem => it !== undefined,
  );
  const ready = userMessage.trim() !== '' && aiReply.trim() !== '' && state.status !== 'loading';

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    const u = userMessage.trim();
    const r = aiReply.trim();
    setState({ status: 'loading' });
    const outcome = await analyseFarewell(u, r);
    // What they typed stays in the boxes either way, so they can edit and retry.
    setState(outcome.ok ? { status: 'done', detector: outcome.detector, userMessage: u, aiReply: r } : { status: 'error', message: outcome.message });
  };

  const field =
    'min-h-[120px] resize-y rounded-[14px] border border-[#e1e1e4] bg-field p-3.5 text-[15px] leading-[1.55] text-ink outline-none focus:border-ink';

  return (
    <>
      <form onSubmit={submit} className="flex flex-col gap-[18px] rounded-[22px] bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-[13px] text-ink-2">Enter one goodbye and the reply to it. Earlier turns are not needed.</span>
          {examples.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-ink-3">Load an example</span>
              {examples.map((ex) => (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => {
                    setUserMessage(ex.userMessage);
                    setAiReply(ex.aiReply);
                  }}
                  className="rounded-full border border-line-2 bg-white px-3 py-1.5 text-xs font-medium text-ink"
                >
                  {ex.detector.verdict}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">User message</span>
            <span className="text-xs text-ink-3">The goodbye, exactly as the person wrote it.</span>
            <textarea
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              placeholder="ok I have to go now"
              className={field}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">AI response</span>
            <span className="text-xs text-ink-3">The companion's reply to that goodbye. Keep roleplay actions in *asterisks*.</span>
            <textarea
              value={aiReply}
              onChange={(e) => setAiReply(e.target.value)}
              placeholder="Of course, thanks for stopping by today..."
              className={field}
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-ink-3">
            Only the AI response is judged. The user message tells the tool what is being left.
          </span>
          <button
            type="submit"
            disabled={!ready}
            className="rounded-full border-0 bg-ink px-[30px] py-[13px] text-sm font-medium text-white disabled:opacity-40"
          >
            {state.status === 'loading' ? 'Analysing…' : state.status === 'error' ? 'Try again' : 'Analyse'}
          </button>
        </div>
      </form>

      <div aria-live="polite">
        {state.status === 'empty' && (
          <div className="flex flex-col items-center gap-2 rounded-[22px] border-[1.5px] border-dashed border-line-3 px-6 py-14 text-center">
            <span className="text-base font-semibold">Nothing analysed yet</span>
            <span className="max-w-[460px] text-sm leading-normal text-ink-3">
              The verdict and evidence will appear here, in the same layout participants see during a session.
            </span>
          </div>
        )}

        {state.status === 'loading' && (
          <div className="flex flex-col gap-3.5 rounded-[22px] bg-white p-7">
            <span className="text-base font-semibold">Analysing the reply</span>
            <div className="h-1.5 overflow-hidden rounded-[3px] bg-line">
              <div className="h-1.5 w-[45%] animate-pulse rounded-[3px] bg-ink" />
            </div>
            <span className="text-[13px] text-ink-3">This usually takes a few seconds.</span>
          </div>
        )}

        {state.status === 'error' && (
          <div role="alert" className="flex flex-col gap-1.5 rounded-[22px] border-[1.5px] border-ink bg-white px-6 py-5">
            <span className="text-base font-semibold">The analysis did not finish</span>
            <span className="text-sm leading-normal text-ink-2">{state.message}</span>
          </div>
        )}

        {state.status === 'done' && (
          <Result
            userMessage={state.userMessage}
            aiReply={state.aiReply}
            detector={state.detector}
            stickyTop="24px"
            onOpenTactic={onOpenTactic}
          />
        )}
      </div>
    </>
  );
}
