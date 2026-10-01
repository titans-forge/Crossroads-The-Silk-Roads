import { scoreBreakdown } from './accounts';
import { allEncounters, encounters, bactraEncounters, pamirEncounters, kashgarEncounters, dunhuangEncounters, people } from "../data/journey";
import { northRouteEncounters, southRouteEncounters } from "../data/routes";
import { getReflection, reflections } from "../data/learning";
import type { CargoGood, Choice, GameMode, JourneyState, OutcomeChange, ResourceKey } from "../types";
import { capacity, cargoLoad, cargoNames, choiceRestriction, creditLimit, emergencyChoice, resolveEncounter, vimaBalance } from "./rules";

const clamp = (value: number) => Math.max(0, Math.min(100, value));
const resourceNames: Record<ResourceKey, string> = { water: "Water", food: "Food", silver: "Silver", camels: "Camels", medicine: "Medicine" };
const montageNote = (days: number, journey: string) => `Travel montage: ${days} illustrative days ${journey}. Arranged staging and local provisioning cover this interval; only the displayed decision costs affect stores. This is a teaching abstraction, not a dated historical itinerary.`;

function transitAfterChoice(state: JourneyState): { days: number; note: string | null } {
  if (state.chapter === 1 && state.encounterIndex === 4) return { days: 18, note: montageNote(18, "through the remaining stages toward Bactra's western gate") };
  if (state.chapter !== 5 || state.legacyRouteSkipped || state.encounterIndex > 1) return { days: 0, note: null };
  const south = state.contracts.route === "south";
  const days = state.encounterIndex === 0 ? south ? 18 : 24 : south ? 55 : 28;
  const journey = state.encounterIndex === 0 ? south ? "between Yarkand and Khotan" : "between Kucha and the Turfan basin" : south ? "through the remaining southern oasis stages toward Dunhuang" : "through the eastern oasis stages toward Dunhuang";
  return { days, note: montageNote(days, journey) };
}

export function createInitialState(mode: GameMode = "story"): JourneyState {
  return {
    chapter: 1, encounterIndex: 0, day: 1, rulesVersion: 3,
    people: people.map((person) => ({ ...person })),
    resources: { water: 31, food: 34, silver: 46, camels: 8, medicine: 5 },
    standing: 50, knowledge: 0, decisions: [], status: "playing", lastReaction: null, lastOutcome: null, endingId: null,
    mode, cargo: { glass: 3, wool: 4, herbs: 2, silk: 0, jade: 0 },
    contracts: { vima: "unsettled", villageFavor: false, guide: "none", hospitality: false, route: "undecided", manuscript: false },
    reflections: [], pendingStatus: null, lastTravelNote: null,
  };
}

export function getChapterEncounters(chapter: JourneyState["chapter"], route: JourneyState["contracts"]["route"] = "undecided", legacyRouteSkipped = false) {
  if (chapter === 1) return encounters;
  if (chapter === 2) return bactraEncounters;
  if (chapter === 3) return pamirEncounters;
  if (chapter === 4) return kashgarEncounters;
  return legacyRouteSkipped ? dunhuangEncounters : [...(route === "south" ? southRouteEncounters : northRouteEncounters), ...dunhuangEncounters];
}

export const getCargoLoad = cargoLoad;
export const getCapacity = capacity;
export const getVimaBalance = vimaBalance;

export function getEncounter(state: JourneyState) {
  const chapter = getChapterEncounters(state.chapter, state.contracts.route, state.legacyRouteSkipped);
  const index = state.lastOutcome ? state.encounterIndex - 1 : state.encounterIndex;
  const source = chapter[index];
  if (!source) return undefined;
  const encounter = resolveEncounter(source, state);
  if (!state.lastOutcome && state.mode === "challenge" && encounter.choices.every((choice) => choiceRestriction(state, choice))) encounter.choices.push(emergencyChoice(state, encounter));
  return encounter;
}

