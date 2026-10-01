import { allEncounters } from '../data/journey';
import { northRouteEncounters, southRouteEncounters } from '../data/routes';
import { isMarketChoice } from '../data/market';
import { PLAYTEST_CONTENT_VERSION, PLAYTEST_FORMAT, PLAYTEST_FORMAT_VERSION, probeQuestions, type ProbePhase } from '../data/playtest';
import type { GameMode } from '../types';

export const PILOT_STORAGE_KEY = 'crossroads-local-pilot-v1';
export const MAX_PILOT_BYTES = 1_000_000;
export const MAX_TRIAL_ACTIVE_MS = 4 * 60 * 60 * 1_000;
export type PilotPhase = 'playing' | 'after' | 'later' | 'complete';
export interface ProbeAnswerSelection { questionId: string; optionId: string }
export interface ProbeAnswer extends ProbeAnswerSelection { correct: boolean }
export interface PilotTrial { encounterId: string; choiceId: string; activeMs: number; helpOpens: number; timingIncomplete?: boolean }
export interface PilotFeedback { clarity: 1 | 2 | 3 | 4 | 5; enjoyment: 1 | 2 | 3 | 4 | 5; challenge: 'easy' | 'right' | 'hard'; wouldReplay: boolean }
export interface PilotSession {
  format: typeof PLAYTEST_FORMAT;
  version: typeof PLAYTEST_FORMAT_VERSION;
  contentVersion: typeof PLAYTEST_CONTENT_VERSION;
  id: string;
  mode: GameMode;
  rulesVersion: 1 | 2 | 3;
  phase: PilotPhase;
  before: ProbeAnswer[];
  after: ProbeAnswer[];
  later: ProbeAnswer[];
  trials: PilotTrial[];
  paused: boolean;
  feedback: PilotFeedback | null;
  completedJourney: boolean;
  interrupted: boolean;
  route: 'undecided' | 'north' | 'south';
  /** Participant-reported interval; zero is same-day practice, not delayed retention. */
  followupDelayDays?: number;
}

const encounters = new Map([...allEncounters, ...northRouteEncounters, ...southRouteEncounters].map(encounter => [encounter.id, encounter]));
const sessionKeys = ['format', 'version', 'contentVersion', 'id', 'mode', 'rulesVersion', 'phase', 'before', 'after', 'later', 'trials', 'paused', 'feedback', 'completedJourney', 'interrupted', 'route', 'followupDelayDays'];
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const phases: PilotPhase[] = ['playing', 'after', 'later', 'complete'];
const routes = ['undecided', 'north', 'south'];

