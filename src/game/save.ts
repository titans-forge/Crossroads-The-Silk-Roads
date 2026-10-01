import { allEncounters } from "../data/journey";
import { northRouteEncounters, southRouteEncounters } from "../data/routes";
import type { JourneyState } from "../types";
import { acknowledgeOutcome, choose, continueToBactra, continueToDunhuang, continueToKashgar, continueToPamirs, createInitialState, replayLegacyChoice } from "./engine";
import { MAX_SAVE_BYTES, validateJourneyState } from "./validation";

export const SAVE_FORMAT = "titans-forge-crossroads-silk-roads";
export const SAVE_VERSION = 4;
const saveEncounters = [...allEncounters, ...northRouteEncounters, ...southRouteEncounters];

interface SaveEnvelope {
  format: typeof SAVE_FORMAT;
  version: number;
  exportedAt: string;
  state: JourneyState;
}

export type CampaignImportResult =
  | { ok: true; state: JourneyState; migrated: boolean; warnings: string[] }
  | { ok: false; error: string };

export function serializeCampaign(state: JourneyState): string {
  const errors = validateJourneyState(state, saveEncounters);
  if (errors.length) throw new Error(`Cannot export this campaign: ${errors[0]}`);
  const envelope: SaveEnvelope = { format: SAVE_FORMAT, version: SAVE_VERSION, exportedAt: new Date().toISOString(), state: { ...state, rulesVersion: state.rulesVersion ?? 1 } };
  return JSON.stringify(envelope, null, 2);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

function advance(state: JourneyState, chapter: number): JourneyState {
  let next = acknowledgeOutcome(state);
  while (next.chapter < chapter) {
    const previousChapter = next.chapter;
    next = previousChapter === 1 ? continueToBactra(next)
      : previousChapter === 2 ? continueToPamirs(next)
        : previousChapter === 3 ? continueToKashgar(next) : continueToDunhuang(next);
    if (next.chapter === previousChapter) throw new Error("Legacy campaign cannot advance from its recorded choices.");
  }
  return next;
}

function validEmergencyHistory(state: JourneyState): boolean {
  if (!state.decisions.some((decision) => decision.choiceId === "emergency-relief")) return true;
  let replay: JourneyState = { ...createInitialState("challenge"), rulesVersion: state.rulesVersion ?? 1 };
  for (const decision of state.decisions) {
    const encounter = saveEncounters.find((item) => item.id === decision.encounterId)!;
    replay = advance(replay, encounter.chapter);
    const next = choose(replay, decision.choiceId);
    if (next.decisions.length !== replay.decisions.length + 1) return false;
    replay = acknowledgeOutcome(next);
  }
  return true;
}

/** Called only after structural and chronological validation of the old format. */
function migrateLegacy(candidate: Record<string, unknown>): JourneyState {
  const legacy = candidate as unknown as JourneyState;
  let replay: JourneyState = { ...createInitialState("story"), rulesVersion: 1 as const };
  if (legacy.chapter === 5) replay = { ...replay, legacyRouteSkipped: true };
  for (const decision of legacy.decisions) {
    const encounter = allEncounters.find((item) => item.id === decision.encounterId)!;
    replay = advance(replay, encounter.chapter);
    const next = replayLegacyChoice(replay, decision.choiceId);
    if (next.decisions.length !== replay.decisions.length + 1) throw new Error("Legacy campaign contains a decision that could not be reconstructed.");
    replay = acknowledgeOutcome(next);
  }
  replay = advance(replay, legacy.chapter);
  const pending = legacy.lastOutcome ?? null;
  return {
    ...replay,
    // Preserve the historical ledger and validated saved values. New cargo/contracts
    // are reconstructed by the same choice rules the current game uses.
    people: legacy.people.map((person) => ({
      ...person,
      location: person.location ?? replay.people.find((member) => member.id === person.id)!.location,
      traveling: person.traveling ?? replay.people.find((member) => member.id === person.id)!.traveling,
    })),
    resources: { ...legacy.resources },
    standing: legacy.standing,
    knowledge: legacy.knowledge,
    decisions: legacy.decisions.map((decision) => ({ ...decision })),
    status: pending ? "playing" : legacy.status,
    pendingStatus: pending ? legacy.status : null,
    lastOutcome: pending,
    lastReaction: legacy.lastReaction,
    endingId: legacy.endingId,
    reflections: [],
    lastTravelNote: legacy.chapter === 5
      ? "Imported journey: the new regional route scenes were not part of this original campaign. Your recorded frontier progress is preserved."
      : "Imported journey: elapsed travel time and cargo were reconstructed from your recorded choices under the revised rules.",
  };
}

export function parseCampaign(raw: string): CampaignImportResult {
  try {
    if (typeof raw !== "string" || raw.length > MAX_SAVE_BYTES || new TextEncoder().encode(raw).length > MAX_SAVE_BYTES) {
      return { ok: false, error: "This campaign file is too large. The limit is 1 MiB." };
    }
    let parsed: unknown;
    try { parsed = JSON.parse(raw); }
    catch { return { ok: false, error: "This file is not valid JSON." }; }

    let candidate = parsed;
    let version: number | undefined;
    if (isRecord(parsed) && "format" in parsed) {
      if (parsed.format !== SAVE_FORMAT) return { ok: false, error: "This save belongs to a different game." };
      if (typeof parsed.version !== "number" || !Number.isInteger(parsed.version) || parsed.version < 1) return { ok: false, error: "This save has no supported version." };
      if (parsed.version > SAVE_VERSION) return { ok: false, error: "This save was created by a newer version of the game." };
      if (Object.keys(parsed).some((key) => !["format", "version", "exportedAt", "state"].includes(key))) return { ok: false, error: "This save contains unsupported envelope fields." };
      if (typeof parsed.exportedAt !== "string" || parsed.exportedAt.length > 40 || !/^\d{4}-\d\d-\d\dT/.test(parsed.exportedAt) || !Number.isFinite(Date.parse(parsed.exportedAt))) return { ok: false, error: "This save has an invalid export date." };
      candidate = parsed.state;
      version = parsed.version;
    }
    if (!isRecord(candidate) || !Array.isArray(candidate.people) || !Array.isArray(candidate.decisions)) {
      return { ok: false, error: "This file does not contain a recognizable Silk Roads campaign." };
    }

    const hasCurrentFields = ["mode", "cargo", "contracts", "reflections", "pendingStatus", "lastTravelNote"].some((key) => key in candidate);
    if (version === SAVE_VERSION || hasCurrentFields) {
      const errors = validateJourneyState(candidate, saveEncounters);
      if (errors.length) return { ok: false, error: errors[0] };
      const state = { ...candidate, rulesVersion: candidate.rulesVersion ?? 1 } as unknown as JourneyState;
      if (version === SAVE_VERSION && candidate.rulesVersion === undefined) return { ok: false, error: "This campaign has no gameplay rules version." };
      if (!validEmergencyHistory(state)) return { ok: false, error: "Campaign relief decisions are inconsistent with the available choices." };
      return { ok: true, state, migrated: version !== SAVE_VERSION, warnings: version !== SAVE_VERSION ? ["Your existing campaign keeps its original gameplay rules and all recorded choices. Start a new journey to use the revised strategy rules."] : [] };
    }

    // Version 1 had one chapter, an "arrived" status, and no outcome/network fields.
    const legacy = {
      ...candidate,
      chapter: candidate.chapter === undefined ? 1 : candidate.chapter,
      status: candidate.status === "arrived" ? "chapter-complete" : candidate.status,
      endingId: candidate.endingId === undefined ? null : candidate.endingId,
      lastReaction: candidate.lastReaction === undefined ? null : candidate.lastReaction,
      lastOutcome: candidate.lastOutcome === undefined ? null : candidate.lastOutcome,
    };
    const errors = validateJourneyState(legacy, allEncounters, { legacy: true });
    if (errors.length) return { ok: false, error: errors[0] };
    const state = migrateLegacy(legacy);
    const migratedErrors = validateJourneyState(state, saveEncounters);
    if (migratedErrors.length) return { ok: false, error: `This older campaign could not be safely upgraded: ${migratedErrors[0]}` };
    const warnings = [
      "Older campaign upgraded to Story mode. Your recorded decisions, resources, health, trust, and standing were preserved.",
      "Cargo, obligations, and elapsed travel time were reconstructed from your choices using the revised rules. Historical choices remain as originally recorded.",
      "Concept checks are new, so no demonstrated concepts have been credited automatically.",
    ];
    if (state.legacyRouteSkipped) warnings.push("This journey had already entered the frontier: the new regional route scenes were left unplayed so your original progress stays intact.");
    return { ok: true, state, migrated: true, warnings };
  } catch {
    return { ok: false, error: "This campaign could not be safely imported. Your current journey has not been changed." };
  }
}