function applyChoice(state: JourneyState, choice: Choice) {
  const resources = { ...state.resources };
  for (const key of Object.keys(resources) as ResourceKey[]) resources[key] += choice.effects.resources?.[key] ?? 0;
  const cargo = { ...state.cargo };
  for (const key of Object.keys(cargo) as CargoGood[]) cargo[key] = Math.max(0, cargo[key] + (choice.effects.cargo?.[key] ?? 0));
  const contracts = { ...state.contracts, ...choice.effects.contracts };
  const peopleNext = state.people.map((person) => ({
    ...person, ...choice.effects.personUpdates?.[person.id],
    health: clamp(person.health + (person.traveling ? choice.effects.health?.[person.id] ?? 0 : 0)),
    trust: clamp(person.trust + (choice.effects.trust?.[person.id] ?? 0)),
  }));
  if (contracts.vima === "paid") {
    const samira = peopleNext.find((person) => person.id === "samira");
    if (samira && /repay.*father|father.*debt/i.test(samira.reason)) samira.reason = "The inherited Bactra account is settled. She now guides the household's trade, care, and relationships across the roads.";
  }
  let days = choice.duration ?? choice.effects.duration ?? 1;
  const transit = transitAfterChoice(state);
  days += transit.days;
  const recovery: string[] = [];
  if (state.mode === "story") {
    // Story mode keeps the household in play, but records rather than erases the bill.
    for (const key of ["food", "water", "camels"] as const) {
      if (resources[key] < 1) { const amount = 1 - resources[key]; resources[key] = 1; resources.silver -= amount * (key === "camels" ? 12 : 3); recovery.push(`${amount} ${key} obtained on credit`); }
    }
    if (resources.medicine < 0) { const amount = -resources.medicine; resources.medicine = 0; resources.silver -= amount * 4; recovery.push(`${amount} emergency medicine doses supplied on credit`); }
    const projected = { ...state, cargo, contracts, resources };
    const excess = Math.max(0, cargoLoad(projected) - capacity(projected));
    if (excess) { const animals = Math.ceil(excess / 2); resources.camels += animals; resources.silver -= animals * 12; recovery.push(`${animals} additional pack animals hired for ${animals * 12} silver to carry the excess load`); }
    for (const person of peopleNext) if (person.traveling && person.health < 10) { person.health = 10; resources.silver -= 8; recovery.push(`${person.name} received emergency care for 8 silver`); }
    if (recovery.length) days += 2;
  }
  resources.medicine = Math.max(0, resources.medicine);
  const standing = clamp(state.standing + (choice.effects.standing ?? 0));
  return { resources, cargo, contracts, people: peopleNext, standing, days, recovery, transit };
}

export function getTradeProjection(state: JourneyState, choice: Choice) {
  const next = applyChoice(state, choice);
  const projected = { ...state, ...next };
  return { resources: next.resources, load: cargoLoad(projected), capacity: capacity(projected), days: next.days, assistance: next.recovery };
}

export function journeyContinuation(state: JourneyState, choice: Choice): string | null {
  if (state.encounterIndex + 1 < getChapterEncounters(state.chapter, state.contracts.route, state.legacyRouteSkipped).length) return null;
  const continues = state.chapter === 1 || state.chapter === 3 || (state.chapter === 2 && choice.id === "household-east") || (state.chapter === 4 && ["north-road", "south-road"].includes(choice.id));
  return continues ? "Continues to the next chapter" : "Ends this journey after the aftermath";
}

