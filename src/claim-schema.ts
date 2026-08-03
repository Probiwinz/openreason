import { z } from 'zod';

/** The kind of proposition the reader found in the source text. */
export const ClaimTypeSchema = z.enum([
  'empirical',
  'causal',
  'normative',
  'evaluative',
  'predictive',
  'definitional',
  'interpretive',
]);
export type ClaimType = z.infer<typeof ClaimTypeSchema>;

/** How the source presents the proposition, independent of whether it is true. */
export const ClaimStanceSchema = z.enum([
  'asserted',
  'denied',
  'questioned',
  'quoted',
  'hypothetical',
  'uncertain',
]);
export type ClaimStance = z.infer<typeof ClaimStanceSchema>;

/**
 * A verbatim source span. Offsets are absolute, zero-based offsets into the
 * complete document; endOffset is exclusive.
 */
export const EvidenceSpanSchema = z.object({
  documentId: z.string().min(1),
  segmentId: z.string().min(1),
  text: z.string().min(1),
  startOffset: z.number().int().nonnegative(),
  endOffset: z.number().int().positive(),
}).strict().refine(span => span.endOffset > span.startOffset, {
  message: 'endOffset must be greater than startOffset',
  path: ['endOffset'],
});
export type EvidenceSpan = z.infer<typeof EvidenceSpanSchema>;

/** Provider-neutral structured output expected from a reader implementation. */
export const ClaimCandidateSchema = z.object({
  claim: z.string().trim().min(1),
  claimType: ClaimTypeSchema,
  speaker: z.string().trim().min(1).nullable(),
  stance: ClaimStanceSchema,
  evidence: EvidenceSpanSchema,
  confidence: z.number().min(0).max(1),
  requiresExternalVerification: z.boolean(),
}).strict();
export type ClaimCandidate = z.infer<typeof ClaimCandidateSchema>;

export const ReaderOutputSchema = z.object({
  segmentId: z.string().min(1),
  claims: z.array(ClaimCandidateSchema),
}).strict();
export type ReaderOutput = z.infer<typeof ReaderOutputSchema>;

/** A candidate that passed the deterministic gate. */
export const ClaimSchema = ClaimCandidateSchema.extend({
  id: z.string().min(1),
}).strict();
export type Claim = z.infer<typeof ClaimSchema>;
