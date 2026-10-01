import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Compass, RotateCcw } from 'lucide-react';
import type { JourneyState } from '../types';
import { getScore } from '../game/engine';
import { buildEpilogue, reflectionProgress } from '../game/epilogue';
import portraits from '../assets/caravan-portraits.webp';
import { ReflectionPanel } from './ReflectionPanel';
import { HouseholdAccounts } from './HouseholdAccounts';
import './Debrief.css';

const chapterCopy = [
  ['The road becomes a market.', 'Bactra brings the household into a new system of measures, credit, and local relationships. The people and promises you bring through the gate shape what happens next.'],
  ['The mountains set their own terms.', 'Your Bactra accounts and household arrangements travel with you. Beyond the city, guides, carrying capacity, and seasons set the limits of every bargain.'],
  ['An oasis is a community.', 'Kashgar lives where mountain water meets branching roads. You arrive with the animals, cargo, agreements, and people who made this crossing possible.'],
  ['Your choice opens a different road.', 'The northern and southern oases have different trading opportunities and obligations. You will meet that route before the frontier roads reconverge at Dunhuang.'],
];
const endingCopy: Record<string, string> = {
  'arash-east': 'Arash takes the eastern assignment. Samira stays in Bactra, where recovery, correspondence, and accounts become the household\'s work.',
  'bactra-house': 'Samira becomes a local partner in Bactra. The household can now connect travelers whose roads it may never walk.',
  'kashgar-house': 'At Kashgar, Samira opens a relay house linking western merchants with both eastern corridors.',
  'eastern-handoff': 'Samira hands the cargo to an eastern carrier and begins the return road. The goods continue through another household\'s knowledge and relationships.',
  'frontier-office': 'Samira establishes a frontier office, connecting western contacts with eastern carriers. The household\'s accounts and obligations remain hers to manage.',
  'return-household': 'The household sells locally and turns west. Its lasting achievement is a chain of people and places to return to.',
  'emergency-relief': 'The household accepts local work and a modest settlement. Preserving people leaves room for another journey.',
};