export function getChoicePreview(state: JourneyState, choice: Choice): { allowed: boolean; reason?: string; days: number; costs: string[] } {
  const reason = state.lastOutcome || state.status !== "playing" ? "Continue past the recorded outcome first." : choiceRestriction(state, choice);
  const projected = applyChoice(state, choice);
  const costs: string[] = [];
  for (const key of Object.keys(state.resources) as ResourceKey[]) { const delta = projected.resources[key] - state.resources[key]; if (delta) costs.push(`${resourceNames[key]} ${delta > 0 ? "+" : ""}${delta}`); }
  for (const good of Object.keys(state.cargo) as CargoGood[]) { const delta = projected.cargo[good] - state.cargo[good]; if (delta) costs.push(`${cargoNames[good]} ${delta > 0 ? "+" : ""}${delta} lots`); }
  for (const person of projected.people) {
    const previous = state.people.find((item) => item.id === person.id)!;
    const health = person.health - previous.health;
    const trust = person.trust - previous.trust;
    if (health) costs.push(`${person.name} health ${health > 0 ? "+" : ""}${health}`);
    if (!trust && previous.trust === 100 && (choice.effects.trust?.[person.id] ?? 0) > 0) costs.push(`${person.name}: trust already at 100`);
    if (trust) costs.push(`${person.name} trust ${trust > 0 ? "+" : ""}${trust}`);
    if (person.traveling !== previous.traveling) costs.push(person.traveling ? `${person.name} rejoins` : `${person.name} settles in ${person.location}`);
  }
  const standingDelta = projected.standing - state.standing;
  if (!standingDelta && state.standing === 100 && (choice.effects.standing ?? 0) > 0) costs.push("Standing already at 100");
  if (standingDelta) costs.push(`Standing ${standingDelta > 0 ? "+" : ""}${standingDelta}`);
  if (projected.resources.silver < 0) costs.push(`${-projected.resources.silver} silver owed after this choice${state.mode === "challenge" ? ` / ${-creditLimit} limit` : ""}`);
  if (choice.effects.contracts?.villageFavor === false && state.contracts.villageFavor) costs.push("Village introduction spent");
  if (choice.effects.contracts?.hospitality) costs.push("Two spaces reserved for passengers until Kashgar");
  if (choice.effects.contracts?.manuscript) costs.push("One space reserved for the manuscript until Dunhuang");
  if (choice.effects.contracts?.vima) costs.push(`Vima's account: ${choice.effects.contracts.vima}`);
  if (choice.effects.contracts?.guide) costs.push(`Guide: ${choice.effects.contracts.guide}`);
  costs.push(...projected.recovery);
  if (projected.transit.note) costs.push(projected.transit.note);
  return { allowed: !reason, ...(reason ? { reason } : {}), days: projected.days, costs };
}

function describeChanges(state: JourneyState, next: ReturnType<typeof applyChoice>): OutcomeChange[] {
  const changes: OutcomeChange[] = [];
  for (const key of Object.keys(state.resources) as ResourceKey[]) { const delta = next.resources[key] - state.resources[key]; if (delta) changes.push({ kind: "resource", label: resourceNames[key], delta }); }
  for (const good of Object.keys(state.cargo) as CargoGood[]) { const delta = next.cargo[good] - state.cargo[good]; if (delta) changes.push({ kind: "cargo", label: `${cargoNames[good]} lots`, delta }); }
  for (const person of next.people) {
    const old = state.people.find((item) => item.id === person.id)!;
    if (person.health !== old.health) changes.push({ kind: "health", label: `${person.name} health`, delta: person.health - old.health });
    if (person.trust !== old.trust) changes.push({ kind: "trust", label: `${person.name} trust`, delta: person.trust - old.trust });
    if (person.traveling !== old.traveling || person.location !== old.location) changes.push({ kind: "network", label: person.name, detail: !person.traveling ? `Now based in ${person.location}` : !old.traveling ? "Rejoined the caravan" : `Now traveling with: ${person.location}` });
  }
  for (const key of Object.keys(state.contracts) as (keyof JourneyState["contracts"])[]) if (state.contracts[key] !== next.contracts[key]) changes.push({ kind: "contract", label: key === "vima" ? "Vima's account" : key === "villageFavor" ? "Village introduction" : key === "guide" ? "Mountain guide" : key === "hospitality" ? "Family passage" : key === "route" ? "Eastern route" : "Manuscript custody", detail: typeof next.contracts[key] === "boolean" ? next.contracts[key] ? "Accepted" : "Completed or spent" : String(next.contracts[key]) });
  if (next.standing !== state.standing) changes.push({ kind: "standing", label: "Road standing", delta: next.standing - state.standing });
  if (next.days) changes.push({ kind: "time", label: "Elapsed journey days", delta: next.days });
  for (const detail of next.recovery) changes.push({ kind: "contract", label: "Story assistance", detail });
  if (next.transit.note) changes.push({ kind: "time", label: "Arranged corridor travel", detail: next.transit.note });
  return changes;
}

