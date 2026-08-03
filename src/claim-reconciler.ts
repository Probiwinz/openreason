import { createHash } from 'node:crypto';
import { z } from 'zod';
import type { Claim } from './claim-schema.js';

export const ClaimRelationshipTypeSchema = z.enum([
  'duplicate',
  'supports',
  'contradicts',
  'qualifies',
  'same_topic',
  'different_time',
  'different_speaker',
  'unresolved',
]);
export type ClaimRelationshipType = z.infer<typeof ClaimRelationshipTypeSchema>;

export const ClaimRelationshipDecisionSchema = z.object({
  sourceClaimId: z.string().min(1),
  targetClaimId: z.string().min(1),
  relationship: ClaimRelationshipTypeSchema,
  confidence: z.number().min(0).max(1),
  rationale: z.string().trim().min(1),
}).strict();
export type ClaimRelationshipDecision = z.infer<typeof ClaimRelationshipDecisionSchema>;

/**
 * Only the envelope is parsed here so one malformed decision cannot discard
 * independent valid decisions. Every item is gated separately below.
 */
export const DocumentClaimReconcilerOutputSchema = z.object({
  documentId: z.string().min(1),
  decisions: z.array(z.unknown()),
}).strict();

export type DocumentClaimReconcilerRequest = {
  documentId: string;
  claims: readonly Claim[];
};

/** Provider-neutral reconciler. Provider output remains untrusted until gated. */
export interface DocumentClaimReconcilerAgent {
  readonly id: string;
  reconcileClaims(request: DocumentClaimReconcilerRequest): Promise<unknown>;
}

export class DocumentClaimReconcilerAbortError extends Error {
  override readonly name = 'DocumentClaimReconcilerAbortError';
}

export type DocumentClaimRelationship = {
  id: string;
  sourceClaimId: string;
  targetClaimId: string;
  type: ClaimRelationshipType;
  confidence: number;
  rationale: string;
  decidedBy: string;
};

export type DocumentClaimCluster = {
  id: string;
  claimIds: string[];
  relationshipIds: string[];
};

export type UnresolvedClaimConflict = {
  id: string;
  claimIds: [string, string];
  relationshipIds: string[];
  contextRelationshipIds: string[];
  kind: 'contradiction' | 'unresolved_relationship';
  rationale: string;
  status: 'unresolved';
};

export type DocumentClaimAuditRecord = {
  id: string;
  sequence: number;
  agentId: string;
  action: 'relationship_accepted' | 'relationship_rejected' | 'agent_failed';
  claimIds: string[];
  relationshipType?: ClaimRelationshipType;
  relationshipId?: string;
  rationale: string;
};

export type ReconcilerOutputErrorCode =
  | 'INVALID_RECONCILER_OUTPUT'
  | 'DOCUMENT_ID_MISMATCH'
  | 'INVALID_RELATIONSHIP_DECISION'
  | 'UNKNOWN_CLAIM_ID'
  | 'SELF_RELATIONSHIP'
  | 'DUPLICATE_RELATIONSHIP'
  | 'CLAIM_DOCUMENT_MISMATCH';

export type ReconcilerOutputError = {
  code: ReconcilerOutputErrorCode;
  message: string;
  decisionIndex?: number;
  path?: Array<string | number>;
};

export type ReconcilerExecutionError = {
  agentId: string;
  message: string;
};

export type DocumentClaimLedger = {
  schemaVersion: '1.0';
  id: string;
  documentId: string;
  claims: Claim[];
  relationships: DocumentClaimRelationship[];
  clusters: DocumentClaimCluster[];
  unresolvedConflicts: UnresolvedClaimConflict[];
  auditRecords: DocumentClaimAuditRecord[];
  outputErrors: ReconcilerOutputError[];
  executionErrors: ReconcilerExecutionError[];
};

export type MockDocumentClaimReconcilerHandler = (
  request: DocumentClaimReconcilerRequest,
) => unknown | Promise<unknown>;

