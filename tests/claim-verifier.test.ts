import { describe, expect, it } from 'vitest';
import type { Claim } from '../src/claim-schema.js';
import {
  gateClaimVerification,
  MockClaimVerifierAgent,
  runClaimVerifier,
} from '../src/claim-verifier.js';
import { createDocument, segmentDocument } from '../src/segmenter.js';

const content = 'The study may indicate a small effect.\n\nThe policy lowers costs and improves access.';
const document = createDocument(content, { id: 'doc-semantic-verifier' });
const segments = segmentDocument(document);

function claimFor(
  segmentIndex: number,
  overrides: Partial<Claim> = {},
): Claim {
  const segment = segments[segmentIndex];
  return {
    id: `${document.id}:claim-${segmentIndex}`,
    claim: segment.text,
    claimType: 'empirical',
    speaker: null,
    stance: 'asserted',
    evidence: {
      documentId: document.id,
      segmentId: segment.id,
      text: segment.text,
      startOffset: segment.startOffset,
      endOffset: segment.endOffset,
    },
    confidence: 0.8,
    requiresExternalVerification: true,
    ...overrides,
  };
}

describe('gateClaimVerification', () => {
  it('preserves an accepted gated claim unchanged', () => {
    const claim = claimFor(0);
    const result = gateClaimVerification({
      claimId: claim.id,
      decision: 'accepted',
      issues: [],
      rationale: 'The normalized claim preserves the source wording and modality.',
      revisions: null,
    }, claim, 'test-verifier');

    expect(result.errors).toEqual([]);
    expect(result.finalClaims).toEqual([claim]);
    expect(result.record).toMatchObject({
      sourceClaimId: claim.id,
      verifierId: 'test-verifier',
      decision: 'accepted',
      finalClaimIds: [claim.id],
    });
  });

  it('rewrites an overstated claim while preserving its exact evidence span', () => {
    const claim = claimFor(0, {
      claim: 'The study proves a large effect.',
      confidence: 0.6,
    });
    const output = {
      claimId: claim.id,
      decision: 'rewrite',
      issues: ['UNFAITHFUL_PARAPHRASE', 'LOST_QUALIFIER'],
      rationale: 'The source is tentative and describes only a small effect.',
      revisions: [{
        claim: 'The study may indicate a small effect.',
        claimType: 'empirical',
        speaker: null,
        stance: 'uncertain',
        confidence: 0.95,
        requiresExternalVerification: true,
      }],
    };

    const first = gateClaimVerification(output, claim, 'test-verifier');
    const second = gateClaimVerification(output, claim, 'test-verifier');

    expect(first.errors).toEqual([]);
    expect(first.finalClaims).toHaveLength(1);
    expect(first.finalClaims[0].claim).toBe('The study may indicate a small effect.');
    expect(first.finalClaims[0].stance).toBe('uncertain');
    expect(first.finalClaims[0].evidence).toEqual(claim.evidence);
    expect(first.finalClaims[0].id).not.toBe(claim.id);
    expect(second.finalClaims[0].id).toBe(first.finalClaims[0].id);
  });

  it('can split a bundled claim into multiple atomic revisions', () => {
    const claim = claimFor(1);
    const result = gateClaimVerification({
      claimId: claim.id,
      decision: 'rewrite',
      issues: ['NON_ATOMIC'],
      rationale: 'The source contains two independently checkable propositions.',
      revisions: [
        {
          claim: 'The policy lowers costs.',
          claimType: 'causal',
          speaker: null,
          stance: 'asserted',
          confidence: 0.9,
          requiresExternalVerification: true,
        },
        {
          claim: 'The policy improves access.',
          claimType: 'causal',
          speaker: null,
          stance: 'asserted',
          confidence: 0.9,
          requiresExternalVerification: true,
        },
      ],
    }, claim, 'test-verifier');

    expect(result.errors).toEqual([]);
    expect(result.finalClaims.map(finalClaim => finalClaim.claim)).toEqual([
      'The policy lowers costs.',
      'The policy improves access.',
    ]);
    expect(new Set(result.finalClaims.map(finalClaim => finalClaim.id)).size).toBe(2);
    expect(result.finalClaims.every(finalClaim => finalClaim.evidence === claim.evidence)).toBe(true);
  });

  it('rejects verifier output for a different claim', () => {
    const claim = claimFor(0);
    const result = gateClaimVerification({
      claimId: 'another-claim',
      decision: 'accepted',
      issues: [],
      rationale: 'Looks faithful.',
      revisions: null,
    }, claim, 'test-verifier');

    expect(result.finalClaims).toEqual([]);
    expect(result.record).toBeUndefined();
    expect(result.errors[0].code).toBe('CLAIM_ID_MISMATCH');
  });

  it('requires actual revisions for a rewrite decision', () => {
    const claim = claimFor(0);
    const result = gateClaimVerification({
      claimId: claim.id,
      decision: 'rewrite',
      issues: ['LOST_QUALIFIER'],
      rationale: 'The claim needs repair.',
      revisions: null,
    }, claim, 'test-verifier');

    expect(result.finalClaims).toEqual([]);
    expect(result.errors.every(error => error.code === 'INVALID_VERIFIER_OUTPUT')).toBe(true);
  });
});

describe('runClaimVerifier', () => {
  it('passes the full containing segment and continues after an isolated failure', async () => {
    const firstClaim = claimFor(0);
    const secondClaim = claimFor(1);
    const verifier = new MockClaimVerifierAgent(({ claim, segment }) => {
      expect(segment.id).toBe(claim.evidence.segmentId);
      expect(segment.text).toContain(claim.evidence.text);
      if (claim.id === firstClaim.id) throw new Error('verifier unavailable');
      return {
        claimId: claim.id,
        decision: 'accepted',
        issues: [],
        rationale: 'Faithful and atomic.',
        revisions: null,
      };
    });

    const result = await runClaimVerifier(
      [firstClaim, secondClaim],
      segments,
      verifier,
    );

    expect(verifier.calls).toHaveLength(2);
    expect(result.executionErrors).toEqual([{
      claimId: firstClaim.id,
      message: 'verifier unavailable',
    }]);
    expect(result.accepted).toEqual([secondClaim]);
  });

  it('records rejected claims without forwarding them as final claims', async () => {
    const claim = claimFor(0);
    const verifier = new MockClaimVerifierAgent(() => ({
      claimId: claim.id,
      decision: 'rejected',
      issues: ['CONTEXT_INSUFFICIENT'],
      rationale: 'The evidence span does not identify what the pronoun refers to.',
      revisions: null,
    }));

    const result = await runClaimVerifier([claim], segments, verifier);

    expect(result.rejectedClaimIds).toEqual([claim.id]);
    expect(result.accepted).toEqual([]);
    expect(result.rewritten).toEqual([]);
  });
});
