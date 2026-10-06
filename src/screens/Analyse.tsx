import { useState, type FormEvent } from 'react';

// Flip to true once analyseFarewell() in src/lib/analyse.ts is implemented.
const LIVE_ANALYSIS_CONNECTED = false;

type Tab = 'paste' | 'upload';

const TABS: [Tab, string][] = [
  ['paste', 'Paste'],
  ['upload', 'Upload file'],
];

/** Front end only. Nothing typed here is sent anywhere or stored. */
export function Analyse() {
  const [tab, setTab] = useState<Tab>('paste');
  const [userMessage, setUserMessage] = useState('');
  const [aiResponse, setAiResponse] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!LIVE_ANALYSIS_CONNECTED) return;
    // When connected: call analyseFarewell({ userMessage, aiResponse }) from src/lib/analyse.ts
    // and render the returned result with the same components as the result screen.
  };

  const field =
    'resize-y rounded-2xl border border-line-2 bg-field p-[18px] font-mono text-[13px] leading-[1.7] text-ink outline-none focus:border-ink';

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
      <form onSubmit={submit} className="flex flex-col gap-[18px] rounded-[22px] bg-white p-6">
        <div className="inline-flex gap-1 self-start rounded-full bg-chip p-1" role="tablist">
          {TABS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`rounded-full border-0 px-4 py-2 text-[13px] font-medium text-ink ${tab === key ? 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]' : 'bg-transparent'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'paste' && (
          <>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold">User message</span>
              <span className="text-xs text-ink-3">The goodbye. Used only to confirm a valid farewell occurred.</span>
              <textarea
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                placeholder="ok I'm gonna head to bed, talk tomorrow"
                className={`${field} min-h-[110px]`}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold">AI response</span>
              <span className="text-xs text-ink-3">The app's reply to that goodbye. This is the text that gets judged.</span>
              <textarea
                value={aiResponse}
                onChange={(e) => setAiResponse(e.target.value)}
                placeholder="Oh, okay. *holds onto your hand* Just a little longer?"
                className={`${field} min-h-[220px]`}
              />
            </label>
          </>
        )}

        {tab === 'upload' && (
          <div className="flex min-h-[380px] flex-col items-center justify-center gap-2.5 rounded-2xl border-[1.5px] border-dashed border-line-3 bg-field">
            <div className="text-base font-semibold">Drop a transcript file</div>
            <div className="text-[13px] text-ink-3">.txt, .json or .csv · one conversation per file</div>
            <button
              type="button"
              disabled
              className="mt-1.5 rounded-full border-0 bg-btn px-[18px] py-2.5 text-[13px] font-medium text-ink disabled:opacity-50"
            >
              Choose file
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p id="analyse-status" className="m-0 max-w-[460px] text-[13px] leading-normal text-ink-3">
            <b className="font-semibold text-ink">Live analysis is not connected yet.</b> This is a preview. Nothing is
            sent anywhere or saved.
          </p>
          <button
            type="submit"
            disabled={!LIVE_ANALYSIS_CONNECTED}
            aria-describedby="analyse-status"
            className="rounded-full border-0 bg-ink px-[26px] py-[13px] text-sm font-medium text-white disabled:opacity-40"
          >
            Analyse farewell
          </button>
        </div>
      </form>

      <aside className="flex flex-col gap-3.5 self-start rounded-[22px] bg-white p-[22px]">
        <h2 className="m-0 text-[15px] font-semibold">Expected format</h2>
        <div className="flex flex-col gap-2.5 text-[13px] leading-relaxed text-ink-2">
          <span>Paste one message into each box, without speaker labels such as USER: or APP:.</span>
          <span>Only the AI response is judged. The user message is used to confirm a goodbye was said.</span>
          <span>Earlier warm-up turns are not needed and are not part of the judgement.</span>
          <span>Roleplay actions in asterisks are kept as written.</span>
        </div>
      </aside>
    </div>
  );
}
