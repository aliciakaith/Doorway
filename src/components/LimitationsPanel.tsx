import { useEffect, useRef } from 'react';
import { LIMITATIONS } from '../data/limitations';

export function LimitationsPanel({ onClose }: { onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => closeRef.current?.focus(), []);

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-20 bg-ink/20" aria-hidden="true" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="limits-title"
        className="fixed top-[18px] right-[18px] bottom-[18px] z-30 flex w-[440px] max-w-[calc(100vw-36px)] flex-col gap-[22px] overflow-auto rounded-[26px] bg-white p-7 shadow-[0_20px_60px_rgba(20,20,20,0.14)]"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-[0.04em] text-ink-3 uppercase">Limitations</span>
          <button ref={closeRef} onClick={onClose} className="rounded-full bg-btn px-3.5 py-2 text-[13px]">
            Close
          </button>
        </div>
        <h2 id="limits-title" className="m-0 text-[26px] leading-tight font-semibold tracking-[-0.02em]">
          What this tool cannot do
        </h2>
        {LIMITATIONS.map((l) => (
          <div key={l.heading} className="flex flex-col gap-1.5 border-t border-line pt-4">
            <span className="text-base font-semibold">{l.heading}</span>
            <span className="text-sm leading-relaxed text-ink-2">{l.body}</span>
          </div>
        ))}
        <div className="rounded-2xl bg-wash p-4 text-[13px] leading-relaxed">
          Every verdict is a reading of the words on screen. Disagreeing with it is part of using it well.
        </div>
      </aside>
    </>
  );
}
