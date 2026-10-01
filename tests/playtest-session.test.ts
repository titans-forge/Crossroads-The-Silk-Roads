import { afterEach, describe, expect, it, vi } from 'vitest';
import { PLAYTEST_CONTENT_VERSION, probeQuestions, type ProbePhase } from '../src/data/playtest';
import { answerProbe, createPilot, deletePilot, finishPilot, loadPilot, MAX_PILOT_BYTES, MAX_TRIAL_ACTIVE_MS, PILOT_STORAGE_KEY, recordPilotChoice, savePilot, serializePilot, validatePilot, type PilotSession, type PilotTrial, type ProbeAnswerSelection } from '../src/playtest/session';

const id = '6bda0b23-3844-4b72-aafd-dd1ad60c0a19';
const answers = (phase: ProbePhase, unsure = false): ProbeAnswerSelection[] => probeQuestions[phase].map(question => ({ questionId: question.id, optionId: unsure ? 'unsure' : question.correctId }));
const fresh = () => createPilot(id, 'story', 2, answers('before'));
const trial: PilotTrial = { encounterId: 'departure-account', choiceId: 'travel-light', activeMs: 1_203.5, helpOpens: 2 };
const after = () => finishPilot(fresh(), true, 'north');
const later = () => answerProbe(after(), 'after', answers('after'));
const complete = () => answerProbe({ ...later(), followupDelayDays: 5 }, 'later', answers('later'));
afterEach(() => vi.unstubAllGlobals());

describe('optional local pilot operations', () => {
  it('starts only after three baseline responses and derives their correctness', () => {
    const session = fresh();
    expect(validatePilot(session)).toBe(true);
    expect(session).toMatchObject({ id, mode: 'story', rulesVersion: 2, contentVersion: PLAYTEST_CONTENT_VERSION, phase: 'playing', after: [], later: [], trials: [], completedJourney: false, interrupted: false });
    expect(session.before.every(answer => answer.correct)).toBe(true);
    expect(createPilot(id, 'challenge', 1, answers('before', true)).before.every(answer => !answer.correct && answer.optionId === 'unsure')).toBe(true);
  });

  it('rejects incomplete, duplicate, or unknown opening responses without modifying caller data', () => {
    const selections = answers('before');
    const original = structuredClone(selections);
    for (const invalid of [[], selections.slice(1), [selections[0], selections[0], selections[2]], [...selections.slice(0, 2), { questionId: selections[2].questionId, optionId: 'invented' }]]) {
      expect(() => createPilot(id, 'story', 2, invalid)).toThrow();
    }
    expect(() => createPilot('participant@example.com', 'story', 2, selections)).toThrow();
    expect(selections).toEqual(original);
  });

  it('records a copied trial with bounded relative duration and no implicit storage write', () => {
    const setItem = vi.fn();
    vi.stubGlobal('localStorage', { setItem });
    const session = fresh();
    const input = { ...trial };
    const result = recordPilotChoice(session, input);
    input.helpOpens = 999;
    expect(result.trials).toEqual([trial]);
    expect(session.trials).toEqual([]);
    expect(setItem).not.toHaveBeenCalled();
    expect(validatePilot(result)).toBe(true);
  });

  it('does not duplicate a decision or collect while paused, interrupted, or outside play', () => {
    const recorded = recordPilotChoice(fresh(), trial);
    expect(recordPilotChoice(recorded, trial)).toBe(recorded);
    for (const session of [{ ...fresh(), paused: true }, { ...fresh(), interrupted: true }, after(), later(), complete()]) expect(recordPilotChoice(session, trial)).toBe(session);
  });

  it.each([
    { activeMs: -1 }, { activeMs: Infinity }, { activeMs: NaN }, { activeMs: MAX_TRIAL_ACTIVE_MS + 1 },
    { activeMs: '100' }, { helpOpens: -1 }, { helpOpens: 0.5 }, { helpOpens: 1_001 },
    { encounterId: 'unknown' }, { choiceId: 'redistribute' }, { choiceId: 'emergency-relief' },
  ])('rejects malformed or cross-encounter trial values %#', (change) => {
    const session = fresh();
    expect(recordPilotChoice(session, { ...trial, ...change } as PilotTrial)).toBe(session);
  });

  it('recognizes the challenge relief identifier without asserting that a pilot trace proves engine eligibility', () => {
    const challenge = createPilot(id, 'challenge', 2, answers('before'));
    const recorded = recordPilotChoice(challenge, { ...trial, choiceId: 'emergency-relief' });
    expect(recorded.trials).toHaveLength(1);
    expect(validatePilot(recorded)).toBe(true);
  });

  it('keeps an interrupted or partial play separate from a completed journey', () => {
    const partial = finishPilot({ ...fresh(), interrupted: true }, true, 'undecided');
    expect(partial).toMatchObject({ phase: 'after', completedJourney: false, interrupted: true, paused: false });
    expect(finishPilot(fresh(), false, 'undecided')).toMatchObject({ phase: 'after', completedJourney: false, interrupted: false });
    expect(finishPilot(after(), false, 'south')).toEqual(after());
  });

  it('records each submitted phase once and requires its preceding phase', () => {
    const session = fresh();
    expect(answerProbe(session, 'after', answers('after'))).toBe(session);
    expect(answerProbe(session, 'before', answers('before', true))).toBe(session);
    const ready = after();
    expect(answerProbe(ready, 'later', answers('later'))).toBe(ready);
    expect(answerProbe(ready, 'after', answers('after').slice(1))).toBe(ready);
    const answered = answerProbe(ready, 'after', answers('after', true));
    expect(answered.phase).toBe('later');
    expect(answered.after.every(answer => !answer.correct)).toBe(true);
    expect(answerProbe(answered, 'after', answers('after'))).toBe(answered);
  });

  it('requires a self-reported follow-up interval and accepts zero as practice', () => {
    const session = later();
    expect(answerProbe(session, 'later', answers('later'))).toBe(session);
    for (const followupDelayDays of [0, 3, 7, 365]) {
      const result = answerProbe({ ...session, followupDelayDays }, 'later', answers('later'));
      expect(result).toMatchObject({ phase: 'complete', followupDelayDays });
      expect(validatePilot(result)).toBe(true);
    }
    for (const followupDelayDays of [-1, 0.5, 366, NaN]) expect(validatePilot({ ...session, followupDelayDays })).toBe(false);
    expect(validatePilot({ ...session, followupDelayDays: '5' })).toBe(false);
    expect(validatePilot({ ...fresh(), followupDelayDays: 5 })).toBe(false);
  });

  it('round-trips an anonymous complete record with fixed-choice feedback', () => {
    const session: PilotSession = { ...complete(), feedback: { clarity: 4, enjoyment: 5, challenge: 'right', wouldReplay: true } };
    const restored: unknown = JSON.parse(serializePilot(session));
    expect(validatePilot(restored)).toBe(true);
    expect(restored).toEqual(session);
    expect(Object.keys(session)).not.toContain('timestamp');
    expect(Object.keys(session)).not.toContain('name');
  });
});

