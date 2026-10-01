import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Debrief } from '../src/components/Debrief';
import { acknowledgeOutcome, choose, continueToBactra, createInitialState, recordReflection } from '../src/game/engine';
import { getReflection } from '../src/data/learning';
import type { JourneyState } from '../src/types';

const act = (state: JourneyState, id: string) => acknowledgeOutcome(choose(state, id));
const chapter = () => ['travel-light', 'redistribute', 'share-medicine', 'let-arash', 'keep-cargo', 'call-favor'].reduce(act, createInitialState());
const ending = () => ['hire-broker', 'full-rest', 'settle-debt', 'narin-stays', 'arash-east'].reduce(act, continueToBactra(chapter()));
const render = (state: JourneyState) => renderToStaticMarkup(<Debrief state={state} onAnswer={() => {}} onContinue={() => {}} onRestart={() => {}} onJournal={() => {}}/>);

describe('ending presentation', () => {
  it('does not present unattempted reflections as failed answers', () => {
    const html = render(ending());
    expect(html).toContain('Reflections not attempted');
    expect(html).toContain('2 available reflections not explored. 3 not yet reached.');
    expect(html).not.toContain('/5');
    expect(html).toContain('Arash takes the next road.');
    expect(html).toContain('The decisions that shaped your road');
    expect(html).toContain('caravan-portraits.webp');
  });
  it('uses attempted questions as the score denominator', () => {
    const html = render(recordReflection(ending(), getReflection(2)!.correctId));
    expect(html).toContain('1/1');
    expect(html).toContain('Chapter 1: Not explored');
    expect(html).toContain('Chapter 2: Answered');
    expect(html).not.toContain('Chapter 3:');
  });
  it('keeps chapter continuation and ending content separate', () => {
    const html = render(chapter());
    expect(html).toContain('Enter Bactra');
    expect(html).not.toContain('Where your people go next');
    expect(html).toContain('Journey timing and reconstruction');
  });
});
