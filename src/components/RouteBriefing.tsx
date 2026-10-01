import type { Encounter, JourneyState } from '../types';
import { getChoicePreview, getTradeProjection } from '../game/engine';
import { routeDescriptions } from '../data/routes';
import north from '../assets/tarim-north.jpg';
import south from '../assets/tarim-south.jpg';
import './RouteBriefing.css';

export function RouteBriefing({ state, encounter }: { state: JourneyState; encounter: Encounter }) {
  if (encounter.id !== 'tarim-fork') return null;
  return <details className="route-briefing"><summary>Compare the two roads</summary>
    <div className="route-briefing-options">{(['north', 'south'] as const).map(route => {
      const choice = encounter.choices.find(item => item.id === `${route}-road`);
      if (!choice) return null;
      const preview = getChoicePreview(state, choice);
      const after = getTradeProjection(state, choice);
      return <article key={route}>
        <img src={route === 'north' ? north : south} alt={route === 'north' ? 'Composite illustration of the northern oasis road' : 'Composite illustration of the southern oasis road'} width="1672" height="941" loading="lazy"/>
        <h2>{routeDescriptions[route].title}</h2>
        <p>{routeDescriptions[route].summary}</p>
        <p>{route === 'north' ? 'The two stops center on shared accounts, paid work, and water access. No jade purchase is needed.' : 'Buying jade is optional. Escort work and provisions are alternatives; Khotan also offers work when you arrive without jade.'}</p>
        {preview.allowed ? <><h3>After departure</h3><dl>
          <div><dt>Silver balance</dt><dd>{after.resources.silver}</dd></div>
          <div><dt>Food / water</dt><dd>{after.resources.food} / {after.resources.water}</dd></div>
          <div><dt>Free cargo spaces</dt><dd>{after.capacity - after.load}</dd></div>
        </dl>{after.assistance.length > 0 && <p>Includes Story assistance on credit.</p>}</> : <p className="route-blocked">Unavailable: {preview.reason}</p>}
      </article>;
    })}</div>
    <p className="route-briefing-note">Departure balances only: later bargains and costs are not included. Negative silver is debt; Vima's separate claim is not included. Neither road guarantees more profit. The scenes and travel intervals are game reconstructions, not a surveyed historical itinerary.</p>
  </details>;
}
