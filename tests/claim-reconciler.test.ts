import { describe, expect, it } from 'vitest';
import type { Claim } from '../src/claim-schema.js';
import {
  ClaimRelationshipTypeSchema,
  gateDocumentClaimReconciliation,
  MockDocumentClaimReconcilerAgent,
  runDocumentClaimReconciler,
} from '../src/claim-reconciler.js';
import { createDocument, segmentDocument } from '../src/segmenter.js';

const content = [
  'The report estimates the project will cost 20 million euros.',
  'The project is expected to cost about 20 million euros.',
  'The original 2024 estimate was 18 million euros.',
  'The opposition expects the final cost to reach 25 million euros.',
  'The minister says the cost will not exceed 20 million euros.',
].join('\n\n');
const document = createDocument(content, { id: 'doc-ledger-test' });
const segments = segmentDocument(document);

function claimFor(
  index: number,
  claim: string,
  overrides: Partial<Claim> = {},
): Claim {
  const segment = segments[index];
  return {
    id: `${document.id}:claim-${index}`,
    claim,
    claimType: 'predictive',
    speaker: null,
    stance: 'asserted',
    evidence: {
      documentId: document.id,
      segmentId: segment.id,
      text: segment.text,
      startOffset: segment.startOffset,
      endOffset: segment.endOffset,
    },
    confidence: 0.9,
    requiresExternalVerification: true,
    ...overrides,
  };
}

const claims = [
  claimFor(0, 'The project will cost 20 million euros.'),
  claimFor(1, 'The project will cost approximately 20 million euros.'),
  claimFor(2, 'The project was estimated at 18 million euros in 2024.'),
  claimFor(3, 'The project will cost 25 million euros.', { speaker: 'the opposition' }),
  claimFor(4, 'The project will not exceed 20 million euros.', { speaker: 'the minister' }),
];

function decision(
  sourceClaimId: string,
  targetClaimId: string,
  relationship: string,
  rationale = `${relationship} based on the supplied document claims.`,
) {
  return {
    sourceClaimId,
    targetClaimId,
    relationship,
    confidence: 0.9,
    rationale,
  };
}

