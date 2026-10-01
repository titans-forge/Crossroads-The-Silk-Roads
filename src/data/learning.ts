export interface ReflectionQuestion {
  chapter: 1 | 2 | 3 | 4 | 5;
  concept: string;
  prompt: string;
  options: Array<{ id: string; text: string }>;
  correctId: string;
  explanation: string;
  sourceUrl: string;
}

export const reflections: ReflectionQuestion[] = [
  {
    chapter: 1,
    concept: "Relationships carry value",
    prompt: "A second caravan has enough silver but knows nobody at the next gate. Yours has less silver and a letter from a local household. Why might yours still pass more easily?",
    options: [
      { id: "gate-price", text: "The same amount of silver always buys the same access in every city." },
      { id: "gate-introduction", text: "A trusted introduction can help officials identify who will answer for your promises." },
      { id: "gate-exemption", text: "A friendly letter makes the caravan exempt from local rules." },
    ],
    correctId: "gate-introduction",
    explanation: "An introduction can connect a stranger to people who already have local standing. It can help secure assistance or a hearing, but it neither guarantees success nor cancels a toll. Money and relationships do different work.",
    sourceUrl: "https://www.unesco.org/en/silk-roads/about-silk-roads?hub=196704",
  },
  {
    chapter: 2,
    concept: "A household can become a network",
    prompt: "Imagine Narin settles in Bactra while another member travels east. Which new development would best show that settlement has strengthened the trading household?",
    options: [
      { id: "network-distance", text: "The travelers cover more distance without ever hearing from her again." },
      { id: "network-control", text: "The household can now set the rules in every market it reaches." },
      { id: "network-contact", text: "She sends reliable local prices and introduces a returning caravan to lodging and care." },
    ],
    correctId: "network-contact",
    explanation: "A settled contact can supply information and introductions that travelers cannot carry in a pack. The network connects different places through people; it does not require everyone to remain on the road or give them control over a city.",
    sourceUrl: "https://www.iranicaonline.org/articles/sogdian-trade/",
  },
  {
    chapter: 3,
    concept: "A route is more than a distance",
    prompt: "Two ways lead to the same oasis. The short pass has no reliable pasture and may close in snow. The longer valley has inhabited stopping places. What information matters most before choosing?",
    options: [
      { id: "route-feasibility", text: "The season, supplies, animal condition, and local reports for both routes." },
      { id: "route-length", text: "Which route draws the shortest line on the map." },
      { id: "route-price", text: "The cargo's expected sale price, without considering how it gets there." },
    ],
    correctId: "route-feasibility",
    explanation: "A shorter route can cost more if it lacks water, pasture, or safe passage. A longer route also consumes supplies. The sound comparison joins geography to the caravan's condition and current local knowledge; neither route is always best.",
    sourceUrl: "https://whc.unesco.org/en/list/1442/",
  },
  {
    chapter: 4,
    concept: "Relay exchange connects different journeys",
    prompt: "A silk bolt arrives in Kashgar, changes owners, and later reaches a buyer west of Merv. No person travels the entire distance. What does that tell you about the exchange?",
    options: [
      { id: "relay-failure", text: "It failed because the first merchant did not reach the final buyer." },
      { id: "relay-specialists", text: "Regional merchants and handoffs connected several shorter journeys into a longer chain." },
      { id: "relay-one-road", text: "All the merchants must have followed one road with the same rules and language." },
    ],
    correctId: "relay-specialists",
    explanation: "An object's journey can be longer than any one carrier's. Handoffs join regional expertise, while accounts, witnesses, and introductions help manage the new risks each transfer creates. The routes form a network with branches.",
    sourceUrl: "https://www.unesco.org/en/silk-roads/about-silk-roads?hub=196704",
  },
  {
    chapter: 5,
    concept: "Historical evidence has a date and a limit",
    prompt: "A historian finds a merchant's letter written near Dunhuang in AD 313. Your caravan story is set around AD 200. Which claim can the letter support most directly?",
    options: [
      { id: "evidence-exact", text: "Samira's particular argument at the gate happened exactly as the game shows it." },
      { id: "evidence-unchanged", text: "Every rule described in the letter must have been identical a century earlier." },
      { id: "evidence-bounded", text: "Some merchants used such connections by AD 313; applying the details to AD 200 needs more evidence." },
    ],
    correctId: "evidence-bounded",
    explanation: "The Sogdian Ancient Letters provide evidence for merchant communities and correspondence in the early fourth century. They can help frame questions about an earlier period, but cannot prove Samira's fictional actions or every rule around AD 200.",
    sourceUrl: "https://www.iranicaonline.org/articles/sogdian-trade/",
  },
];

