// Checks public/data/results.json against the contract in src/types.ts.
// Runs in the browser in dev, and at build time via the plugin in vite.config.ts.
// Pure TypeScript with no DOM access, so it works in both places.

import type { ConversationItem } from '../types.ts';

/** The study uses a fixed set of eight conversations. */
export const EXPECTED_ITEM_COUNT = 8;

const VERDICTS = ['present', 'absent', 'borderline'];
const TACTICS = ['premature_exit', 'fomo', 'emotional_neglect', 'emotional_pressure', 'ignoring_exit', 'physical_restraint'];
const STATES = ['fired', 'contested', 'ruled_out'];
const ZONES = ['clearly_absent', 'leaning_absent', 'borderline', 'leaning_present', 'clearly_present'];
const PLATFORMS = ['Replika', 'Character.AI'];
const SCOPES = ['session', 'app'];
const MITIGATIONS = ['low', 'high'];

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isText = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);
const oneOf = (v: unknown, list: string[]) => typeof v === 'string' && list.includes(v);

/** Returns every problem found. An empty array means the file is valid. */
export function validateResults(data: unknown): string[] {
  const errors: string[] = [];
  if (!Array.isArray(data)) {
    return ['results.json must be a JSON array of ConversationItem objects.'];
  }
  if (data.length !== EXPECTED_ITEM_COUNT) {
    errors.push(`Expected ${EXPECTED_ITEM_COUNT} items, found ${data.length}.`);
  }

  const seenIds = new Set<string>();
  data.forEach((raw, i) => {
    const where = `Item ${i + 1}${isObj(raw) && isText(raw.id) ? ` (${raw.id})` : ''}`;
    const err = (msg: string) => errors.push(`${where}: ${msg}`);
    if (!isObj(raw)) return err('is not an object.');

    if (!isText(raw.id)) err('id is missing.');
    else if (seenIds.has(raw.id)) err(`id "${raw.id}" is used more than once.`);
    else seenIds.add(raw.id);

    if (!oneOf(raw.platform, PLATFORMS)) err(`platform must be one of ${PLATFORMS.join(', ')}.`);
    if (!oneOf(raw.scope, SCOPES)) err(`scope must be one of ${SCOPES.join(', ')}.`);
    if (!oneOf(raw.mitigation, MITIGATIONS)) err(`mitigation must be one of ${MITIGATIONS.join(', ')}.`);
    for (const key of ['companion', 'probeId', 'collectedOn', 'userMessage', 'aiResponse']) {
      if (!isText(raw[key])) err(`${key} must be a non-empty string.`);
    }
    if (!isInt(raw.warmUpTurns) || raw.warmUpTurns < 0) err('warmUpTurns must be a whole number of 0 or more.');

    const result = raw.result;
    if (!isObj(result)) return err('result is missing.');
    if (!oneOf(result.verdict, VERDICTS)) err(`result.verdict must be one of ${VERDICTS.join(', ')}.`);
    if (!isText(result.summary)) err('result.summary must be a non-empty string.');
    if (!(result.borderlineNote === null || typeof result.borderlineNote === 'string')) {
      err('result.borderlineNote must be a string or null.');
    }
    if (!Array.isArray(result.decisionTrace) || result.decisionTrace.length === 0 || !result.decisionTrace.every(isText)) {
      err('result.decisionTrace must be a non-empty array of strings.');
    }

    const c = result.confidence;
    if (!isObj(c)) err('result.confidence is missing.');
    else {
      if (typeof c.value !== 'number' || c.value < 0 || c.value > 1) err('confidence.value must be a number from 0 to 1.');
      if (!oneOf(c.zone, ZONES)) err(`confidence.zone must be one of ${ZONES.join(', ')}.`);
      if (!isInt(c.runsTotal) || c.runsTotal < 1) err('confidence.runsTotal must be a whole number of 1 or more.');
      if (!isInt(c.runsAgreeing) || c.runsAgreeing < 0 || (isInt(c.runsTotal) && c.runsAgreeing > c.runsTotal)) {
        err('confidence.runsAgreeing must be a whole number between 0 and runsTotal.');
      }
      if (typeof c.note !== 'string') err('confidence.note must be a string.');
    }

    if (!Array.isArray(result.spans)) return err('result.spans must be an array.');
    const aiResponse = typeof raw.aiResponse === 'string' ? raw.aiResponse : '';
    const ranges: { id: number; start: number; end: number }[] = [];
    let primaryCount = 0;

    result.spans.forEach((s, j) => {
      const at = `span ${j + 1}`;
      if (!isObj(s)) return err(`${at} is not an object.`);
      if (s.id !== j + 1) err(`${at} has id ${String(s.id)}; span ids must run 1, 2, 3… in order.`);
      if (!oneOf(s.state, STATES)) err(`${at} state must be one of ${STATES.join(', ')}.`);
      if (!oneOf(s.tactic, TACTICS)) err(`${at} tactic must be one of ${TACTICS.join(', ')}.`);
      if (typeof s.primary !== 'boolean') err(`${at} primary must be true or false.`);
      if (s.primary === true) {
        primaryCount += 1;
        if (s.state === 'ruled_out') err(`${at} is ruled_out but marked primary.`);
      }
      if (!isText(s.rationale)) err(`${at} rationale must be a non-empty string.`);
      if (s.state === 'contested' && !isText(s.readOtherWay)) err(`${at} is contested but has no readOtherWay.`);
      if (s.state !== 'contested' && s.readOtherWay !== undefined) err(`${at} has readOtherWay but is not contested.`);

      if (!isText(s.evidence)) return err(`${at} evidence must be a non-empty string.`);
      const start = aiResponse.indexOf(s.evidence);
      if (start === -1) {
        err(`${at} evidence "${s.evidence}" is not found verbatim in aiResponse. Check quotes, apostrophes and spacing.`);
      } else {
        ranges.push({ id: j + 1, start, end: start + s.evidence.length });
      }
    });

    ranges.sort((a, b) => a.start - b.start);
    for (let k = 1; k < ranges.length; k++) {
      if (ranges[k].start < ranges[k - 1].end) {
        err(`spans ${ranges[k - 1].id} and ${ranges[k].id} overlap in aiResponse; highlights cannot overlap.`);
      }
    }

    if (result.verdict === 'present' && primaryCount !== 1) {
      err(`verdict is present, so exactly one span must have primary: true (found ${primaryCount}).`);
    } else if (primaryCount > 1) {
      err(`at most one span may have primary: true (found ${primaryCount}).`);
    }
  });

  return errors;
}

export class ResultsValidationError extends Error {
  constructor(public readonly problems: string[]) {
    super(`results.json failed validation with ${problems.length} problem(s).`);
    this.name = 'ResultsValidationError';
  }
}

/** Throws ResultsValidationError listing every problem if the data is invalid. */
export function assertValidResults(data: unknown): asserts data is ConversationItem[] {
  const problems = validateResults(data);
  if (problems.length > 0) throw new ResultsValidationError(problems);
}
