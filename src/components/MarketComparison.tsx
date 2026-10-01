import type { Encounter, JourneyState } from '../types';
import { getChoicePreview, getTradeProjection } from '../game/engine';
import './MarketComparison.css';

const marketStops = new Set(['merchant-handoff', 'relay-silk', 'south-yarkand-carriers', 'south-khotan-stone', 'broken-seal']);
export function MarketComparison({ state, encounter }: { state: JourneyState; encounter: Encounter }) {
  if (!marketStops.has(encounter.id)) return null;
  const offers = encounter.choices.map(choice => ({
    choice, preview: getChoicePreview(state, choice), result: getTradeProjection(state, choice),
  }));
  return <details className="market-comparison">
    <summary>Compare the bargains</summary>
    <p>Balances after each bargain, including supplies used and any Story assistance. A negative silver balance is debt, not profit.</p>
    <div className="market-table-scroll" role="region" aria-label="Market balances after each choice" tabIndex={0}>
      <table><caption>What remains with the household</caption><thead><tr><th scope="col">Bargain</th><th scope="col">Silver</th><th scope="col">Food</th><th scope="col">Water</th><th scope="col">Cargo</th><th scope="col">Days</th></tr></thead>
        <tbody>{offers.map(({choice, preview, result}, index) => {
          return <tr key={choice.id} className={preview.allowed ? '' : 'market-unavailable'}>
            <th scope="row"><span>{String.fromCharCode(65 + index)}. {choice.label}</span>{!preview.allowed && <small>{preview.reason}</small>}{preview.allowed && result.assistance.length > 0 && <small>Includes assistance on credit</small>}</th>
            {preview.allowed ? <><td>{result.resources.silver}</td><td>{result.resources.food}</td><td>{result.resources.water}</td><td>{result.load}/{result.capacity}</td><td>{result.days}</td></> : <td colSpan={5}>Unavailable</td>}
          </tr>;
        })}</tbody>
      </table>
    </div>
    <div className="market-mobile" aria-label="Market balances after each choice">
      {offers.map(({choice, preview, result},index)=>{
        return <section key={choice.id}>
          <h3>{String.fromCharCode(65+index)}. {choice.label}</h3>
          {preview.allowed ? <><dl>{[
            ['Silver',result.resources.silver],['Food',result.resources.food],
            ['Water',result.resources.water],['Cargo',result.load+'/'+result.capacity],['Days',result.days],
          ].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
          {result.assistance.length>0&&<small>Includes assistance on credit</small>}</>:
          <p>Unavailable: {preview.reason}</p>}
        </section>;
      })}
    </div>
    <p className="market-footnote">Fixed game offers, not historical price records. Later resale is separate; Vima's outstanding claim is not included in the silver balance unless this bargain pays it.</p>
  </details>;
}
