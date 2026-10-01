import { describe, expect, it } from "vitest";
import { acknowledgeOutcome, choose, continueToBactra, continueToDunhuang, continueToKashgar, continueToPamirs, createInitialState, getCapacity, getCargoLoad, getChoicePreview, getEncounter, getScore, recordReflection } from "../src/game/engine";
import { getReflection } from "../src/data/learning";
import type { JourneyState } from "../src/types";

const act = (state: JourneyState, id: string) => acknowledgeOutcome(choose(state, id));
const road = ["travel-light", "redistribute", "share-medicine", "let-arash", "sell-all", "call-favor"];
function chapter2() { return continueToBactra(road.reduce(act, createInitialState())); }
function chapter3(narin = "narin-contract", debt = "settle-debt") { return continueToPamirs(["hire-broker", "full-rest", debt, narin, "household-east"].reduce(act, chapter2())); }
function chapter4(pass = "cross-pass", narin = "narin-contract") { return continueToKashgar(["lower-valley", "wait-dawn", "rest-high", "carry-family", pass].reduce(act, chapter3(narin))); }
function chapter5(route = "north-road") { return continueToDunhuang(["canal-share", "sell-glass", "send-accounts", "carry-text", route].reduce(act, chapter4())); }
function finish(state: JourneyState): JourneyState {
  for (let count = 0; count < 10 && state.status === "playing"; count++) { const encounter = getEncounter(state)!; const choice = encounter.choices.find((item) => getChoicePreview(state, item).allowed)!; state = act(state, choice.id); }
  return state;
}

