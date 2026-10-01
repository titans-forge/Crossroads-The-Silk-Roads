import { describe, expect, it } from "vitest";
import { acknowledgeOutcome, choose, continueToBactra, continueToDunhuang, continueToKashgar, continueToPamirs, createInitialState, getCapacity, getCargoLoad, getChoicePreview, getEncounter } from "../src/game/engine";
import type { GameMode, JourneyState } from "../src/types";

function nextChapter(state: JourneyState) {
  return state.chapter === 1 ? continueToBactra(state) : state.chapter === 2 ? continueToPamirs(state) : state.chapter === 3 ? continueToKashgar(state) : continueToDunhuang(state);
}

describe("campaign balance invariants", () => {
  it.each<GameMode>(["story", "challenge"])("keeps %s campaigns progressing with honest resources", (mode) => {
    const endings = new Set<string>(); const visited = new Set<string>();
    for (let seed = 1; seed <= 300; seed++) {
      let random = seed; let state = createInitialState(mode);
      for (let turn = 0; turn < 40 && ["playing", "chapter-complete"].includes(state.status); turn++) {
        if (state.status === "chapter-complete") { state = nextChapter(state); continue; }
        const encounter = getEncounter(state)!; visited.add(encounter.id);
        let allowed = encounter.choices.filter((choice) => getChoicePreview(state, choice).allowed);
        expect(allowed.length).toBeGreaterThan(0);
        // Half the samples seek the entire route when their resources allow it.
        if (seed % 2 === 0 && encounter.id === "eastbound-handoff") allowed = allowed.some((choice) => choice.id === "household-east") ? allowed.filter((choice) => choice.id === "household-east") : allowed;
        if (seed % 2 === 0 && encounter.id === "tarim-fork") allowed = allowed.some((choice) => choice.id === "north-road" || choice.id === "south-road") ? allowed.filter((choice) => choice.id === "north-road" || choice.id === "south-road") : allowed;
        random = (random * 1664525 + 1013904223) >>> 0;
        const old = state;
        state = acknowledgeOutcome(choose(state, allowed[random % allowed.length].id));
        expect(state.decisions.length).toBe(old.decisions.length + 1);
        expect(state.day).toBeGreaterThanOrEqual(old.day);
        expect(Object.values(state.cargo).every((quantity) => Number.isInteger(quantity) && quantity >= 0)).toBe(true);
        expect(getCargoLoad(state)).toBeLessThanOrEqual(getCapacity(state));
        expect(state.resources.food).toBeGreaterThan(0);
        expect(state.resources.water).toBeGreaterThan(0);
        if (mode === "challenge") expect(state.resources.silver).toBeGreaterThanOrEqual(-40);
      }
      expect(["campaign-complete", "failed"]).toContain(state.status);
      if (state.endingId) endings.add(state.endingId);
    }
    expect(endings.size).toBeGreaterThanOrEqual(4);
    expect(visited.has("north-kucha-accounts")).toBe(true);
    expect(visited.has("south-yarkand-carriers")).toBe(true);
  });
});