type UnknownRecord = Record<string, unknown>;
function object(value: unknown): value is UnknownRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}
function keys(value: UnknownRecord, allowed: string[]): boolean { return Object.keys(value).every(key => allowed.includes(key)); }
function boundedInteger(value: unknown, maximum: number, minimum = 0): value is number { return typeof value === 'number' && Number.isSafeInteger(value) && value >= minimum && value <= maximum; }
function optionCorrect(phase: ProbePhase, questionId: string, optionId: string): boolean | null {
  const question = probeQuestions[phase].find(item => item.id === questionId);
  if (!question) return null;
  if (optionId === 'unsure') return false;
  if (!question.options.some(option => option.id === optionId)) return null;
  return optionId === question.correctId;
}
function validAnswers(value: unknown, phase: ProbePhase, allowEmpty: boolean): value is ProbeAnswer[] {
  if (!Array.isArray(value)) return false;
  if (allowEmpty && value.length === 0) return true;
  if (value.length !== probeQuestions[phase].length) return false;
  const seen = new Set<string>();
  return value.every(answer => {
    if (!object(answer) || !keys(answer, ['questionId', 'optionId', 'correct']) || typeof answer.questionId !== 'string' || typeof answer.optionId !== 'string' || typeof answer.correct !== 'boolean' || seen.has(answer.questionId)) return false;
    seen.add(answer.questionId);
    return optionCorrect(phase, answer.questionId, answer.optionId) === answer.correct;
  });
}
function normalizeAnswers(phase: ProbePhase, value: unknown): ProbeAnswer[] | null {
  if (!Array.isArray(value) || value.length !== probeQuestions[phase].length) return null;
  const answers: ProbeAnswer[] = [];
  for (const candidate of value) {
    if (!object(candidate) || !keys(candidate, ['questionId', 'optionId', 'correct']) || typeof candidate.questionId !== 'string' || typeof candidate.optionId !== 'string') return null;
    const correct = optionCorrect(phase, candidate.questionId, candidate.optionId);
    if (correct === null || (candidate.correct !== undefined && candidate.correct !== correct)) return null;
    answers.push({ questionId: candidate.questionId, optionId: candidate.optionId, correct });
  }
  if (!validAnswers(answers, phase, false)) return null;
  return probeQuestions[phase].map(question => answers.find(answer => answer.questionId === question.id)!);
}
function validTrial(value: unknown, mode: GameMode, rulesVersion: unknown): value is PilotTrial {
  if (!object(value) || !keys(value, ['encounterId', 'choiceId', 'activeMs', 'helpOpens', 'timingIncomplete']) || typeof value.encounterId !== 'string' || typeof value.choiceId !== 'string') return false;
  const encounter = encounters.get(value.encounterId);
  return !!encounter && (encounter.choices.some(choice => choice.id === value.choiceId) || isMarketChoice(encounter.id, value.choiceId, rulesVersion) || (mode === 'challenge' && value.choiceId === 'emergency-relief'))
    && typeof value.activeMs === 'number' && Number.isFinite(value.activeMs) && value.activeMs >= 0 && value.activeMs <= MAX_TRIAL_ACTIVE_MS
    && boundedInteger(value.helpOpens, 1_000) && (value.timingIncomplete === undefined || typeof value.timingIncomplete === 'boolean');
}
function validFeedback(value: unknown): value is PilotFeedback | null {
  if (value === null) return true;
  return object(value) && keys(value, ['clarity', 'enjoyment', 'challenge', 'wouldReplay'])
    && boundedInteger(value.clarity, 5, 1) && boundedInteger(value.enjoyment, 5, 1)
    && typeof value.challenge === 'string' && ['easy', 'right', 'hard'].includes(value.challenge) && typeof value.wouldReplay === 'boolean';
}

/** Never coerces stored records, accepts identity fields, or throws for malformed input. */
export function validatePilot(value: unknown): value is PilotSession {
  try {
    if (!object(value) || !keys(value, sessionKeys) || value.format !== PLAYTEST_FORMAT || value.version !== PLAYTEST_FORMAT_VERSION || value.contentVersion !== PLAYTEST_CONTENT_VERSION) return false;
    if (typeof value.id !== 'string' || !uuid.test(value.id) || typeof value.mode !== 'string' || !['story', 'challenge'].includes(value.mode) || ![1, 2, 3].includes(value.rulesVersion as number) || !phases.includes(value.phase as PilotPhase)) return false;
    if (!['paused', 'completedJourney', 'interrupted'].every(key => typeof value[key] === 'boolean') || typeof value.route !== 'string' || !routes.includes(value.route) || !validFeedback(value.feedback)) return false;
    if (!validAnswers(value.before, 'before', false) || !validAnswers(value.after, 'after', true) || !validAnswers(value.later, 'later', true)) return false;
    const afterDone = value.after.length === probeQuestions.after.length;
    const laterDone = value.later.length === probeQuestions.later.length;
    if ((value.phase === 'playing' || value.phase === 'after') && (afterDone || laterDone)) return false;
    if (value.phase === 'later' && (!afterDone || laterDone)) return false;
    if (value.phase === 'complete' && (!afterDone || !laterDone)) return false;
    if (value.followupDelayDays !== undefined && (!boundedInteger(value.followupDelayDays, 365) || !['later', 'complete'].includes(String(value.phase)))) return false;
    if (value.phase === 'complete' && value.followupDelayDays === undefined) return false;
    if (value.phase === 'playing' && (value.completedJourney || value.feedback !== null)) return false;
    if (value.completedJourney && value.interrupted) return false;
    if (!Array.isArray(value.trials) || value.trials.length > 30) return false;
    const seen = new Set<string>();
    for (const trial of value.trials) {
      if (!validTrial(trial, value.mode as GameMode, value.rulesVersion) || seen.has(trial.encounterId)) return false;
      seen.add(trial.encounterId);
    }
    return true;
  } catch { return false; }
}

