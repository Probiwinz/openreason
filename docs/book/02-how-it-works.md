# How OpenReason Works

OpenReason follows a simple pipeline:

```text
Input → Optional deterministic segments → Intent → Frameworks → Evidence statuses → Analysis packet → Final report
```

The current implementation does not pretend to replace the LLM. Instead, it structures the work so that the LLM has to make its method visible.

For plain-text and Markdown inputs, OpenReason can first create traceable segments without using an AI model. Each segment keeps an exact source offset and a stable ID. This preparation step is independent of intent detection and can be used by future claim or source-processing stages.
