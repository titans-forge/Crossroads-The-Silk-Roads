import type { JourneyState } from '../types';
import { getChapterEncounters } from '../game/engine';
export const chapterNames = ['The road to Bactra', 'The Bactra exchange', 'Across the Pamirs', 'Where roads divide', 'The eastern relay'];
export function RouteStrip({state}: {state:JourneyState}) {
  const total = getChapterEncounters(state.chapter,state.contracts.route,state.legacyRouteSkipped).length;
  const step = Math.min(total, Math.max(1,state.encounterIndex + (state.lastOutcome ? 0 : 1)));
  return <div className="route-strip" aria-label={`Chapter ${state.chapter} of 5, encounter ${step} of ${total}`}><div><span>Chapter {String(state.chapter).padStart(2,'0')} / 05</span><strong>{chapterNames[state.chapter-1]}</strong></div><div className="route-progress" aria-hidden="true">{Array.from({length:total},(_,i)=><i key={i} className={i<step?'passed':''} />)}</div><small>{step} of {total} encounters</small></div>;
}