/** Deterministic test/provider substitute: the same handler input yields the same output. */
export class MockDocumentClaimReconcilerAgent implements DocumentClaimReconcilerAgent {
  readonly calls: DocumentClaimReconcilerRequest[] = [];

  constructor(
    private readonly handler: MockDocumentClaimReconcilerHandler,
    readonly id = 'mock-document-claim-reconciler',
  ) {}

  async reconcileClaims(request: DocumentClaimReconcilerRequest): Promise<unknown> {
    this.calls.push(request);
    return this.handler(request);
  }
}

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 12);
}

const symmetricRelationships = new Set<ClaimRelationshipType>([
  'duplicate',
  'contradicts',
  'same_topic',
  'different_time',
  'different_speaker',
  'unresolved',
]);

function normalizedEndpoints(
  decision: ClaimRelationshipDecision,
): [string, string] {
  if (!symmetricRelationships.has(decision.relationship)) {
    return [decision.sourceClaimId, decision.targetClaimId];
  }
  return [decision.sourceClaimId, decision.targetClaimId].sort() as [string, string];
}

function relationshipIdentity(
  sourceClaimId: string,
  targetClaimId: string,
  type: ClaimRelationshipType,
): string {
  return JSON.stringify({ sourceClaimId, targetClaimId, type });
}

function cloneClaims(claims: readonly Claim[]): Claim[] {
  return claims.map(claim => ({
    ...claim,
    evidence: { ...claim.evidence },
  }));
}

function buildClusters(
  claims: readonly Claim[],
  relationships: readonly DocumentClaimRelationship[],
): DocumentClaimCluster[] {
  const parent = new Map(claims.map(claim => [claim.id, claim.id]));

  const find = (id: string): string => {
    const current = parent.get(id);
    if (!current || current === id) return id;
    const root = find(current);
    parent.set(id, root);
    return root;
  };

  const union = (left: string, right: string): void => {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot === rightRoot) return;
    const [first, second] = [leftRoot, rightRoot].sort();
    parent.set(second, first);
  };

  for (const relationship of relationships) {
    union(relationship.sourceClaimId, relationship.targetClaimId);
  }

  const claimsByRoot = new Map<string, string[]>();
  for (const claim of claims) {
    const root = find(claim.id);
    const group = claimsByRoot.get(root) ?? [];
    group.push(claim.id);
    claimsByRoot.set(root, group);
  }

  return [...claimsByRoot.values()]
    .map(claimIds => claimIds.sort())
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(claimIds => {
      const claimIdSet = new Set(claimIds);
      const relationshipIds = relationships
        .filter(relationship =>
          claimIdSet.has(relationship.sourceClaimId)
          && claimIdSet.has(relationship.targetClaimId))
        .map(relationship => relationship.id)
        .sort();
      return {
        id: `cluster-${digest(JSON.stringify(claimIds))}`,
        claimIds,
        relationshipIds,
      };
    });
}

function buildUnresolvedConflicts(
  relationships: readonly DocumentClaimRelationship[],
): UnresolvedClaimConflict[] {
  const contextualTypes = new Set<ClaimRelationshipType>([
    'different_time',
    'different_speaker',
  ]);

  return relationships
    .filter(relationship =>
      relationship.type === 'contradicts' || relationship.type === 'unresolved')
    .map(relationship => {
      const claimIds = [
        relationship.sourceClaimId,
        relationship.targetClaimId,
      ].sort() as [string, string];
      const contextRelationshipIds = relationships
        .filter(candidate => {
          const candidateIds = [candidate.sourceClaimId, candidate.targetClaimId].sort();
          return contextualTypes.has(candidate.type)
            && candidateIds[0] === claimIds[0]
            && candidateIds[1] === claimIds[1];
        })
        .map(candidate => candidate.id)
        .sort();

      return {
        id: `conflict-${digest(relationship.id)}`,
        claimIds,
        relationshipIds: [relationship.id],
        contextRelationshipIds,
        kind: relationship.type === 'contradicts'
          ? 'contradiction' as const
          : 'unresolved_relationship' as const,
        rationale: relationship.rationale,
        status: 'unresolved' as const,
      };
    });
}

