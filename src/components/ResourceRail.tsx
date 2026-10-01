import { Coins, Droplets, HeartPulse, Wheat, Package, Footprints } from 'lucide-react';
import { HouseholdAccounts } from './HouseholdAccounts';
import { householdAccounts } from '../game/accounts';
import type { JourneyState } from '../types';
import { getCapacity, getCargoLoad } from '../game/engine';

export const cargoNames = { glass: 'Glass crates', wool: 'Wool bales', herbs: 'Herb bundles', silk: 'Silk bolts', jade: 'Jade parcels' };
export function ResourceRail({ state }: { state: JourneyState }) {
  const accounts = householdAccounts(state);
  const resources = [[Droplets, 'Water', state.resources.water, 'skins'], [Wheat, 'Food', state.resources.food, 'stores'], [Coins, state.resources.silver < 0 ? 'Debt' : 'Silver', Math.abs(state.resources.silver), state.resources.silver < 0 ? 'owed' : 'drachms'], [Footprints, 'Camels', state.resources.camels, 'animals'], [HeartPulse, 'Medicine', state.resources.medicine, 'doses']] as const;
  const shownIndex=state.encounterIndex-(state.lastOutcome?1:0);
  const place = state.chapter <= 2 ? 'Bactra' : state.chapter === 3 ? 'The Pamirs' : state.chapter === 4 ? 'Kashgar' : !state.legacyRouteSkipped && shownIndex < 2 ? state.contracts.route === 'north' ? 'Northern oases' : 'Southern oases' : 'Dunhuang';
  return <aside className="resource-rail" aria-label="Caravan supplies">
    <div className="destination"><span>{state.chapter === 1 ? 'Bound for' : 'On the road at'}</span><strong>{place}</strong><span>Journey day {state.day} · approximate</span></div>
    <div className="resource-list">{resources.map(([Icon, label, value, unit]) => <div className="resource" key={label}><Icon size={18} aria-hidden="true" /><div><span>{label}</span><strong>{value}</strong></div><small>{unit}</small></div>)}</div>
    {accounts.totalOwed > 0 && <p className="credit-note" style={{ marginTop: 10 }}>Total owed: {accounts.totalOwed} silver{accounts.inheritedClaim > 0 ? `, including Vima\'s ${accounts.inheritedClaim}-silver claim` : ''}.</p>}
    <details className="manifest"><summary><Package size={16} /> Cargo &amp; accounts <strong>{getCargoLoad(state)}/{getCapacity(state)} load</strong></summary><ul>{Object.entries(state.cargo).filter(([,value]) => value > 0).map(([good,value]) => <li key={good}><span>{cargoNames[good as keyof typeof cargoNames]}</span><strong>{value}</strong></li>)}</ul>{getCargoLoad(state) === 0 && <p>No trade cargo remains.</p>}
    <HouseholdAccounts state={state}/>
    <div className="standing"><span>Road standing</span><strong>{state.standing}/100</strong><meter min="0" max="100" value={state.standing} aria-label="Road standing" /></div>
    <p className="credit-note">{state.mode === 'challenge' ? 'Challenge: credit is capped at 40 owed. Shortages can force costly relief work.' : 'Story: credit is available. Debts stay on your account and affect your ending.'}</p></details>
  </aside>;
}
