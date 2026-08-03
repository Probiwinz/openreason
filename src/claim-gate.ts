import { createHash } from 'node:crypto';
import { z } from 'zod';
import type { Document, Segment } from './schema.js';
import {
  ClaimCandidateSchema,
  type Claim,
  type ClaimCandidate,
} from './claim-schema.js';

export type ClaimGateErrorCode =
  | 'INVALID_READER_OUTPUT'
  | 'SCHEMA_INVALID'
  | 'DOCUMENT_MISMATCH'
  | 'SEGMENT_MISMATCH'
  | 'SEGMENT_DOCUMENT_MISMATCH'
  | 'EVIDENCE_OUT_OF_DOCUMENT_BOUNDS'
  | 'EVIDENCE_OUT_OF_SEGMENT_BOUNDS'
  | 'EVIDENCE_TEXT_MISMATCH'
  | 'DUPLICATE_CLAIM';

export type ClaimGateError = {
  code: ClaimGateErrorCode;
  message: string;
  path?: Array<string | number>;
};

export type RejectedClaim = {
  index: number;
  candidate: unknown;
  errors: ClaimGateError[];
};

export type ClaimGateResult = {
  accepted: Claim[];
  rejected: RejectedClaim[];
  outputErrors: ClaimGateError[];
};

const ReaderEnvelopeSchema = z.object({
  segmentId: z.string().min(1),
  claims: z.array(z.unknown()),
}).strict();

function makeClaimId(candidate: ClaimCandidate): string {
  const identity = JSON.stringify({
    documentId: candidate.evidence.documentId,
    segmentId: candidate.evidence.segmentId,
    startOffset: candidate.evidence.startOffset,
    endOffset: candidate.evidence.endOffset,
    claim: candidate.claim,
    claimType: candidate.claimType,
    speaker: candidate.speaker,
    stance: candidate.stance,
  });
  const digest = createHash('sha256').update(identity).digest('hex').slice(0, 12);
  return `${candidate.evidence.documentId}:claim-${digest}`;
}

function schemaErrors(error: z.ZodError): ClaimGateError[] {
  return error.issues.map(issue => ({
    code: 'SCHEMA_INVALID',
    message: issue.message,
    path: issue.path,
  }));
}

function validateEvidence(
  candidate: ClaimCandidate,
  document: Document,
  segment: Segment,
): ClaimGateError[] {
  const errors: ClaimGateError[] = [];
  const evidence = candidate.evidence;

  if (evidence.documentId !== document.id) {
    errors.push({
      code: 'DOCUMENT_MISMATCH',
      message: `Evidence refers to document "${evidence.documentId}", expected "${document.id}".`,
      path: ['evidence', 'documentId'],
    });
  }

  if (evidence.segmentId !== segment.id) {
    errors.push({
      code: 'SEGMENT_MISMATCH',
      message: `Evidence refers to segment "${evidence.segmentId}", expected "${segment.id}".`,
      path: ['evidence', 'segmentId'],
    });
  }

  if (segment.documentId !== document.id) {
    errors.push({
      code: 'SEGMENT_DOCUMENT_MISMATCH',
      message: `Segment "${segment.id}" does not belong to document "${document.id}".`,
      path: ['evidence', 'segmentId'],
    });
  }

  if (
    evidence.startOffset < segment.startOffset
    || evidence.endOffset > segment.endOffset
  ) {
    errors.push({
      code: 'EVIDENCE_OUT_OF_SEGMENT_BOUNDS',
      message: `Evidence offsets [${evidence.startOffset}, ${evidence.endOffset}) are outside segment bounds [${segment.startOffset}, ${segment.endOffset}).`,
      path: ['evidence'],
    });
  }

  if (
    evidence.startOffset < 0
    || evidence.endOffset > document.content.length
    || evidence.endOffset <= evidence.startOffset
  ) {
    errors.push({
      code: 'EVIDENCE_OUT_OF_DOCUMENT_BOUNDS',
      message: `Evidence offsets [${evidence.startOffset}, ${evidence.endOffset}) are outside document bounds [0, ${document.content.length}).`,
      path: ['evidence'],
    });
  } else if (document.content.slice(evidence.startOffset, evidence.endOffset) !== evidence.text) {
    errors.push({
      code: 'EVIDENCE_TEXT_MISMATCH',
      message: 'Evidence text does not exactly match the document at the supplied offsets.',
      path: ['evidence', 'text'],
    });
  }

  return errors;
}

/**
 * Validates untrusted reader output one claim at a time. A malformed claim does
 * not prevent independent valid claims in the same response from being used.
 */
export function gateReaderOutput(
  output: unknown,
  document: Document,
  segment: Segment,
): ClaimGateResult {
  const envelope = ReaderEnvelopeSchema.safeParse(output);
  if (!envelope.success) {
    return {
      accepted: [],
      rejected: [],
      outputErrors: envelope.error.issues.map(issue => ({
        code: 'INVALID_READER_OUTPUT',
        message: issue.message,
        path: issue.path,
      })),
    };
  }

  if (envelope.data.segmentId !== segment.id) {
    return {
      accepted: [],
      rejected: [],
      outputErrors: [{
        code: 'SEGMENT_MISMATCH',
        message: `Reader output refers to segment "${envelope.data.segmentId}", expected "${segment.id}".`,
        path: ['segmentId'],
      }],
    };
  }

  const accepted: Claim[] = [];
  const rejected: RejectedClaim[] = [];
  const acceptedIds = new Set<string>();

  for (const [index, untrustedCandidate] of envelope.data.claims.entries()) {
    const parsed = ClaimCandidateSchema.safeParse(untrustedCandidate);
    if (!parsed.success) {
      rejected.push({
        index,
        candidate: untrustedCandidate,
        errors: schemaErrors(parsed.error),
      });
      continue;
    }

    const candidate = parsed.data;
    const errors = validateEvidence(candidate, document, segment);
    const id = makeClaimId(candidate);
    if (acceptedIds.has(id)) {
      errors.push({
        code: 'DUPLICATE_CLAIM',
        message: `Claim "${id}" duplicates an already accepted claim.`,
      });
    }

    if (errors.length > 0) {
      rejected.push({ index, candidate: untrustedCandidate, errors });
      continue;
    }

    accepted.push({ id, ...candidate });
    acceptedIds.add(id);
  }

  return { accepted, rejected, outputErrors: [] };
}