function finalizeLedger(
  documentId: string,
  claims: readonly Claim[],
  relationships: DocumentClaimRelationship[],
  auditRecords: DocumentClaimAuditRecord[],
  outputErrors: ReconcilerOutputError[],
  executionErrors: ReconcilerExecutionError[] = [],
): DocumentClaimLedger {
  relationships.sort((left, right) => left.id.localeCompare(right.id));
  const canonicalClaims = cloneClaims(claims).sort((left, right) => left.id.localeCompare(right.id));
  return {
    schemaVersion: '1.0',
    id: `ledger-${digest(JSON.stringify({
      documentId,
      claimIds: canonicalClaims.map(claim => claim.id),
      relationshipIds: relationships.map(relationship => relationship.id),
    }))}`,
    documentId,
    claims: canonicalClaims,
    relationships,
    clusters: buildClusters(canonicalClaims, relationships),
    unresolvedConflicts: buildUnresolvedConflicts(relationships),
    auditRecords,
    outputErrors,
    executionErrors,
  };
}

function rejectedAudit(
  agentId: string,
  sequence: number,
  rationale: string,
  decision?: Partial<ClaimRelationshipDecision>,
): DocumentClaimAuditRecord {
  return {
    id: `audit-${digest(JSON.stringify({ agentId, sequence, rationale }))}`,
    sequence,
    agentId,
    action: 'relationship_rejected',
    claimIds: [decision?.sourceClaimId, decision?.targetClaimId]
      .filter((value): value is string => typeof value === 'string'),
    ...(decision?.relationship ? { relationshipType: decision.relationship } : {}),
    rationale,
  };
}

/**
 * Converts untrusted provider output into a canonical ledger. Claims and their
 * evidence are copied verbatim from local input; provider output can only add
 * validated relationships and rationale.
 */
