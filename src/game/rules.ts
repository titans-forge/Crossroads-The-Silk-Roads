import { marketOffers } from "../data/market";
import type { CargoGood, Choice, Encounter, JourneyState } from "../types";

export const cargoNames: Record<CargoGood, string> = { glass: "Glass", wool: "Wool", herbs: "Herbs", silk: "Silk", jade: "Jade" };
export const creditLimit = -40;
export const vimaBalance = (state: JourneyState) => ({ unsettled: 28, paid: 0, contract: 12, disputed: 20 })[state.contracts.vima];
export const cargoLoad = (state: JourneyState) => Object.values(state.cargo).reduce((total, amount) => total + amount, 0);
export const capacity = (state: JourneyState) => Math.max(0, state.resources.camels * 2 - (state.contracts.hospitality && state.chapter === 3 ? 2 : 0) - (state.contracts.manuscript ? 1 : 0));

const durations: Record<string, number> = {
  "take-credit": 3, "travel-light": 2, "sell-cloth": 3,
  redistribute: 4, "leave-animal": 2, abandon: 1,
  "share-medicine": 2, "stop-village": 4, "press-on": 1,
  "let-arash": 2, pay: 0, detour: 4,
  "sell-all": 2, "sell-half": 3, "keep-cargo": 1,
  physician: 2, "water-camels": 1, "call-favor": 2,
  "hire-broker": 1, "challenge-measure": 2, "pay-customs": 0,
  "full-rest": 3, "animals-first": 2, "cheap-yard": 1,
  "lower-valley": 7, "high-guide": 3, "follow-caravan": 4,
  "wait-dawn": 2, "rope-bargain": 1, "cross-now": 0,
  "descend-together": 5, "arash-descends": 2, "rest-high": 3,
  "carry-family": 3, "pay-shelter": 1, "camp-outside": 1,
  "cross-pass": 4, "scout-east": 7, "winter-valley": 75,
  "canal-share": 2, "canal-labor": 3, "private-well": 0,
  "send-accounts": 2, "send-silver": 1, "request-people": 3,
  "carry-text": 2, "fund-copy": 4, "share-route": 0,
  "hire-guarantor": 1, "declare-cargo": 3, "people-first": 2,
  "obey-closure": 3, "join-convoy": 1, "send-runner": 2,
  "sell-camels": 0, "lease-camels": 5, "refuse-sale": 0,
  "honor-vima": 3, "show-ledger": 2, "sell-discount": 0,
};

function addResource(choice: Choice, resource: "silver" | "food" | "water", delta: number) {
  choice.effects.resources ??= {};
  choice.effects.resources[resource] = (choice.effects.resources[resource] ?? 0) + delta;
}

function sell(choice: Choice, state: JourneyState, good: CargoGood, fraction = 1, price = 9) {
  const amount = fraction === 1 ? state.cargo[good] : Math.ceil(state.cargo[good] * fraction);
  choice.effects.cargo = { ...choice.effects.cargo, [good]: -amount };
  choice.effects.resources = { ...choice.effects.resources, silver: amount * price };
  if (!amount) choice.disabledReason = `There is no ${cargoNames[good].toLowerCase()} in your cargo.`;
}

function remainingGood(state: JourneyState): CargoGood | undefined {
  return (["glass", "silk", "jade", "wool", "herbs"] as CargoGood[]).find((good) => state.cargo[good] > 0);
}

