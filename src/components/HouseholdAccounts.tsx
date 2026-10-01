import type { JourneyState } from '../types';
import { householdAccounts, scoreBreakdown } from '../game/accounts';
import './HouseholdAccounts.css';

export function HouseholdAccounts({ state, scores = false }: { state: JourneyState; scores?: boolean }) {
  const account = householdAccounts(state);
  const breakdown = scoreBreakdown(state);
  return <section className="household-accounts" aria-label="Household accounts">
    <h3>Household accounts</h3>
    <dl>
      <div><dt>Silver in hand</dt><dd>{account.cash}</dd></div>
      <div><dt>Caravan credit owed</dt><dd>{account.credit}</dd></div>
      <div><dt>Vima's separate claim</dt><dd>{account.inheritedClaim}</dd></div>
      <div className="account-total"><dt>Total owed</dt><dd>{account.totalOwed}</dd></div>
    </dl>
    <p>{account.cashAfterClaims < 0 ? `${-account.cashAfterClaims} more silver would be needed to clear both accounts from cash alone.` : `${account.cashAfterClaims} silver would remain after clearing both accounts.`} Cargo and camels are not cash; no sale or payment has been made here.</p>
    {account.creditRoom !== null && <p>Challenge spending room: {account.creditRoom} silver before reaching the 40-silver credit limit. Vima's claim is separate until paid.</p>}
    {scores && <details className="score-explanation"><summary>How your scores were calculated</summary>
      <h4>People: {breakdown.people}/100</h4>
      <p>The average of health and trust for all four household members, including settled contacts.</p>
      <div className="score-factor"><span>Average health</span><meter min="0" max="100" value={breakdown.health} aria-label="Average health"/><strong>{breakdown.health.toFixed(1)}</strong></div>
      <div className="score-factor"><span>Average trust</span><meter min="0" max="100" value={breakdown.trust} aria-label="Average trust"/><strong>{breakdown.trust.toFixed(1)}</strong></div>
      <h4>Livelihood: {breakdown.livelihood}/100</h4>
      <dl><div><dt>Food and water</dt><dd>+{breakdown.supplyPoints.toFixed(1)}</dd></div><div><dt>Road standing</dt><dd>+{breakdown.standingPoints.toFixed(1)}</dd></div><div><dt>Assets after Vima's claim</dt><dd>+{breakdown.assetPoints.toFixed(1)}</dd></div><div><dt>Caravan credit penalty</dt><dd>-{breakdown.debtPenalty.toFixed(1)}</dd></div></dl>
      <p>The total is limited to 0-100, then rounded. Displayed components are rounded separately. The asset index counts silver, 5 points per cargo lot and 3 per camel, less Vima's claim; its contribution is limited to 0-50. Food and water contribute up to 25, and standing up to 25. Credit also subtracts 0.35 points per silver owed.</p>
      <p>These are game scores, not historical valuations, sale offers, or a judgment of your choices. Reflections never change either score.</p>
    </details>}
  </section>;
}
