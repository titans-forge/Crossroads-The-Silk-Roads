import { useState } from 'react';
import { CheckCircle2, BookOpen } from 'lucide-react';
import { getReflection } from '../data/learning';
import type { JourneyState } from '../types';

export function ReflectionPanel({state,onAnswer,chapter=state.chapter}: {state:JourneyState;onAnswer:(id:string)=>void;chapter?:JourneyState['chapter']}) {
  const question=getReflection(chapter);
  const answer=state.reflections.find(item=>item.chapter===chapter);
  const [selected,setSelected]=useState<string|null>(null);
  if(!question) return null;
  return <section className="reflection" aria-labelledby="reflection-title"><div className="reflection-heading"><BookOpen size={19}/><span>Put the journey to work</span></div><h2 id="reflection-title">{question.prompt}</h2>
    {!answer ? <><fieldset><legend className="sr-only">Choose an explanation</legend>{question.options.map(option=><label key={option.id} className={selected===option.id?'selected':''}><input type="radio" name={`reflection-${state.chapter}`} value={option.id} checked={selected===option.id} onChange={()=>setSelected(option.id)}/><span>{option.text}</span></label>)}</fieldset><button className="primary" disabled={!selected} onClick={()=>selected&&onAnswer(selected)}>Check my reasoning</button><p className="small-note">Your first answer is recorded. Every answer gets an explanation and lets you continue.</p></> : <div className="reflection-answer" role="status"><strong><CheckCircle2 size={18}/>{answer.correct?'You made the connection.':'Here is the connection to take with you.'}</strong><p>{question.explanation}</p><p className="small-note">{question.concept} · {answer.correct?'Demonstrated on this question':'Revisit in your journal'}</p><a href={question.sourceUrl} target="_blank" rel="noreferrer">Explore the supporting source</a></div>}
  </section>;
}
