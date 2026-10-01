import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createInitialState, getScore } from '../src/game/engine';
import { householdAccounts, scoreBreakdown } from '../src/game/accounts';
import { HouseholdAccounts } from '../src/components/HouseholdAccounts';
import { Debrief } from '../src/components/Debrief';
import type { JourneyState } from '../src/types';

describe('household accounts and score transparency', () => {
  it('separates inherited debt from cash and does not imply repayment', () => {
    const state = createInitialState();
    expect(householdAccounts(state)).toMatchObject({cash: 46, credit: 0, inheritedClaim: 28, totalOwed: 28, cashAfterClaims: 18, creditRoom: null});
    const before = JSON.stringify(state);
    const html = renderToStaticMarkup(<HouseholdAccounts state={state}/>);
    expect(html).toContain('no sale or payment has been made here');
    expect(JSON.stringify(state)).toBe(before);
  });
  it('counts both liabilities without double-counting credit', () => {
    const state = createInitialState('challenge');
    state.resources.silver = -30;
    state.contracts.vima = 'contract';
    expect(householdAccounts(state)).toMatchObject({cash: 0, credit: 30, inheritedClaim: 12, totalOwed: 42, cashAfterClaims: -42, creditRoom: 10});
    state.contracts.vima = 'paid';
    expect(householdAccounts(state).totalOwed).toBe(30);
  });
  it('shows cash plus remaining credit as spending room, not additional free silver', () => {
    expect(householdAccounts(createInitialState('challenge')).creditRoom).toBe(86);
  });
  it('preserves the original score formula across varied states and all rule versions', () => {
    const clamp = (n: number) => Math.max(0, Math.min(100, n));
    for (const rulesVersion of [1, 2, 3] as const) for (const silver of [-200, -40, 0, 46, 300]) {
      const state = { ...createInitialState(), rulesVersion };
      state.resources.silver = silver;
      state.resources.food = 3;
      state.resources.water = 12;
      const expected = Math.round(clamp(clamp(15 * 1.1) * .25 + 50 * .25 + clamp(silver + 9 * 5 + 8 * 3 - 28) * .5 - Math.max(0, -silver) * .35));
      expect(getScore(state).livelihood).toBe(expected);
      expect(getScore(state).people).toBe(75);
      expect(scoreBreakdown(state).livelihood).toBe(expected);
    }
  });
  it('explains simplified valuations and score components', () => {
    const html = renderToStaticMarkup(<HouseholdAccounts state={createInitialState()} scores/>);
    expect(html).toContain('How your scores were calculated');
    expect(html).toContain('5 points per cargo lot');
    expect(html).toContain('not historical valuations');
    expect(html).toContain('Average health');
  });
  it.each(['eastern-handoff', 'return-household'])('does not invent another sale for an empty %s', endingId => {
    const state: JourneyState = { ...createInitialState(), chapter: 5, status: 'campaign-complete', endingId,
      decisions: [{ encounterId: 'final-relay', choiceId: endingId, lesson: 'The household returns.', changes: [{ kind: 'time', label: 'Days', delta: 1 }] }] };
    const html = renderToStaticMarkup(<Debrief state={state} onAnswer={() => {}} onContinue={() => {}} onRestart={() => {}} onJournal={() => {}}/>);
    expect(html).toContain('The household turns west.');
    expect(html).toContain('no new sale');
    expect(html).not.toContain('Samira hands the cargo to an eastern carrier');
  });
});
