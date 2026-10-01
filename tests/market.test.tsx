import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { acknowledgeOutcome, choose, createInitialState, getEncounter, getTradeProjection, getCargoLoad, getCapacity } from '../src/game/engine';
import { parseCampaign, serializeCampaign } from '../src/game/save';
import { MarketComparison } from '../src/components/MarketComparison';
import { probeQuestions } from '../src/data/playtest';
import { createPilot, recordPilotChoice, validatePilot } from '../src/playtest/session';
import type { JourneyState } from '../src/types';

const prefix = ['travel-light', 'redistribute', 'share-medicine', 'let-arash'];
const atMarket = (mode: 'story' | 'challenge' = 'story', rulesVersion: 1 | 2 | 3 = 3) => prefix.reduce<JourneyState>((s, id) => acknowledgeOutcome(choose(s, id)), { ...createInitialState(mode), rulesVersion });

describe('versioned market bargains', () => {
  it.each([1, 2] as const)('preserves three choices for rules %s and rejects the new offer', version => {
    const state = atMarket('story', version);
    expect(getEncounter(state)!.choices).toHaveLength(3);
    expect(choose(state, 'barter-wool-provisions')).toBe(state);
    expect(parseCampaign(serializeCampaign(state))).toMatchObject({ ok: true, state: { rulesVersion: version } });
  });
  it.each(['story', 'challenge'] as const)('settles the wool trade exactly once in %s mode', mode => {
    const state = atMarket(mode);
    const choice = getEncounter(state)!.choices.find(c => c.id === 'barter-wool-provisions')!;
    const before = JSON.stringify(state);
    const projection = getTradeProjection(state, choice);
    const next = choose(state, choice.id);
    expect(next.cargo.wool).toBe(state.cargo.wool - 1);
    expect(next.cargo.glass).toBe(state.cargo.glass);
    expect(next.resources.silver).toBe(state.resources.silver);
    expect(next.resources.food - state.resources.food).toBe(mode === 'challenge' ? 5 : 6);
    expect(next.resources).toEqual(projection.resources);
    expect(next.day - state.day).toBe(projection.days);
    expect(projection.days).toBe(20);
    expect(getCargoLoad(next)).toBe(projection.load);
    expect(getCapacity(next)).toBe(projection.capacity);
    expect(choose(next, choice.id)).toBe(next);
    const acknowledged = acknowledgeOutcome(next);
    expect(choose(acknowledged, choice.id)).toBe(acknowledged);
    expect(JSON.stringify(state)).toBe(before);
    expect(parseCampaign(serializeCampaign(next))).toMatchObject({ ok: true, state: next });
    expect(parseCampaign(serializeCampaign(acknowledged))).toMatchObject({ ok: true, state: acknowledged });
  });
  it('rejects a new market decision mislabeled as legacy rules', () => {
    const next = choose(atMarket(), 'barter-wool-provisions');
    const forged = JSON.parse(serializeCampaign(next));
    forged.state.rulesVersion = 2;
    expect(parseCampaign(JSON.stringify(forged)).ok).toBe(false);
    expect(() => serializeCampaign({ ...next, rulesVersion: 2 })).toThrow('outside its encounter');
  });
  it('requires actual owned goods even in Story mode', () => {
    const state = atMarket();
    state.cargo.wool = 0;
    expect(choose(state, 'barter-wool-provisions')).toBe(state);
    const html = renderToStaticMarkup(<MarketComparison state={state} encounter={getEncounter(state)!}/>);
    expect(html).toContain('Not enough wool remains.');
    expect(html).toContain('Unavailable');
  });
  it('exchanges only one glass lot at Kashgar and enforces credit limits', () => {
    const state: JourneyState = { ...createInitialState('challenge'), chapter: 4, encounterIndex: 1 };
    const next = choose(state, 'barter-glass-reserve');
    expect(next.cargo.glass).toBe(2);
    expect(next.resources.silver).toBe(44);
    expect(next.resources.food).toBe(41);
    state.resources.silver = -39;
    expect(choose(state, 'barter-glass-reserve')).toBe(state);
  });
  it('includes Story assistance in projections rather than advertising free capacity', () => {
    const state: JourneyState = { ...createInitialState(), chapter: 4, encounterIndex: 1 };
    state.resources.camels = 1;
    const choice = getEncounter(state)!.choices.find(c => c.id === 'carry-for-share')!;
    const projection = getTradeProjection(state, choice);
    expect(projection.assistance.length).toBeGreaterThan(0);
    expect(projection.resources).toEqual(choose(state, choice.id).resources);
  });
  it('keeps market trials valid and version-bound in learner records', () => {
    const answers = probeQuestions.before.map(q => ({ questionId: q.id, optionId: q.correctId }));
    const pilot = createPilot('6bda0b23-3844-4b72-aafd-dd1ad60c0a19', 'story', 3, answers);
    const updated = recordPilotChoice(pilot, { encounterId: 'merchant-handoff', choiceId: 'barter-wool-provisions', activeMs: 2000, helpOpens: 0 });
    expect(updated.trials).toHaveLength(1);
    expect(validatePilot(updated)).toBe(true);
    expect(validatePilot({ ...updated, rulesVersion: 2 })).toBe(false);
  });
});
