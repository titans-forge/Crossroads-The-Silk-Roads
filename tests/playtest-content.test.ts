import { describe, expect, it } from 'vitest';
import { reflections } from '../src/data/learning';
import { PLAYTEST_CONTENT_VERSION, PLAYTEST_FORMAT, PLAYTEST_FORMAT_VERSION, probeQuestions, type ProbePhase } from '../src/data/playtest';

const phases: ProbePhase[] = ['before', 'after', 'later'];

describe('pilot transfer question content', () => {
  it('covers the same three taught concepts with three distinct forms', () => {
    const taught = new Set(reflections.map(question => question.concept));
    const expected = probeQuestions.before.map(question => question.concept).sort();
    expect(new Set(expected).size).toBe(3);
    for (const phase of phases) {
      expect(probeQuestions[phase].map(question => question.concept).sort()).toEqual(expected);
      expect(probeQuestions[phase].every(question => taught.has(question.concept))).toBe(true);
    }
  });

  it('provides globally unique identifiers and exactly one declared answer per question', () => {
    const ids = new Set<string>();
    for (const phase of phases) for (const question of probeQuestions[phase]) {
      expect(question.id.startsWith(`${phase}-`)).toBe(true);
      for (const id of [question.id, ...question.options.map(option => option.id)]) {
        expect(id).toMatch(/^[a-z][a-z0-9-]+$/);
        expect(ids.has(id)).toBe(false);
        ids.add(id);
      }
      expect(question.options).toHaveLength(3);
      expect(question.options.filter(option => option.id === question.correctId)).toHaveLength(1);
      expect(new Set(question.options.map(option => option.text)).size).toBe(3);
      expect(question.options.every(option => option.id !== 'unsure')).toBe(true);
    }
  });

  it('uses new prompts instead of replaying chapter answers or identical test items', () => {
    const questions = phases.flatMap(phase => probeQuestions[phase]);
    expect(new Set(questions.map(question => question.prompt)).size).toBe(9);
    const chapterPrompts = new Set(reflections.map(question => question.prompt));
    for (const question of questions) {
      expect(chapterPrompts.has(question.prompt)).toBe(false);
      expect(question.prompt.trim().length).toBeGreaterThan(50);
      expect(question.prompt.length).toBeLessThan(650);
      expect(question.explanation.trim().length).toBeGreaterThan(60);
      expect(question.explanation.length).toBeLessThan(650);
      for (const option of question.options) {
        expect(option.text.trim().length).toBeGreaterThan(20);
        expect(option.text.length).toBeLessThan(240);
      }
    }
  });

  it('varies answer positions across each phase and each matched concept', () => {
    for (const phase of phases) {
      expect(new Set(probeQuestions[phase].map(question => question.options.findIndex(option => option.id === question.correctId))).size).toBe(3);
    }
    for (const concept of probeQuestions.before.map(question => question.concept)) {
      const positions = phases.map(phase => {
        const question = probeQuestions[phase].find(item => item.concept === concept)!;
        return question.options.findIndex(option => option.id === question.correctId);
      });
      expect(new Set(positions).size).toBe(3);
    }
  });

  it('versions the original assessment content separately from the export structure', () => {
    expect(PLAYTEST_FORMAT).toBe('titans-forge-crossroads-playtest');
    expect(Number.isInteger(PLAYTEST_FORMAT_VERSION) && PLAYTEST_FORMAT_VERSION > 0).toBe(true);
    expect(PLAYTEST_CONTENT_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}\.\d+$/);
  });
});
