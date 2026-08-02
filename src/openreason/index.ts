import fs from 'node:fs';
import { buildAnalysisPlan } from './planner.js';
import { AnalysisResult } from '../schema.js';
import { EVIDENCE_MODEL } from './evidence.js';

export class ReasoningEngine {
  private readonly frameworksRoot: string;

  constructor(frameworksRoot = 'frameworks') {
    this.frameworksRoot = frameworksRoot;
  }

  analyze(input: string): AnalysisResult {
    const plan = buildAnalysisPlan(input, this.frameworksRoot);

    const frameworkList = plan.frameworks
      .map(f => `- **${f.name}** (\`${f.id}\`) — ${f.verification_status} — ${f.purpose}`)
      .join('\n');

    const evidenceTable = [
      '| Label | Name | Confidence |',
      '|---|---|---|',
      ...EVIDENCE_MODEL.map(e => `| \`${e.label}\` | ${e.name} | ${e.confidence} |`),
    ].join('\n');

    const frameworkSections = plan.frameworks.map(f => {
      const questions = f.analysis_questions.map(q => `- [ ] ${q}`).join('\n');
      const limitations = f.limitations.map(l => `- ${l}`).join('\n');
      return [
        `#### ${f.name} (\`${f.id}\`)`,
        '',
        `*Purpose: ${f.purpose}*`,
        '',
        '**Questions to answer:**',
        questions,
        '',
        '**Decision rules to apply:**',
        f.decision_rules.map(r => `- ${r}`).join('\n'),
        '',
        '**Limitations:**',
        limitations,
      ].join('\n');
    }).join('\n\n');

    const reportScaffold = [
      '# OpenReason Analysis',
      '',
      `**Input:** ${plan.intent.primaryIntent} (confidence: ${plan.intent.confidence})`,
      `**Frameworks:** ${plan.frameworks.map(f => f.id).join(', ')}`,
      `**Signals matched:** ${plan.intent.matchedSignals.join(', ') || 'none'}`,
      '',
      '---',
      '',
      '## Evidence reference',
      '',
      evidenceTable,
      '',
      '---',
      '',
      '## Summary',
      '',
      '[FILL: One paragraph — what is the material, what analytical lens was applied, what is the key finding.]',
      '',
      '## Intent and frameworks activated',
      '',
      `- Detected intent: **${plan.intent.primaryIntent}**`,
      `- Confidence: **${plan.intent.confidence}**`,
      plan.intent.secondaryIntents.length
        ? `- Secondary intents: ${plan.intent.secondaryIntents.join(', ')}`
        : '- Secondary intents: none',
      '',
      '**Frameworks activated:**',
      frameworkList,
      '',
      '## Claim map',
      '',
      '*List only what is directly stated or observable in the text (O1/O2).*',
      '',
      '- [O2] [FILL: first explicit claim]',
      '- [O2] [FILL: second explicit claim]',
      '',
      '## Evidence graph',
      '',
      '*Build upward from O1/O2 through inferences and interpretations to effects and hypotheses.*',
      '',
      '```',
      '[O2] ...',
      '  ↓',
      '[L1] Because ..., it follows that ...',
      '  ↓',
      '[F1/D1/R1] This functions as / frames / constructs ...',
      '  ↓',
      '[C1/S1] This may ... (cautious language)',
      '[H1] A possible but unproven explanation is ...',
      '```',
      '',
      '## Framework findings',
      '',
      frameworkSections,
      '',
      '## Strongest counterinterpretation',
      '',
      '[FILL: What is the most plausible alternative reading? What would need to be true for the main interpretation to be wrong? State this fairly.]',
      '',
      '## Confidence and limitations',
      '',
      '[FILL: What can this analysis determine with confidence? What cannot it determine? What framework limitations apply? What additional evidence would strengthen or change the analysis?]',
    ].join('\n');

    return { plan, reportScaffold };
  }

  analyzeFile(inputPath: string): AnalysisResult {
    const input = fs.readFileSync(inputPath, 'utf8');
    return this.analyze(input);
  }
}

export { buildAnalysisPlan } from './planner.js';
export { EVIDENCE_MODEL, EVIDENCE_LABELS, isValidEvidenceStatus, getEvidenceEntry } from './evidence.js';
export { createDocument, segmentDocument } from '../segmenter.js';
export type { EvidenceStatusEntry } from './evidence.js';
export type { CreateDocumentOptions } from '../segmenter.js';
export type { Document, DocumentFormat, Segment, SegmentKind } from '../schema.js';