describe('Document Claim Reconciler gate', () => {
  it('represents every required relationship label', () => {
    expect(ClaimRelationshipTypeSchema.options).toEqual([
      'duplicate',
      'supports',
      'contradicts',
      'qualifies',
      'same_topic',
      'different_time',
      'different_speaker',
      'unresolved',
    ]);
  });

  it('records duplicate claims without merging or discarding either provenance chain', () => {
    const originalClaims = structuredClone(claims.slice(0, 2));
    const ledger = gateDocumentClaimReconciliation({
      documentId: document.id,
      decisions: [decision(
        claims[1].id,
        claims[0].id,
        'duplicate',
        'Both claims express the same approximate 20 million euro estimate.',
      )],
    }, document.id, claims.slice(0, 2), 'test-agent');

    expect(ledger.claims).toEqual(originalClaims);
    expect(ledger.claims).toHaveLength(2);
    expect(ledger.relationships).toHaveLength(1);
    expect(ledger.relationships[0]).toMatchObject({
      sourceClaimId: claims[0].id,
      targetClaimId: claims[1].id,
      type: 'duplicate',
      decidedBy: 'test-agent',
    });
    expect(ledger.clusters[0].claimIds).toEqual([claims[0].id, claims[1].id]);
    expect(ledger.auditRecords[0]).toMatchObject({
      agentId: 'test-agent',
      action: 'relationship_accepted',
      relationshipType: 'duplicate',
      rationale: 'Both claims express the same approximate 20 million euro estimate.',
    });
    expect(ledger.claims.map(claim => claim.evidence)).toEqual(
      originalClaims.map(claim => claim.evidence),
    );
  });

  it('keeps qualification directional and preserves both original claims', () => {
    const ledger = gateDocumentClaimReconciliation({
      documentId: document.id,
      decisions: [decision(
        claims[2].id,
        claims[0].id,
        'qualifies',
        'The 18 million figure is explicitly limited to the original 2024 estimate.',
      )],
    }, document.id, [claims[0], claims[2]], 'test-agent');

    expect(ledger.relationships[0]).toMatchObject({
      sourceClaimId: claims[2].id,
      targetClaimId: claims[0].id,
      type: 'qualifies',
    });
    expect(ledger.claims.map(claim => claim.id).sort()).toEqual(
      [claims[0].id, claims[2].id].sort(),
    );
  });

  it('keeps a genuine contradiction unresolved even with speaker and time context', () => {
    const ledger = gateDocumentClaimReconciliation({
      documentId: document.id,
      decisions: [
        decision(claims[3].id, claims[4].id, 'contradicts', '25 million exceeds the stated 20 million ceiling.'),
        decision(claims[3].id, claims[4].id, 'different_speaker', 'The claims are attributed to the opposition and the minister.'),
        decision(claims[3].id, claims[4].id, 'different_time', 'One is a final-cost expectation and the other is a current ceiling claim.'),
      ],
    }, document.id, [claims[3], claims[4]], 'test-agent');

    expect(ledger.relationships.map(item => item.type).sort()).toEqual([
      'contradicts',
      'different_speaker',
      'different_time',
    ]);
    expect(ledger.unresolvedConflicts).toHaveLength(1);
    expect(ledger.unresolvedConflicts[0]).toMatchObject({
      kind: 'contradiction',
      status: 'unresolved',
      claimIds: [claims[3].id, claims[4].id].sort(),
    });
    expect(ledger.unresolvedConflicts[0].contextRelationshipIds).toHaveLength(2);
  });

  it('accepts supports, same-topic, and unresolved decisions without making a truth decision', () => {
    const ledger = gateDocumentClaimReconciliation({
      documentId: document.id,
      decisions: [
        decision(claims[1].id, claims[0].id, 'supports'),
        decision(claims[2].id, claims[0].id, 'same_topic'),
        decision(claims[2].id, claims[1].id, 'unresolved'),
      ],
    }, document.id, claims.slice(0, 3), 'test-agent');

    expect(ledger.relationships.map(item => item.type).sort()).toEqual([
      'same_topic',
      'supports',
      'unresolved',
    ]);
    expect(ledger.unresolvedConflicts).toHaveLength(1);
    expect(ledger.unresolvedConflicts[0].kind).toBe('unresolved_relationship');
    expect(ledger.claims).toHaveLength(3);
  });

  it('isolates an invalid provider decision while retaining independent valid decisions', () => {
    const ledger = gateDocumentClaimReconciliation({
      documentId: document.id,
      decisions: [
        decision(claims[0].id, claims[1].id, 'duplicate'),
        {
          ...decision(claims[1].id, claims[2].id, 'invented_relationship'),
          evidence: { overwritten: true },
        },
        decision(claims[2].id, claims[0].id, 'qualifies'),
      ],
    }, document.id, claims.slice(0, 3), 'test-agent');

    expect(ledger.relationships.map(item => item.type).sort()).toEqual([
      'duplicate',
      'qualifies',
    ]);
    expect(ledger.outputErrors.some(error =>
      error.code === 'INVALID_RELATIONSHIP_DECISION' && error.decisionIndex === 1,
    )).toBe(true);
    expect(ledger.auditRecords.map(record => record.action)).toEqual([
      'relationship_accepted',
      'relationship_rejected',
      'relationship_accepted',
    ]);
  });

  it('rejects unknown claim ids without discarding local claims', () => {
    const original = structuredClone(claims[0]);
    const ledger = gateDocumentClaimReconciliation({
      documentId: document.id,
      decisions: [decision(claims[0].id, 'provider-invented-claim', 'supports')],
    }, document.id, [claims[0]], 'test-agent');

    expect(ledger.relationships).toEqual([]);
    expect(ledger.claims).toEqual([original]);
    expect(ledger.outputErrors.map(error => error.code)).toContain('UNKNOWN_CLAIM_ID');
  });

  it('never lets provider data replace claims or evidence', () => {
    const original = structuredClone(claims[0]);
    const ledger = gateDocumentClaimReconciliation({
      documentId: document.id,
      decisions: [],
      claims: [{
        ...claims[0],
        evidence: { ...claims[0].evidence, text: 'provider replacement' },
      }],
    }, document.id, [claims[0]], 'test-agent');

    expect(ledger.relationships).toEqual([]);
    expect(ledger.claims).toEqual([original]);
    expect(ledger.outputErrors.map(error => error.code)).toContain('INVALID_RECONCILER_OUTPUT');
  });

  it('produces stable ledger, relationship, cluster, conflict, and audit ids', () => {
    const output = {
      documentId: document.id,
      decisions: [
        decision(claims[0].id, claims[1].id, 'duplicate'),
        decision(claims[3].id, claims[4].id, 'contradicts'),
      ],
    };
    const first = gateDocumentClaimReconciliation(output, document.id, claims, 'stable-agent');
    const second = gateDocumentClaimReconciliation(output, document.id, claims, 'stable-agent');

    expect(second.id).toBe(first.id);
    expect(second.relationships.map(item => item.id)).toEqual(
      first.relationships.map(item => item.id),
    );
    expect(second.clusters.map(item => item.id)).toEqual(first.clusters.map(item => item.id));
    expect(second.unresolvedConflicts.map(item => item.id)).toEqual(
      first.unresolvedConflicts.map(item => item.id),
    );
    expect(second.auditRecords.map(item => item.id)).toEqual(
      first.auditRecords.map(item => item.id),
    );
  });
});