/** New campaigns give named relationships a later practical use; older saves keep their terms. */
function applyNetworkTerms(choice: Choice, state: JourneyState) {
  if ((state.rulesVersion ?? 1) < 2) return;
  const chose = (id: string) => state.decisions.some((decision) => decision.choiceId === id);
  if (choice.id === "hire-broker" || choice.id === "hire-guarantor") {
    const referenceAdjustment = Math.max(-4, Math.min(4, Math.trunc((state.standing - 50) / 10)));
    if (referenceAdjustment) {
      addResource(choice, "silver", referenceAdjustment);
      choice.detail += referenceAdjustment > 0 ? ` Road references at standing ${state.standing} reduce the agreed fee by ${referenceAdjustment} silver.` : ` Weak road references at standing ${state.standing} add ${-referenceAdjustment} silver to the agreed fee.`;
      choice.reaction += " The intermediary checks the household's road references before agreeing to the recorded terms.";
    }
  }

  if (choice.id === "fund-copy") choice.detail += " The copying community will provide an eastern referral: 6 silver off a frontier guarantor and 8 off the rent of a Dunhuang office.";
  if (chose("fund-copy") && choice.id === "hire-guarantor") {
    // A concession cannot turn a fee into free cash at unusually favorable reference terms.
    const concession = Math.min(6, Math.max(0, -(choice.effects.resources?.silver ?? 0)));
    addResource(choice, "silver", concession);
    choice.detail += ` The community supported by your copied text provides a referral worth ${concession} silver of this fee.`;
    choice.reaction += " A letter from the copying community identifies a resident willing to introduce Samira to the guarantor.";
  }
  if (chose("fund-copy") && choice.id === "frontier-office") {
    addResource(choice, "silver", 8);
    choice.detail += " The copying community offers shared premises, reducing the office's first rent by 8 silver.";
    choice.reaction += " The community's shared courtyard provides the first premises; the earlier copying work has become an institutional relationship.";
  }

  if (choice.id === "request-people") choice.detail += " A paid local interpreter will meet the caravan at Dunhuang: direct inspection takes one day with no interpreter fee, and documented sales gain 4 silver.";
  if (chose("request-people") && choice.id === "declare-cargo") {
    addResource(choice, "silver", 5);
    choice.duration = 1;
    choice.detail += " Your earlier recruitment arranged a local interpreter. The 5-silver interpretation fee is covered and inspection takes one day.";
    choice.reaction += " The interpreter hired through Bactra is waiting with matching cargo terms, shortening the inspection and honoring the prepaid arrangement.";
  }
  if (chose("request-people") && choice.id === "show-ledger") {
    addResource(choice, "silver", 4);
    choice.duration = 1;
    choice.detail += " The interpreter recruited through Bactra reconciles the copied account in one day and improves the documented price by 4 silver.";
    choice.reaction += " The recruited interpreter resolves the buyer's uncertainty directly; the improved price appears in the account.";
  }

  if (choice.id === "honor-vima") choice.detail += " Reciprocal westbound contacts will supply 2 food and 2 water at your final handoff or homeward departure.";
  if (chose("honor-vima") && (choice.id === "eastern-handoff" || choice.id === "return-household")) {
    addResource(choice, "food", 2);
    addResource(choice, "water", 2);
    choice.detail += " The contacts supported by your remittance deliver the promised 2 food and 2 water for the return.";
    choice.reaction += " The westbound household sends the promised provisions. The earlier reciprocal settlement now supports the return road.";
  }
}