export function getReflection(chapter: number): ReflectionQuestion | undefined {
  return reflections.find((question) => question.chapter === chapter);
}

export const glossary = [
  { term: "Bactria / Bactra", definition: "Bactria is a historical region south of the Oxus River. Bactra, at modern Balkh, was one of its major cities." },
  { term: "Broker", definition: "A person who helps others make a bargain, often by knowing local buyers, rules, or languages." },
  { term: "Capital", definition: "Something used to support future work or earnings. For a caravan this can include goods, money, and trained transport animals." },
  { term: "Caravan", definition: "People and pack animals traveling together. Its members can cooperate without sharing one owner or destination." },
  { term: "Caravanserai", definition: "A lodging place associated with caravan travel. Designs and dates vary; the game's lodging courts do not recreate a particular surviving building." },
  { term: "Commandery", definition: "An administrative district in the Han system. Dunhuang was one such frontier district." },
  { term: "Credit / debt", definition: "Credit lets someone receive value now and promise repayment later. The unpaid promise is a debt; it does not vanish when the purse is empty." },
  { term: "Fodder", definition: "Food for working animals, such as grass, hay, or other plant material." },
  { term: "Guarantor", definition: "Someone who agrees to answer for another person's promise, helping others trust an unfamiliar trader." },
  { term: "Household", definition: "The game's continuing group of family, workers, and partners. Some can settle in cities while others travel." },
  { term: "Information asymmetry", definition: "A situation in which one side of a bargain knows something useful the other side does not." },
  { term: "Kushan", definition: "An ancient ruling dynasty whose realm included Bactria and parts of South and Central Asia around the game's period." },
  { term: "Oasis", definition: "A place in an arid region where water supports settlement or cultivation. Travelers depend on the work of its residents." },
  { term: "Oxus", definition: "An ancient name for the Amu Darya river. Its mountain tributaries connect the Pamir approaches with lower valleys." },
  { term: "Primary source", definition: "Evidence made in the period being studied, such as a letter, coin, object, or inscription. Its date and original purpose affect what it can tell us." },
  { term: "Reciprocity", definition: "An exchange of help or obligations that may continue over time, rather than ending with one payment." },
  { term: "Relay trade", definition: "Exchange through successive carriers or owners. Goods can cross a much greater distance than any one merchant travels." },
  { term: "Seal", definition: "An identifying mark impressed or attached to an object or document. A seal can help connect a claim to a person; it is not proof by itself." },
  { term: "Tarim Basin", definition: "The region containing the Taklamakan Desert. Routes followed inhabited oasis corridors around its edges." },
  { term: "Transaction costs", definition: "The time, work, and expense of making an exchange, such as finding a buyer, interpreting terms, or resolving a dispute." },
];

export const sourceFraming = "Samira and her household are fictional. The setting draws on documented Silk Roads networks around AD 200, with some later evidence clearly identified as comparison. Encounters, dialogue, prices, and outcomes are reconstructions. Map points locate regions and cities approximately; lines omit many intermediate stops. Journey days are approximate game time, not a documented ancient itinerary. Five application questions check concepts demonstrated in this journey, not historical mastery.";
