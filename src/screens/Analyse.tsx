import { useState, type FormEvent } from 'react';
import type { ConversationItem, Verdict } from '../types';
import { VERDICT_LABEL } from '../lib/labels';

// Flip to true once analyseFarewell() in src/lib/analyse.ts is implemented.
const LIVE_ANALYSIS_CONNECTED = false;

const EXAMPLE_ORDER: Verdict[] = ['present', 'absent', 'borderline'];

/**
 * Front end only. Nothing typed here is sent anywhere or stored, and no result is produced.
 * "Load an example" only copies text from the study set into the two boxes.
 */
export function Analyse({ items }: { items: ConversationItem[] }) {
  const [userMessage, setUserMessage] = useState('');
  const [aiResponse, setAiResponse] = useState('');

  const examples = EXAMPLE_ORDER.map((v) => items.find((it) => it.result.verdict === v)).filter(
    (it): it is ConversationItem => it !== undefined,
  );

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!LIVE_ANALYSIS_CONNECTED) return;
    // When connected: call analyseFarewell({ userMessage, aiResponse }) from src/lib/analyse.ts
    // and render the returned result with the same Result component as the review screen.
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
                    setAiResponse(ex.aiResponse);
                  }}
                  className="rounded-full border border-line-2 bg-white px-3 py-1.5 text-xs font-medium text-ink"
                >
                  {VERDICT_LABEL[ex.result.verdict]}
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
              value={aiResponse}
              onChange={(e) => setAiResponse(e.target.value)}
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
            disabled={!LIVE_ANALYSIS_CONNECTED}
            aria-describedby="analyse-status"
            className="rounded-full border-0 bg-ink px-[30px] py-[13px] text-sm font-medium text-white disabled:opacity-40"
          >
            Analyse
          </button>
        </div>
      </form>

      <div
        id="analyse-status"
        className="flex flex-col items-center gap-2 rounded-[22px] border-[1.5px] border-dashed border-line-3 px-6 py-14 text-center"
      >
        <span className="text-base font-semibold">Live analysis is not connected yet</span>
        <span className="max-w-[460px] text-sm leading-normal text-ink-3">
          This screen is a preview. Nothing you enter is sent anywhere or saved. When it is connected, the verdict, confidence
          and evidence will appear here, in the same layout participants see during a session.
        </span>
      </div>
    </>
  );
}
