import { createHash } from 'node:crypto';
import { z } from 'zod';
import type { Claim, ClaimStance, ClaimType } from './claim-schema.js';
import type { Segment } from './schema.js';

export const ClaimVerificationIssueSchema = z.enum([
  'UNFAITHFUL_PARAPHRASE',
  'UNSUPPORTED_DETAIL',
  'LOST_QUALIFIER',
  'NEGATION_ERROR',
  'STANCE_MISMATCH',
  'SPEAKER_MISMATCH',
  'CLAIM_TYPE_MISMATCH',
  'NON_ATOMIC',
  'CONTEXT_INSUFFICIENT',
  'OTHER',
]);
export type ClaimVerificationIssue = z.infer<typeof ClaimVerificationIssueSchema>;

export const ClaimRevisionSchema = z.object({
  claim: z.string().trim().min(1),
  claimType: z.enum([
    'empirical',
    'causal',
    'normative',
    'evaluative',
    'predictive',
    'definitional',
    'interpretive',
  ]),
  speaker: z.string().trim().min(1).nullable(),
  stance: z.enum([
    'asserted',
    'denied',
    'questioned',
    'quoted',
    'hypothetical',
    'uncertain',
  ]),
  confidence: z.number().min(0).max(1),
  requiresExternalVerification: z.boolean(),
}).strict();
export type ClaimRevision = z.infer<typeof ClaimRevisionSchema>;

const AcceptedVerificationSchema = z.object({
  claimId: z.string().min(1),
  decision: z.literal('accepted'),
  issues: z.array(ClaimVerificationIssueSchema).length(0),
  rationale: z.string().trim().min(1),
  revisions: z.null(),
}).strict();

const RewriteVerificationSchema = z.object({
  claimId: z.string().min(1),
  decision: z.literal('rewrite'),
  issues: z.array(ClaimVerificationIssueSchema).min(1),
  rationale: z.string().trim().min(1),
  revisions: z.array(ClaimRevisionSchema).min(1),
}).strict();

const RejectedVerificationSchema = z.object({
  claimId: z.string().min(1),
  decision: z.literal('rejected'),
  issues: z.array(ClaimVerificationIssueSchema).min(1),
  rationale: z.string().trim().min(1),
  revisions: z.null(),
}).strict();

export const ClaimVerificationOutputSchema = z.discriminatedUnion('decision', [
  AcceptedVerificationSchema,
  RewriteVerificationSchema,
  RejectedVerificationSchema,
]);
export type ClaimVerificationOutput = z.infer<typeof ClaimVerificationOutputSchema>;

export type ClaimVerifierRequest = {
  claim: Claim;
  segment: Segment;
};

/** Provider-neutral semantic verifier. Its output remains untrusted until gated. */
export interface ClaimVerifierAgent {
  readonly id: string;
  verifyClaim(request: ClaimVerifierRequest): Promise<unknown>;
}

export class ClaimVerifierAbortError extends Error {
  override readonly name = 'ClaimVerifierAbortError';
}

export type ClaimVerifierOutputErrorCode =
  | 'INVALID_VERIFIER_OUTPUT'
  | 'CLAIM_ID_MISMATCH'
  | 'SEGMENT_NOT_FOUND'
  | 'SEGMENT_MISMATCH';

export type ClaimVerifierOutputError = {
  claimId: string;
  code: ClaimVerifierOutputErrorCode;
  message: string;
  path?: Array<string | number>;
};

export type ClaimVerificationRecord = {
  sourceClaimId: string;
  verifierId: string;
  decision: 'accepted' | 'rewrite' | 'rejected';
  issues: ClaimVerificationIssue[];
  rationale: string;
  finalClaimIds: string[];
};

export type GatedClaimVerification = {
  record?: ClaimVerificationRecord;
  finalClaims: Claim[];
  errors: ClaimVerifierOutputError[];
};

export type ClaimVerifierExecutionError = {
  claimId: string;
  message: string;
};

export type ClaimVerifierRunResult = {
  verifierId: string;
  records: ClaimVerificationRecord[];
  accepted: Claim[];
  rewritten: Claim[];
  finalClaims: Claim[];
  rejectedClaimIds: string[];
  outputErrors: ClaimVerifierOutputError[];
  executionErrors: ClaimVerifierExecutionError[];
};

export type MockClaimVerifierHandler = (
  request: ClaimVerifierRequest,
) => unknown | Promise<unknown>;

export class MockClaimVerifierAgent implements ClaimVerifierAgent {
  readonly calls: ClaimVerifierRequest[] = [];

  constructor(
    private readonly handler: MockClaimVerifierHandler,
    readonly id = 'mock-claim-verifier',
  ) {}

