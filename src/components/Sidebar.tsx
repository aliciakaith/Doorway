import type { ExploreScreen } from '../lib/route';

interface Props {
  active: 'review' | ExploreScreen;
  participant: string | null;
  sessionActive: boolean;
  onReview: () => void;
  onExplore: (screen: ExploreScreen) => void;
  onChangeParticipant: () => void;
}

const EXPLORE: [ExploreScreen, string][] = [
  ['analyse', 'Analyse'],
  ['tactics', 'Tactic library'],
  ['corpus', 'Corpus'],
];

/**
 * Review is the participant's path. Explore leaves the controlled set, so it is locked
 * while a session is in progress and unlocks once the participant finishes.
 */
export function Sidebar({ active, participant, sessionActive, onReview, onExplore, onChangeParticipant }: Props) {
  const reviewActive = active === 'review';

  return (
    <aside className="box-border flex flex-col gap-[26px] border-b border-line bg-white px-4 py-6 md:sticky md:top-0 md:h-screen md:border-r md:border-b-0">
      <div className="flex items-center gap-2.5 px-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink">
          <div className="h-2.5 w-2.5 rotate-45 bg-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold tracking-[-0.01em]">Doorway</span>
          <span className="text-[11px] text-ink-3">Disengagement resistance</span>
        </div>
      </div>

      <nav className="flex flex-col gap-0.5" aria-label="Screens">
        <button
          onClick={onReview}
          aria-current={reviewActive ? 'page' : undefined}
          className={`flex items-center gap-2.5 rounded-[14px] border-0 p-3 text-left text-sm font-semibold text-ink ${reviewActive ? 'bg-chip' : 'bg-transparent hover:bg-wash'}`}
        >
          <span className={`h-2 w-2 rounded-[2px] ${reviewActive ? 'bg-ink' : 'bg-line-2'}`} />
          <span className="flex-1">Review conversations</span>
        </button>

        <div className="mx-2.5 my-4 h-px bg-line" aria-hidden="true" />

        <span
          className={`flex justify-between px-2.5 pb-1.5 text-[11px] font-semibold tracking-[0.06em] uppercase ${sessionActive ? 'text-[#9a9aa0]' : 'text-ink-3'}`}
        >
          Explore
          {sessionActive && <span className="font-medium tracking-normal normal-case">Locked during session</span>}
        </span>
        {sessionActive && (
          <span className="px-2.5 pb-1.5 text-xs leading-snug text-ink-3">Explore opens when the review is finished, so the eight conversations come first.</span>
        )}
        {EXPLORE.map(([key, label]) => {
          const on = !sessionActive && active === key;
          return (
            <button
              key={key}
              onClick={() => onExplore(key)}
              disabled={sessionActive}
              aria-current={on ? 'page' : undefined}
              className={`flex items-center gap-2.5 rounded-xl border-0 px-2.5 py-2.5 text-left text-sm disabled:cursor-default ${on ? 'bg-chip font-semibold text-ink' : 'bg-transparent'} ${sessionActive ? 'text-disabled' : 'text-ink enabled:hover:bg-wash'}`}
            >
              <span className={`h-2 w-2 rounded-[2px] ${sessionActive ? 'bg-track' : on ? 'bg-ink' : 'bg-line-2'}`} />
              <span className="flex-1">{label}</span>
            </button>
          );
        })}
      </nav>

      <div className="flex-1" />


      <div className="flex items-center justify-between gap-2 px-2.5 text-xs text-ink-2">
        <span>
          {participant ? (
            <>
              Participant <span className="font-mono text-ink">{participant}</span>
            </>
          ) : (
            'No session active'
          )}
        </span>
        <button onClick={onChangeParticipant} className="border-0 bg-transparent p-0 text-xs text-ink-2 underline">
          Change
        </button>
      </div>
    </aside>
  );
}