describe('runDocumentClaimReconciler', () => {
  it('sends all final claims in one document-wide provider-neutral request', async () => {
    const agent = new MockDocumentClaimReconcilerAgent(request => ({
      documentId: request.documentId,
      decisions: [decision(request.claims[0].id, request.claims[1].id, 'duplicate')],
    }));

    const ledger = await runDocumentClaimReconciler(document.id, claims, agent);

    expect(agent.calls).toHaveLength(1);
    expect(agent.calls[0]).toEqual({ documentId: document.id, claims });
    expect(ledger.relationships[0].type).toBe('duplicate');
  });

  it('isolates an agent failure and still returns every unchanged final claim', async () => {
    const agent = new MockDocumentClaimReconcilerAgent(() => {
      throw new Error('provider unavailable');
    }, 'failing-agent');

    const ledger = await runDocumentClaimReconciler(document.id, claims, agent);

    expect(ledger.claims).toEqual(claims);
    expect(ledger.relationships).toEqual([]);
    expect(ledger.executionErrors).toEqual([{
      agentId: 'failing-agent',
      message: 'provider unavailable',
    }]);
    expect(ledger.auditRecords[0]).toMatchObject({
      agentId: 'failing-agent',
      action: 'agent_failed',
      rationale: 'provider unavailable',
    });
  });

  it('protects trusted provenance even if a provider implementation mutates its request', async () => {
    const sourceClaims = structuredClone(claims.slice(0, 2));
    const agent = new MockDocumentClaimReconcilerAgent(request => {
      request.claims[0].evidence.text = 'provider tried to overwrite evidence';
      request.claims[0].id = 'provider-tried-to-overwrite-id';
      return {
        documentId: request.documentId,
        decisions: [],
      };
    });

    const ledger = await runDocumentClaimReconciler(document.id, sourceClaims, agent);

    expect(sourceClaims).toEqual(claims.slice(0, 2));
    expect(ledger.claims).toEqual(claims.slice(0, 2));
  });
});
