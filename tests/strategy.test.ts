import { describe, expect, it } from 'vitest';
import { acknowledgeOutcome, choose, continueToBactra, continueToDunhuang, continueToKashgar, continueToPamirs, createInitialState, getChoicePreview, getEncounter, migrateState } from '../src/game/engine';
import type { JourneyState } from '../src/types';

const act = (state: JourneyState, id: string) => acknowledgeOutcome(choose(state, id));
const initial = (rulesVersion: 1 | 2) => ({ ...createInitialState(), rulesVersion });
function bactra(version: 1 | 2) { return continueToBactra(['travel-light', 'redistribute', 'share-medicine', 'let-arash', 'sell-all', 'call-favor'].reduce(act, initial(version))); }
function oasis(version: 1 | 2) {
  const mountains = continueToPamirs(['hire-broker', 'full-rest', 'settle-debt', 'narin-stays', 'household-east'].reduce(act, bactra(version)));
  return continueToKashgar(['lower-valley', 'wait-dawn', 'rest-high', 'carry-family', 'cross-pass'].reduce(act, mountains));
}
function frontier(version: 1 | 2, message = 'send-accounts', text = 'share-route') {
  const north = continueToDunhuang(['canal-share', 'sell-glass', message, text, 'north-road'].reduce(act, oasis(version)));
  return ['north-hire-scribe', 'north-buy-reserve'].reduce(act, north);
}
function claim(version: 1 | 2, message = 'send-accounts', text = 'share-route') {
  return ['hire-guarantor', 'obey-closure', 'lease-camels'].reduce(act, frontier(version, message, text));
}
const offered = (state: JourneyState, id: string) => getEncounter(state)!.choices.find((choice) => choice.id === id)!;

describe('strategic consequences with versioned terms', () => {
  it('gives new journeys rules 3 while omitted migration rules remain 1', () => {
    expect(createInitialState().rulesVersion).toBe(3);
    const old = initial(1); delete (old as JourneyState).rulesVersion;
    expect(migrateState(old).rulesVersion).toBe(1);
    const unchanged = { ...bactra(1), rulesVersion: undefined, standing: 95 };
    expect(offered(unchanged, 'hire-broker').effects.resources?.silver).toBe(-9);
  });

  it('makes references change broker terms without repricing rules 1 saves', () => {
    const old = bactra(1), next = bactra(2);
    expect(offered({ ...old, standing: 5 }, 'hire-broker').effects.resources?.silver).toBe(-9);
    expect(offered({ ...old, standing: 95 }, 'hire-broker').effects.resources?.silver).toBe(-9);
    expect(offered({ ...next, standing: 5 }, 'hire-broker').effects.resources?.silver).toBe(-13);
    expect(offered({ ...next, standing: 95 }, 'hire-broker').effects.resources?.silver).toBe(-5);
    expect(offered({ ...next, standing: 95 }, 'hire-broker').detail).toContain('reduce the agreed fee by 4');
  });

  it('delivers the copying referral only after paying for the copied text', () => {
    const sponsored = frontier(2, 'send-accounts', 'fund-copy');
    const unsponsored = { ...frontier(2), standing: sponsored.standing };
    expect(offered(sponsored, 'hire-guarantor').effects.resources!.silver! - offered(unsponsored, 'hire-guarantor').effects.resources!.silver!).toBe(6);
    expect(offered(sponsored, 'hire-guarantor').detail).toContain('community supported by your copied text');
    const sponsoredFinal = act(claim(2, 'send-accounts', 'fund-copy'), 'show-ledger');
    const unsponsoredFinal = act(claim(2), 'show-ledger');
    expect(offered(sponsoredFinal, 'frontier-office').effects.resources?.silver).toBe(-10);
    expect(offered(unsponsoredFinal, 'frontier-office').effects.resources?.silver).toBe(-18);
    expect(offered(frontier(1, 'send-accounts', 'fund-copy'), 'hire-guarantor').effects.resources?.silver).toBe(-13);
  });

  it('turns a recruitment letter into prepaid local interpretation', () => {
    const hired = frontier(2, 'request-people');
    const alone = frontier(2);
    expect(offered(hired, 'declare-cargo').duration).toBe(1);
    expect(offered(hired, 'declare-cargo').effects.resources?.silver).toBe(0);
    expect(offered(alone, 'declare-cargo').duration).toBe(3);
    expect(offered(alone, 'declare-cargo').effects.resources?.silver).toBe(-5);
    const aidedSale = offered(claim(2, 'request-people'), 'show-ledger');
    const ordinarySale = offered(claim(2), 'show-ledger');
    expect(aidedSale.effects.resources!.silver! - ordinarySale.effects.resources!.silver!).toBe(4);
    expect(aidedSale.duration).toBe(1);
    expect(offered(frontier(1, 'request-people'), 'declare-cargo').duration).toBe(3);
  });

  it('distinguishes reciprocal return provisions from immediate documented cash', () => {
    const start = claim(2);
    const reciprocal = act(start, 'honor-vima');
    const documented = act(start, 'show-ledger');
    expect(documented.resources.silver - reciprocal.resources.silver).toBe(2);
    const reciprocalHome = act(reciprocal, 'return-household');
    const documentedHome = act(documented, 'return-household');
    expect(reciprocalHome.resources.food - documentedHome.resources.food).toBe(2);
    expect(reciprocalHome.resources.water - documentedHome.resources.water).toBe(2);
    expect(reciprocalHome.lastReaction).toContain('promised provisions');
    expect(offered(act(claim(1), 'honor-vima'), 'return-household').effects.resources?.food).toBe(7);
  });

  it('shows the revised net price before selection and preserves the rule version', () => {
    const state = { ...frontier(2, 'send-accounts', 'fund-copy'), standing: 95 };
    const choice = offered(state, 'hire-guarantor');
    const preview = getChoicePreview(state, choice);
    expect(preview.costs).toContain('Silver -3');
    const next = act(state, choice.id);
    expect(next.resources.silver - state.resources.silver).toBe(-3);
    expect(next.rulesVersion).toBe(2);
  });
});