/** Resolve authored scenes against the household's actual inventory and history. */
export function resolveEncounter(source: Encounter, state: JourneyState): Encounter {
  const encounter = structuredClone(source);
  if (state.rulesVersion === 3 && marketOffers[source.id]) {
    encounter.choices.push(structuredClone(marketOffers[source.id]));
    encounter.text += source.id === "merchant-handoff" ? " A provisioner nearby also offers food and water in exchange for wool." : " A provisioner offers a smaller exchange: one glass lot and some silver for a road reserve.";
  }
  const present = (id: string) => state.people.some((person) => person.id === id && person.traveling);
  const hasBactraContact = state.people.some((person) => !person.traveling && person.location === "Bactra");
  if (encounter.id === "bactra-lodging") {
    const receivedCare = state.decisions.some((item) => ["physician", "call-favor"].includes(item.choiceId));
    encounter.text = `The animals need fodder, ${receivedCare ? "Arash needs rest after receiving care at the gate" : "Arash still needs care after falling ill near the gate"}, and every covered room costs silver. Vardan asks for shelter before another wet night.`;
  }
  if (encounter.id === "oasis-water") encounter.text = encounter.text.replace("eight thirsty camels", `${state.resources.camels} thirsty camels`);
  if (encounter.id === "gate-reckoning") encounter.text = `Bactra is visible. Arash has developed a fever on the last stage, and the animals need water before the gate queue closes. Samira has ${state.resources.silver >= 0 ? `${state.resources.silver} silver` : `${-state.resources.silver} silver in unpaid credit`}; time and access determine which help she can arrange.`;
  if (encounter.id === "traveling-text") encounter.text = `A traveling monk asks for dry space for a manuscript and letters to the next community. ${present("arash") ? "Arash can help compare the written introductions." : "Arash is in Bactra; another interpreter will be needed."}`;
  if (encounter.id === "bactra-letter" && !hasBactraContact) encounter.text = "A courier brings news from the brokers who handled the household's Bactra accounts. No member of Samira's household stayed in Bactra, so each message depends on a paid intermediary.";
  if (encounter.id === "south-khotan-stone" && !state.cargo.jade) encounter.text = "Samira reaches Khotan with no jade in her own account. Stone merchants still need inspectors, introductions, and sorting labor. She can buy an inspected sample or earn money through local service.";
  if (encounter.id === "relay-silk") encounter.text = state.cargo.glass > 0
    ? `A Kashgar broker examines Samira's ${state.cargo.glass} glass lots and offers silk obtained through eastern merchants. She can exchange goods, sell locally, or carry a new consignment.`
    : "The glass was sold on an earlier road. A Kashgar broker instead offers a purchase of silk, a sale of the household's remaining goods, or work carrying a new consignment.";
  if (encounter.id === "broken-seal") encounter.text = state.contracts.vima === "paid"
    ? "A Dunhuang buyer asks to inspect the goods still in Samira's account. Vima's old claim was paid in Bactra; the broken seal and copied receipt establish that history. The household must now choose how to sell and remit its proceeds."
    : `A Dunhuang buyer examines the goods still in Samira's account. Vima's ${state.contracts.vima === "contract" ? "eastern contract" : "western claim"} remains on the copied record. Distance has made the witnesses harder to reach.`;
  if (encounter.id === "broken-seal" && state.contracts.vima === "paid") encounter.title = "A final sale with a clear account";
  if (encounter.id === "broken-seal" && !cargoLoad(state)) encounter.text = `All merchandise has already changed hands. Samira can now earn fees through account work and introductions. ${state.contracts.vima === "paid" ? "The receipt confirms Vima's claim was paid." : "Vima's remaining claim still needs payment even though there is no cargo left to sell."}`;
  if (encounter.id === "broken-seal" && !cargoLoad(state)) encounter.title = "The accounts outlast the cargo";
  if (encounter.id === "final-relay" && !cargoLoad(state)) encounter.text = "The household has already handed off its last merchandise. Samira can close the accounts and return west, take a permanent office at Dunhuang, or arrange the household's homeward provisions. No remaining cargo can fund the return twice.";

  encounter.choices = encounter.choices.map((choice) => {
    choice.duration = choice.duration ?? choice.effects.duration ?? durations[choice.id] ?? 1;
    const contracts = (updates: Partial<JourneyState["contracts"]>) => { choice.effects.contracts = { ...choice.effects.contracts, ...updates }; };
    switch (choice.id) {
      case "keep-cargo":
        choice.label = "Keep the glass for the eastern road";
        choice.detail = "Keep the cargo through Bactra's account settlements for a later offer at Kashgar. A better price is not guaranteed.";
        break;
      case "take-credit":
        choice.effects.cargo = { glass: 3 }; choice.effects.resources = { ...choice.effects.resources, silver: -12 };
        choice.detail = "Buy three glass lots for 12 silver or record the unpaid price as credit; use three cargo spaces.";
        break;
      case "sell-cloth":
        choice.effects.cargo = { wool: -1 }; if (!state.cargo.wool) choice.disabledReason = "No wool remains to exchange."; break;
      case "share-medicine": case "stop-village": contracts({ villageFavor: true }); break;
      case "call-favor":
        if (state.contracts.villageFavor) { contracts({ villageFavor: false }); choice.detail = "Use the introduction earned by helping the village; the favor is spent."; }
        else { choice.label = "Hire local porters to arrange help"; choice.detail = "No village introduction was earned; pay 12 silver for local assistance."; choice.effects.resources = { ...choice.effects.resources, silver: -12 }; choice.reaction = "Without an elder's seal, Samira bargains with the porters directly. They arrange water and a litter for an agreed fee."; }
        break;
      case "sell-all": sell(choice, state, "glass", 1, 10); break;
      case "sell-half": sell(choice, state, "glass", 0.5, 9); break;
      case "settle-debt": contracts({ vima: "paid" }); break;
      case "east-contract": contracts({ vima: "contract" }); choice.effects.cargo = { wool: 2 }; choice.detail += " Two contract lots occupy cargo space until settled."; break;
      case "contest-account": contracts({ vima: "disputed" }); break;
      case "narin-stays": choice.detail = "Pay the agreed wages and keep Narin as a trusted local contact in Bactra."; break;
      case "arash-east":
        choice.effects.personUpdates = { ...choice.effects.personUpdates, arash: { role: "Eastbound apprentice", reason: "Carries the household's goods and copied accounts with the next caravan.", location: "Eastbound caravan", traveling: true } };
        for (const person of state.people) if (person.id !== "arash" && person.traveling) choice.effects.personUpdates[person.id] = { location: "Bactra", traveling: false, role: person.id === "samira" ? "Bactra household coordinator" : person.id === "vardan" ? "Bactra animal handler" : "Bactra healer", reason: "Remains with the household in Bactra while Arash carries the accounts and goods east." };
        break;
      case "lower-valley": contracts({ guide: "dara" }); break;
      case "high-guide": {
        contracts({ guide: "roshna" });
        const remove = Math.max(0, cargoLoad(state) - (state.resources.camels - 2) * 2);
        let left = remove;
        choice.effects.cargo = {};
        for (const good of ["wool", "glass", "herbs", "silk", "jade"] as CargoGood[]) { const quantity = Math.min(left, state.cargo[good]); if (quantity) choice.effects.cargo[good] = -quantity; left -= quantity; }
        choice.detail = "Change animals and pay the guide, recording any unpaid fee as credit. " + (remove ? `Sell ${remove} cargo lots for ${remove * 3} silver to fit the smaller train.` : "Your existing cargo fits; no sale is needed.");
        if (remove) addResource(choice, "silver", remove * 3);
        choice.reaction = remove ? `Roshna inspects the smaller train and requires the sale of ${remove} cargo lots before accepting the guide's payment. The loads now fit the available animals.` : "Roshna inspects the smaller camel train. The existing cargo fits, so no additional lots need to be sold before she accepts the guide's payment.";
        break;
      }
      case "follow-caravan": contracts({ guide: "caravan" }); break;
      case "rest-high":
        choice.reaction = present("narin") ? "Narin helps arrange a prompt descent with the guide. Arash begins to improve in a lower camp while the household loses travel time." : "Without Narin, Samira follows the guide's urgent advice and moves Arash to a lower camp. His improvement comes after descent, not another night at altitude.";
        break;
      case "carry-family": contracts({ hospitality: true }); choice.detail += " Reserve two pack spaces until Kashgar and spend two extra travel days."; break;
      case "cross-pass":
        if (state.contracts.guide === "caravan") { addResource(choice, "silver", -5); choice.detail += " Pay the caravan master 5 extra silver for a place with his guide."; }
        break;
      case "exchange-silk":
        if (state.cargo.glass) { choice.effects.cargo = { glass: -state.cargo.glass, silk: 3 }; choice.effects.resources = { silver: 3 }; choice.detail = `Exchange ${state.cargo.glass} glass lots for full ownership of three silk lots and 3 silver. No future resale share remains.`; choice.reaction = `${state.cargo.glass} glass lots leave the account; three silk lots enter it with a small balancing payment. Both merchants transfer full ownership now.`; }
        else { choice.label = "Buy three lots of silk"; choice.detail = "The glass is already gone. Pay 18 silver for three silk lots."; choice.effects.cargo = { silk: 3 }; choice.effects.resources = { silver: -18 }; choice.reaction = "Samira pays for three silk lots. The broker issues a fresh ownership record; no previously sold glass changes hands."; }
        break;
      case "sell-glass": {
        const good = remainingGood(state);
        if (good) { sell(choice, state, good, 1, good === "glass" ? 9 : 5); choice.label = `Sell the remaining ${cargoNames[good].toLowerCase()}`; choice.detail = `Transfer ${state.cargo[good]} lots to a local buyer and free their cargo space.`; choice.reaction = `The buyer takes ${state.cargo[good]} ${cargoNames[good].toLowerCase()} lots. Their ownership ends in Samira's account here.`; }
        else { choice.label = "Work as a market intermediary"; choice.detail = "There is no cargo to sell; earn 8 silver by arranging another merchant's handoff."; choice.duration = 3; choice.effects.resources = { silver: 8 }; choice.reaction = "Samira sells her time and introductions. Another merchant owns the goods throughout the bargain."; }
        break;
      }
      case "carry-for-share":
        choice.effects.cargo = { silk: 2 };
        choice.label = "Take silk as payment for transport work";
        choice.detail = "Earn 8 silver and full ownership of two silk lots by assisting the broker's convoy. Your two new lots use cargo space; no future proceeds are promised.";
        choice.reaction = "The broker pays in silver and two silk lots. Samira's household helps his handlers prepare and move the convoy, then carries away its own clearly recorded compensation.";
        choice.lesson = "Transport work could be compensated in goods as well as money. Recording when ownership transferred distinguished wages in kind from merchandise held on another person's behalf.";
        break;
      case "send-accounts": case "send-silver": case "request-people":
        if (choice.id === "request-people" && (state.rulesVersion ?? 1) >= 2) choice.reaction = "The courier records a prepaid booking with a frontier interpreter. Samira sends the cargo terms ahead so they can be matched at Dunhuang.";
        if (!hasBactraContact) { addResource(choice, "silver", -3); choice.detail += " A paid Bactra intermediary charges 3 silver because the household has no agent in that city."; }
        break;
      case "carry-text": contracts({ manuscript: true }); choice.detail += " Keep one pack space dry for the manuscript until Dunhuang."; break;
      case "north-road": contracts({ route: "north" }); break;
      case "south-road": contracts({ route: "south" }); break;
      case "south-buy-jade": choice.effects.cargo = { jade: 2 }; break;
      case "south-pay-assayer":
        if (!state.cargo.jade) { choice.label = "Buy an inspected sample"; choice.detail = "Pay 10 silver for one inspected jade lot and the assessor's work."; choice.effects.resources = { silver: -10 }; choice.effects.cargo = { jade: 1 }; choice.reaction = "The assessor tests a small lot before Samira buys it. The new jade, its cost, and its ownership enter the ledger together."; }
        break;
      case "south-consign-stone": case "south-sell-locally":
        if (state.cargo.jade) { choice.effects.cargo = { jade: -1 }; }
        else { choice.label = choice.id === "south-consign-stone" ? "Arrange a stone merchant's introduction" : "Work in the sorting yard"; choice.detail = "You own no jade. Earn 6 silver through local work without claiming another merchant's goods."; choice.effects.resources = { silver: 6 }; choice.effects.cargo = {}; choice.duration = 2; choice.reaction = "Samira is paid for a day of useful work. The stone remains in its owner's account."; }
        break;
      case "hire-guarantor": case "declare-cargo": case "people-first":
        if (state.contracts.manuscript) { contracts({ manuscript: false }); choice.detail += " Deliver the manuscript to its named community, freeing one cargo space."; }
        break;
      case "honor-vima": case "show-ledger": case "sell-discount": {
        const good = remainingGood(state);
        const prices = { "honor-vima": 4, "show-ledger": 6, "sell-discount": 3 };
        choice.effects.cargo = good ? { [good]: -1 } : {};
        choice.effects.resources = { silver: good ? prices[choice.id] : (choice.id === "sell-discount" ? 3 : 5) };
        if (!good) { choice.label = choice.id === "sell-discount" ? "Take a quick translation job" : choice.id === "show-ledger" ? "Reconcile the household's accounts" : "Arrange a western remittance"; choice.detail = "No saleable cargo remains. Complete paid account work using the records already carried."; choice.reaction = "The ledger contains no remaining merchandise to sell. Samira earns a small fee through account work instead."; choice.lesson = "Merchant households could earn through interpretation, record keeping, and introductions after their merchandise had changed hands; commercial knowledge and obligations survived the final sale."; }
        else choice.detail = `Sell one ${cargoNames[good].toLowerCase()} lot, using ${choice.id === "show-ledger" ? "a documented assessment" : choice.id === "sell-discount" ? "a quick discounted handoff" : "a remittance arrangement"}.`;
        if (state.contracts.vima === "paid" && good) {
          choice.reaction = "The broken seal and repayment receipt confirm that Vima has no surviving claim. The buyer records the new sale against Samira's remaining cargo.";
          choice.label = choice.id === "honor-vima" ? "Send a share to the western household" : choice.id === "show-ledger" ? "Present the repayment receipt" : "Accept a quick local sale";
        }
        if (state.contracts.vima !== "paid" && choice.id !== "sell-discount") {
          const balance = vimaBalance(state);
          addResource(choice, "silver", -balance);
          contracts({ vima: "paid" });
          choice.detail += ` Pay the remaining ${balance}-silver western claim from the proceeds and any additional cash or credit.`;
          choice.reaction += ` The final ${balance}-silver payment closes Vima's surviving account; the bill is recorded separately from the sale.`;
        }
        break;
      }
      case "eastern-handoff": case "return-household": {
        choice.effects.cargo = Object.fromEntries(Object.entries(state.cargo).map(([good, quantity]) => [good, -quantity]));
        choice.effects.resources = { ...choice.effects.resources, silver: cargoLoad(state) * (choice.id === "eastern-handoff" ? 5 : 4) };
        if (!cargoLoad(state)) { choice.label = "Close the accounts and return west"; choice.detail = "All merchandise has already changed hands. Keep the household's remaining silver and begin the return."; choice.reaction = "Samira closes an account with no goods left to sell. Earlier handoffs funded the return; nothing is sold twice."; }
        break;
      }
      case "frontier-office": case "kashgar-house": case "bactra-house": {
        const city = state.chapter === 2 ? "Bactra" : state.chapter === 4 ? "Kashgar" : "Dunhuang";
        choice.effects.personUpdates = { ...choice.effects.personUpdates, samira: { role: `${city} broker`, reason: "Maintains a settled relay office for the household.", location: city, traveling: false } };
        for (const person of state.people) if (person.id !== "samira" && person.traveling) choice.effects.personUpdates[person.id] = { traveling: false, location: city, reason: `Works with the household's settled relay office in ${city}.` };
        break;
      }
    }
    applyNetworkTerms(choice, state);
    // Local winter work covers daily food; the calendar cost remains visible.
    const provisionDays = choice.id === "winter-valley" ? 2 : choice.duration;
    const consumption = state.mode === "challenge" ? Math.ceil(provisionDays / 2) : Math.floor(provisionDays / 4);
    addResource(choice, "food", -consumption);
    addResource(choice, "water", -Math.floor(provisionDays / (state.mode === "challenge" ? 3 : 6)));
    return choice;
  });
  return encounter;
}

