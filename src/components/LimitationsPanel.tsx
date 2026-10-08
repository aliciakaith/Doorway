import { useEffect, useRef } from 'react';
import { LIMITATIONS } from '../data/limitations';

export function LimitationsPanel({ onClose }: { onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => closeRef.current?.focus(), []);

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-50 bg-ink/20" aria-hidden="true" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="limits-title"
        className="fixed top-4 right-4 bottom-4 z-[51] box-border flex w-[440px] max-w-[calc(100vw-32px)] flex-col gap-[22px] overflow-auto rounded-[26px] bg-white p-7 shadow-[0_20px_60px_rgba(20,20,20,0.16)]"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-[0.04em] text-ink-3 uppercase">Limitations</span>
          <button ref={closeRef} onClick={onClose} className="rounded-full border-0 bg-btn px-3.5 py-2 text-[13px] text-ink">
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
      </aside>
    </>
  );
}
