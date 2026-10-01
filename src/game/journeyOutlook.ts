import type { JourneyState } from '../types';
import { capacity, cargoLoad, vimaBalance } from './rules';

export function journeyStage(state: JourneyState) {
  const index = Math.max(0, state.encounterIndex - (state.lastOutcome ? 1 : 0));
  if (state.chapter < 5) return ['merv', 'bactra', 'wakhan', 'kashgar'][state.chapter - 1];
  if (state.legacyRouteSkipped || index >= 2) return 'dunhuang';
  return state.contracts.route === 'north' ? ['kucha', 'turfan'][index] : ['yarkand', 'khotan'][index];
}

export function journeyOutlook(state: JourneyState) {
  const stage = journeyStage(state);
  const north = state.contracts.route === 'north';
  const road = ['Merv', 'Bactra', 'Pamir approaches', 'Kashgar', ...(north ? ['Kucha', 'Turfan'] : ['Yarkand', 'Khotan']), 'Dunhuang'];
  const position = state.chapter < 5 ? state.chapter - 1 : stage === 'dunhuang' ? 6 : stage === 'kucha' || stage === 'yarkand' ? 4 : 5;
  const upcoming = state.chapter < 4 ? road.slice(position + 1, 4) : state.contracts.route === 'undecided' ? ['Northern or southern oases', 'Dunhuang'] : road.slice(position + 1);
  const focus = stage === 'merv' ? 'Keep the household supplied while deciding which goods to carry east.'
    : stage === 'bactra' ? 'Balance rest, trading terms, and Vima\'s claim before the mountains.'
    : stage === 'wakhan' ? 'Guides, shelter, and carrying space compete for the same resources.'
    : stage === 'kashgar' ? 'The north offers account work and water bargains; the south offers jade trading and escort work.'
    : stage === 'kucha' ? 'Separate records cost silver; shared accounts trade independence for lower costs.'
    : stage === 'turfan' ? 'Choose between buying water, shared travel, and working for supplies.'
    : stage === 'yarkand' ? 'Jade uses money and carrying space. Escort work and provisions are alternatives.'
    : stage === 'khotan' ? state.cargo.jade > 0 ? 'Your jade can be sold for cash or exchanged partly for supplies.' : 'You carry no jade. The stone-market encounter offers work instead of a sale.'
    : 'Settle frontier obligations and decide how the household and its goods continue.';
  const notes = [`${cargoLoad(state)} of ${capacity(state)} cargo spaces occupied.`];
  if (vimaBalance(state) > 0) notes.push(`Vima's separate claim: ${vimaBalance(state)} silver remains.`);
  if (state.resources.silver < 0) notes.push(`Caravan credit: ${Math.abs(state.resources.silver)} silver owed${state.mode === 'challenge' ? ' (limit 40)' : ''}.`);
  if ((state.rulesVersion ?? 1) >= 2 && state.decisions.some(d => d.choiceId === 'request-people') && stage !== 'dunhuang') notes.push('An interpreter is already booked at Dunhuang.');
  if ((state.rulesVersion ?? 1) >= 2 && state.decisions.some(d => d.choiceId === 'fund-copy')) notes.push('Your copying-community referral can reduce frontier guarantor and office costs.');
  if (state.chapter < 4 && state.cargo.glass > 0) notes.push('Glass kept on the road has another sale opportunity at Kashgar.');
  return { stage, upcoming, focus, notes };
}
