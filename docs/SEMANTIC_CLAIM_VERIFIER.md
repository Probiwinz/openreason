# Semantic Claim Verifier

The semantic claim verifier runs after the deterministic claim gate.

```text
Document
→ deterministic segments
→ reader claim candidates
→ hard claim gate
→ semantic claim verifier
→ canonical final claims
```

The hard gate answers a structural question: does the quoted evidence exist at the supplied document and segment offsets?

The semantic verifier answers a different question: does the normalized claim faithfully represent that evidence in its surrounding segment?

It does **not** decide whether the proposition is true outside the document. External source verification remains a separate stage.

## Decisions

Each gated claim receives exactly one decision:

- `accepted` — the existing claim is faithful and atomic.
- `rewrite` — the claim is repairable. One or more replacement claims are returned.
- `rejected` — the segment does not support a recoverable claim or does not contain enough context.

A rewrite may split one bundled claim into multiple independently checkable claims. All rewritten claims retain the original hard-gated evidence span. The verifier cannot replace document IDs, segment IDs, quotes, or offsets.

## Checks

The verifier checks:

- semantic faithfulness and unsupported additions
- lost uncertainty, conditions, scope, timing, or attribution
- negation and stance
- speaker attribution
- claim-type classification
- atomicity
- whether the segment supplies enough context

Issue codes are machine-readable and defined in `src/claim-verifier.ts`.

## Provider-neutral API

Implementations conform to `ClaimVerifierAgent`:

```typescript
interface ClaimVerifierAgent {
  readonly id: string;
  verifyClaim(request: ClaimVerifierRequest): Promise<unknown>;
}
```

Provider output is intentionally typed as `unknown`. `gateClaimVerification()` validates it locally before any accepted or rewritten claim can continue.

`runClaimVerifier()` isolates failures claim by claim and returns:

- `accepted` — unchanged accepted claims
- `rewritten` — locally constructed replacement claims
- `finalClaims` — the canonical union of accepted and rewritten claims
- `rejectedClaimIds`
- structured output and execution errors
- verification records linking source claim IDs to final claim IDs

## Codex adapter

`CodexSubagentClaimVerifierAgent` delegates each claim to the read-only project custom agent `openreason_claim_verifier` with no inherited conversation history, web search, shell access, or file access.

Run the combined reader and semantic-verifier path with:

```bash
npx tsx src/cli.ts read input.md --verify --out reports/claims.json
```

The verifier receives the full containing segment for context, while local code preserves the exact evidence span that already passed the hard gate.
