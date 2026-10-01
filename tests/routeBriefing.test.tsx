import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createInitialState, getEncounter, getTradeProjection } from '../src/game/engine';
import { RouteBriefing } from '../src/components/RouteBriefing';
import { MarketComparison } from '../src/components/MarketComparison';
import type { JourneyState } from '../src/types';

describe('decision comparisons', () => {
  const atFork = ():JourneyState => ({...createInitialState(),chapter:4,encounterIndex:4});
  it('shows both roads at the fork without changing campaign state', () => {
    const state=atFork(), before=JSON.stringify(state), encounter=getEncounter(state)!;
    expect(encounter.id).toBe('tarim-fork');
    const html=renderToStaticMarkup(<RouteBriefing state={state} encounter={encounter}/>);
    expect(html).toContain('Compare the two roads');
    expect(html).toContain('Buying jade is optional');
    expect(html).toContain('Departure balances only');
    for (const choice of encounter.choices.filter(c=>c.id.endsWith('-road'))) {
      expect(html).toContain('<dd>'+getTradeProjection(state,choice).resources.silver+'</dd>');
    }
    expect(JSON.stringify(state)).toBe(before);
  });
  it('does not appear at other encounters', () => {
    const state=createInitialState();
    expect(renderToStaticMarkup(<RouteBriefing state={state} encounter={getEncounter(state)!}/>)).toBe('');
  });
  it('does not show departure balances for unaffordable roads', () => {
    const state={...atFork(),mode:'challenge' as const};
    state.resources.silver=-40;
    const html=renderToStaticMarkup(<RouteBriefing state={state} encounter={getEncounter(state)!}/>);
    expect(html).toContain('Unavailable:');
    expect(html).not.toContain('<h3>After departure</h3>');
  });
  it('offers labelled mobile bargain balances alongside the desktop table', () => {
    const state:JourneyState={...createInitialState(),chapter:4,encounterIndex:1};
    const html=renderToStaticMarkup(<MarketComparison state={state} encounter={getEncounter(state)!}/>);
    for(const label of ['Silver','Food','Water','Cargo','Days']) expect(html).toContain('<dt>'+label+'</dt>');
    expect(html).toContain('<caption>What remains with the household</caption>');
  });
});