function chooseInternal(state: JourneyState, choiceId: string, legacy = false): JourneyState {
  if (state.status !== "playing" || state.lastOutcome) return state;
  const encounter = getEncounter(state);
  const choice = encounter?.choices.find((item) => item.id === choiceId);
  if (!encounter || !choice || (!legacy && choiceRestriction(state, choice))) return state;
  const next = applyChoice(state, choice);
  const nextIndex = state.encounterIndex + 1;
  const complete = nextIndex >= getChapterEncounters(state.chapter, state.contracts.route, state.legacyRouteSkipped).length;
  const failed = state.mode === "challenge" && (next.resources.water <= 0 || next.resources.food <= 0 || next.resources.camels <= 0 || next.people.filter((person) => person.traveling && person.health <= 0).length >= 2);
  const chapterContinues = state.chapter === 1 || state.chapter === 3 || (state.chapter === 2 && choice.id === "household-east") || (state.chapter === 4 && ["north-road", "south-road"].includes(choice.id));
  const pendingStatus = failed ? "failed" : complete ? chapterContinues ? "chapter-complete" : "campaign-complete" : "playing";
  const changes = describeChanges(state, next);
  const reaction = choice.reaction + (next.recovery.length ? ` Story assistance: ${next.recovery.join("; ")}.` : "");
  return {
    ...state, resources: next.resources, cargo: next.cargo, contracts: next.contracts, people: next.people, standing: next.standing,
    encounterIndex: nextIndex, day: state.day + next.days, knowledge: state.knowledge + (choice.effects.knowledge ?? 0),
    decisions: [...state.decisions, { encounterId: encounter.id, choiceId, lesson: choice.lesson, choiceLabel: choice.label, reaction, changes, day: state.day + next.days, title: encounter.title, location: encounter.location, ...(encounter.sourceUrl ? { sourceUrl: encounter.sourceUrl } : {}) }],
    status: "playing", pendingStatus, lastReaction: null,
    lastOutcome: { encounterId: encounter.id, choiceId, choiceLabel: choice.label, reaction, lesson: choice.lesson, changes },
    endingId: complete && state.chapter >= 2 ? choice.id : state.endingId,
    lastTravelNote: next.transit.note ?? state.lastTravelNote,
  };
}

export const choose = (state: JourneyState, choiceId: string) => chooseInternal(state, choiceId);
/** Import-only replay, after the save module has validated the legacy sequence. */
export const replayLegacyChoice = (state: JourneyState, choiceId: string) => chooseInternal(state, choiceId, true);

export function acknowledgeOutcome(state: JourneyState): JourneyState {
  return state.lastOutcome ? { ...state, status: state.pendingStatus ?? "playing", pendingStatus: null, lastReaction: state.lastOutcome.reaction, lastOutcome: null } : state;
}

function enterChapter(state: JourneyState, chapter: JourneyState["chapter"], note: string, travelDays = 0): JourneyState {
  const travelNote = travelDays ? `${note} ${montageNote(travelDays, "through arranged regional stages")}` : note;
  return { ...state, chapter, encounterIndex: 0, day: state.day + travelDays, status: "playing", lastOutcome: null, pendingStatus: null, endingId: null, lastReaction: travelNote, lastTravelNote: travelNote };
}

