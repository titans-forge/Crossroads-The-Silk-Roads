/**
 * Exploratory transfer probes for the optional local playtest.
 * These are original items, not a standardized or validated assessment.
 * Keep answers/explanations hidden during a phase; see PLAYTEST_PROTOCOL.md
 * for feedback timing and the limits of comparing the three forms.
 */
export type ProbePhase = 'before' | 'after' | 'later';

export interface ProbeQuestion {
  id: string;
  concept: string;
  prompt: string;
  options: Array<{ id: string; text: string }>;
  correctId: string;
  explanation: string;
}

export const PLAYTEST_FORMAT = 'titans-forge-crossroads-playtest';
export const PLAYTEST_FORMAT_VERSION = 1;
export const PLAYTEST_CONTENT_VERSION = '2026-09-07.1';

export const probeQuestions: Record<ProbePhase, ProbeQuestion[]> = {
  before: [
    {
      id: 'before-route-conditions',
      concept: 'A route is more than a distance',
      prompt: 'A team is taking seed to a village. The hill road is shorter, but its water stop may be closed. The river road is longer and has regular supply stops. Which information would help the team compare them?',
      options: [
        { id: 'before-route-last-year', text: 'Which road had the most travelers last year, before the water stop changed.' },
        { id: 'before-route-current-needs', text: 'How much water the team can carry, which stops are open, and each journey time.' },
        { id: 'before-route-distance-price', text: 'Which road has the shorter distance and the cheaper fare at its starting point.' },
      ],
      correctId: 'before-route-current-needs',
      explanation: 'A useful comparison connects the team’s needs with current conditions along each route. Distance, starting price, and past popularity leave out whether the journey can actually be supplied.',
    },
    {
      id: 'before-network-pottery',
      concept: 'Relay exchange connects different journeys',
      prompt: 'Pottery made inland appears in a distant coastal market. You want to explain how it arrived without assuming that one merchant traveled the whole way. Which discovery would help most?',
      options: [
        { id: 'before-network-maker', text: 'A description of the potter’s workshop, including the clay and tools used there.' },
        { id: 'before-network-coastal-price', text: 'A price list showing how much coastal buyers paid for several kinds of pottery.' },
        { id: 'before-network-linked-sales', text: 'Linked sale records showing where different carriers received and passed on the same pots.' },
      ],
      correctId: 'before-network-linked-sales',
      explanation: 'Linked handoffs can connect several regional journeys into an object’s longer journey. Workshop and price records answer useful questions, but do not establish the chain of carriers.',
    },
    {
      id: 'before-evidence-illustration',
      concept: 'Historical evidence has a date and a limit',
      prompt: 'A museum wants to use an illustration from AD 1800 to show the exact carts used in AD 1600. What should its researchers check before making that claim?',
      options: [
        { id: 'before-evidence-earlier-support', text: 'Whether dated evidence from the earlier period supports that cart design in the place shown.' },
        { id: 'before-evidence-detailed-drawing', text: 'Whether the later illustration is detailed enough to show the wheels and the cargo clearly.' },
        { id: 'before-evidence-repeated-picture', text: 'Whether other modern books use the same illustration when explaining how goods were transported.' },
      ],
      correctId: 'before-evidence-earlier-support',
      explanation: 'A later picture may suggest a possibility, but detail and repetition do not move its evidence two centuries backward. The particular claim needs support for the earlier time and place.',
    },
  ],
  after: [
    {
      id: 'after-route-repair-service',
      concept: 'A route is more than a distance',
      prompt: 'You must choose a transport service for a heavy exhibition crate. One advertises a fast road and a low fare. Another takes longer but provides repair stops and replacement carts. How should you compare them?',
      options: [
        { id: 'after-route-low-fare', text: 'Choose the lower fare, then use its advertised journey time to plan the delivery.' },
        { id: 'after-route-extra-services', text: 'Choose the service with more facilities, without checking whether this load needs them.' },
        { id: 'after-route-whole-journey', text: 'Compare the load, likely delays, available help, and full cost on both routes.' },
      ],
      correctId: 'after-route-whole-journey',
      explanation: 'The fastest advertised service may become slower or costlier if the load needs support it cannot provide. Extra facilities also cost something. Compare both services against this particular journey’s needs.',
    },
    {
      id: 'after-network-resident-partner',
      concept: 'Relay exchange connects different journeys',
      prompt: 'A merchant stops traveling and lives at a junction. Letters show her introducing incoming carriers to people who know the next region. How could this help goods travel farther?',
      options: [
        { id: 'after-network-connect-stages', text: 'Her local contacts could connect the incoming journey to another carrier’s regional knowledge.' },
        { id: 'after-network-one-carrier', text: 'Her introductions would matter chiefly if the incoming carrier traveled every remaining stage.' },
        { id: 'after-network-storage-only', text: 'Her useful contribution would mainly be keeping goods at the junction until their owners returned.' },
      ],
      correctId: 'after-network-connect-stages',
      explanation: 'A resident partner can connect different journeys through introductions and local knowledge. Settling need not remove someone from a wider network, and goods need not wait for their first carrier to return.',
    },
    {
      id: 'after-evidence-game-price',
      concept: 'Historical evidence has a date and a limit',
      prompt: 'A historical game gives a fictional trader an exact toll price. Its source link describes trade across several centuries but records no such payment. Which statement is best supported?',
      options: [
        { id: 'after-evidence-price-confirmed', text: 'The linked history confirms the quoted price because it covers the same trading region.' },
        { id: 'after-evidence-context-limited', text: 'The link can support the trading context; that exact price remains part of the reconstruction.' },
        { id: 'after-evidence-context-rejected', text: 'The invented price makes the linked history unusable for understanding the wider trading setting.' },
      ],
      correctId: 'after-evidence-context-limited',
      explanation: 'Evidence can support a setting without documenting a particular transaction. An invented price neither becomes a verified fact through a general source link nor cancels everything that source can explain.',
    },
  ],
  later: [
    {
      id: 'later-route-changed-season',
      concept: 'A route is more than a distance',
      prompt: 'A travel log says a mountain shortcut worked well last summer. Your group will carry a heavier load this spring, after storms damaged a bridge. What should guide your decision now?',
      options: [
        { id: 'later-route-recheck-feasibility', text: 'Current crossing reports and supply stops, compared with the group’s load and an alternative route.' },
        { id: 'later-route-repeat-success', text: 'The previous group’s successful arrival, together with the time it saved on that shortcut.' },
        { id: 'later-route-avoid-mountains', text: 'The bridge damage alone, taking the longer route before checking conditions or supplies there.' },
      ],
      correctId: 'later-route-recheck-feasibility',
      explanation: 'Earlier success is useful evidence, but conditions and the group’s needs have changed. Recheck the shortcut and the alternative: a longer road also needs suitable crossings and supplies.',
    },
    {
      id: 'later-network-interrupted-carrier',
      concept: 'Relay exchange connects different journeys',
      prompt: 'A cloth carrier cannot continue beyond a town. A resident partner arranges for two other carriers to take the cloth across their own regions. What best explains how delivery can still succeed?',
      options: [
        { id: 'later-network-same-carrier', text: 'The first carrier must eventually complete the remaining distance for the exchange to count as successful.' },
        { id: 'later-network-connected-legs', text: 'Regional handoffs can preserve the longer exchange even when one carrier’s journey stops.' },
        { id: 'later-network-fewer-records', text: 'Changing carriers lets the partners set aside the ownership records used on the first journey.' },
      ],
      correctId: 'later-network-connected-legs',
      explanation: 'A network can join shorter journeys through new carriers and local partners. A change of carrier does not make ownership or custody disappear; accounts and agreements still connect the stages.',
    },
    {
      id: 'later-evidence-household-inventory',
      concept: 'Historical evidence has a date and a limit',
      prompt: 'An inventory from AD 700 lists silk in one town household. A display uses it to claim that every household in that town traded silk in AD 400. What would make the explanation more careful?',
      options: [
        { id: 'later-evidence-later-popularity', text: 'Add more descriptions of silk’s popularity after AD 700 to strengthen the earlier town-wide claim.' },
        { id: 'later-evidence-value-proves-trade', text: 'Explain that valuable goods in one household show that trading them was common across the town.' },
        { id: 'later-evidence-narrow-claim', text: 'Limit the claim to what this dated record shows and seek other evidence about the earlier town.' },
      ],
      correctId: 'later-evidence-narrow-claim',
      explanation: 'One household’s later inventory does not establish every household’s work three centuries earlier. The date, the household, and the kind of record all limit the claim it can support.',
    },
  ],
};
