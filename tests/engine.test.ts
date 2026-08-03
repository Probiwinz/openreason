import { describe, it, expect } from 'vitest';
import { ReasoningEngine } from '../src/openreason/index.js';
import { EVIDENCE_LABELS } from '../src/openreason/evidence.js';

describe('ReasoningEngine.analyze', () => {
  const engine = new ReasoningEngine();

  it('returns a plan with the input text', () => {
    const result = engine.analyze('Why are Iranians used as a contrast group against Somalis?');
    expect(result.plan.input).toContain('Iranians');
  });

  it('plan contains at least one activated framework', () => {
    const result = engine.analyze('This argument contains a logical fallacy.');
    expect(result.plan.frameworks.length).toBeGreaterThan(0);
  });

  it('plan evidenceModel matches the canonical evidence labels', () => {
    const result = engine.analyze('Analyse the framing of this political speech.');
    expect(result.plan.evidenceModel).toEqual(EVIDENCE_LABELS);
  });

  it('plan intent has a confidence field', () => {
    const result = engine.analyze('What fallacy is in this argument?');
    expect(['low', 'medium', 'high']).toContain(result.plan.intent.confidence);
  });

  it('plan instructions are non-empty', () => {
    const result = engine.analyze('Analyse this statement.');
    expect(result.plan.instructions.length).toBeGreaterThan(0);
  });

  it('reportScaffold contains the standard section headings', () => {
    const result = engine.analyze('Analyse the rhetoric in this speech.');
    expect(result.reportScaffold).toContain('## Summary');
    expect(result.reportScaffold).toContain('## Claim map');
    expect(result.reportScaffold).toContain('## Evidence graph');
    expect(result.reportScaffold).toContain('## Strongest counterinterpretation');
    expect(result.reportScaffold).toContain('## Confidence and limitations');
  });

  it('reportScaffold includes detected intent', () => {
    const result = engine.analyze('What logical fallacy is used in this argument?');
    expect(result.reportScaffold).toContain('logical_analysis');
  });

  it('reportScaffold includes framework analysis questions', () => {
    const result = engine.analyze('Why are Iranians used as a contrast group against Somalis?');
    const question = result.plan.frameworks.flatMap(f => f.analysis_questions)[0];
    expect(question).toBeDefined();
    expect(result.reportScaffold).toContain(question!);
  });
});
