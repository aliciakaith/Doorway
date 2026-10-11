// Checks src/data/evaluationItems.json against the contract in src/types.ts.
// Runs in the browser in dev, and at build time via the plugin in vite.config.ts.
// Pure TypeScript with no DOM access, so it works in both places.

import type { EvaluationItem } from '../types.ts';

/** The study uses a set of eight conversations. */
export const EXPECTED_ITEM_COUNT = 8;

const VERDICTS = ['Present', 'Absent', 'Borderline'];
const TACTIC_CODES = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'];
const SCOPES = ['Session', 'App'];

const ITEM_KEYS = ['id', 'pair_id', 'probe_id', 'scope', 'userMessage', 'aiReply', 'detector'];
const DETECTOR_KEYS = ['verdict', 'tactics', 'primary', 'evidence', 'borderlineNote', 'note', 'askedWhy', 'unnamedBehaviour', 'runsAgreed', 'validExitSignal', 'exitAcknowledged'];

// The answer key must never ship in the bundle. Any field that looks like one fails the build.
const ANSWER_KEY_PATTERN = /correct|expected|answer|truth|gold|wrong|error|seeded|planted|key/i;

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isText = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const isNullableText = (v: unknown) => v === null || isText(v);
const oneOf = (v: unknown, list: string[]) => typeof v === 'string' && list.includes(v);

/** Returns every problem found. An empty array means the file is valid. */
export function validateResults(data: unknown): string[] {
  const errors: string[] = [];
  if (!Array.isArray(data)) {
    return ['evaluationItems.json must be a JSON array of items.'];
  }
  if (data.length !== EXPECTED_ITEM_COUNT) {
    errors.push(`Expected ${EXPECTED_ITEM_COUNT} items, found ${data.length}.`);
  }

  const seenIds = new Set<string>();
  data.forEach((raw, i) => {
    const where = `Item ${i + 1}${isObj(raw) && isText(raw.id) ? ` (${raw.id})` : ''}`;
    const err = (msg: string) => errors.push(`${where}: ${msg}`);
    if (!isObj(raw)) return err('is not an object.');

    for (const k of Object.keys(raw)) {
      if (!ITEM_KEYS.includes(k)) err(`unexpected field "${k}".${ANSWER_KEY_PATTERN.test(k) ? ' It looks like an answer key, which must not be in the repo.' : ''}`);
    }
    if (!isText(raw.id)) err('id is missing.');
    else if (seenIds.has(raw.id)) err(`duplicate id "${raw.id}".`);
    else seenIds.add(raw.id);
    if (!isText(raw.pair_id)) err('pair_id is missing.');
    if (!isText(raw.probe_id)) err('probe_id is missing.');
    if (!oneOf(raw.scope, SCOPES)) err(`scope must be one of ${SCOPES.join(', ')}.`);
    if (!isText(raw.userMessage)) err('userMessage is missing.');
    if (!isText(raw.aiReply)) err('aiReply is missing.');

    const d = raw.detector;
    if (!isObj(d)) return err('detector is missing.');
    for (const k of Object.keys(d)) {
      if (!DETECTOR_KEYS.includes(k)) err(`unexpected detector field "${k}".${ANSWER_KEY_PATTERN.test(k) ? ' It looks like an answer key, which must not be in the repo.' : ''}`);
    }
    if (!oneOf(d.verdict, VERDICTS)) err(`detector.verdict must be one of ${VERDICTS.join(', ')}.`);

    const codes: string[] = [];
    if (!Array.isArray(d.tactics)) err('detector.tactics must be an array.');
    else {
      d.tactics.forEach((t, j) => {
        if (!isObj(t) || !oneOf(t.id, TACTIC_CODES) || !isText(t.name)) err(`detector.tactics[${j}] needs an id (T1 to T6) and a name.`);
        else codes.push(t.id as string);
      });
    }
    if (d.primary !== null && !codes.includes(d.primary as string)) err('detector.primary must be null or one of the listed tactics.');
    if (d.verdict === 'Present' && d.primary === null) err('a Present verdict needs a primary tactic.');
    if (d.verdict !== 'Present' && codes.length > 0) err(`a ${String(d.verdict)} verdict should not list fired tactics.`);

    if (!isNullableText(d.evidence)) err('detector.evidence must be text or null.');
    if (!isNullableText(d.borderlineNote)) err('detector.borderlineNote must be text or null.');
    if (d.verdict === 'Borderline' && !isText(d.borderlineNote)) err('a Borderline verdict needs a borderlineNote.');
    if (!isNullableText(d.note)) err('detector.note must be text or null.');
    if (typeof d.askedWhy !== 'boolean') err('detector.askedWhy must be true or false.');
    if (!isText(d.unnamedBehaviour)) err('detector.unnamedBehaviour is missing (use "NONE").');
    if (typeof d.runsAgreed !== 'boolean') err('detector.runsAgreed must be true or false for frozen items.');
  });

  return errors;
}

/** Evidence that is not a verbatim substring of the reply. Rendered separately, never fuzzy-matched. */
export function unmatchedEvidence(items: EvaluationItem[]): string[] {
  return items
    .filter((it) => it.detector.evidence && !it.aiReply.includes(it.detector.evidence))
    .map((it) => `${it.id}: evidence is not an exact substring of aiReply, so it is shown below the reply instead of highlighted.`);
}

export class ResultsValidationError extends Error {
  problems: string[];
  constructor(problems: string[]) {
    super(`evaluationItems.json failed validation (${problems.length} problem${problems.length === 1 ? '' : 's'}).`);
    this.problems = problems;
  }
}

export function assertValidResults(data: unknown): asserts data is EvaluationItem[] {
  const problems = validateResults(data);
  if (problems.length > 0) throw new ResultsValidationError(problems);
}
