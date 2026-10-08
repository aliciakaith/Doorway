interface Props {
  answered: boolean[];
  onGoTo: (index: number) => void;
  onExport: () => void;
}

/** End of the session. Lists anything still unanswered before the participant exports. */
export function Done({ answered, onGoTo, onExport }: Props) {
  const total = answered.length;
  const unanswered = answered.map((a, i) => (a ? -1 : i)).filter((i) => i !== -1);

  return (
    <div className="box-border flex min-h-[calc(100vh-80px)] items-center justify-center py-16">
      <div className="flex w-full max-w-[560px] flex-col gap-[22px]">
        <h1 className="m-0 text-4xl font-semibold tracking-[-0.03em]">
          {unanswered.length ? `${total - unanswered.length} of ${total} conversations answered` : `All ${total} conversations answered`}
        </h1>
        <p className="m-0 text-base leading-[1.6] text-ink-2">
          {unanswered.length
            ? `${unanswered.length === 1 ? 'This one still needs' : 'These still need'} an answer before you export.`
            : 'Thank you. Your responses are ready to export.'}
        </p>
        {unanswered.length > 0 && (
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {unanswered.map((i) => (
              <li key={i} className="flex items-center gap-3 rounded-[14px] border border-line bg-white px-4 py-3">
                <span className="box-border h-2.5 w-2.5 rounded-full border-[1.5px] border-ink-3" aria-hidden="true" />
                <span className="flex-1 text-[15px] font-medium">Conversation {i + 1}</span>
                <button
                  onClick={() => onGoTo(i)}
                  className="shrink-0 rounded-full border border-ink bg-white px-3.5 py-[7px] text-[13px] font-medium whitespace-nowrap text-ink"
                >
                  Go back to it
                </button>
              </li>
            ))}
          </ul>
        )}
        <button
          onClick={onExport}
          className="self-start rounded-full border-0 bg-ink px-7 py-3.5 text-[15px] font-medium text-white"
        >
          Export responses
        </button>
      </div>
    </div>
  );
}
