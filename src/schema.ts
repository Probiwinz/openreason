import { z } from 'zod';

export const EvidenceStatusSchema = z.enum(['O1','O2','L1','D1','R1','F1','C1','S1','H1','X1']);
export type EvidenceStatus = z.infer<typeof EvidenceStatusSchema>;

export const VerificationStatusSchema = z.enum(['draft','reviewed','verified','contested']);
export type VerificationStatus = z.infer<typeof VerificationStatusSchema>;

export const FrameworkSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  version: z.string().min(1),
  domain: z.string().min(1),
  purpose: z.string().min(1),
  scope: z.string().min(1),
  verification_status: VerificationStatusSchema.default('draft'),
  capabilities: z.array(z.string()).min(1),
  intents: z.array(z.string()).min(1),
  triggers: z.array(z.string()).min(1),
  anti_triggers: z.array(z.string()).default([]),
  core_concepts: z.array(z.string()).min(1),
  evidence_statuses: z.array(EvidenceStatusSchema).min(1),
  analysis_steps: z.array(z.string()).min(1),
  decision_rules: z.array(z.string()).min(1),
  analysis_questions: z.array(z.string()).min(1),
  output_fields: z.array(z.string()).min(1),
  limitations: z.array(z.string()).min(1),
  references: z.array(z.object({
    title: z.string(),
    author: z.string().optional(),
    year: z.number().optional(),
    note: z.string().optional()
  })).min(1)
});

export type Framework = z.infer<typeof FrameworkSchema>;

export type IntentResult = {
  primaryIntent: string;
  secondaryIntents: string[];
  matchedSignals: string[];
  confidence: 'low' | 'medium' | 'high';
};

export type ResolutionResult = {
  activatedFrameworks: Framework[];
  skippedFrameworks: { id: string; reason: string }[];
};

export type DocumentFormat = 'plaintext' | 'markdown';

export type Document = {
  id: string;
  content: string;
  format: DocumentFormat;
  title?: string;
  sourcePath?: string;
};

export type SegmentKind = 'heading' | 'paragraph' | 'code';

export type Segment = {
  id: string;
  documentId: string;
  index: number;
  kind: SegmentKind;
  headingPath: string[];
  text: string;
  startOffset: number;
  endOffset: number;
};

export const MaturityLevelSchema = z.enum(['implemented', 'draft', 'planned', 'reference']);
export type MaturityLevel = z.infer<typeof MaturityLevelSchema>;

export const PackFrameworkEntrySchema = z.object({
  id: z.string().min(1),
  maturity: MaturityLevelSchema,
  note: z.string().optional(),
});
export type PackFrameworkEntry = z.infer<typeof PackFrameworkEntrySchema>;

export const PackSchema = z.object({
  id: z.string().min(1),
  capabilities: z.array(z.string()).min(1),
  description: z.string().min(1),
  frameworks: z.array(PackFrameworkEntrySchema).min(1),
});
export type Pack = z.infer<typeof PackSchema>;

export type AnalysisPacket = {
  inputPath: string;
  input: string;
  intent: IntentResult;
  frameworks: string[];
  evidenceModel: EvidenceStatus[];
  reportMarkdown: string;
  compiledInstructions: string;
};

export type AnalysisPlan = {
  input: string;
  intent: IntentResult;
  frameworks: Framework[];
  evidenceModel: EvidenceStatus[];
  instructions: string;
};

export type AnalysisResult = {
  plan: AnalysisPlan;
  reportScaffold: string;
};