export function createPilot(id: string, mode: GameMode, rulesVersion: 1 | 2 | 3, beforeAnswers: ProbeAnswerSelection[]): PilotSession {
  const before = normalizeAnswers('before', beforeAnswers);
  const session: PilotSession = { format: PLAYTEST_FORMAT, version: PLAYTEST_FORMAT_VERSION, contentVersion: PLAYTEST_CONTENT_VERSION, id, mode, rulesVersion, phase: 'playing', before: before ?? [], after: [], later: [], trials: [], paused: false, feedback: null, completedJourney: false, interrupted: false, route: 'undecided' };
  if (!validatePilot(session)) throw new Error('A local pilot needs a valid anonymous UUID, supported rules, and one response to each opening question.');
  return session;
}

export function recordPilotChoice(session: PilotSession, trial: PilotTrial): PilotSession {
  if (!validatePilot(session) || session.phase !== 'playing' || session.paused || session.interrupted || session.trials.length >= 30 || !validTrial(trial, session.mode, session.rulesVersion) || session.trials.some(item => item.encounterId === trial.encounterId)) return session;
  return { ...session, trials: [...session.trials, { ...trial }] };
}

export function finishPilot(session: PilotSession, completedJourney: boolean, route: PilotSession['route']): PilotSession {
  if (!validatePilot(session) || session.phase !== 'playing' || typeof completedJourney !== 'boolean' || !routes.includes(route)) return session;
  return { ...session, phase: 'after', paused: false, completedJourney: completedJourney && !session.interrupted, route };
}

export function answerProbe(session: PilotSession, phase: ProbePhase, selections: ProbeAnswerSelection[]): PilotSession {
  if (!validatePilot(session) || phase === 'before' || session.phase !== phase || session[phase].length) return session;
  if (phase === 'later' && session.followupDelayDays === undefined) return session;
  const answers = normalizeAnswers(phase, selections);
  if (!answers) return session;
  return { ...session, [phase]: answers, phase: phase === 'after' ? 'later' : 'complete' };
}

export function serializePilot(session: PilotSession): string {
  if (!validatePilot(session)) throw new Error('This pilot record is invalid; the stored copy has not been replaced.');
  const raw = JSON.stringify(session, null, 2);
  if (new TextEncoder().encode(raw).length > MAX_PILOT_BYTES) throw new Error('This pilot record is too large.');
  return raw;
}

/** Invalid or inaccessible local data remains untouched and is never treated as a valid study record. */
export function loadPilot(): PilotSession | null {
  try {
    const raw = localStorage.getItem(PILOT_STORAGE_KEY);
    if (raw === null || raw.length > MAX_PILOT_BYTES || new TextEncoder().encode(raw).length > MAX_PILOT_BYTES) return null;
    const candidate: unknown = JSON.parse(raw);
    return validatePilot(candidate) ? candidate : null;
  } catch { return null; }
}
export function savePilot(session: PilotSession): boolean {
  try { localStorage.setItem(PILOT_STORAGE_KEY, serializePilot(session)); return true; }
  catch { return false; }
}
export function deletePilot(): boolean {
  try { localStorage.removeItem(PILOT_STORAGE_KEY); return true; }
  catch { return false; }
}
