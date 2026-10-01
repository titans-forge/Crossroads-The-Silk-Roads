import type { Encounter, JourneyState, Person, PersonId, ResourceKey } from "../types";
import { isMarketChoice } from "../data/market";
import { getReflection } from "../data/learning";

const resourceKeys: ResourceKey[] = ["water", "food", "silver", "camels", "medicine"];
const personIds: PersonId[] = ["samira", "vardan", "arash", "narin"];
const statuses: JourneyState["status"][] = ["playing", "chapter-complete", "campaign-complete", "failed"];

type JsonObject = Record<string, unknown>;
export const MAX_SAVE_BYTES = 1_048_576;
const cargoKeys = ["glass", "wool", "herbs", "silk", "jade"];
const stateKeys = ["chapter", "encounterIndex", "day", "people", "resources", "standing", "knowledge", "decisions", "status", "lastReaction", "lastOutcome", "endingId", "mode", "cargo", "contracts", "reflections", "pendingStatus", "lastTravelNote", "legacyRouteSkipped", "rulesVersion"];

function record(value: unknown): value is JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

function boundedString(value: unknown, maximum = 8_000, allowEmpty = false): value is string {
  return typeof value === "string" && value.length <= maximum && (allowEmpty || value.trim().length > 0) && !/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value);
}

function integer(value: unknown, minimum: number, maximum: number): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= minimum && value <= maximum;
}

function onlyKeys(value: JsonObject, keys: readonly string[]): boolean {
  return Object.keys(value).every((key) => keys.includes(key));
}

function nullableString(value: unknown, maximum = 8_000): boolean {
  return value === null || boundedString(value, maximum);
}

function validChanges(value: unknown): boolean {
  if (!Array.isArray(value) || value.length > 64) return false;
  return value.every((change) => record(change)
    && onlyKeys(change, ["kind", "label", "delta", "detail"])
    && ["resource", "health", "trust", "standing", "network", "cargo", "time", "contract"].includes(String(change.kind))
    && boundedString(change.label, 200)
    && (change.delta !== undefined || change.detail !== undefined)
    && (change.delta === undefined || integer(change.delta, -10_000, 10_000))
    && (change.detail === undefined || boundedString(change.detail, 2_000)));
}

function knownSource(value: unknown, encounters: Encounter[]): boolean {
  if (!boundedString(value, 2_000)) return false;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password
      && encounters.some((encounter) => encounter.sourceUrl === value);
  } catch {
    return false;
  }
}

function nonEmpty(value: unknown, minimum = 1) {
  return typeof value === "string" && value.trim().length >= minimum;
}

export function validateContent(encounters: Encounter[], people: Person[]): string[] {
  const errors: string[] = [];
  const encounterIds = new Set<string>();
  const choiceIds = new Set<string>();
  const knownPeople = new Set(people.map((person) => person.id));
  const expectedChapterCounts = [6, 5, 5, 5, 5];

  if (people.length !== personIds.length || personIds.some((id) => !knownPeople.has(id))) {
    errors.push("The four required household members are not registered exactly once.");
  }

  encounters.forEach((encounter, index) => {
    const label = encounter.id || `encounter at index ${index}`;
    if (!nonEmpty(encounter.id)) errors.push(`Encounter ${index} has no id.`);
    if (encounterIds.has(encounter.id)) errors.push(`Duplicate encounter id: ${encounter.id}.`);
    encounterIds.add(encounter.id);
    if (!knownPeople.has(encounter.speaker)) errors.push(`${label} has an unknown speaker.`);
    if (!nonEmpty(encounter.title) || !nonEmpty(encounter.text, 40)) errors.push(`${label} needs a title and substantive prompt.`);
    if (!nonEmpty(encounter.location) || !nonEmpty(encounter.sourceNote, 40)) errors.push(`${label} needs a location and source note.`);
    if (encounter.sourceUrl) {
      try {
        const url = new URL(encounter.sourceUrl);
        if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("unsupported protocol");
      } catch {
        errors.push(`${label} has an invalid source URL.`);
      }
    }
    if (encounter.choices.length !== 3) errors.push(`${label} must contain exactly three choices.`);
    encounter.choices.forEach((choice) => {
      if (!nonEmpty(choice.id)) errors.push(`${label} has a choice without an id.`);
      if (choiceIds.has(choice.id)) errors.push(`Duplicate choice id: ${choice.id}.`);
      choiceIds.add(choice.id);
      if (!nonEmpty(choice.label) || !nonEmpty(choice.detail, 20)) errors.push(`${label}/${choice.id} needs usable choice text.`);
      if (!nonEmpty(choice.reaction, 30) || !nonEmpty(choice.lesson, 40)) errors.push(`${label}/${choice.id} needs a reaction and historical lesson.`);
    });
  });

  expectedChapterCounts.forEach((expected, index) => {
    const actual = encounters.filter((encounter) => encounter.chapter === index + 1).length;
    if (actual !== expected) errors.push(`Chapter ${index + 1} has ${actual} encounters; expected ${expected}.`);
  });

  return errors;
}

