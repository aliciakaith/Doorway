/** Full-screen error shown when results.json fails to load or fails validation. */
export function DataError({ problems }: { problems: string[] }) {
  return (
    <div className="min-h-screen p-[18px]">
      <div className="mx-auto mt-10 flex max-w-[860px] flex-col gap-4 rounded-[22px] border-[3px] border-ink bg-white p-8">
        <span className="text-xs font-semibold tracking-[0.04em] text-ink-3 uppercase">Data error · nothing rendered</span>
        <h1 className="m-0 text-[28px] font-semibold tracking-[-0.02em]">public/data/results.json is not valid</h1>
        <p className="m-0 text-sm leading-relaxed text-ink-2">
          The app refuses to show results that do not match the contract in <code className="font-mono">src/types.ts</code>.
          Fix the problems below and refresh.
        </p>
        <ol className="m-0 flex list-decimal flex-col gap-2 rounded-xl bg-wash py-4 pr-4 pl-10 font-mono text-[13px] leading-relaxed">
          {problems.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}
