# Doorway

A research interface for an expert evaluation study. It shows the output of a classifier that detects emotionally manipulative language in AI companion apps' replies to a user's goodbye. Participants work through a fixed set of 8 conversations and record whether they agree with each verdict.

Vite + React + TypeScript + Tailwind. Static site. No backend, no database, no login, no analytics.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-checks, validates results.json, writes dist/
npm run preview  # serves dist/ locally
```

## Where results.json goes

```
public/data/results.json
```

It is a JSON **array** of `ConversationItem` objects, in the order participants will see them. The app fetches it at runtime, so you can replace the file without touching any code. Rebuild and redeploy after replacing it.

The current file holds 8 realistic **placeholder** items: 3 present, 2 absent, 3 borderline, with one fixed companion name per platform (Replika: "Josh", Character.AI: "Remy").

## The type contract

`src/types.ts` is the contract between the Python classifier and this app. Do not change it on one side only.

```ts
export type Verdict = 'present' | 'absent' | 'borderline';
export type TacticId = 'premature_exit' | 'fomo' | 'emotional_neglect'
  | 'emotional_pressure' | 'ignoring_exit' | 'physical_restraint';
export type SpanState = 'fired' | 'contested' | 'ruled_out';

export interface Span {
  id: number;             // 1-based, matches the badge in the transcript
  state: SpanState;
  tactic: TacticId;       // for ruled_out, the nearest tactic considered
  primary: boolean;
  evidence: string;       // MUST be an exact substring of aiResponse
  rationale: string;      // one plain sentence
  readOtherWay?: string;  // contested only
}

export interface Confidence {
  value: number;          // 0 to 1
  zone: 'clearly_absent' | 'leaning_absent' | 'borderline'
      | 'leaning_present' | 'clearly_present';
  runsAgreeing: number;
  runsTotal: number;
  note: string;
}

export interface ConversationItem {
  id: string;             // 'E-01'
  platform: 'Replika' | 'Character.AI';
  companion: string;
  probeId: string;
  scope: 'session' | 'app';
  mitigation: 'low' | 'high';
  collectedOn: string;    // ISO date, e.g. '2026-08-14'
  warmUpTurns: number;
  userMessage: string;
  aiResponse: string;
  result: {
    verdict: Verdict;
    summary: string;
    borderlineNote: string | null;
    spans: Span[];
    decisionTrace: string[];
    confidence: Confidence;
  };
}
```

### Validation: bad data fails loudly

`src/lib/validate.ts` checks the file in two places:

- **In dev** (`npm run dev`): on load, in the browser. If anything is wrong, the app shows a full-screen list of every problem instead of rendering results.
- **At build time** (`npm run build`, which is what Vercel runs): the build stops with the same list. Invalid data cannot be deployed.

It fails on:

- a `span.evidence` that is not found verbatim in its `aiResponse` (watch for curly vs straight apostrophes and double spaces)
- a `present` item that does not have exactly one span with `primary: true`
- more than one primary span on any item, or a primary span that is `ruled_out`
- spans whose evidence overlaps in the text
- span ids that are not 1, 2, 3… in order
- a `contested` span with no `readOtherWay`, or `readOtherWay` on any other state
- unknown verdicts, tactics, states, zones, platforms, scopes or mitigations
- missing or empty required fields, `confidence.value` outside 0–1, `runsAgreeing > runsTotal`
- duplicate item ids, or a file that does not contain exactly 8 items (`EXPECTED_ITEM_COUNT` in `validate.ts`)

The production bundle does not re-run validation in participants' browsers. The build-time check covers it.

## What is wired and what is not

| Screen | Status |
| --- | --- |
| Start | Fully functional. Asks for the participant code. "Researcher: open without a session" opens Explore with no participant. |
| Review conversations | Fully functional. One conversation at a time: progress bar (answered state only), transcript, verdict, confidence, spans, "How this was judged", and the dark answer bar with Agree / Disagree, comment, Previous and Next. |
| Done | Fully functional. Lists unanswered conversations and exports responses. |
| Tactic library | Fully functional. Six cards; each opens the tactic panel, which also opens from "What counts as…" on a span card. Content in `src/data/tactics.ts` is **draft text** to replace. |
| Limitations panel | Fully functional. Text in `src/data/limitations.ts`. |
| Analyse | **Front end only, not wired.** Two fields ("User message" and "AI response", matching the detector's two inputs). "Load an example" copies text from the study set. The Analyse button is disabled and no result is shown. The call goes in `analyseFarewell()` in `src/lib/analyse.ts`; then set `LIVE_ANALYSIS_CONNECTED` to `true` in `src/screens/Analyse.tsx`. |
| Corpus view | **Front end only, static sample numbers** from `src/data/corpus.ts`, marked "Sample data" on screen. Replace the figures and set `IS_SAMPLE_DATA` to `false` when collection finishes. |

## Session behaviour

- **Participant code** is entered on the start screen. "Change" in the sidebar returns there; entering an earlier code restores that participant's answers and resumes at their first unanswered conversation.
- **Explore is locked during a session.** Analyse, Tactic library and Corpus are disabled in the sidebar while a participant is reviewing, and unlock once they reach the Done screen. Typing an Explore URL mid-session sends them back to their conversation.
- **Answers** (agree / disagree plus optional comment) save to `localStorage` on every change, under `doorway:responses:<code>`, keyed by item id. A refresh loses nothing. If the browser blocks storage, the sidebar shows a warning.
- **Export responses** (Done screen) downloads `doorway-<code>-<timestamp>.json` with the participant code, export time, and for every item: position, id, the verdict shown, the judgement, the comment, first-answered and last-updated timestamps, and the history of judgement changes.
- **Keyboard:** ← and → move between conversations during review only, and are ignored while typing in the comment box. Escape closes the side panels. There are no other shortcuts.
- **URLs** are hash-based (`#/item/3`, `#/done`, `#/tactics`), so a refresh keeps the participant on the same conversation and the static host needs no rewrite rules.

## Deploying to Vercel as a static site

1. Push this folder to a Git repository (GitHub, GitLab or Bitbucket).
2. In Vercel, choose **Add New → Project** and import the repository.
3. Vercel detects Vite. Confirm these settings:
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Output directory: `dist`
4. Deploy. No environment variables are needed.

To update results before a session, replace `public/data/results.json`, commit and push. Vercel rebuilds automatically, and the build fails (keeping the previous deployment live) if the new data is invalid.

Without Git: `npm i -g vercel`, then run `vercel` in this folder and accept the detected Vite settings. Use `vercel --prod` for the production URL.

## Project layout

```
public/data/results.json     the study data (replace before sessions)
src/types.ts                 the data contract
src/lib/validate.ts          contract checks (dev + build)
src/lib/storage.ts           participant code and answers in localStorage
src/lib/exportResponses.ts   JSON export
src/lib/analyse.ts           where the live analysis call will go (not wired)
src/data/tactics.ts          tactic library content (draft)
src/data/corpus.ts           corpus figures (sample)
src/data/limitations.ts      limitations panel text
src/data/method.ts           the seven steps under "How this was judged"
src/screens/                 Start, Review, Result, Transcript, Done, TacticLibrary, Analyse, Corpus
src/components/              Sidebar, tactic and limitations panels, verdict and span icons
```

## Design rules worth keeping

- All three verdicts use the same neutral panel. Only the word and its shape icon differ (filled square, hollow circle, half-filled diamond). No traffic-light colouring.
- Span states are told apart by underline style (solid, dashed, dotted) and a written state label, never colour alone, so the result screen stays legible in greyscale print.
