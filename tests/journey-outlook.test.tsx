import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createInitialState, choose } from '../src/game/engine';
import { journeyStage, journeyOutlook } from '../src/game/journeyOutlook';
import { JourneyScene, journeyScene } from '../src/components/JourneyScene';
import type { JourneyState } from '../src/types';

const routeState = (route: 'north' | 'south', index = 0): JourneyState => ({ ...createInitialState(), chapter: 5, encounterIndex: index, contracts: { ...createInitialState().contracts, route } });
describe('journey outlook', () => {
  it('does not select a route before the player does', () => {
    const state = { ...createInitialState(), chapter: 4 as const };
    expect(journeyOutlook(state).upcoming).toEqual(['Northern or southern oases', 'Dunhuang']);
    expect(journeyScene(state).label).toContain('Kashgar');
  });
  it.each(['north', 'south'] as const)('keeps %s scenery at its oasis until the outcome is acknowledged', route => {
    const state = routeState(route);
    const outcome = choose(state, route === 'north' ? 'north-hire-scribe' : 'south-buy-supplies');
    expect(outcome.lastOutcome).not.toBeNull();
    expect(journeyStage(outcome)).toBe(journeyStage(state));
    expect(journeyScene(outcome).src).toBe(journeyScene(state).src);
  });
  it('selects each branch and returns to frontier art after both oasis scenes', () => {
    expect(journeyStage(routeState('north', 1))).toBe('turfan');
    expect(journeyStage(routeState('south', 1))).toBe('khotan');
    expect(journeyScene(routeState('north')).src).not.toBe(journeyScene(routeState('south')).src);
    expect(journeyStage(routeState('south', 2))).toBe('dunhuang');
    expect(journeyStage({ ...routeState('north'), legacyRouteSkipped: true })).toBe('dunhuang');
  });
  it('uses the real cargo capacity and keeps debts separate', () => {
    const state = createInitialState('challenge');
    state.resources.silver = -7;
    state.contracts.manuscript = true;
    const notes = journeyOutlook(state).notes;
    expect(notes).toContain('9 of 15 cargo spaces occupied.');
    expect(notes).toContain("Vima's separate claim: 28 silver remains.");
    expect(notes).toContain('Caravan credit: 7 silver owed (limit 40).');
  });
  it('does not promise new-rule benefits to legacy saves', () => {
    const state = createInitialState();
    state.decisions.push({ encounterId: 'test', choiceId: 'request-people', lesson: '' });
    expect(journeyOutlook(state).notes).toContain('An interpreter is already booked at Dunhuang.');
    state.rulesVersion = 1;
    expect(journeyOutlook(state).notes.join(' ')).not.toContain('interpreter');
  });
  it('shows cargo-sensitive guidance without changing the save', () => {
    const state = routeState('south', 1);
    const original = JSON.stringify(state);
    expect(journeyOutlook(state).focus).toContain('no jade');
    expect(JSON.stringify(state)).toBe(original);
    state.cargo.jade = 1;
    expect(journeyOutlook(state).focus).toContain('Your jade');
  });
  it('provides accessible art and a collapsed outlook', () => {
    const html = renderToStaticMarkup(<JourneyScene state={routeState('north')} onEnlarge={() => {}} onAtlas={() => {}}/>);
    expect(html).toContain('Enlarge landscape');
    expect(html).toContain('Upcoming stops');
    expect(html).toContain('Turfan');
    expect(html).not.toContain(' open=');
    expect(html).toContain('alt="Illustrated northern oasis');
  });
});
