import { useEffect, useRef } from 'react';
import { BookOpen, Clock3 } from 'lucide-react';
import { RouteBriefing } from './RouteBriefing';
import { MarketComparison } from './MarketComparison';
import { getChoicePreview, journeyContinuation } from '../game/engine';
import type { Encounter, JourneyState } from '../types';
function displayCosts(costs:string[],all:boolean):string[]{
 const values=costs.map(cost=>cost.startsWith('Travel montage:')?`${cost.match(/\d+/)?.[0]} days of arranged travel included`:cost);
 if(all)return values;
 const people=values.filter(cost=>/^(Samira|Vardan|Arash|Narin) (health|trust) /.test(cost));
 const names=[...new Set(people.map(cost=>cost.split(' ')[0]))];
 const summaries=names.map(name=>`${name}: ${people.filter(cost=>cost.startsWith(name+' ')).map(cost=>{const parts=cost.split(' ');return `${parts[1]} ${parts[2].startsWith('-')?'↓':'↑'}`;}).join(', ')}`);
 return [...values.filter(cost=>!people.includes(cost)),...summaries];
}
export function DecisionPanel({encounter,state,onChoose,onContext,disabled=false,shortcuts=true,allEffects=false,onToggleEffects}: {encounter:Encounter;state:JourneyState;onChoose:(id:string)=>void;onContext:()=>void;disabled?:boolean;shortcuts?:boolean;allEffects?:boolean;onToggleEffects:()=>void}) {
 const heading=useRef<HTMLHeadingElement>(null);
 const options=encounter.choices.map(choice=>({choice,preview:getChoicePreview(state,choice)}));
 const travelNotes=[...new Set(options.flatMap(({preview})=>preview.costs.filter(cost=>cost.startsWith('Travel montage:'))))];
 useEffect(()=>{heading.current?.focus({preventScroll:true});},[encounter.id]);
 useEffect(()=>{
  const handle=(event:KeyboardEvent)=>{
   if(disabled||!shortcuts||event.repeat||event.metaKey||event.ctrlKey||event.altKey||event.shiftKey||event.isComposing)return;
   const target=event.target as HTMLElement|null;
   if(!target?.closest('.decision-panel')||target.closest('input,textarea,select,[contenteditable="true"],dialog'))return;
   const choice=encounter.choices[['a','b','c','d','e'].indexOf(event.key.toLowerCase())];
   if(choice&&getChoicePreview(state,choice).allowed){event.preventDefault();onChoose(choice.id);}
  };
  window.addEventListener('keydown',handle);return()=>window.removeEventListener('keydown',handle);
 },[disabled,shortcuts,encounter,state,onChoose]);
 return <section className="decision-panel" aria-labelledby="encounter-title"><div className="decision-topline"><span>{encounter.location}</span><button className="text-button" onClick={onContext}><BookOpen size={16}/> Historical context</button></div>
 <h1 id="encounter-title" ref={heading} tabIndex={-1}>{encounter.title}</h1><p className="decision-story">{encounter.text}</p>{["thin-air","gate-reckoning"].includes(encounter.id)&&<p className="condition-note"><strong>Arash needs care now.</strong> Health measures general resilience; it does not rule out illness in this scene.</p>}<p className="speaker">{state.people.find(person=>person.id===encounter.speaker)?.name} is watching this decision.</p>
 <RouteBriefing state={state} encounter={encounter}/><MarketComparison state={state} encounter={encounter}/><div className="choices-toolbar"><span>Choose a course</span><button className="text-button effects-toggle" aria-pressed={allEffects} onClick={onToggleEffects}>{allEffects?'Summarize people effects':'Show all numerical effects'}</button></div><div className="choices" id="journey-choices" tabIndex={-1}>{options.map(({choice,preview},index)=><div className="choice-option" key={choice.id}><button onClick={()=>onChoose(choice.id)} disabled={disabled||!preview.allowed} aria-keyshortcuts={shortcuts?String.fromCharCode(65+index):undefined} aria-describedby={`choice-detail-${index}`}><span className="choice-letter" aria-hidden="true">{String.fromCharCode(65+index)}</span><span className="choice-body"><strong>{choice.label}</strong>{journeyContinuation(state,choice)&&<span className="journey-choice-status">{journeyContinuation(state,choice)}</span>}<span id={`choice-detail-${index}`} className="choice-detail">{choice.detail}</span><span className="choice-cost"><Clock3 size={12} aria-hidden="true"/>{preview.days} {preview.days===1?'day':'days'}{displayCosts(preview.costs,allEffects).map((cost,i)=><span className="preview-item" key={i}>{cost}</span>)}</span>{!preview.allowed&&<span className="choice-unavailable">{preview.reason}</span>}</span></button></div>)}</div>
 {travelNotes.map(note=><details className="travel-details" key={note}><summary>About this travel stage</summary><p>{note}</p></details>)}<p className="decision-hint">Shown costs include travel supplies. There are no hidden dice rolls or real-time deadlines. Choices are final; your journal remembers them.</p></section>;
}
