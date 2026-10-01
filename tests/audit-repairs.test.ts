import { describe, expect, it } from 'vitest';
import { acknowledgeOutcome, choose, continueToBactra, createInitialState, getEncounter, recordReflection } from '../src/game/engine';
import { buildEpilogue, reflectionProgress } from '../src/game/epilogue';
import { getReflection } from '../src/data/learning';
import { parseCampaign, serializeCampaign } from '../src/game/save';
import type { JourneyState } from '../src/types';

const act = (state: JourneyState, id: string) => acknowledgeOutcome(choose(state, id));
const firstChapter = (care = 'call-favor') => ['travel-light', 'redistribute', 'share-medicine', 'let-arash', 'keep-cargo', care].reduce(act, createInitialState());
const relay = () => ['hire-broker', 'full-rest', 'settle-debt', 'narin-stays', 'arash-east'].reduce(act, continueToBactra(firstChapter()));

describe('played-audit repairs', () => {
  it('does not promise a glass market absent from the Bactra chapter', () => {
    const state = ['travel-light', 'redistribute', 'share-medicine', 'let-arash'].reduce(act, createInitialState());
    const keep = getEncounter(state)!.choices.find(choice => choice.id === 'keep-cargo')!;
    expect(keep.label).not.toContain('for Bactra');
    expect(keep.detail).toContain('Kashgar');
    expect(keep.detail).toContain('not guaranteed');
  });
  it.each(['physician', 'call-favor'])('recognizes gate care from %s in the lodging scene', care => {
    const state = act(continueToBactra(firstChapter(care)), 'hire-broker');
    expect(getEncounter(state)!.text).toContain('after receiving care');
    expect(getEncounter(state)!.text).not.toContain('still runs a fever');
  });
  it('retains the need for care when only the animals were watered', () => {
    const state = act(continueToBactra(firstChapter('water-camels')), 'hire-broker');
    expect(getEncounter(state)!.text).toContain('still needs care');
  });
  it('describes Arash transferring rather than rejoining', () => {
    const end = relay();
    expect(end.status).toBe('campaign-complete');
    const movement = end.decisions.at(-1)!.changes!.find(change => change.kind === 'network' && change.label === 'Arash');
    expect(movement?.detail).toBe('Now traveling with: Eastbound caravan');
  });
  it('keeps recruitment pricing and legacy wording while clarifying the current promise', () => {
    const state: JourneyState = { ...createInitialState(), chapter: 4, encounterIndex: 2 };
    const offer = getEncounter(state)!.choices.find(choice => choice.id === 'request-people')!;
    expect(offer.effects.resources?.silver).toBe(-9);
    expect(offer.detail).toContain('paid Bactra intermediary');
    expect(offer.reaction).toContain('prepaid booking');
    const legacy = getEncounter({ ...state, rulesVersion: 1 })!.choices.find(choice => choice.id === 'request-people')!;
    expect(legacy.reaction).toContain('No one can know');
    expect(legacy.effects.resources?.silver).toBe(-9);
  });
  it('separates optional skipped questions from unreached chapters', () => {
    expect(reflectionProgress(relay())).toMatchObject({ attempted: 0, correct: 0, skipped: 2, unreached: 3 });
    expect(reflectionProgress(createInitialState())).toMatchObject({ attempted: 0, skipped: 0, unreached: 5 });
  });
  it('allows skipped questions later, sorts records, and preserves the first answer', () => {
    let state = relay();
    state = recordReflection(state, getReflection(2)!.correctId);
    const wrong = getReflection(1)!.options.find(option => option.id !== getReflection(1)!.correctId)!.id;
    state = recordReflection(state, wrong);
    expect(state.reflections.map(answer => answer.chapter)).toEqual([1, 2]);
    expect(recordReflection(state, getReflection(1)!.correctId)).toBe(state);
    expect(reflectionProgress(state)).toMatchObject({ correct: 1, attempted: 2, skipped: 0, unreached: 3 });
    const restored = parseCampaign(serializeCampaign(state));
    expect(restored.ok).toBe(true);
    if (restored.ok) expect(restored.state.reflections).toEqual(state.reflections);
  });
  it('rejects future, invalid, and unacknowledged reflection attempts', () => {
    const state = relay();
    expect(recordReflection(state, getReflection(3)!.correctId)).toBe(state);
    expect(recordReflection(state, 'invented')).toBe(state);
    const gate = ['travel-light', 'redistribute', 'share-medicine', 'let-arash', 'keep-cargo'].reduce(act, createInitialState());
    const pending = choose(gate, 'call-favor');
    expect(recordReflection(pending, getReflection(1)!.correctId)).toBe(pending);
  });
  it('builds an ending only from recorded decisions and current people', () => {
    const state = relay();
    const before = JSON.stringify(state);
    const ending = buildEpilogue(state);
    expect(ending.title).toBe('Arash takes the next road.');
    expect(ending.highlights.length).toBeLessThanOrEqual(3);
    for (const event of ending.highlights) expect(state.decisions.some(decision => decision.encounterId === event.id)).toBe(true);
    expect(ending.people.find(person => person.id === 'arash')?.destination).toBe('Eastbound caravan');
    expect(ending.people.find(person => person.id === 'narin')?.destination).toBe('Bactra');
    expect(JSON.stringify(state)).toBe(before);
  });
  it('handles a legacy ledger without outcome changes', () => {
    const state = relay();
    state.decisions = state.decisions.map(({ changes: _changes, ...decision }) => decision);
    expect(buildEpilogue(state).highlights).toHaveLength(3);
    expect(parseCampaign(serializeCampaign(state)).ok).toBe(true);
  });
});
