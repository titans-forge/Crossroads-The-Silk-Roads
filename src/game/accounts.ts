import type { JourneyState } from '../types';
import { cargoLoad, vimaBalance } from './rules';

const clamp = (value: number) => Math.max(0, Math.min(100, value));

export function householdAccounts(state: JourneyState) {
  const cash = Math.max(0, state.resources.silver);
  const credit = Math.max(0, -state.resources.silver);
  const inheritedClaim = vimaBalance(state);
  return { cash, credit, inheritedClaim, totalOwed: credit + inheritedClaim,
    cashAfterClaims: cash - credit - inheritedClaim,
    creditRoom: state.mode === 'challenge' ? Math.max(0, state.resources.silver + 40) : null };
}

export function scoreBreakdown(state: JourneyState) {
  const health = state.people.reduce((sum, person) => sum + person.health, 0) / state.people.length;
  const trust = state.people.reduce((sum, person) => sum + person.trust, 0) / state.people.length;
  const stores = clamp((state.resources.food + state.resources.water) * 1.1);
  const assetIndex = state.resources.silver + cargoLoad(state) * 5 + state.resources.camels * 3 - vimaBalance(state);
  const supplyPoints = stores * 0.25;
  const standingPoints = state.standing * 0.25;
  const assetPoints = clamp(assetIndex) * 0.5;
  const debtPenalty = Math.max(0, -state.resources.silver) * 0.35;
  return { health, trust, supplyPoints, standingPoints, assetPoints, debtPenalty,
    people: Math.round((health + trust) / 2),
    livelihood: Math.round(clamp(supplyPoints + standingPoints + assetPoints - debtPenalty)) };
}