export function gateDocumentClaimReconciliation(
  output: unknown,
  documentId: string,
  claims: readonly Claim[],
  agentId: string,
): DocumentClaimLedger {
  const relationships: DocumentClaimRelationship[] = [];
  const auditRecords: DocumentClaimAuditRecord[] = [];
  const outputErrors: ReconcilerOutputError[] = [];
  const claimsById = new Map<string, Claim>();

  for (const claim of claims) {
    if (claim.evidence.documentId !== documentId) {
      outputErrors.push({
        code: 'CLAIM_DOCUMENT_MISMATCH',
        message: `Claim "${claim.id}" belongs to document "${claim.evidence.documentId}", not "${documentId}".`,
      });
      continue;
    }
    claimsById.set(claim.id, claim);
  }

  const parsedEnvelope = DocumentClaimReconcilerOutputSchema.safeParse(output);
  if (!parsedEnvelope.success) {
    for (const issue of parsedEnvelope.error.issues) {
      outputErrors.push({
        code: 'INVALID_RECONCILER_OUTPUT',
        message: issue.message,
        path: issue.path,
      });
    }
    auditRecords.push(rejectedAudit(
      agentId,
      0,
      'Local gate rejected the reconciler envelope.',
    ));
    return finalizeLedger(documentId, claims, relationships, auditRecords, outputErrors);
  }

  if (parsedEnvelope.data.documentId !== documentId) {
    const message = `Reconciler output refers to document "${parsedEnvelope.data.documentId}", expected "${documentId}".`;
    outputErrors.push({
      code: 'DOCUMENT_ID_MISMATCH',
      message,
      path: ['documentId'],
    });
    auditRecords.push(rejectedAudit(agentId, 0, message));
    return finalizeLedger(documentId, claims, relationships, auditRecords, outputErrors);
  }

  const relationshipKeys = new Set<string>();
  for (const [decisionIndex, untrustedDecision] of parsedEnvelope.data.decisions.entries()) {
    const sequence = decisionIndex + 1;
    const parsedDecision = ClaimRelationshipDecisionSchema.safeParse(untrustedDecision);
    if (!parsedDecision.success) {
      for (const issue of parsedDecision.error.issues) {
        outputErrors.push({
          code: 'INVALID_RELATIONSHIP_DECISION',
          message: issue.message,
          decisionIndex,
          path: issue.path,
        });
      }
      auditRecords.push(rejectedAudit(
        agentId,
        sequence,
        'Local gate rejected an invalid relationship decision.',
      ));
      continue;
    }

    const decision = parsedDecision.data;
    const missingIds = [decision.sourceClaimId, decision.targetClaimId]
      .filter(claimId => !claimsById.has(claimId));
    if (missingIds.length > 0) {
      const message = `Relationship refers to unknown claim id(s): ${missingIds.join(', ')}.`;
      outputErrors.push({ code: 'UNKNOWN_CLAIM_ID', message, decisionIndex });
      auditRecords.push(rejectedAudit(agentId, sequence, message, decision));
      continue;
    }

    if (decision.sourceClaimId === decision.targetClaimId) {
      const message = 'A claim cannot have a reconciliation relationship with itself.';
      outputErrors.push({ code: 'SELF_RELATIONSHIP', message, decisionIndex });
      auditRecords.push(rejectedAudit(agentId, sequence, message, decision));
      continue;
    }

    const [sourceClaimId, targetClaimId] = normalizedEndpoints(decision);
    const identity = relationshipIdentity(
      sourceClaimId,
      targetClaimId,
      decision.relationship,
    );
    if (relationshipKeys.has(identity)) {
      const message = 'The same relationship was already accepted for this claim pair.';
      outputErrors.push({ code: 'DUPLICATE_RELATIONSHIP', message, decisionIndex });
      auditRecords.push(rejectedAudit(agentId, sequence, message, decision));
      continue;
    }

    relationshipKeys.add(identity);
    const relationship: DocumentClaimRelationship = {
      id: `relationship-${digest(identity)}`,
      sourceClaimId,
      targetClaimId,
      type: decision.relationship,
      confidence: decision.confidence,
      rationale: decision.rationale,
      decidedBy: agentId,
    };
    relationships.push(relationship);
    auditRecords.push({
      id: `audit-${digest(JSON.stringify({ agentId, sequence, relationshipId: relationship.id }))}`,
      sequence,
      agentId,
      action: 'relationship_accepted',
      claimIds: [sourceClaimId, targetClaimId],
      relationshipType: relationship.type,
      relationshipId: relationship.id,
      rationale: decision.rationale,
    });
  }

  return finalizeLedger(documentId, claims, relationships, auditRecords, outputErrors);
}

function executionMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Runs one document-wide reconciliation call without risking existing claims. */
export async function runDocumentClaimReconciler(
  documentId: string,
  claims: readonly Claim[],
  agent: DocumentClaimReconcilerAgent,
): Promise<DocumentClaimLedger> {
  const trustedClaims = cloneClaims(claims);
  const providerClaims = cloneClaims(trustedClaims);
  try {
    const output = await agent.reconcileClaims({ documentId, claims: providerClaims });
    return gateDocumentClaimReconciliation(output, documentId, trustedClaims, agent.id);
  } catch (error) {
    if (error instanceof DocumentClaimReconcilerAbortError) throw error;
    const message = executionMessage(error);
    return finalizeLedger(
      documentId,
      trustedClaims,
      [],
      [{
        id: `audit-${digest(JSON.stringify({ agentId: agent.id, message }))}`,
        sequence: 0,
        agentId: agent.id,
        action: 'agent_failed',
        claimIds: [],
        rationale: message,
      }],
      [],
      [{ agentId: agent.id, message }],
    );
  }
}