export function choiceRestriction(state: JourneyState, choice: Choice): string | undefined {
  if (choice.disabledReason) return choice.disabledReason;
  for (const good of Object.keys(state.cargo) as CargoGood[]) if (state.cargo[good] + (choice.effects.cargo?.[good] ?? 0) < 0) return `Not enough ${cargoNames[good].toLowerCase()} remains.`;
  if (state.mode === "story") return;
  const resource = (key: keyof JourneyState["resources"]) => state.resources[key] + (choice.effects.resources?.[key] ?? 0);
  if (resource("silver") < creditLimit) return "This would exceed the challenge credit limit of 40 silver owed.";
  if (resource("water") <= 0 || resource("food") <= 0 || resource("camels") <= 0) return "This would exhaust an essential caravan supply.";
  if (resource("medicine") < 0) return "There is not enough medicine for this choice.";
  const projected = { ...state, resources: { ...state.resources, camels: resource("camels") }, contracts: { ...state.contracts, ...choice.effects.contracts }, cargo: { ...state.cargo } };
  for (const good of Object.keys(state.cargo) as CargoGood[]) projected.cargo[good] += choice.effects.cargo?.[good] ?? 0;
  if (cargoLoad(projected) > capacity(projected)) return `The resulting load exceeds capacity (${cargoLoad(projected)}/${capacity(projected)} spaces).`;
}

export function emergencyChoice(state: JourneyState, encounter: Encounter): Choice {
  const cargo: Partial<Record<CargoGood, number>> = {};
  let excess = Math.max(0, cargoLoad(state) - capacity(state));
  for (const good of ["wool", "glass", "herbs", "silk", "jade"] as CargoGood[]) { const amount = Math.min(excess, state.cargo[good]); if (amount) cargo[good] = -amount; excess -= amount; }
  return {
    id: "emergency-relief", label: "Work for relief and accept a basic settlement",
    detail: "Resolve this stop through seven days of local work: restore food and water, earn 15 silver, and sell any excess load without profit. Standing falls by 6.",
    duration: 7, effects: { resources: { food: Math.max(6, 10 - state.resources.food), water: Math.max(6, 10 - state.resources.water), silver: Math.max(15, creditLimit - state.resources.silver), camels: Math.max(0, 1 - state.resources.camels) }, cargo, standing: -6, trust: { samira: -3 } },
    reaction: "The caravan cannot afford its preferred terms. Local work and a basic settlement keep it moving, at the cost of a week and standing. No resource or debt is silently erased.",
    lesson: encounter.choices[0].lesson,
  };
}
