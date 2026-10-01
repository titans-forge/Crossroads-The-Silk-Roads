import { useEffect, useRef } from 'react';
import { ArrowRight, BookOpen } from 'lucide-react';
import type { OutcomeRecord } from '../types';

export function OutcomePanel({ outcome, onContinue, onContext }: { outcome: OutcomeRecord; onContinue: () => void; onContext: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [outcome.encounterId]);
  return <section className="outcome-panel" aria-labelledby="outcome-title">
    <div className="decision-topline"><span>Decision recorded</span><button className="text-button" onClick={onContext}><BookOpen size={16} /> Historical context</button></div>
    <h1 id="outcome-title" ref={heading} tabIndex={-1}>{outcome.choiceLabel}</h1>
    <blockquote>{outcome.reaction}</blockquote>
    <div className="outcome-changes" aria-label="What changed">{outcome.changes.map((change, index) => <div key={`${change.label}-${index}`}><span>{change.label}</span>{change.label==='Arranged corridor travel'?<details className="travel-details"><summary>Travel and provisioning details</summary><p>{change.detail}</p></details>:<strong className={change.kind === 'time' ? '' : (change.delta ?? 0) < 0 ? 'cost' : 'gain'}>{typeof change.delta === 'number' ? `${change.delta > 0 ? '+' : ''}${change.delta}` : change.detail}</strong>}</div>)}</div>
    <div className="outcome-lesson"><BookOpen size={20} /><div><strong>What this shows</strong><p>{outcome.lesson}</p></div></div>
    <button className="primary outcome-continue" onClick={onContinue}>Continue <ArrowRight size={18} /></button>
  </section>;
}
