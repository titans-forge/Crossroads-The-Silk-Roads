import type { Choice } from '../types';

// Fictional fixed offers, not claims about historical prices. Each replaces a
// single encounter decision, so revisiting the screen cannot repeat the trade.
export const marketOffers: Record<string, Choice> = {
  'merchant-handoff': {
    id: 'barter-wool-provisions', label: 'Trade one wool bale for provisions',
    detail: 'Give up one wool bale for 6 food and 6 water. Keep the glass and silver, but spend two days arranging supplies.',
    duration: 2, effects: { cargo: { wool: -1 }, resources: { food: 6, water: 6 }, knowledge: 3 },
    reaction: 'The provisioner accepts one bale. Vardan checks the food and fills the skins; Samira keeps her glass but has one less bale to sell later.',
    lesson: 'Barter could preserve cash while exchanging a future sale for an immediate need. Provisions and merchandise served different purposes even when both could be traded.',
  },
  'relay-silk': {
    id: 'barter-glass-reserve', label: 'Exchange one glass lot for a road reserve',
    detail: 'Trade one glass lot and 2 silver for 8 food and 8 water. Keep the rest of the cargo instead of exchanging it all for silk.',
    duration: 2, effects: { cargo: { glass: -1 }, resources: { silver: -2, food: 8, water: 8 }, knowledge: 3 },
    reaction: 'Only one glass lot changes hands. The remaining goods stay in the household account as the provisioner loads food and fills the water skins.',
    lesson: 'A partial exchange let a household keep some merchandise while meeting immediate needs. That flexibility still cost goods, cash, and the time needed to arrange the bargain.',
  },
};

export function isMarketChoice(encounterId: string, choiceId: unknown, rulesVersion: unknown) {
  return rulesVersion === 3 && typeof choiceId === 'string' && marketOffers[encounterId]?.id === choiceId;
}
