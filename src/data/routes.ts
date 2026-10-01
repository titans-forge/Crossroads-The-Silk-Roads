import type { Encounter } from "../types";

// These are fictional dilemmas at real route regions, not reconstructions of known transactions.
// Chapter-five encounter days are ordering hints only; the engine advances approximate elapsed time.
export const northRouteEncounters: Encounter[] = [
  {
    id: "north-kucha-accounts", chapter: 5, day: 24,
    location: "A merchant court in the Kucha oasis",
    title: "One account, three owners",
    text: "At Kucha, three small caravans are assembling an eastbound train. A clerk offers to copy Samira's account separately. The other merchants propose one shared list to save fees. A porter asks her to stay and help check the incoming loads for a wage.",
    speaker: "samira",
    sourceNote: "Kucha lay on the northern oasis networks. Written records are one kind of evidence for exchange, but this shared account and its fees are invented. Pooling work can save expense while making responsibilities harder to separate.",
    sourceUrl: "https://whc.unesco.org/en/list/1442/",
    sourceLabel: "UNESCO: northern oasis corridors and surviving sites",
    choices: [
      {
        id: "north-hire-scribe", label: "Pay for a separate account",
        detail: "Spend silver to keep the household's goods and obligations clear.", duration: 1,
        reaction: "The clerk reads each entry back. Samira leaves with less silver and a record that does not depend on two strangers remembering the same bargain.",
        effects: { resources: { silver: -12 }, trust: { samira: 4 }, standing: 8, knowledge: 4 },
        lesson: "A separate record cost money but made responsibility easier to establish. Larger markets offered services that could reduce uncertainty without removing it.",
      },
      {
        id: "north-pool-account", label: "Share the account and supplies",
        detail: "Split the clerk's fee and accept a joint account with the other merchants.", duration: 2,
        reaction: "The merchants divide the copying fee and open their food baskets. Samira asks each to mark which loads belong to whom before the clerk ties the list.",
        effects: { resources: { silver: -4, food: 5 }, trust: { samira: -3 }, standing: 4, knowledge: 4 },
        lesson: "Cooperation spread the cost of a journey. It also required people to agree who owned the goods and who would answer if a load went missing.",
      },
      {
        id: "north-cash-sale", label: "Check incoming loads for a wage",
        detail: "Delay departure and earn silver through tiring market work.", duration: 3,
        reaction: "Samira spends two market days beside a tally board. The porter pays her in silver; the caravan eats while it waits for the next train.",
        effects: { resources: { silver: 12, food: -4 }, health: { samira: -3 }, standing: 2, knowledge: 3 },
        lesson: "A traveler could earn money through local work between journeys. Time and food made a wage valuable without making it free profit.",
      },
    ],
  },
  {
    id: "north-turfan-water", chapter: 5, day: 25,
    location: "Lodging court in the Turfan basin",
    title: "Leave with water, or leave with the train",
    text: "The low basin is hot and dry. A water seller can fill Samira's skins before the next departure. A caravan leaving at dusk shares its stops for a fee. The lodging keeper offers water in exchange for repairing a shaded animal enclosure, but the work will take time.",
    speaker: "vardan",
    sourceNote: "The Turfan region's aridity made water management essential to settlement and travel. These bargains are fictional. The scene does not assume that any particular surviving irrigation work already existed around AD 200.",
    sourceUrl: "https://whc.unesco.org/en/list/1442/",
    sourceLabel: "UNESCO: water systems and the Turfan basin",
    choices: [
      {
        id: "north-buy-reserve", label: "Buy a full water reserve",
        detail: "Pay the high price and keep control of your departure.", duration: 1,
        reaction: "Vardan lifts each skin to test the weight. Samira counts out the price of leaving when she chooses.",
        effects: { resources: { silver: -15, water: 14 }, trust: { vardan: 4 }, knowledge: 3 },
        lesson: "Buying supplies could preserve independence and time. At an arid stopping place, that flexibility could carry a high price.",
      },
      {
        id: "north-dusk-caravan", label: "Join the dusk caravan",
        detail: "Pay less for shared water stops and follow another leader's schedule.", duration: 2,
        reaction: "The lead animals move as the shadows lengthen. The water is cheaper, but Vardan must take his turn when the other caravan stops.",
        effects: { resources: { silver: -4, food: -3, water: 8 }, health: { vardan: -2 }, standing: 4, knowledge: 4 },
        lesson: "Traveling together could make scarce supplies easier to reach while giving another person authority over pace and stopping places.",
      },
      {
        id: "north-water-labor", label: "Repair the enclosure for water",
        detail: "Keep the silver, spend food, and accept hard work before leaving.", duration: 3,
        reaction: "The keeper brings water as the repaired shade goes up. Samira rests her blistered hands while Vardan fills the skins.",
        effects: { resources: { food: -4, water: 11 }, health: { samira: -4 }, trust: { vardan: 3 }, standing: 6, knowledge: 4 },
        lesson: "Labor could buy access when cash was scarce. The exchange depended on settled residents and still cost travelers effort and supplies.",
      },
    ],
  },
];

