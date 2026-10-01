import { Compass, Expand } from 'lucide-react';
import type { JourneyState } from '../types';
import { journeyOutlook, journeyStage } from '../game/journeyOutlook';
import road from '../assets/bactra-approach.webp';
import market from '../assets/bactra-market.webp';
import mountain from '../assets/pamir-approach.webp';
import oasis from '../assets/kashgar-oasis.webp';
import frontier from '../assets/dunhuang-frontier.webp';
import north from '../assets/tarim-north.jpg';
import south from '../assets/tarim-south.jpg';
import './JourneyScene.css';

const scenes: Record<string, { src: string; label: string; alt: string }> = {
  merv: { src: road, label: 'The road east of Merv', alt: 'Illustrated caravan on the road toward Bactra' },
  bactra: { src: market, label: 'Bactra under Kushan rule', alt: 'Illustrated market at Bactra' },
  wakhan: { src: mountain, label: 'The Pamir approaches', alt: 'Illustrated caravan route through mountain valleys' },
  kashgar: { src: oasis, label: 'Kashgar oasis junction', alt: 'Illustrated oasis market with traders and pack animals' },
  kucha: { src: north, label: 'Kucha: northern oasis road', alt: 'Illustrated northern oasis, water channel, earthen settlement and caravan beneath distant mountains' },
  turfan: { src: north, label: 'Turfan: northern oasis road', alt: 'Composite illustration of an arid northern oasis route, not a reconstruction of Turfan' },
  yarkand: { src: south, label: 'Yarkand: southern oasis road', alt: 'Illustrated caravan beside a river-fed oasis, dunes and distant mountains' },
  khotan: { src: south, label: 'Khotan: southern oasis road', alt: 'Composite illustration of a southern oasis route with a roadside stone-working yard' },
  dunhuang: { src: frontier, label: 'Dunhuang at the Han frontier', alt: 'Illustrated eastern frontier settlement and caravan route' },
};
export const journeyScene = (state: JourneyState) => scenes[journeyStage(state)];

export function JourneyScene({ state, onEnlarge, onAtlas }: { state: JourneyState; onEnlarge: () => void; onAtlas: () => void }) {
  const scene = journeyScene(state);
  const outlook = journeyOutlook(state);
  return <section data-stage={journeyStage(state)} className="journey-scene" aria-label="The road ahead">
    {!state.lastOutcome && <a className="jump-choices" href="#journey-choices">Go to choices ↓</a>}<div className="journey-landscape">
      <img src={scene.src} alt={scene.alt} width="1672" height="941" fetchPriority="high"/>
      <div className="journey-landscape-label"><span>Around AD 200</span><strong>{scene.label}</strong></div>
      <button className="scene-expand" onClick={onEnlarge} aria-label="Enlarge landscape" title="Enlarge landscape"><Expand size={18}/></button>
    </div>
    <details className="journey-outlook">
      <summary>Road ahead <span>{outlook.upcoming[0] ?? 'The final handoff'}</span></summary>
      <div className="journey-outlook-body">
        {outlook.upcoming.length > 0 && <ol aria-label="Upcoming stops">{outlook.upcoming.map(stop => <li key={stop}>{stop}</li>)}</ol>}
        <p>{outlook.focus}</p>
        <ul>{outlook.notes.map(note => <li key={note}>{note}</li>)}</ul>
        {state.lastTravelNote && <p className="small-note">{state.lastTravelNote}</p>}
        <button className="text-button" onClick={onAtlas}><Compass size={16}/> Open atlas &amp; journal</button>
      </div>
    </details>
  </section>;
}
