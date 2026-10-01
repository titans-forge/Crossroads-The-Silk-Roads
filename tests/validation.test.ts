import { describe, expect, it } from "vitest";
import { allEncounters } from "../src/data/journey";
import { northRouteEncounters, southRouteEncounters } from "../src/data/routes";
import { acknowledgeOutcome, choose, createInitialState } from "../src/game/engine";
import { validateJourneyState } from "../src/game/validation";

const content = [...allEncounters, ...northRouteEncounters, ...southRouteEncounters];
const valid = () => structuredClone(createInitialState()) as unknown as Record<string, any>;
const errors = (state: unknown) => validateJourneyState(state, content);

describe("untrusted campaign state validation", () => {
  it("accepts initial state and both sides of a decision acknowledgement", () => {
    const initial = createInitialState();
    const decided = choose(initial, "travel-light");
    expect(errors(initial)).toEqual([]);
    expect(errors(decided)).toEqual([]);
    expect(errors(acknowledgeOutcome(decided))).toEqual([]);
  });

  it.each([null, false, 1, "state", [], { people: [null], decisions: [null] }])("never throws on malformed top-level or nested input %#", (state) => {
    expect(() => errors(state)).not.toThrow();
    expect(errors(state).length).toBeGreaterThan(0);
  });

  it.each([
    ["null household member", (state: any) => { state.people[0] = null; }],
    ["duplicate member", (state: any) => { state.people[1] = state.people[0]; }],
    ["missing member name", (state: any) => { delete state.people[0].name; }],
    ["invalid travel boolean", (state: any) => { state.people[0].traveling = "false"; }],
    ["invalid portrait CSS", (state: any) => { state.people[0].portraitPosition = "url(https://example.test)"; }],
    ["negative health", (state: any) => { state.people[0].health = -1; }],
    ["out-of-range trust", (state: any) => { state.people[0].trust = 101; }],
    ["null resources", (state: any) => { state.resources = null; }],
    ["numeric string", (state: any) => { state.resources.water = "31"; }],
    ["negative provisions", (state: any) => { state.resources.food = -1; }],
    ["missing cargo", (state: any) => { delete state.cargo.glass; }],
    ["negative cargo", (state: any) => { state.cargo.wool = -1; }],
    ["invalid cargo good", (state: any) => { state.cargo.uranium = 1; }],
    ["null contracts", (state: any) => { state.contracts = null; }],
    ["unknown debt status", (state: any) => { state.contracts.vima = "forgiven"; }],
    ["invalid contract boolean", (state: any) => { state.contracts.villageFavor = "yes"; }],
    ["unknown mode", (state: any) => { state.mode = "god"; }],
    ["out-of-range day", (state: any) => { state.day = 1e100; }],
    ["fractional index", (state: any) => { state.encounterIndex = 1.5; }],
    ["advanced chapter without history", (state: any) => { state.chapter = 4; }],
    ["false completion", (state: any) => { state.status = "campaign-complete"; }],
    ["invented ending", (state: any) => { state.endingId = "eastern-handoff"; }],
    ["unplayed route", (state: any) => { state.contracts.route = "north"; }],
    ["legacy marker before frontier", (state: any) => { state.legacyRouteSkipped = true; }],
    ["pending status without outcome", (state: any) => { state.pendingStatus = "playing"; }],
    ["missing current field", (state: any) => { delete state.reflections; }],
    ["oversized string", (state: any) => { state.people[0].reason = "a".repeat(2001); }],
    ["unexpected nested property", (state: any) => { state.resources.constructor = {}; }],
  ])("rejects %s", (_label, damage) => {
    const state = valid();
    damage(state);
    expect(errors(state).length).toBeGreaterThan(0);
  });

  it("rejects every non-finite numeric value without coercion", () => {
    for (const number of [NaN, Infinity, -Infinity]) {
      const state = valid();
      state.resources.silver = number;
      expect(errors(state).length).toBeGreaterThan(0);
    }
  });

  it("accepts explicit debt while rejecting fractional or unbounded debt", () => {
    const state = valid();
    state.resources.silver = -120;
    expect(errors(state)).toEqual([]);
    state.resources.silver = -0.5;
    expect(errors(state).length).toBeGreaterThan(0);
  });

  it("checks the nested outcome against its latest decision", () => {
    const decided = choose(createInitialState(), "travel-light");
    for (const change of [
      { changes: [null] },
      { changes: [{ kind: "script", label: "Invalid", delta: 1 }] },
      { changes: [{ kind: "time", label: "Invalid", delta: "2" }] },
      { encounterId: "broken-camel" },
      { choiceId: "sell-cloth" },
      { lesson: "A different lesson." },
    ]) {
      expect(errors({ ...decided, lastOutcome: { ...decided.lastOutcome, ...change } }).length).toBeGreaterThan(0);
    }
    expect(errors({ ...decided, lastOutcome: null }).length).toBeGreaterThan(0);
  });

  it("checks history order, references, source URLs, and nested record shape", () => {
    const decided = choose(createInitialState(), "travel-light");
    for (const history of [
      [null],
      [{ ...decided.decisions[0], encounterId: "broken-camel", choiceId: "redistribute" }],
      [{ ...decided.decisions[0], choiceId: "redistribute" }],
      [{ ...decided.decisions[0], sourceUrl: "javascript:alert(1)" }],
      [{ ...decided.decisions[0], sourceUrl: "https://unknown.example/" }],
      [{ ...decided.decisions[0], changes: [null] }],
      Array.from({ length: 29 }, () => decided.decisions[0]),
    ]) expect(errors({ ...decided, decisions: history }).length).toBeGreaterThan(0);
  });

  it("does not grant a concept check before completing its chapter", () => {
    const state = valid();
    state.reflections = [{ chapter: 1, answerId: "gate-introduction", correct: true }];
    expect(errors(state)).toContain("Campaign reflection precedes its completed chapter.");
    state.reflections = [null];
    expect(() => errors(state)).not.toThrow();
    expect(errors(state).length).toBeGreaterThan(0);
  });

  it("fails safely on hostile non-JSON objects and never modifies input", () => {
    const state = valid();
    const before = structuredClone(state);
    expect(errors(state)).toEqual([]);
    expect(state).toEqual(before);
    const hostile = { get chapter() { throw new Error("getter"); } };
    expect(errors(hostile)).toEqual(["Campaign state could not be safely read."]);
  });
});
