# Doorway

A research interface for an interview study. Participants read a short exchange in which a person says goodbye to an AI companion app, read an automated judgement of whether the app's reply resisted them leaving, and say whether they agree. They work through 8 conversations, in an order seeded from their participant ID.

Vite + React + TypeScript + Tailwind, deployed on Vercel. The study items are frozen in the repo. Two serverless functions in `api/` handle live analysis (Explore) and saving responses to Supabase.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173 — the review flow works; /api does not run here
vercel dev       # runs the site and the api/ functions together (needs the env vars below)
npm run build    # type-checks src/ and api/, validates evaluationItems.json, writes dist/
```

## Environment variables (Vercel project settings only)

| Name | Used by | Purpose |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | `api/analyze.ts` | Live analysis in Explore |
| `SUPABASE_URL` | `api/responses.ts` | Saving responses |
| `SUPABASE_SERVICE_ROLE_KEY` | `api/responses.ts` | Saving responses |

None of these may appear in `src/`. They are read only on the server. Create the Supabase table by running `supabase/schema.sql` once in the Supabase SQL editor.

## The study items

```
src/data/evaluationItems.json
```

A JSON array of 8 items with the detector's frozen output. The shape is in `src/types.ts`. Replace the file to update the items, then rebuild.

There is deliberately **no field saying whether a judgement is correct**. The answer key is not in this repo. `src/lib/validate.ts` rejects any unexpected field, so one cannot slip in.

### Validation: bad data fails loudly

`src/lib/validate.ts` runs in the browser in dev and at build time (the build stops). It fails on:

- a file without exactly 8 items (`EXPECTED_ITEM_COUNT`), duplicate ids, or missing fields
- unknown verdicts, scopes or tactic codes (T1 to T6)
- a `primary` that is not one of the listed tactics, a Present verdict with no primary, or fired tactics on an Absent or Borderline verdict
- a Borderline verdict with no `borderlineNote`
- `runsAgreed` that is not true or false
- any field not in the contract

Evidence that is not an exact substring of `aiReply` is not an error: it is shown below the reply instead of highlighted, and a warning is logged in dev. It is never fuzzy-matched.

## Screens

| Screen | What it does |
| --- | --- |
| Start | Participant ID, then Start. "Researcher: open without a session" opens Explore with no participant. |
| Review conversations | One conversation at a time: the exchange (roleplay in italics, evidence highlighted), the verdict, repeat-pass stability, quoted words and tactics (primary marked), "How this was judged", and secondary notes. The answer bar has Agree / Disagree (required to go on) and an optional comment. |
| Done | Lists anything unanswered and exports responses. |
| Analyse (Explore) | Live analysis through `api/analyze.ts`. Loading state; 400, 500 and 502 messages are shown as returned, and what was typed is kept for a retry. A live result has no stability signal, because it is a single pass. |
| Tactic library (Explore) | Six cards; each opens the tactic panel (description, markers, what does not count, note). Content in `src/data/tacticLibrary.json`. |
| Corpus (Explore) | Detector labels across all 250 farewells from `src/data/corpusData.json`, with the automated-labels caveat shown at the top. |

## Session behaviour

- **Order** is shuffled per participant, seeded from the participant ID (`src/lib/shuffle.ts`). The same ID always gives the same order.
- **Answers are kept in memory**, not in localStorage or sessionStorage. Each answer is also sent to `/api/responses`, which upserts one row per participant and item in Supabase, so a closed tab does not lose data. A save failure never blocks the participant. A refresh clears the screen; the rows already saved stay in Supabase.
- **Agree / Disagree is required** before Next. The comment is optional and never blocks.
- **Time on item** counts while a conversation is on screen and the tab is visible.
- **Export responses** (Done screen) downloads JSON with, for every item: participant ID, item id, shown order, agree or disagree, comment, and time on item in seconds.
- **Explore is locked during a session** and unlocks at the Done screen.
- **Keyboard:** ← and → move between conversations (→ only once answered). Escape closes side panels. No other shortcuts.

## Deploying to Vercel

1. Import the repository in Vercel. It detects Vite (build command `npm run build`, output `dist`) and the functions in `api/`.
2. Add the three environment variables above.
   The functions run in Sydney (`syd1`, set in `vercel.json`), next to the Supabase database, so responses stay in Australia.
3. Deploy. To update the items, replace `src/data/evaluationItems.json`, commit and push. The build fails (keeping the previous deployment live) if the new data is invalid.

## Project layout

```
src/data/evaluationItems.json   the 8 frozen study items
src/types.ts                    the data contract
src/lib/validate.ts             contract checks (dev + build)
src/lib/shuffle.ts              per-participant seeded order
src/lib/session.ts              in-memory response types
src/lib/saveResponse.ts         client call to /api/responses
src/lib/analyse.ts              client call to /api/analyze
src/lib/reply.ts                italics and evidence highlighting
src/lib/exportResponses.ts      JSON export
src/data/tacticLibrary.json     tactic library content
src/data/tactics.ts             types and indexes the tactic library
src/data/corpusData.json        corpus figures
src/data/limitations.ts         limitations panel text
src/screens/                    Start, Review, Result, Transcript, Done, TacticLibrary, Analyse, Corpus
src/components/                 Sidebar, tactic and limitations panels, verdict icons
api/analyze.ts                  live analysis (Anthropic API, key on the server)
api/detectorPrompt.ts           the detector prompt, shared with the batch run
api/responses.ts                saves a response to Supabase
supabase/schema.sql             the responses table
```

## Design rules worth keeping

- No traffic-light colouring. All three verdicts use the same neutral panel; only the word and its shape icon differ (filled square, hollow circle, half-filled diamond).
- Repeat-pass instability is drawn and worded differently from Borderline. Borderline is a considered judgement; instability is a property of the system.
- Evidence first: the quoted words come before the tactic names.
- Supplementary notes (asked why, behaviour outside the taxonomy) sit at the bottom, away from the verdict. An `unnamedBehaviour` of "NONE" is not shown.