  async verifyClaim(request: ClaimVerifierRequest): Promise<unknown> {
    this.calls.push(request);
    return this.handler(request);
  }
}

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 12);
}

function makeRewrittenClaim(
  source: Claim,
  revision: ClaimRevision,
  index: number,
): Claim {
  const identity = JSON.stringify({
    sourceClaimId: source.id,
    index,
    claim: revision.claim,
    claimType: revision.claimType,
    speaker: revision.speaker,
    stance: revision.stance,
    confidence: revision.confidence,
    requiresExternalVerification: revision.requiresExternalVerification,
  });

  return {
    id: `${source.evidence.documentId}:claim-${digest(identity)}`,
    claim: revision.claim,
    claimType: revision.claimType as ClaimType,
    speaker: revision.speaker,
    stance: revision.stance as ClaimStance,
    evidence: source.evidence,
    confidence: revision.confidence,
    requiresExternalVerification: revision.requiresExternalVerification,
  };
}

/**
 * Converts one untrusted semantic-verifier response into zero or more claims.
 * The verifier may revise semantic fields, but the original evidence span is
 * always preserved by local code and can never be replaced by model output.
 */
export function gateClaimVerification(
  output: unknown,
  claim: Claim,
  verifierId: string,
): GatedClaimVerification {
  const parsed = ClaimVerificationOutputSchema.safeParse(output);
  if (!parsed.success) {
    return {
      finalClaims: [],
      errors: parsed.error.issues.map(issue => ({
        claimId: claim.id,
        code: 'INVALID_VERIFIER_OUTPUT',
        message: issue.message,
        path: issue.path,
      })),
    };
  }

  if (parsed.data.claimId !== claim.id) {
    return {
      finalClaims: [],
      errors: [{
        claimId: claim.id,
        code: 'CLAIM_ID_MISMATCH',
        message: `Verifier output refers to claim "${parsed.data.claimId}", expected "${claim.id}".`,
        path: ['claimId'],
      }],
    };
  }

  const finalClaims = parsed.data.decision === 'accepted'
    ? [claim]
    : parsed.data.decision === 'rewrite'
      ? parsed.data.revisions.map((revision, index) => makeRewrittenClaim(claim, revision, index))
      : [];

  return {
    finalClaims,
    errors: [],
    record: {
      sourceClaimId: claim.id,
      verifierId,
      decision: parsed.data.decision,
      issues: parsed.data.issues,
      rationale: parsed.data.rationale,
      finalClaimIds: finalClaims.map(finalClaim => finalClaim.id),
    },
  };
}

function executionMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Runs one isolated semantic-verification call for every gated reader claim. */
export async function runClaimVerifier(
  claims: readonly Claim[],
  segments: readonly Segment[],
  verifier: ClaimVerifierAgent,
): Promise<ClaimVerifierRunResult> {
  const segmentsById = new Map(segments.map(segment => [segment.id, segment]));
  const result: ClaimVerifierRunResult = {
    verifierId: verifier.id,
    records: [],
    accepted: [],
    rewritten: [],
    finalClaims: [],
    rejectedClaimIds: [],
    outputErrors: [],
    executionErrors: [],
  };

  for (const claim of claims) {
    const segment = segmentsById.get(claim.evidence.segmentId);
    if (!segment) {
      result.outputErrors.push({
        claimId: claim.id,
        code: 'SEGMENT_NOT_FOUND',
        message: `No segment "${claim.evidence.segmentId}" exists for claim "${claim.id}".`,
      });
      continue;
    }

    if (segment.documentId !== claim.evidence.documentId) {
      result.outputErrors.push({
        claimId: claim.id,
        code: 'SEGMENT_MISMATCH',
        message: `Segment "${segment.id}" belongs to document "${segment.documentId}", not "${claim.evidence.documentId}".`,
      });
      continue;
    }

    try {
      const output = await verifier.verifyClaim({ claim, segment });
      const gated = gateClaimVerification(output, claim, verifier.id);
      result.outputErrors.push(...gated.errors);
      if (!gated.record) continue;

      result.records.push(gated.record);
      if (gated.record.decision === 'accepted') {
        result.accepted.push(...gated.finalClaims);
        result.finalClaims.push(...gated.finalClaims);
      } else if (gated.record.decision === 'rewrite') {
        result.rewritten.push(...gated.finalClaims);
        result.finalClaims.push(...gated.finalClaims);
      } else {
        result.rejectedClaimIds.push(claim.id);
      }
    } catch (error) {
      if (error instanceof ClaimVerifierAbortError) throw error;
      result.executionErrors.push({
        claimId: claim.id,
        message: executionMessage(error),
      });
    }
  }

  return result;
}
