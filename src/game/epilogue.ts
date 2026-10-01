import { reflections } from '../data/learning';
import type { JourneyState } from '../types';

export function reflectionProgress(state: JourneyState) {
  const completed = state.status === 'chapter-complete' || state.status === 'campaign-complete';
  const available = state.chapter - (completed && !state.lastOutcome ? 0 : 1);
  const attempted = state.reflections.length;
  return {
    correct: state.reflections.filter(answer => answer.correct).length,
    attempted,
    skipped: Math.max(0, available - attempted),
    unreached: reflections.length - available,
    chapters: reflections.filter(question => question.chapter <= available),
  };
}

const endingTitles: Record<string, string> = {
  'arash-east': 'Arash takes the next road.',
  'bactra-house': 'A home at the crossroads.',
  'kashgar-house': 'Two roads, one household.',
  'eastern-handoff': 'The goods go farther than their owners.',
  'frontier-office': 'A western door in Dunhuang.',
  'return-household': 'The road home has familiar faces.',
  'emergency-relief': 'A place to begin again.',
};

// Select from recorded events rather than inventing outcomes for unseen choices.
export function buildEpilogue(state: JourneyState) {
  const turningPoints = state.decisions.filter(decision =>
    decision.changes?.some(change => change.kind === 'network' || change.kind === 'contract')
  );
  const highlights = turningPoints.length > 3
    ? [turningPoints[0], turningPoints[Math.floor(turningPoints.length / 2)], turningPoints[turningPoints.length - 1]]
    : turningPoints;
  const selected = highlights.length ? highlights : state.decisions.slice(-3);
  return {
    title: endingTitles[state.endingId ?? ''] ?? 'A network begins with a household.',
    highlights: selected.map(decision => ({
      id: decision.encounterId,
      title: decision.choiceLabel ?? decision.choiceId,
      location: decision.location ?? 'On the road',
      day: decision.day,
      text: decision.reaction ?? decision.lesson,
    })),
    people: state.people.map(person => ({
      ...person,
      destination: !person.traveling ? person.location : state.endingId === 'arash-east' && person.id === 'arash'
        ? 'Eastbound caravan' : ['return-household', 'eastern-handoff'].includes(state.endingId ?? '')
          ? 'Beginning the return west' : person.location,
    })),
  };
}
