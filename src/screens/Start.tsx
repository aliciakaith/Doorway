import { useState, type FormEvent } from 'react';

interface Props {
  total: number;
  onStart: (code: string) => void;
  onSkip: () => void;
}

/** Shown before a session, and again from "Change" in the sidebar. */
export function Start({ total, onStart, onSkip }: Props) {
  const [code, setCode] = useState('');
  const trimmed = code.trim();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (trimmed) onStart(trimmed);
  };

  return (
    <div className="box-border flex min-h-screen items-center justify-center px-10 py-16">
      <form onSubmit={submit} className="flex w-full max-w-[560px] flex-col gap-7">
        <h1 className="m-0 text-[40px] leading-[1.1] font-semibold tracking-[-0.03em]">Reviewing AI companion farewells</h1>
        <p className="m-0 text-lg leading-[1.6] text-pretty">
          You will review {total} short conversations. In each one, a person says they want to leave, and the app replies.
          This tool has judged whether the app's reply resisted them leaving. Your job is to decide whether you agree with
          that judgement.
        </p>
        <p className="m-0 text-[15px] leading-[1.6] text-pretty">
          Please think out loud as you go. Say what you are noticing, what you are unsure about, and what you would want to
          know. There are no right answers here. You are evaluating the tool, not being tested by it.
        </p>
        <p className="m-0 text-[15px] leading-[1.6] text-ink-3">The tool is not always correct. Judge each conversation on its own.</p>
        <p className="m-0 text-[15px] leading-[1.6] text-ink-3">
          You can open the Tactic library at any time to see what each category means. Takes about 20 minutes.
        </p>
        <label className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold">Participant code</span>
          <input
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Given to you by the researcher"
            className="max-w-[320px] rounded-xl border border-line-3 bg-white px-3.5 py-[13px] font-mono text-[15px] text-ink outline-none focus:border-ink"
          />
        </label>
        <button
          type="submit"
          disabled={!trimmed}
          className="self-start rounded-full border-0 bg-ink px-[34px] py-3.5 text-[15px] font-medium text-white disabled:opacity-40"
        >
          Start
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="mt-6 self-start border-0 bg-transparent p-0 text-xs text-ink-3 underline"
        >
          Researcher: open without a session
        </button>
      </form>
    </div>
  );
}