export function continueToBactra(state: JourneyState): JourneyState {
  return state.status === "chapter-complete" && state.chapter === 1 && !state.lastOutcome ? enterChapter(state, 2, "Bactra opens around the caravan: markets, measures, and choices about which obligations continue east.") : state;
}
export function continueToPamirs(state: JourneyState): JourneyState {
  return state.status === "chapter-complete" && state.chapter === 2 && state.endingId === "household-east" && !state.lastOutcome ? enterChapter(state, 3, "Beyond Bactra, local guides, inhabited valleys, seasons, and carrying capacity determine the road. Dates mark approximate elapsed time.", 12) : state;
}
export function continueToKashgar(state: JourneyState): JourneyState {
  if (state.status !== "chapter-complete" || state.chapter !== 3 || state.lastOutcome) return state;
  const winter = state.decisions.at(-1)?.choiceId === "winter-valley";
  const scouting = state.decisions.at(-1)?.choiceId === "scout-east";
  const next = enterChapter(state, 4, winter ? "After a winter of local work, spring reopens the valleys. The waiting season remains in the journey's elapsed days." : scouting ? "The scouts return with a tested route, retrieve the cached cargo, and reunite the traveling household before the onward stages to Kashgar. No cargo remains abandoned in the valley." : "After the mountain passage, the household reaches Kashgar's water schedules and branching roads.", 14);
  next.contracts = { ...next.contracts, hospitality: false };
  if (next.people.find((person) => person.id === "narin")?.traveling && next.decisions.some((decision) => decision.choiceId === "narin-contract")) {
    next.people = next.people.map((person) => person.id === "narin" ? { ...person, traveling: false, location: "Kashgar", role: "Kashgar healer", reason: "Her final contract ended at Kashgar. She now practices locally and remains a household contact." } : person);
    next.lastTravelNote += " Narin's contracted passage ends here; she joins the settled network in Kashgar.";
    next.lastReaction = next.lastTravelNote;
  }
  return next;
}
export function continueToDunhuang(state: JourneyState): JourneyState {
  if (state.status !== "chapter-complete" || state.chapter !== 4 || !["north-road", "south-road"].includes(state.endingId ?? "") || state.lastOutcome) return state;
  const route = state.endingId === "south-road" ? "south" : "north";
  const next = enterChapter(state, 5, route === "south" ? "The southern corridor begins with Yarkand's carriers and Khotan's stone market before the frontier at Dunhuang." : "The northern corridor begins with Kucha's account practices and Turfan's water arrangements before the frontier at Dunhuang.", route === "south" ? 12 : 28);
  next.contracts = { ...next.contracts, route };
  return next;
}

export function recordReflection(state: JourneyState, answerId: string, chapter = reflections.find(question => question.options.some(option => option.id === answerId))?.chapter ?? state.chapter): JourneyState {
  if (state.lastOutcome || !["chapter-complete", "campaign-complete"].includes(state.status) || chapter > state.chapter || state.reflections.some((item) => item.chapter === chapter)) return state;
  const finalEncounter = getChapterEncounters(chapter, state.contracts.route, state.legacyRouteSkipped).at(-1);
  if (!finalEncounter || !state.decisions.some((item) => item.encounterId === finalEncounter.id)) return state;
  const question = getReflection(chapter);
  if (!question || !question.options.some((option) => option.id === answerId)) return state;
  return { ...state, reflections: [...state.reflections, { chapter, answerId, correct: answerId === question.correctId }].sort((a, b) => a.chapter - b.chapter) };
}

export function isValidSave(value: unknown): value is JourneyState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<JourneyState>;
  return [1, 2, 3, 4, 5].includes(state.chapter ?? 0) && Array.isArray(state.people) && Array.isArray(state.decisions) && Number.isInteger(state.encounterIndex);
}

export function migrateState(value: unknown): JourneyState {
  if (!value || typeof value !== "object") return createInitialState();
  const old = value as Partial<JourneyState> & { status?: string };
  if (!Array.isArray(old.people) || !Array.isArray(old.decisions)) return createInitialState();
  const base = createInitialState(old.mode === "challenge" ? "challenge" : "story");
  const status = (old.status as string) === "arrived" ? "chapter-complete" : old.status ?? "playing";
  return { ...base, ...old, rulesVersion: old.rulesVersion ?? 1, status: status as JourneyState["status"], chapter: old.chapter ?? 1, cargo: { ...base.cargo, ...old.cargo }, contracts: { ...base.contracts, ...old.contracts }, people: old.people.map((person) => ({ ...person, location: person.location ?? "With the caravan", traveling: person.traveling ?? true })), reflections: old.reflections ?? [], lastOutcome: old.lastOutcome ?? null, pendingStatus: old.pendingStatus ?? (old.lastOutcome ? status as JourneyState["status"] : null) };
}

export const encounterCount = allEncounters.length + 2;
export function getScore(state: JourneyState) {
  const { people, livelihood } = scoreBreakdown(state);
  return { people, livelihood, understanding: state.reflections.filter((item) => item.correct).length * 20 };
}
