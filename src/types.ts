export type ResourceKey = "water" | "food" | "silver" | "camels" | "medicine";
export type PersonId = "samira" | "vardan" | "arash" | "narin";
export type GameMode = "story" | "challenge";
export type CargoGood = "glass" | "wool" | "herbs" | "silk" | "jade";
export type Chapter = 1 | 2 | 3 | 4 | 5;
export type JourneyStatus = "playing" | "chapter-complete" | "campaign-complete" | "failed";

export interface Contracts {
  vima: "unsettled" | "paid" | "contract" | "disputed";
  villageFavor: boolean;
  guide: "none" | "dara" | "roshna" | "caravan";
  hospitality: boolean;
  route: "undecided" | "north" | "south";
  manuscript: boolean;
}

export interface Person {
  id: PersonId;
  name: string;
  role: string;
  reason: string;
  health: number;
  trust: number;
  portraitPosition: string;
  location: string;
  traveling: boolean;
}

export interface Effects {
  resources?: Partial<Record<ResourceKey, number>>;
  health?: Partial<Record<PersonId, number>>;
  trust?: Partial<Record<PersonId, number>>;
  standing?: number;
  knowledge?: number;
  cargo?: Partial<Record<CargoGood, number>>;
  contracts?: Partial<Contracts>;
  duration?: number;
  personUpdates?: Partial<Record<PersonId, Partial<Pick<Person, "role" | "reason" | "location" | "traveling">>>>;
}

export interface Choice {
  id: string;
  label: string;
  detail: string;
  reaction: string;
  effects: Effects;
  lesson: string;
  disabledReason?: string;
  duration?: number;
}

export interface Encounter {
  id: string;
  chapter: 1 | 2 | 3 | 4 | 5;
  day: number;
  location: string;
  title: string;
  text: string;
  speaker: PersonId;
  sourceNote: string;
  sourceUrl?: string;
  sourceLabel?: string;
  choices: Choice[];
}

export interface OutcomeChange {
  kind: "resource" | "health" | "trust" | "standing" | "network" | "cargo" | "time" | "contract";
  label: string;
  delta?: number;
  detail?: string;
}

export interface OutcomeRecord {
  encounterId: string;
  choiceId: string;
  choiceLabel: string;
  reaction: string;
  lesson: string;
  changes: OutcomeChange[];
}

export interface JourneyState {
  /** Omitted or 1 preserves the installed v0.2 campaign rules. */
  rulesVersion?: 1 | 2 | 3;
  chapter: 1 | 2 | 3 | 4 | 5;
  encounterIndex: number;
  day: number;
  people: Person[];
  resources: Record<ResourceKey, number>;
  standing: number;
  knowledge: number;
  decisions: { encounterId: string; choiceId: string; lesson: string; choiceLabel?: string; reaction?: string; changes?: OutcomeChange[]; day?: number; title?: string; location?: string; sourceUrl?: string }[];
  status: JourneyStatus;
  lastReaction: string | null;
  lastOutcome: OutcomeRecord | null;
  endingId: string | null;
  mode: GameMode;
  cargo: Record<CargoGood, number>;
  contracts: Contracts;
  reflections: Array<{ chapter: Chapter; answerId: string; correct: boolean }>;
  pendingStatus: JourneyStatus | null;
  lastTravelNote: string | null;
  /** Only migrated journeys already beyond Kashgar omit the newly added route encounters. */
  legacyRouteSkipped?: boolean;
}