export const southRouteEncounters: Encounter[] = [
  {
    id: "south-yarkand-carriers", chapter: 5, day: 24,
    location: "Departure yard at Yarkand",
    title: "A small bundle can change the whole load",
    text: "A westbound merchant needs silver for his next stage and offers two small jade bundles obtained near Khotan. Samira could buy them for a later sale to a worker there. He also needs help escorting his own carriers toward the next stopping place. A provisioner nearby has food and water ready for the road.",
    speaker: "samira",
    sourceNote: "Yarkand and Khotan belonged to southern route networks around the Tarim Basin, and Khotan was a long-standing jade source. This merchant, ownership offer, and escort fee are fictional; compact valuables still used carrying capacity.",
    sourceUrl: "https://www.iranicaonline.org/articles/jade-i/",
    sourceLabel: "Encyclopaedia Iranica: Khotan as a jade source",
    choices: [
      {
        id: "south-buy-jade", label: "Buy the two jade bundles",
        detail: "Spend silver and carrying space for a possible sale at Khotan.", duration: 2,
        reaction: "Samira marks two bundles as the household's own. Vardan finds room for the stone, then checks what space remains for water.",
        effects: { resources: { silver: -12 }, cargo: { jade: 2 }, trust: { samira: 3 }, knowledge: 4 },
        lesson: "Owning goods offered a claim on future profit while committing cash and transport space. A compact object was not a weightless investment.",
      },
      {
        id: "south-carry-for-fee", label: "Escort the merchant's carriers",
        detail: "Earn a fee without buying the goods; spend supplies accompanying their group.", duration: 2,
        reaction: "The stone stays with the merchant's own carriers. Samira supplies another pair of eyes on the road and receives the agreed escort fee at the next stop.",
        effects: { resources: { silver: 10, food: -3, water: -4 }, health: { samira: -2 }, standing: 4, knowledge: 4 },
        lesson: "A caravan could earn from transport services without owning the goods. A service fee and a merchant's resale profit paid for different work and risk.",
      },
      {
        id: "south-buy-supplies", label: "Spend the silver on provisions",
        detail: "Pass up the jade and strengthen the reserve for the next desert stages.", duration: 1,
        reaction: "The jade goes into another trader's pack. Samira watches the provisioner tie food beside the full water skins.",
        effects: { resources: { silver: -8, water: 8, food: 6 }, trust: { vardan: 4 }, knowledge: 3 },
        lesson: "Passing up a promising purchase could protect a journey. Supplies and sale goods competed for the same money and animal capacity.",
      },
    ],
  },
  {
    id: "south-khotan-stone", chapter: 5, day: 25,
    location: "A stone worker's court at Khotan",
    title: "Who can tell what the stone is worth?",
    text: "At Khotan, a buyer turns a jade bundle toward the light. Samira knows its purchase price, but not how a worker would judge the stone. A careful inspection takes time. A nearby workshop offers less silver today, and a provisioner will settle a bargain partly in supplies.",
    speaker: "samira",
    sourceNote: "Khotan's jade varied in color and quality; specialist knowledge mattered to its value. This inspection and these prices are fictional. Later written descriptions help explain the material but do not establish the exact terms of a sale around AD 200.",
    sourceUrl: "https://www.iranicaonline.org/articles/jade-i/",
    sourceLabel: "Encyclopaedia Iranica: jade materials and evidence dates",
    choices: [
      {
        id: "south-pay-assayer", label: "Have one bundle inspected, then sell",
        detail: "Wait for skilled work and a better price; the fee is included in the silver shown.", duration: 3,
        reaction: "The worker shows the buyer a flaw and a clear face in the same stone. Samira accepts a considered price after paying for the inspection.",
        effects: { cargo: { jade: -1 }, resources: { silver: 22, food: -3 }, trust: { samira: 4 }, knowledge: 5 },
        lesson: "A specialist could make quality easier to judge. Paying for that knowledge could improve a price, while waiting still consumed time and food.",
      },
      {
        id: "south-consign-stone", label: "Sell one bundle to the workshop",
        detail: "Take a lower cash price and a local introduction without waiting for inspection.", duration: 1,
        reaction: "The workshop owner accepts the stone at his own risk and introduces Samira to a buyer at the eastern yard. The sale is settled today.",
        effects: { cargo: { jade: -1 }, resources: { silver: 14 }, standing: 6, knowledge: 4 },
        lesson: "A lower price could buy speed and leave quality risk with a specialist. A useful introduction might matter on the next stage as well.",
      },
      {
        id: "south-sell-locally", label: "Trade one bundle for cash and supplies",
        detail: "Accept less silver in exchange for food and water ready to load.", duration: 1,
        reaction: "The provisioner sets down silver, food, and filled skins. Vardan checks the supplies while Samira closes the account.",
        effects: { cargo: { jade: -1 }, resources: { silver: 10, food: 5, water: 5 }, trust: { vardan: 4 }, knowledge: 4 },
        lesson: "The best return depended on what the traveler needed next. A smaller cash payment could still be useful when part of the price arrived as provisions.",
      },
    ],
  },
];

