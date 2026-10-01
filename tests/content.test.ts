import { describe, expect, it } from "vitest";
import { allEncounters, people } from "../src/data/journey";
import { getReflection, glossary, reflections, sourceFraming } from "../src/data/learning";
import { northRouteEncounters, routePlaces, southRouteEncounters } from "../src/data/routes";
import { validateContent } from "../src/game/validation";
import type { Encounter } from "../src/types";

const routeVariants = [...northRouteEncounters, ...southRouteEncounters];
const publishedEncounters = [...allEncounters, ...routeVariants];

describe("historical content", () => {
  it("preserves the base campaign and validates every base encounter", () => {
    expect(validateContent(allEncounters, people)).toEqual([]);
    expect([1, 2, 3, 4, 5].map((chapter) => allEncounters.filter((encounter) => encounter.chapter === chapter).length)).toEqual([6, 5, 5, 5, 5]);
  });

  it("provides distinct complete route branches without collisions with saved base choices", () => {
    for (const [prefix, route] of [["north-", northRouteEncounters], ["south-", southRouteEncounters]] as const) {
      expect(route).toHaveLength(2);
      for (const encounter of route) {
        expect(encounter.chapter).toBe(5);
        expect(encounter.id.startsWith(prefix)).toBe(true);
        expect(encounter.choices).toHaveLength(3);
        expect(people.some((person) => person.id === encounter.speaker)).toBe(true);
        expect(encounter.text.trim().length).toBeGreaterThan(40);
        for (const choice of encounter.choices) {
          expect(choice.id.startsWith(prefix)).toBe(true);
          expect(choice.lesson.trim().length).toBeGreaterThan(40);
          expect(choice.reaction.trim().length).toBeGreaterThan(30);
          expect(Number.isInteger(choice.duration) && (choice.duration ?? 0) > 0).toBe(true);
        }
      }
    }
    const encounterIds = publishedEncounters.map((encounter) => encounter.id);
    const choiceIds = publishedEncounters.flatMap((encounter) => encounter.choices.map((choice) => choice.id));
    expect(new Set(encounterIds).size).toBe(encounterIds.length);
    expect(new Set(choiceIds).size).toBe(choiceIds.length);
    expect(allEncounters.length + northRouteEncounters.length).toBe(28);
    expect(allEncounters.length + southRouteEncounters.length).toBe(28);
  });

  it("gives every published scene a readable source note and an HTTPS source", () => {
    for (const encounter of publishedEncounters) {
      expect(encounter.sourceNote.trim().length, encounter.id).toBeGreaterThan(40);
      expect(encounter.sourceLabel?.trim().length, encounter.id).toBeGreaterThan(5);
      const url = new URL(encounter.sourceUrl ?? "");
      expect(url.protocol, encounter.id).toBe("https:");
      expect(url.username, encounter.id).toBe("");
      expect(url.password, encounter.id).toBe("");
    }
  });

  it("rejects duplicate identifiers and unresolved content", () => {
    const duplicate = structuredClone(allEncounters[0]) as Encounter;
    duplicate.sourceNote = "";
    duplicate.choices[0].id = allEncounters[1].choices[0].id;
    const errors = validateContent([...allEncounters, duplicate], people);
    expect(errors).toEqual(expect.arrayContaining([
      expect.stringContaining("Duplicate encounter id"),
      expect.stringContaining("Duplicate choice id"),
      expect.stringContaining("source note"),
    ]));
  });
});

describe("learning content", () => {
  it("has one unambiguous application question per chapter with globally unique answer IDs", () => {
    expect(reflections.map((question) => question.chapter)).toEqual([1, 2, 3, 4, 5]);
    const answerIds = reflections.flatMap((question) => question.options.map((option) => option.id));
    expect(new Set(answerIds).size).toBe(answerIds.length);
    for (const question of reflections) {
      expect(getReflection(question.chapter)).toBe(question);
      expect(question.options).toHaveLength(3);
      expect(question.options.filter((option) => option.id === question.correctId)).toHaveLength(1);
      expect(new Set(question.options.map((option) => option.text)).size).toBe(3);
      expect(question.explanation.length).toBeGreaterThan(80);
      expect(new URL(question.sourceUrl).protocol).toBe("https:");
    }
    expect(getReflection(0)).toBeUndefined();
    expect(getReflection(6)).toBeUndefined();
  });

  it("makes the glossary and geographic branches usable without a remote map", () => {
    expect(new Set(glossary.map((entry) => entry.term)).size).toBe(glossary.length);
    expect(glossary.every((entry) => entry.definition.trim().length > 20)).toBe(true);
    expect(sourceFraming).toContain("fictional");
    const requiredPlaces = ["merv", "bactra", "wakhan", "kashgar", "kucha", "turfan", "yarkand", "khotan", "dunhuang"];
    expect(routePlaces.map((place) => place.id)).toEqual(requiredPlaces);
    for (const place of routePlaces) {
      expect(Number.isFinite(place.lon) && place.lon >= 60 && place.lon <= 100).toBe(true);
      expect(Number.isFinite(place.lat) && place.lat >= 34 && place.lat <= 45).toBe(true);
      expect(place.description.trim().length).toBeGreaterThan(30);
    }
    const byId = Object.fromEntries(routePlaces.map((place) => [place.id, place]));
    expect(byId.kucha.lat).toBeGreaterThan(byId.khotan.lat);
    expect(byId.turfan.lat).toBeGreaterThan(byId.yarkand.lat);
    expect(byId.merv.lon).toBeLessThan(byId.dunhuang.lon);
  });
});