/** Validate untrusted JSON before any engine, rendering, or migration code sees it. */
export function validateJourneyState(value: unknown, encounters: Encounter[], options: { legacy?: boolean } = {}): string[] {
  try {
    return validateState(value, encounters, options.legacy === true);
  } catch {
    // Accessor-bearing objects are not JSON, but this public validator must still fail safely.
    return ["Campaign state could not be safely read."];
  }
}

function validateState(value: unknown, encounters: Encounter[], legacy: boolean): string[] {
  if (!record(value)) return ["Campaign state is not an object."];
  const state = value;
  const errors: string[] = [];
  const fail = (valid: boolean, message: string) => { if (!valid) errors.push(message); };
  const encounterMap = new Map(encounters.map((encounter) => [encounter.id, encounter]));
  fail(onlyKeys(state, stateKeys), "Campaign contains unsupported state fields.");
  fail(state.rulesVersion === undefined || state.rulesVersion === 1 || state.rulesVersion === 2 || state.rulesVersion === 3, "Campaign rules version is unsupported.");
  fail(integer(state.chapter, 1, 5), "Campaign chapter is invalid.");
  fail(integer(state.encounterIndex, 0, 7), "Campaign encounter index is invalid.");
  fail(integer(state.day, 1, 10_000), "Campaign day is invalid.");
  fail(typeof state.status === "string" && statuses.includes(state.status as JourneyState["status"]), "Campaign status is invalid.");
  fail(integer(state.standing, 0, 100) && integer(state.knowledge, 0, 10_000), "Campaign score values are invalid.");
  fail(nullableString(state.lastReaction), "Campaign reaction is invalid.");
  fail(state.endingId === null || boundedString(state.endingId, 120), "Campaign ending is invalid.");

  if (!record(state.resources) || !onlyKeys(state.resources, resourceKeys)
    || resourceKeys.some((key) => !integer((state.resources as JsonObject)[key], key === "silver" ? -10_000 : 0, 10_000))) {
    errors.push("Campaign resources are incomplete or outside supported bounds.");
  }

  if (!Array.isArray(state.people) || state.people.length !== 4) {
    errors.push("Campaign household must contain exactly four members.");
  } else {
    const seen = new Set<unknown>();
    state.people.forEach((person) => {
      if (!record(person)) { errors.push("Campaign household contains an invalid member."); return; }
      fail(onlyKeys(person, ["id", "name", "role", "reason", "health", "trust", "portraitPosition", "location", "traveling"]), "Campaign household contains unsupported fields.");
      fail(personIds.includes(person.id as PersonId) && !seen.has(person.id), "Campaign household members are unknown or duplicated.");
      seen.add(person.id);
      fail(boundedString(person.name, 80) && boundedString(person.role, 200) && boundedString(person.reason, 2_000), "Campaign household text is invalid.");
      fail(integer(person.health, 0, 100) && integer(person.trust, 0, 100), "Campaign household health or trust is invalid.");
      fail(typeof person.portraitPosition === "string" && ["0% center", "33.33% center", "66.66% center", "100% center"].includes(person.portraitPosition), "Campaign portrait position is invalid.");
      fail((legacy && person.location === undefined) || boundedString(person.location, 200), "Campaign household location is invalid.");
      fail((legacy && person.traveling === undefined) || typeof person.traveling === "boolean", "Campaign household travel status is invalid.");
    });
    fail(personIds.every((id) => seen.has(id)), "Campaign household members are incomplete.");
  }

  const decisions: JsonObject[] = [];
  if (!Array.isArray(state.decisions) || state.decisions.length > 28) {
    errors.push("Campaign decision history is missing or too long.");
  } else {
    state.decisions.forEach((decision, index) => {
      if (!record(decision)) { errors.push(`Decision ${index + 1} is not a valid record.`); return; }
      decisions.push(decision);
      fail(onlyKeys(decision, ["encounterId", "choiceId", "choiceLabel", "lesson", "reaction", "changes", "day", "title", "location", "sourceUrl"]), `Decision ${index + 1} contains unsupported fields.`);
      const encounter = typeof decision.encounterId === "string" ? encounterMap.get(decision.encounterId) : undefined;
      if (!encounter) errors.push(`Decision ${index + 1} references an unknown encounter.`);
      else fail(encounter.choices.some((choice) => choice.id === decision.choiceId)
        || (!legacy && isMarketChoice(encounter.id, decision.choiceId, state.rulesVersion))
        || (!legacy && state.mode === "challenge" && decision.choiceId === "emergency-relief"), `Decision ${index + 1} references a choice outside its encounter.`);
      fail(boundedString(decision.lesson), `Decision ${index + 1} has an invalid lesson record.`);
      fail(decision.choiceLabel === undefined || boundedString(decision.choiceLabel, 300), `Decision ${index + 1} has an invalid choice label.`);
      fail(decision.reaction === undefined || boundedString(decision.reaction), `Decision ${index + 1} has an invalid reaction.`);
      fail(decision.changes === undefined || validChanges(decision.changes), `Decision ${index + 1} has invalid change records.`);
      fail(decision.day === undefined || integer(decision.day, 1, 10_000), `Decision ${index + 1} has an invalid day.`);
      fail(decision.title === undefined || boundedString(decision.title, 300), `Decision ${index + 1} has an invalid title.`);
      fail(decision.location === undefined || boundedString(decision.location, 300), `Decision ${index + 1} has an invalid location.`);
      fail(decision.sourceUrl === undefined || knownSource(decision.sourceUrl, encounters), `Decision ${index + 1} has an unrecognized source URL.`);
      const previousDay = decisions.at(-2)?.day;
      fail(decision.day === undefined || (typeof decision.day === "number" && typeof state.day === "number" && decision.day <= state.day
        && (previousDay === undefined || (typeof previousDay === "number" && decision.day >= previousDay))), `Decision ${index + 1} has an inconsistent journey day.`);
    });
  }

  if (state.lastOutcome !== null && !(legacy && state.lastOutcome === undefined)) {
    const outcome = state.lastOutcome;
    if (!record(outcome)) errors.push("Campaign pending outcome is invalid.");
    else {
      fail(onlyKeys(outcome, ["encounterId", "choiceId", "choiceLabel", "reaction", "lesson", "changes"]), "Campaign pending outcome contains unsupported fields.");
      fail(boundedString(outcome.choiceLabel, 300) && boundedString(outcome.reaction) && boundedString(outcome.lesson) && validChanges(outcome.changes), "Campaign pending outcome text or changes are invalid.");
      const latest = decisions.at(-1);
      fail(!!latest && latest.encounterId === outcome.encounterId && latest.choiceId === outcome.choiceId && latest.lesson === outcome.lesson, "Campaign pending outcome does not match its latest decision.");
      fail(!latest || (latest.reaction === undefined || latest.reaction === outcome.reaction)
        && (latest.choiceLabel === undefined || latest.choiceLabel === outcome.choiceLabel)
        && (latest.changes === undefined || JSON.stringify(latest.changes) === JSON.stringify(outcome.changes)), "Campaign pending outcome differs from its history record.");
    }
  }

  if (!legacy) {
    fail(state.mode === "story" || state.mode === "challenge", "Campaign mode is invalid.");
    fail(record(state.cargo) && onlyKeys(state.cargo, cargoKeys) && cargoKeys.every((key) => integer((state.cargo as JsonObject)[key], 0, 1_000)), "Campaign cargo is incomplete or invalid.");
    if (!record(state.contracts)) errors.push("Campaign contracts are missing.");
    else {
      const contracts = state.contracts;
      fail(onlyKeys(contracts, ["vima", "villageFavor", "guide", "hospitality", "route", "manuscript"]), "Campaign contracts contain unsupported fields.");
      fail(["unsettled", "paid", "contract", "disputed"].includes(String(contracts.vima))
        && ["none", "dara", "roshna", "caravan"].includes(String(contracts.guide))
        && ["undecided", "north", "south"].includes(String(contracts.route))
        && ["villageFavor", "hospitality", "manuscript"].every((key) => typeof contracts[key] === "boolean"), "Campaign contract values are invalid.");
    }
    fail(nullableString(state.lastTravelNote, 4_000), "Campaign travel note is invalid.");
    fail(state.legacyRouteSkipped === undefined || (state.legacyRouteSkipped === true && state.chapter === 5 && state.mode === "story"), "Campaign legacy route marker is invalid.");
    fail(state.pendingStatus === null || (typeof state.pendingStatus === "string" && statuses.includes(state.pendingStatus as JourneyState["status"])), "Campaign pending status is invalid.");
    fail((state.lastOutcome === null && state.pendingStatus === null)
      || (record(state.lastOutcome) && state.status === "playing" && state.pendingStatus !== null), "Campaign pending outcome and status are inconsistent.");
    if (!Array.isArray(state.reflections) || state.reflections.length > 5) errors.push("Campaign reflection records are invalid.");
    else {
      const seen = new Set<unknown>();
      state.reflections.forEach((reflection, index) => {
        if (!record(reflection)) { errors.push("Campaign contains an invalid reflection record."); return; }
        fail(onlyKeys(reflection, ["chapter", "answerId", "correct"]) && integer(reflection.chapter, 1, 5) && !seen.has(reflection.chapter), "Campaign reflection chapters are invalid or duplicated.");
        seen.add(reflection.chapter);
        if (integer(reflection.chapter, 1, 5)) {
          const question = getReflection(reflection.chapter as JourneyState["chapter"]);
          fail(!!question && question.options.some((option) => option.id === reflection.answerId)
            && typeof reflection.correct === "boolean" && reflection.correct === (reflection.answerId === question.correctId), "Campaign reflection answer is invalid.");
          const chapterChoices = decisions.filter((decision) => encounterMap.get(String(decision.encounterId))?.chapter === reflection.chapter);
          const finalEncounter = encounters.filter((encounter) => encounter.chapter === reflection.chapter && !encounter.id.startsWith("north-") && !encounter.id.startsWith("south-")).at(-1);
          fail(!!finalEncounter && chapterChoices.at(-1)?.encounterId === finalEncounter.id, "Campaign reflection precedes its completed chapter.");
          const prior = (state.reflections as unknown[])[index - 1];
          fail(index === 0 || (record(prior) && typeof prior.chapter === "number" && reflection.chapter > prior.chapter), "Campaign reflection order is inconsistent.");
          if (reflection.chapter === state.chapter) fail(state.lastOutcome === null && ["chapter-complete", "campaign-complete"].includes(String(state.status)), "Campaign reflection precedes acknowledgement of its chapter outcome.");
        }
      });
    }
  }

  if (integer(state.chapter, 1, 5) && integer(state.encounterIndex, 0, 7) && Array.isArray(state.decisions)) {
    const routeChoice = decisions.find((decision) => decision.choiceId === "north-road" || decision.choiceId === "south-road")?.choiceId;
    const route = routeChoice === "north-road" ? "north" : routeChoice === "south-road" ? "south" : "undecided";
    if (!legacy && record(state.contracts)) fail(state.contracts.route === route, "Campaign route does not match the decision history.");
    const skipped = legacy || state.legacyRouteSkipped === true;
    const chapterEncounters = (chapter: number) => encounters.filter((encounter) => encounter.chapter === chapter
      && (!encounter.id.startsWith("north-") && !encounter.id.startsWith("south-") || (!skipped && encounter.id.startsWith(`${route}-`))));
    const chapterLength = chapterEncounters(state.chapter).length;
    // Variant scenes precede the five shared frontier scenes regardless of caller catalogue ordering.
    const orderedChapter = (chapter: number) => {
      const items = chapterEncounters(chapter);
      return [...items.filter((item) => item.id.startsWith("north-") || item.id.startsWith("south-")), ...items.filter((item) => !item.id.startsWith("north-") && !item.id.startsWith("south-"))];
    };
    const expected = Array.from({ length: state.chapter - 1 }, (_, index) => orderedChapter(index + 1)).flat();
    expected.push(...orderedChapter(state.chapter).slice(0, state.encounterIndex));
    fail(state.encounterIndex <= chapterLength, "Campaign position is outside the current chapter.");
    fail(decisions.length === expected.length && decisions.every((decision, index) => decision.encounterId === expected[index]?.id), "Campaign decision history does not match its chapter position.");
    if (state.chapter > 2) fail(decisions.some((decision) => decision.choiceId === "household-east"), "Campaign advanced beyond an earlier ending.");
    if (state.chapter === 5) fail(route !== "undecided", "Campaign frontier route was never selected.");
    const effectiveStatus = !legacy && state.lastOutcome !== null ? state.pendingStatus : state.status;
    const lastChoice = decisions.at(-1)?.choiceId;
    const atEnd = state.encounterIndex === chapterLength;
    const continues = state.chapter === 1 || state.chapter === 3 || (state.chapter === 2 && lastChoice === "household-east") || (state.chapter === 4 && (lastChoice === "north-road" || lastChoice === "south-road"));
    if (effectiveStatus !== "failed") {
      const expectedStatus = atEnd ? continues ? "chapter-complete" : "campaign-complete" : "playing";
      fail(effectiveStatus === expectedStatus, "Campaign completion status does not match its progress.");
    }
    fail(effectiveStatus !== "failed" || decisions.length > 0, "Campaign failed before any decision was made.");
    const expectedEnding = atEnd && state.chapter >= 2 ? lastChoice : null;
    fail(state.endingId === expectedEnding, "Campaign ending does not match its final decision.");
  }

  return [...new Set(errors)];
}
