import { describe, expect, it } from "vitest";
import { allEncounters, people } from "../src/data/journey";
import { getReflection } from "../src/data/learning";
import { acknowledgeOutcome, choose, continueToBactra, continueToDunhuang, continueToKashgar, continueToPamirs, createInitialState, getChoicePreview, getEncounter, recordReflection } from "../src/game/engine";
import { parseCampaign, SAVE_FORMAT, SAVE_VERSION, serializeCampaign } from "../src/game/save";
import { MAX_SAVE_BYTES } from "../src/game/validation";
import type { JourneyState } from "../src/types";

const originalChoices = [
  "travel-light", "redistribute", "share-medicine", "let-arash", "sell-all", "call-favor",
  "hire-broker", "animals-first", "settle-debt", "shared-practice", "household-east",
  "lower-valley", "wait-dawn", "rest-high", "carry-family", "cross-pass",
  "canal-labor", "sell-glass", "send-accounts", "carry-text", "north-road",
  "declare-cargo", "obey-closure", "lease-camels", "show-ledger", "eastern-handoff",
];

/** Historical v2 layout: base encounters only, including the original duplicate glass sale. */
function legacyAt(chapter: 1 | 2 | 3 | 4 | 5, index: number): Record<string, any> {
  const prefix = allEncounters.filter((encounter) => encounter.chapter < chapter).length;
  const length = prefix + index;
  const chapterLength = allEncounters.filter((encounter) => encounter.chapter === chapter).length;
  const complete = index === chapterLength;
  return {
    chapter, encounterIndex: index, day: Math.max(1, length),
    people: people.map((person) => ({ ...person, health: 72, trust: 65 })),
    resources: { water: 27, food: 33, silver: -12, camels: 8, medicine: 3 },
    standing: 63, knowledge: length * 3,
    decisions: allEncounters.slice(0, length).map((encounter, position) => ({ encounterId: encounter.id, choiceId: originalChoices[position], lesson: encounter.choices.find((choice) => choice.id === originalChoices[position])!.lesson })),
    status: complete ? chapter === 5 ? "campaign-complete" : "chapter-complete" : "playing",
    lastReaction: complete ? "The caravan reaches the next stop." : null,
    lastOutcome: null,
    endingId: complete && chapter >= 2 ? originalChoices[length - 1] : null,
  };
}

function envelope(state: unknown, version = SAVE_VERSION): string {
  return JSON.stringify({ format: SAVE_FORMAT, version, exportedAt: "2026-09-07T12:00:00.000Z", state });
}

function continueJourney(state: JourneyState): JourneyState {
  return state.chapter === 1 ? continueToBactra(state) : state.chapter === 2 ? continueToPamirs(state) : state.chapter === 3 ? continueToKashgar(state) : continueToDunhuang(state);
}

function completeCampaign(route: "north-road" | "south-road", mode: "story" | "challenge" = "story"): JourneyState {
  let state = createInitialState(mode);
  for (let guard = 0; guard < 40; guard += 1) {
    if (state.status !== "playing") break;
    const encounter = getEncounter(state)!;
    const preferred = encounter.choices.find((choice) => (choice.id === "household-east" || choice.id === route) && getChoicePreview(state, choice).allowed);
    const choice = preferred ?? encounter.choices.find((item) => getChoicePreview(state, item).allowed)!;
    state = choose(state, choice.id);
    const pending = parseCampaign(serializeCampaign(state));
    expect(pending.ok).toBe(true);
    if (pending.ok) expect(pending.state).toEqual(state);
    state = acknowledgeOutcome(state);
    if (state.status === "chapter-complete" || state.status === "campaign-complete") {
      const question = getReflection(state.chapter)!;
      state = recordReflection(state, question.correctId);
      const completed = parseCampaign(serializeCampaign(state));
      expect(completed.ok).toBe(true);
      if (state.status === "chapter-complete") state = continueJourney(state);
    }
  }
  expect(state.status).toBe("campaign-complete");
  return state;
}