describe('untrusted pilot record validation', () => {
  it.each([null, true, [], 'pilot', { before: [null] }])('fails safely on malformed top-level records %#', value => {
    expect(() => validatePilot(value)).not.toThrow();
    expect(validatePilot(value)).toBe(false);
  });

  it('rejects forged scores, phase completion, malformed nested records and identity fields', () => {
    const valid = complete();
    const mutations: Array<(value: any) => void> = [
      value => { value.before[0].correct = false; },
      value => { value.after = []; },
      value => { value.before = [null]; },
      value => { value.later[0].optionId = 'invented'; },
      value => { value.trials = [null]; },
      value => { value.trials = Array(31).fill(trial); },
      value => { value.trials = [trial, trial]; },
      value => { value.feedback = { clarity: 6, enjoyment: 4, challenge: 'right', wouldReplay: false }; },
      value => { value.feedback = { clarity: 4, enjoyment: 4, challenge: 'right', wouldReplay: 'yes' }; },
      value => { value.name = 'Person'; },
      value => { value.exactDate = '2026-09-07'; },
      value => { value.trials = [{ ...trial, note: 'Personal text' }]; },
      value => { value.version = 99; },
      value => { value.contentVersion = 'unrecognized'; },
      value => { value.rulesVersion = '2'; },
      value => { value.paused = 'false'; },
      value => { value.mode = new String('story'); },
      value => { value.completedJourney = true; value.interrupted = true; },
      value => { delete value.followupDelayDays; },
    ];
    for (const mutate of mutations) {
      const damaged = structuredClone(valid);
      mutate(damaged);
      expect(validatePilot(damaged)).toBe(false);
      expect(() => serializePilot(damaged)).toThrow();
    }
    const hostile = { get format() { throw new Error('getter'); } };
    expect(validatePilot(hostile)).toBe(false);
  });
});

describe('separate browser storage for opted-in pilot records', () => {
  function stored(initial?: string) {
    const data = new Map<string, string>([['crossroads-silk-roads-v1', 'existing game save']]);
    if (initial !== undefined) data.set(PILOT_STORAGE_KEY, initial);
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, raw: string) => data.set(key, raw),
      removeItem: (key: string) => data.delete(key),
    });
    return data;
  }

  it('loads, saves, and deletes only the pilot key', () => {
    const data = stored();
    expect(loadPilot()).toBeNull();
    const session = recordPilotChoice(fresh(), trial);
    expect(savePilot(session)).toBe(true);
    expect(loadPilot()).toEqual(session);
    expect(deletePilot()).toBe(true);
    expect(loadPilot()).toBeNull();
    expect(data.get('crossroads-silk-roads-v1')).toBe('existing game save');
  });

  it.each(['not json', JSON.stringify({ trials: [null] }), 'x'.repeat(MAX_PILOT_BYTES + 1)])('rejects damaged local data without deleting it %#', raw => {
    const data = stored(raw);
    expect(loadPilot()).toBeNull();
    expect(data.get(PILOT_STORAGE_KEY)).toBe(raw);
  });

  it('retains the prior valid record when asked to save invalid data', () => {
    const raw = serializePilot(fresh());
    const data = stored(raw);
    const damaged = { ...fresh(), before: [] };
    expect(savePilot(damaged)).toBe(false);
    expect(data.get(PILOT_STORAGE_KEY)).toBe(raw);
  });

  it('returns failure safely when browser storage is denied or unavailable', () => {
    const denied = () => { throw new DOMException('Denied', 'SecurityError'); };
    vi.stubGlobal('localStorage', { getItem: denied, setItem: denied, removeItem: denied });
    expect(loadPilot()).toBeNull();
    expect(savePilot(fresh())).toBe(false);
    expect(deletePilot()).toBe(false);
    vi.stubGlobal('localStorage', undefined);
    expect(loadPilot()).toBeNull();
    expect(savePilot(fresh())).toBe(false);
    expect(deletePilot()).toBe(false);
  });
});
