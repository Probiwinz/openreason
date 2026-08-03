# How OpenReason Works

OpenReason follows a simple pipeline:

```text
Input → Segments → Reader → Claim gate → Semantic verification → Optional claim ledger
      → Intent → Frameworks → Evidence statuses → Analysis packet → Final report
```

The current implementation does not pretend to replace the LLM. Instead, it structures the work so that the LLM has to make its method visible.

For plain-text and Markdown inputs, OpenReason can first create traceable segments without using an AI model. Each segment keeps an exact source offset and a stable ID. This preparation step is independent of intent detection and can be used by future claim or source-processing stages.

The optional reader path extracts claims, validates their exact source spans,
and checks whether each claim faithfully represents its containing segment. A
document-wide reconciler can then record duplicates, support, qualifications,
contradictions, shared topics, speaker differences, time differences, and open
relationships in a `DocumentClaimLedger`.

This ledger does not decide which claim is true. It retains every final claim
and its evidence, records unresolved conflicts, and keeps an audit trail of the
agent rationale and local validation. External source verification is a later,
separate stage.

The same ledger can later support progressive disclosure: a simple result view,
an expandable reasoning view, and a complete provenance/audit view.