describe("household campaign rules", () => {
  it("retains each outcome and rejects further choices until acknowledged", () => {
    const initial = createInitialState();
    const next = choose(initial, "travel-light");
    expect(next.lastOutcome?.choiceLabel).toBe("Travel light");
    expect(getEncounter(next)?.id).toBe("departure-account");
    expect(choose(next, "redistribute")).toBe(next);
    expect(getEncounter(acknowledgeOutcome(next))?.id).toBe("broken-camel");
    expect(initial.decisions).toHaveLength(0);
  });
  it("shows the chapter's final aftermath before allowing the transition", () => {
    const before = road.slice(0, -1).reduce(act, createInitialState());
    const last = choose(before, "call-favor");
    expect(last.status).toBe("playing");
    expect(last.pendingStatus).toBe("chapter-complete");
    expect(last.lastOutcome?.changes.length).toBeGreaterThan(0);
    expect(continueToBactra(last)).toBe(last);
    expect(continueToBactra(acknowledgeOutcome(last)).chapter).toBe(2);
  });
  it("prevents re-selling glass and offers an honest alternative", () => {
    const state = chapter4();
    expect(state.cargo.glass).toBe(0);
    const market = act(state, "canal-share");
    const sale = getEncounter(market)!.choices.find((choice) => choice.id === "sell-glass")!;
    expect(sale.label).not.toContain("glass");
    const sold = act(market, sale.id);
    expect(sold.cargo.wool).toBe(0);
    expect(sold.cargo.glass).toBe(0);
    expect(sold.resources.silver - market.resources.silver).toBe(market.cargo.wool * 5);
  });
  it("records cargo credit honestly at departure", () => {
    const state = act(createInitialState(), "take-credit");
    expect(state.cargo.glass).toBe(6);
    expect(state.resources.silver).toBe(34);
  });
  it("requires an earned introduction or charges for ordinary help", () => {
    const noFavor = ["travel-light", "redistribute", "press-on", "let-arash", "sell-all"].reduce(act, createInitialState());
    const yesFavor = ["travel-light", "redistribute", "share-medicine", "let-arash", "sell-all"].reduce(act, createInitialState());
    expect(getEncounter(noFavor)!.choices.find((choice) => choice.id === "call-favor")!.label).toContain("Hire local");
    expect(act(noFavor, "call-favor").resources.silver - noFavor.resources.silver).toBe(-12);
    expect(act(yesFavor, "call-favor").resources.silver - yesFavor.resources.silver).toBe(-4);
    expect(act(yesFavor, "call-favor").contracts.villageFavor).toBe(false);
  });
  it("preserves repaid debt in the later frontier encounter", () => {
    let state = chapter5();
    while (getEncounter(state)!.id !== "broken-seal") state = act(state, getEncounter(state)!.choices[0].id);
    expect(state.contracts.vima).toBe("paid");
    expect(getEncounter(state)!.text).toContain("paid in Bactra");
    expect(getEncounter(state)!.choices.find((choice) => choice.id === "honor-vima")!.label).not.toContain("Vima");
    expect(getEncounter(state)!.title).toBe("A final sale with a clear account");
    expect(getEncounter(state)!.choices.map((choice) => choice.label)).toEqual(["Send a share to the western household", "Present the repayment receipt", "Accept a quick local sale"]);
    expect(state.people.find((person) => person.id === "samira")!.reason).toContain("account is settled");
  });
  it("charges the surviving western claim before marking it paid", () => {
    let state = chapter5();
    while (getEncounter(state)!.id !== "broken-seal") state = act(state, getEncounter(state)!.choices[0].id);
    state = { ...state, contracts: { ...state.contracts, vima: "contract" } };
    const choice = getEncounter(state)!.choices.find((item) => item.id === "show-ledger")!;
    expect(choice.detail).toContain("12-silver");
    const result = act(state, choice.id);
    expect(result.contracts.vima).toBe("paid");
    expect(result.resources.silver - state.resources.silver).toBe(-6);
  });
  it("distinguishes the actual northern and southern route scenes", () => {
    expect(getEncounter(chapter5("north-road"))!.id).toBe("north-kucha-accounts");
    expect(getEncounter(chapter5("south-road"))!.id).toBe("south-yarkand-carriers");
    expect(finish(chapter5("north-road")).decisions).toHaveLength(28);
    expect(finish(chapter5("south-road")).decisions).toHaveLength(28);
  });
  it("does not grant jade sale proceeds when no jade was purchased", () => {
    const yarkand = chapter5("south-road");
    const khotan = act(yarkand, "south-buy-supplies");
    expect(khotan.cargo.jade).toBe(0);
    const choice = getEncounter(khotan)!.choices.find((item) => item.id === "south-sell-locally")!;
    expect(choice.label).toBe("Work in the sorting yard");
    expect(act(khotan, choice.id).cargo.jade).toBe(0);
    expect(act(khotan, choice.id).resources.silver - khotan.resources.silver).toBe(6);
  });
  it("reserves capacity for a manuscript and releases it on delivery", () => {
    let state = chapter5();
    expect(state.contracts.manuscript).toBe(true);
    expect(getCapacity(state)).toBe(state.resources.camels * 2 - 1);
    while (getEncounter(state)!.id !== "jade-gate-papers") state = act(state, getEncounter(state)!.choices[0].id);
    const delivered = act(state, "hire-guarantor");
    expect(delivered.contracts.manuscript).toBe(false);
    expect(getCapacity(delivered)).toBe(delivered.resources.camels * 2);
  });
  it("ends Narin's final contract at Kashgar and retains her as a contact", () => {
    const narin = chapter4().people.find((person) => person.id === "narin")!;
    expect(narin.traveling).toBe(false);
    expect(narin.location).toBe("Kashgar");
    const settled = chapter4("cross-pass", "shared-practice").people.find((person) => person.id === "narin")!;
    expect(settled.location).toBe("Bactra");
  });
  it("sends only Arash east when the household stays in Bactra", () => {
    const state = ["hire-broker", "full-rest", "settle-debt", "narin-contract", "arash-east"].reduce(act, chapter2());
    expect(state.status).toBe("campaign-complete");
    expect(state.people.filter((person) => person.traveling).map((person) => person.id)).toEqual(["arash"]);
    expect(state.people.filter((person) => person.id !== "arash").every((person) => person.location === "Bactra")).toBe(true);
  });
  it("settles the traveling household at its chosen trade house", () => {
    const state = ["hire-broker", "full-rest", "settle-debt", "narin-contract", "bactra-house"].reduce(act, chapter2());
    expect(state.people.every((person) => !person.traveling && person.location === "Bactra")).toBe(true);
  });
  it("records compensation ownership and retrieved scouting cargo clearly", () => {
    const state = act(chapter4(), "canal-share");
    const choice = getEncounter(state)!.choices.find((item) => item.id === "carry-for-share")!;
    expect(choice.detail).toContain("full ownership");
    expect(act(state, choice.id).cargo.silk).toBe(state.cargo.silk + 2);
    expect(chapter4("scout-east").lastTravelNote).toContain("retrieve the cached cargo");
  });
  it("previews actual standing gains after the upper limit", () => {
    const state = { ...createInitialState(), standing: 100, encounterIndex: 2 };
    const choice = getEncounter(state)!.choices.find((item) => item.id === "share-medicine")!;
    expect(getChoicePreview(state, choice).costs.some((cost) => cost.startsWith("Standing +"))).toBe(false);
    expect(act(state, choice.id).standing).toBe(100);
  });
  it("charges for a Bactra intermediary when the only settled contact is in Kashgar", () => {
    const state = ["canal-share", "sell-glass"].reduce(act, chapter4());
    const choice = getEncounter(state)!.choices.find((item) => item.id === "send-accounts")!;
    expect(getEncounter(state)!.text).toContain("No member");
    expect(choice.effects.resources?.silver).toBe(-6);
  });
  it("makes winter and immediate crossing different elapsed commitments", () => {
    expect(chapter4("winter-valley").day - chapter4("cross-pass").day).toBe(71);
  });
  it("records omitted corridor travel explicitly without hidden supply drains", () => {
    const state = chapter5();
    expect(state.lastTravelNote).toContain("28 illustrative days");
    const choice = getEncounter(state)!.choices[0];
    const next = act(state, choice.id);
    expect(next.day - state.day).toBe((choice.duration ?? 1) + 24);
    expect(next.resources.food - state.resources.food).toBe(choice.effects.resources?.food ?? 0);
    expect(next.lastTravelNote).toContain("between Kucha and the Turfan basin");
    expect(next.decisions.at(-1)?.changes?.some((change) => change.label === "Arranged corridor travel")).toBe(true);
  });
  it("preserves injuries only for traveling people", () => {
    const state = ["lower-valley", "wait-dawn", "arash-descends"].reduce(act, chapter3());
    const health = state.people.find((person) => person.id === "arash")!.health;
    expect(act(state, "camp-outside").people.find((person) => person.id === "arash")!.health).toBe(health);
  });
  it("does not turn exposure to scenes into demonstrated learning", () => {
    const state = road.reduce(act, createInitialState());
    expect(state.knowledge).toBeGreaterThan(0);
    expect(getScore(state).understanding).toBe(0);
    const question = getReflection(1)!;
    const answered = recordReflection(state, question.correctId);
    expect(getScore(answered).understanding).toBe(20);
    expect(recordReflection(answered, question.correctId)).toBe(answered);
    expect(recordReflection(createInitialState(), question.correctId).reflections).toHaveLength(0);
  });
  it("keeps a wrong reflection as the first attempt while allowing progress", () => {
    const state = road.reduce(act, createInitialState());
    const question = getReflection(1)!;
    const wrong = question.options.find((option) => option.id !== question.correctId)!;
    const answered = recordReflection(state, wrong.id);
    expect(getScore(answered).understanding).toBe(0);
    expect(recordReflection(answered, question.correctId)).toBe(answered);
    expect(continueToBactra(answered).chapter).toBe(2);
  });
  it("never erases debt at a fixed negative balance", () => {
    const state = { ...createInitialState(), resources: { ...createInitialState().resources, silver: -100 } };
    const next = act(state, "take-credit");
    expect(next.resources.silver).toBe(-112);
    expect(getScore(next).livelihood).toBeLessThan(getScore(createInitialState()).livelihood);
  });
  it("shows story assistance in preview and records its real bill", () => {
    const state = { ...createInitialState(), resources: { ...createInitialState().resources, water: 1, camels: 1 } };
    const choice = getEncounter(state)!.choices[0];
    const preview = getChoicePreview(state, choice);
    expect(preview.allowed).toBe(true);
    expect(preview.costs.some((cost) => cost.includes("credit"))).toBe(true);
    const next = act(state, choice.id);
    expect(getCargoLoad(next)).toBeLessThanOrEqual(getCapacity(next));
    expect(next.resources.water).toBeGreaterThan(0);
    expect(next.decisions[0].changes?.some((change) => change.label === "Story assistance")).toBe(true);
  });
  it("uses explicit relief when every challenge option is blocked", () => {
    const state = { ...createInitialState("challenge"), resources: { water: 1, food: 1, silver: -40, camels: 8, medicine: 0 } };
    const encounter = getEncounter(state)!;
    const allowed = encounter.choices.filter((choice) => getChoicePreview(state, choice).allowed);
    expect(allowed.map((choice) => choice.id)).toEqual(["emergency-relief"]);
    const next = act(state, "emergency-relief");
    expect(next.encounterIndex).toBe(1);
    expect(next.day).toBe(8);
    expect(next.resources.food).toBe(10);
    expect(next.resources.silver).toBe(-25);
  });
  it("rejects unaffordable or unknown choices without changing the state", () => {
    const state = { ...createInitialState("challenge"), resources: { ...createInitialState().resources, silver: -40 } };
    expect(choose(state, "take-credit")).toBe(state);
    expect(choose(state, "not-real")).toBe(state);
  });
});
