import { describe, expect, it } from 'vitest';
import { createInitialState, getEncounter, getChoicePreview, getChapterEncounters, choose, journeyContinuation } from '../src/game/engine';
import type { JourneyState } from '../src/types';

describe('release choice clarity', () => {
  it.each([8, 12])('Roshna explains the actual sale for %s lots', lots => {
    const state: JourneyState = { ...createInitialState(), chapter: 3, encounterIndex: 0, cargo: {glass: lots, wool:0, herbs:0, silk:0, jade:0} };
    state.resources.camels = 6;
    const choice = getEncounter(state)!.choices.find(c => c.id === 'high-guide')!;
    const next = choose(state, choice.id);
    const sold = lots - next.cargo.glass;
    expect(sold).toBe(Math.max(0, lots - 8));
    expect(choice.detail).toContain(sold ? `Sell ${sold} cargo lots for ${sold * 3} silver` : 'no sale is needed');
    expect(next.resources).toEqual(expect.objectContaining({silver: state.resources.silver + (choice.effects.resources?.silver ?? 0)}));
  });
  it.each([2,4,5] as const)('ending labels agree with actual chapter %s outcomes', chapter => {
    const state: JourneyState = {...createInitialState(), chapter};
    state.encounterIndex = getChapterEncounters(chapter).length - 1;
    for (const choice of getEncounter(state)!.choices) {
      const next = choose(state, choice.id);
      expect(next).not.toBe(state);
      expect(journeyContinuation(state, choice)?.startsWith('Ends')).toBe(next.pendingStatus === 'campaign-complete');
    }
  });
  it('describes saturated trust without promising an increase', () => {
    const state = createInitialState();
    state.people.forEach(p => p.trust = 100);
    const choice = getEncounter(state)!.choices.find(c => c.id === 'travel-light')!;
    const preview = getChoicePreview(state, choice);
    expect(preview.costs).toContain('Vardan: trust already at 100');
    expect(preview.costs.some(c => c.startsWith('Vardan trust +'))).toBe(false);
    expect(journeyContinuation(state, choice)).toBeNull();
  });
});