export const routeDescriptions = {
  north: {
    title: "Northern oasis road",
    summary: "Kashgar → Kucha → Turfan region → Dunhuang. Bargain over accounts at Kucha and water in the arid Turfan basin.",
    travelNote: "Weeks of travel separate these northern vignettes. The line marks selected oasis regions and omits intermediate stops; it is not a surveyed ancient track.",
  },
  south: {
    title: "Southern oasis road",
    summary: "Kashgar → Yarkand → Khotan → Dunhuang. Choose ownership or paid service near Yarkand, then negotiate the value of jade at Khotan.",
    travelNote: "Weeks of travel separate these southern vignettes. Many eastern oasis stages lie between Khotan and Dunhuang; this chapter shows a selection rather than every stop.",
  },
};

// Rounded city/region markers for orientation, not ancient street positions or navigable waypoints.
// UNESCO property coordinates anchor Merv, Bactra, Kucha-region sites and the Turfan region;
// Iranica gives Kashgar's position; Getty TGN gives Dunhuang. Southern markers are approximate
// modern oasis centers; Wakhan is a representative valley-region point. See TEACHING_GUIDE.md.
export const routePlaces = [
  { id: "merv", name: "Merv", lon: 62.18, lat: 37.66, description: "An oasis city by the Murghab in present-day Turkmenistan. The household begins here with goods, workers, and a debt to settle." },
  { id: "bactra", name: "Bactra", lon: 66.9, lat: 36.77, description: "Ancient Bactra, at Balkh in present-day Afghanistan. Bactria under Kushan rule connected western, northern, southern, and eastern networks." },
  { id: "wakhan", name: "Wakhan / Pamir approaches", lon: 72.7, lat: 37.05, description: "A representative point in the mountain-valley region, not one mandatory pass. Local routes divided and changed with season, pasture, and conditions." },
  { id: "kashgar", name: "Kashgar", lon: 76.03, lat: 39.48, description: "An oasis junction west of the Tarim Basin. From here the game's routes divide north and south around the desert." },
  { id: "kucha", name: "Kucha", lon: 82.98, lat: 41.78, description: "An oasis region along the northern network near the Tian Shan. The chapter explores shared travel and the value of commercial records." },
  { id: "turfan", name: "Turfan region", lon: 89.06, lat: 42.95, description: "An arid basin whose settlements depended on water management. The marker lies near the historical Yar/Jiaohe site, not a reconstructed AD 200 market." },
  { id: "yarkand", name: "Yarkand", lon: 77.24, lat: 38.42, description: "A southern oasis near mountain-fed river routes. Here the household chooses between buying goods, providing a service, and carrying provisions." },
  { id: "khotan", name: "Khotan", lon: 79.93, lat: 37.11, description: "A southern oasis region associated with nephrite jade near the Kunlun mountains. Knowing a material's quality could affect its trading value." },
  { id: "dunhuang", name: "Dunhuang", lon: 94.68, lat: 40.17, description: "A Han commandery and gateway to the Hexi Corridor. Both game routes reach its region after many omitted oasis stages; goods can continue through new carriers." },
];