export function Debrief({ state, onAnswer, onContinue, onRestart, onJournal }: {
  state: JourneyState; onAnswer: (id: string) => void; onContinue: () => void; onRestart: () => void; onJournal: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const [reviewChapter, setReviewChapter] = useState(state.chapter);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); setReviewChapter(state.chapter); }, [state.chapter, state.status]);
  const complete = state.status === 'chapter-complete';
  const failed = state.status === 'failed';
  const score = getScore(state);
  const learning = reflectionProgress(state);
  const epilogue = buildEpilogue(state);
  const lastChanges = state.decisions.at(-1)?.changes;
  const emptyHandoff = ['eastern-handoff', 'return-household'].includes(state.endingId ?? '')
    && lastChanges !== undefined && !lastChanges.some(change => change.kind === 'cargo' && (change.delta ?? 0) < 0);
  const [title, copy] = complete ? chapterCopy[state.chapter - 1] ?? chapterCopy[3]
    : failed ? ['The household needs a safe harbor.', 'The caravan can no longer sustain this route. Your journal keeps the choices that led here; a new journey can test a different balance.']
      : emptyHandoff ? ['The household turns west.', 'The last merchandise changed hands earlier. Samira records no new sale at this final stop and begins the return with the household\'s remaining resources and obligations.']
      : [epilogue.title, endingCopy[state.endingId ?? ''] ?? 'This chapter of the household\'s road has ended. Its relationships and responsibilities extend beyond the final market.'];
  const nextLabels = ['Enter Bactra', 'Join the mountain caravan', 'Enter Kashgar', 'Take the eastern route'];
  return <main className="debrief">
    <section className="debrief-story">
      <span className="chapter-label">{failed ? 'A journey interrupted' : complete ? `Chapter ${state.chapter} complete` : 'Journey complete'}</span>
      <h1 id="debrief-title" ref={heading} tabIndex={-1}>{title}</h1>
      <p className="debrief-lead">{copy}</p>
      <div className="score-row">
        <div><strong>{score.people}</strong><span>People</span></div>
        <div><strong>{score.livelihood}</strong><span>Livelihood</span></div>
        <div><strong>{learning.attempted ? `${learning.correct}/${learning.attempted}` : 'Optional'}</strong><span>{learning.attempted ? 'Reflections correct / attempted' : 'Reflections not attempted'}</span></div>
      </div>
      <p className="small-note">{learning.skipped} available reflections not explored. {learning.unreached} not yet reached. Reflections do not change your household scores.</p>
      <div className="personal-debrief"><h2>What your choices left behind</h2><ul>
        <li>{state.resources.silver < 0 ? `The household owes ${-state.resources.silver} drachms. Credit kept it moving, but the account remains open.` : `The household has ${state.resources.silver} drachms in hand and ${state.resources.camels} camels.`}</li>
        <li>{state.contracts.vima === 'paid' ? 'Vima\'s inherited account is settled. His old claim will not return.' : state.contracts.vima === 'contract' ? 'Vima\'s eastern contract remains an obligation tied to your cargo.' : state.contracts.vima === 'disputed' ? 'You contested Vima\'s account. Copies and witnesses are now part of the household\'s protection.' : 'Samira\'s inherited account still awaits settlement in Bactra.'}</li>
        <li>{state.people.every(person => person.traveling) ? 'All four travelers remain together.' : state.people.filter(person => !person.traveling).map(person => `${person.name} represents part of the household in ${person.location}`).join('. ') + '.'}</li>
      </ul></div>
      <HouseholdAccounts state={state} scores/>
      <div className="action-row">
        {complete ? <button className="primary" onClick={onContinue}>{nextLabels[state.chapter - 1]}<ArrowRight size={18}/></button> : <button className="primary" onClick={onRestart}><RotateCcw size={17}/> Begin another journey</button>}
        <button className="secondary" onClick={onJournal}><Compass size={17}/> Review the whole journey</button>
      </div>
      <p className="small-note">{state.decisions.length} decisions recorded · approximate journey day {state.day}. Learning checks are optional and never prevent continuation.</p>
      {!complete && <section className="epilogue" aria-label="Your household's story">
        <h2>The decisions that shaped your road</h2>
        <ol className="epilogue-events">{epilogue.highlights.map(event => <li key={event.id}>
          <small>{event.location}{event.day !== undefined ? ` · Day ${event.day}` : ''}</small>
          <h3>{event.title}</h3><p>{event.text}</p>
        </li>)}</ol>
        <h2>Where your people go next</h2>
        <div className="epilogue-people">{epilogue.people.map(person => <article key={person.id}>
          <div className="epilogue-portrait" aria-hidden="true" style={{ backgroundImage: `url(${portraits})`, backgroundPosition: person.portraitPosition }}/>
          <div><h3>{person.name}</h3><strong>{person.destination}</strong><p>{person.reason}</p><small>Health {person.health} / 100 · Trust {person.trust} / 100</small></div>
        </article>)}</div>
      </section>}
      {state.lastTravelNote && <details className="travel-details"><summary>Journey timing and reconstruction</summary><p>{state.lastTravelNote}</p></details>}
    </section>
    {!failed && <aside className="reflection-review" aria-label="Optional reflections">
      <label className="reflection-picker">Reflect on a chapter<select value={reviewChapter} onChange={event => setReviewChapter(Number(event.target.value) as JourneyState['chapter'])}>
        {learning.chapters.map(question => <option key={question.chapter} value={question.chapter}>Chapter {question.chapter}: {state.reflections.some(answer => answer.chapter === question.chapter) ? 'Answered' : 'Not explored'}</option>)}
      </select></label>
      <ReflectionPanel key={reviewChapter} chapter={reviewChapter} state={state} onAnswer={onAnswer}/>
    </aside>}
  </main>;
}
