# Document Claim Ledger and Reconciliation

The document claim reconciler runs only after semantic verification has produced
`finalClaims` for the complete document.

```text
Document
→ segments
→ reader and hard evidence gate
→ semantic claim verifier
→ finalClaims
→ document claim reconciler
→ DocumentClaimLedger
```

Its job is organization, not truth adjudication. It records how claims within
the supplied document relate to one another. It never searches for outside
sources, decides which speaker is correct, discards a claim, or replaces an
evidence span.

## Relationship vocabulary

Every accepted relationship uses one of these labels:

- `duplicate` — materially the same proposition; both claims remain in the ledger
- `supports` — one claim supplies a reason or evidence for another
- `contradicts` — the propositions cannot both hold under the same scope
- `qualifies` — one claim narrows, conditions, or adds a material caveat
- `same_topic` — related subject without a defensible stronger relationship
- `different_time` — a material temporal difference contextualizes the pair
- `different_speaker` — the pair has materially different attribution
- `unresolved` — the relationship cannot safely be classified from the document

More than one relationship can describe a pair. For example, two claims can be
both `contradicts` and `different_speaker`. The contextual relationship is
recorded, but it does not silently resolve the contradiction.

## Canonical ledger

`DocumentClaimLedger` contains:

- `claims` — every input final claim, with the same claim ID and evidence values
- `relationships` — only locally validated model decisions, with stable IDs
- `clusters` — deterministic connected groups, including singleton claims
- `unresolvedConflicts` — every contradiction or explicitly unresolved pair
- `auditRecords` — the agent, decision, rationale, and local accept/reject outcome
- structured `outputErrors` and `executionErrors`

`duplicate` is a relationship, not a merge instruction. No claim disappears.
Provider output cannot supply claims or evidence; local code builds the ledger
from the trusted `finalClaims` input and accepts only relationship metadata.

## Provider boundary and failure isolation

Implementations conform to the provider-neutral interface:

```typescript
interface DocumentClaimReconcilerAgent {
  readonly id: string;
  reconcileClaims(request: DocumentClaimReconcilerRequest): Promise<unknown>;
}
```

The `unknown` response first passes a local envelope schema and then a strict
per-decision gate. A malformed decision is rejected without losing independent
valid decisions. A failed provider call yields a ledger that still contains all
input claims, plus an execution error and audit record.

`MockDocumentClaimReconcilerAgent` is the deterministic test adapter.
`CodexSubagentClaimReconcilerAgent` runs the project custom agent
`openreason_claim_reconciler` with a read-only sandbox, disabled web search,
no shell environment inheritance, and a strict JSON output schema. These
restrictions reduce capability at the model boundary; the local gate remains the
authority for what enters the ledger.

Run the full optional path with:

```bash
npx tsx src/cli.ts read input.md --reconcile --out reports/ledger.json
```

`--reconcile` implies semantic verification. Without `--verify` or
`--reconcile`, the existing reader output shape is unchanged. `--verify` alone
continues to add only the semantic-verification result.

## Boundary from external fact-checking

Reconciliation asks:

> How do the propositions stated in this document relate to one another?

External fact-checking asks:

> Which propositions are supported by evidence outside this document?

Those are deliberately separate stages. A document can faithfully report two
incompatible speakers without OpenReason having grounds to call either one true.
`unresolvedConflicts` preserves that uncertainty for a future, optional source
verification stage.

## Progressive disclosure

The ledger is designed for three later presentation levels backed by the same
data rather than three separately generated stories:

1. **Result** — a short claim summary and visible conflict status.
2. **Reasoning** — relationships, speakers, timing, and concise rationales.
3. **Audit trail** — original claim IDs, exact evidence spans, agent identity,
   local gate decisions, errors, and the complete transformation history.

This lets the ordinary interface stay simple while the full provenance remains
available under the surface.
