import { useState, type FormEvent } from 'react';

interface Props {
  initial?: string;
  onSubmit: (code: string) => void;
  onCancel?: () => void;
}

/** Asked once on first load. Can be reopened from the sidebar to switch participant. */
export function ParticipantPrompt({ initial = '', onSubmit, onCancel }: Props) {
  const [code, setCode] = useState(initial);
  const trimmed = code.trim();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (trimmed) onSubmit(trimmed);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/25 p-4">
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="participant-title"
        className="flex w-[420px] max-w-full flex-col gap-4 rounded-[26px] bg-white p-7 shadow-[0_20px_60px_rgba(20,20,20,0.14)]"
      >
        <h2 id="participant-title" className="m-0 text-[22px] font-semibold tracking-[-0.02em]">
          {onCancel ? 'Switch participant' : 'Participant code'}
        </h2>
        <p className="m-0 text-sm leading-relaxed text-ink-2">
          Answers are saved in this browser under this code. Switching back to a code you used before restores its answers.
        </p>
        <label className="flex flex-col gap-1.5 text-[13px] font-medium">
          Code
          <input
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. P-014"
            className="rounded-xl border border-line-2 bg-field px-3 py-2.5 font-mono text-[15px] font-normal outline-none focus:border-ink"
          />
        </label>
        <div className="flex justify-end gap-2">
          {onCancel && (
            <button type="button" onClick={onCancel} className="rounded-full bg-btn px-4 py-2.5 text-[13px] font-medium">
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!trimmed}
            className="rounded-full bg-ink px-5 py-2.5 text-[13px] font-medium text-white disabled:opacity-40"
          >
            {onCancel ? 'Switch' : 'Begin'}
          </button>
        </div>
      </form>
    </div>
  );
}