describe("portable campaign saves", () => {
  it("round-trips a v4 rules-2 campaign with its pending outcome", () => {
    const state = choose(createInitialState(), "travel-light");
    const exported = serializeCampaign(state);
    expect(JSON.parse(exported)).toMatchObject({ version: 4, state: { rulesVersion: 3 } });
    const result = parseCampaign(exported);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state).toEqual(state);
      expect(result.migrated).toBe(false);
      expect(result.warnings).toEqual([]);
      expect(result.state.rulesVersion).toBe(3);
    }
  });

  it.each(["initial", "pending", "chapter-complete", "broker-pending"] as const)("preserves an original v3 %s snapshot under rules 1", (position) => {
    let state: JourneyState = { ...createInitialState(), rulesVersion: 1 };
    if (position === "pending") state = choose(state, "travel-light");
    if (position === "chapter-complete" || position === "broker-pending") {
      for (const choiceId of originalChoices.slice(0, 6)) state = acknowledgeOutcome(choose(state, choiceId));
    }
    if (position === "broker-pending") state = choose(continueToBactra(state), "hire-broker");
    const original = structuredClone(state);
    delete original.rulesVersion;
    const result = parseCampaign(envelope(original, 3));
    expect(result).toMatchObject({ ok: true, migrated: true });
    if (result.ok) {
      expect(result.state).toEqual({ ...original, rulesVersion: 1 });
      expect(result.state.resources).toEqual(original.resources);
      expect(result.state.decisions).toEqual(original.decisions);
      expect(result.state.lastOutcome).toEqual(original.lastOutcome);
      expect(result.warnings.join(" ")).toContain("original gameplay rules");
      expect(parseCampaign(serializeCampaign(result.state))).toMatchObject({ ok: true, migrated: false, state: { rulesVersion: 1 } });
    }
  });

  it.each([undefined, 0, 4, "2", null])("rejects unsupported or absent v4 rules version %s", (rulesVersion) => {
    const state: Record<string, unknown> = { ...createInitialState(), rulesVersion };
    if (rulesVersion === undefined) delete state.rulesVersion;
    const result = parseCampaign(envelope(state, 4));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/rules version/i);
  });

  it("imports a genuine v3 rules-1 relief outcome without applying new economics", () => {
    const path = ["sell-cloth", "leave-animal", "share-medicine", "pay", "keep-cargo", "physician", "challenge-measure", "animals-first", "east-contract", "narin-stays", "household-east", "follow-caravan", "wait-dawn", "descend-together", "camp-outside", "emergency-relief"];
    let state: JourneyState = { ...createInitialState("challenge"), rulesVersion: 1 };
    for (const choiceId of path) {
      state = acknowledgeOutcome(state);
      if (state.status === "chapter-complete") state = continueJourney(state);
      const previous = state.decisions.length;
      state = choose(state, choiceId);
      expect(state.decisions).toHaveLength(previous + 1);
    }
    expect(state.lastOutcome?.choiceId).toBe("emergency-relief");
    const original = structuredClone(state);
    delete original.rulesVersion;
    const restored = parseCampaign(envelope(original, 3));
    expect(restored.ok).toBe(true);
    if (restored.ok) {
      expect(restored.state).toEqual({ ...original, rulesVersion: 1 });
      const continued = continueToKashgar(acknowledgeOutcome(restored.state));
      expect(continued.rulesVersion).toBe(1);
      expect(parseCampaign(serializeCampaign(continued))).toMatchObject({ ok: true, state: { rulesVersion: 1 } });
    }
  });

  it.each(["north-road", "south-road"] as const)("round-trips every pending outcome and completion on the %s", (route) => {
    const state = completeCampaign(route);
    expect(state.decisions).toHaveLength(28);
    expect(state.reflections).toHaveLength(5);
    expect(parseCampaign(serializeCampaign(state)).ok).toBe(true);
    const corrupted = structuredClone(state);
    corrupted.reflections[0].correct = false;
    expect(parseCampaign(envelope(corrupted)).ok).toBe(false);
  });

  it("round-trips a challenge campaign, including any earned relief settlements", () => {
    const state = completeCampaign("north-road", "challenge");
    expect(state.mode).toBe("challenge");
    expect(parseCampaign(serializeCampaign(state)).ok).toBe(true);
  });

  it("rejects an invented emergency choice while regular choices were available", () => {
    const state = acknowledgeOutcome(choose(createInitialState("challenge"), "travel-light"));
    state.decisions[0].choiceId = "emergency-relief";
    const result = parseCampaign(envelope(state));
    expect(result).toEqual({ ok: false, error: "Campaign relief decisions are inconsistent with the available choices." });
  });

  it("preserves a naturally reached relief decision at the end of a chapter", () => {
    const path = ["sell-cloth", "leave-animal", "share-medicine", "pay", "keep-cargo", "physician", "challenge-measure", "animals-first", "east-contract", "narin-stays", "household-east", "follow-caravan", "wait-dawn", "descend-together", "camp-outside", "emergency-relief"];
    let state = createInitialState("challenge");
    for (const choiceId of path) {
      state = acknowledgeOutcome(state);
      if (state.status === "chapter-complete") state = continueJourney(state);
      const previousLength = state.decisions.length;
      state = choose(state, choiceId);
      expect(state.decisions.length).toBe(previousLength + 1);
    }
    expect(state.lastOutcome?.choiceId).toBe("emergency-relief");
    expect(state.pendingStatus).toBe("chapter-complete");
    const result = parseCampaign(serializeCampaign(state));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.state).toEqual(state);
    expect(parseCampaign(serializeCampaign(continueToKashgar(acknowledgeOutcome(state)))).ok).toBe(true);
  });

  it("imports an unwrapped current browser save without resetting it", () => {
    const state = choose(createInitialState(), "sell-cloth");
    const result = parseCampaign(JSON.stringify(state));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.migrated).toBe(true);
      expect(result.state).toEqual(state);
    }
  });

  it("rejects invalid JSON, unrelated files and future versions", () => {
    expect(parseCampaign("not json")).toEqual({ ok: false, error: "This file is not valid JSON." });
    expect(parseCampaign(JSON.stringify({ hello: "world" })).ok).toBe(false);
    expect(parseCampaign(envelope(createInitialState(), SAVE_VERSION + 1))).toEqual({ ok: false, error: "This save was created by a newer version of the game." });
  });

  it("rejects damaged history instead of silently starting over", () => {
    const state = createInitialState();
    state.chapter = 5;
    state.decisions.push({ encounterId: "missing", choiceId: "missing", lesson: "A damaged reference." });
    const result = parseCampaign(envelope(state));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("unknown encounter");
  });

  it("never treats missing current fields as permission to default them", () => {
    const state: Record<string, unknown> = { ...createInitialState() };
    delete state.contracts;
    for (const raw of [envelope(state), JSON.stringify(state)]) expect(parseCampaign(raw).ok).toBe(false);
    delete state.mode;
    delete state.cargo;
    delete state.reflections;
    delete state.pendingStatus;
    delete state.lastTravelNote;
    expect(parseCampaign(envelope(state)).ok).toBe(false);
  });

  it("rejects malformed nested imports without throwing or mutating the active campaign", () => {
    const active = choose(createInitialState(), "travel-light");
    const before = structuredClone(active);
    for (const field of ["people", "decisions", "reflections"]) {
      const damaged = { ...active, [field]: [null] };
      expect(() => parseCampaign(envelope(damaged))).not.toThrow();
      expect(parseCampaign(envelope(damaged)).ok).toBe(false);
    }
    expect(active).toEqual(before);
  });

  it("bounds actual UTF-8 bytes and rejects unsupported envelope structure", () => {
    expect(parseCampaign(" ".repeat(MAX_SAVE_BYTES + 1)).ok).toBe(false);
    expect(parseCampaign("é".repeat(MAX_SAVE_BYTES / 2 + 1)).ok).toBe(false);
    for (const extra of [{ version: "3" }, { version: 0 }, { exportedAt: "yesterday" }, { state: null }, { unexpected: true }]) {
      const raw = JSON.stringify({ format: SAVE_FORMAT, version: SAVE_VERSION, exportedAt: "2026-09-07T12:00:00.000Z", state: createInitialState(), ...extra });
      expect(parseCampaign(raw).ok).toBe(false);
    }
    expect(parseCampaign('{"__proto__":{"polluted":true},"people":[],"decisions":[]}').ok).toBe(false);
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
  });

  it.each([[1, 0], [1, 6], [2, 0], [2, 5], [3, 2], [4, 5], [5, 0], [5, 2], [5, 5]] as const)("migrates v2 chapter %i at index %i preserving saved resources and history", (chapter, index) => {
    const old = legacyAt(chapter, index);
    const result = parseCampaign(envelope(old, 2));
    expect(result).toMatchObject({ ok: true, migrated: true });
    if (result.ok) {
      expect(result.state.chapter).toBe(chapter);
      expect(result.state.encounterIndex).toBe(index);
      expect(result.state.resources).toEqual(old.resources);
      expect(result.state.people).toEqual(old.people);
      expect(result.state.decisions).toEqual(old.decisions);
      expect(result.state.reflections).toEqual([]);
      expect(result.state.mode).toBe("story");
      expect(result.warnings.length).toBeGreaterThanOrEqual(3);
      expect(parseCampaign(serializeCampaign(result.state)).ok).toBe(true);
      if (chapter === 5) {
        expect(result.state.legacyRouteSkipped).toBe(true);
        expect(result.state.decisions.some((decision) => decision.encounterId.startsWith("north-") || decision.encounterId.startsWith("south-"))).toBe(false);
      }
      if (chapter > 2) expect(result.state.contracts.vima).toBe("paid");
    }
  });

  it("migrates genuine first-chapter v1 arrival saves and fills old network fields", () => {
    const old = legacyAt(1, 6);
    delete old.chapter;
    delete old.endingId;
    delete old.lastOutcome;
    old.status = "arrived";
    old.people.forEach((person: Record<string, unknown>) => { delete person.location; delete person.traveling; });
    const result = parseCampaign(JSON.stringify(old));
    expect(result).toMatchObject({ ok: true, migrated: true });
    if (result.ok) {
      expect(result.state.status).toBe("chapter-complete");
      expect(result.state.people.every((person) => typeof person.traveling === "boolean" && typeof person.location === "string")).toBe(true);
      expect(result.state.decisions).toHaveLength(6);
    }
  });

  it("preserves a legacy pending outcome instead of silently consuming it", () => {
    const old = legacyAt(1, 1);
    const choice = allEncounters[0].choices.find((item) => item.id === "travel-light")!;
    old.lastOutcome = { encounterId: allEncounters[0].id, choiceId: choice.id, choiceLabel: choice.label, reaction: choice.reaction, lesson: choice.lesson, changes: [{ kind: "resource", label: "Water", delta: 3 }] };
    const result = parseCampaign(envelope(old, 2));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.lastOutcome).toEqual(old.lastOutcome);
      expect(result.state.pendingStatus).toBe("playing");
      expect(acknowledgeOutcome(result.state).lastOutcome).toBeNull();
    }
  });

  it("rejects forged legacy progress and malformed members before migration runs", () => {
    for (const damage of [
      (state: any) => { state.people[0] = null; },
      (state: any) => { state.resources.silver = "12"; },
      (state: any) => { state.decisions[0] = null; },
      (state: any) => { state.chapter = 5; },
      (state: any) => { state.status = "arrived"; },
    ]) {
      const old = legacyAt(1, 1);
      damage(old);
      expect(() => parseCampaign(envelope(old, 2))).not.toThrow();
      expect(parseCampaign(envelope(old, 2)).ok).toBe(false);
    }
  });
});
