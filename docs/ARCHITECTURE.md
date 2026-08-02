# Architecture — OpenReason

---

## Overview

OpenReason has three layers.
Understanding how they relate is more important than understanding any single file.

```
┌─────────────────────────────────────────────────────┐
│  Layer 3: Integration                                │
│  Claude Code (primary interface)                     │
│  Custom GPT adapter   MCP server (planned)           │
├─────────────────────────────────────────────────────┤
│  Layer 2: Reference Implementation                   │
│  TypeScript CLI — for testing and automation         │
│  Intent router → Framework resolver →                │
│  Instruction compiler → Analysis packet              │
├─────────────────────────────────────────────────────┤
│  Layer 1: Conceptual layer                           │
│  Frameworks (YAML)   Evidence model (O1–X1)          │
│  Analytical vocabulary   Verification rules          │
└─────────────────────────────────────────────────────┘
```

The conceptual layer is the foundation.
The reference implementation makes it machine-readable and testable.
The integration layer makes it usable by real people.

**The most important layer for users is Layer 3.**
**The most important layer for contributors is Layer 1.**

---

## Layer 1: Conceptual layer

### Frameworks

A framework is a structured analytical method. It is authored as a YAML file under `frameworks/`.

Each framework defines:
- **When to use it** — `intents` and `triggers` that activate it
- **What it asks** — `analysis_questions`
- **How it reasons** — `analysis_steps` and `decision_rules`
- **What it produces** — `output_fields`
- **What evidence it supports** — `evidence_statuses`
- **Where it came from** — `references` and `verification_status`
- **What it cannot do** — `limitations`

Frameworks are not prompt snippets. They are machine-readable analytical specifications validated against a schema.

Current frameworks:

| File | ID | Domain |
|---|---|---|
| `frameworks/logic/walton.yaml` | `logic-walton` | Informal logic |
| `frameworks/discourse/van_dijk.yaml` | `discourse-van-dijk` | Critical discourse analysis |
| `frameworks/framing/entman.yaml` | `framing-entman` | Framing analysis |
| `frameworks/rhetoric/aristotle.yaml` | `rhetoric-aristotle` | Rhetoric |

### Evidence-status model

The evidence model is the constraint that prevents analytical overclaiming.
Every important claim in an OpenReason analysis must carry one of ten labels: O1 through X1.

The model enforces a strict hierarchy:
- Direct observations (O1, O2) are the most reliable anchor points
- Inferences and interpretations (L1, D1, R1, F1) must be grounded in observations
- Effects and hypotheses (C1, S1, H1) must be stated with appropriate caution
- Speculation (X1) is only used when explicitly requested

See `CLAUDE.md` for the full table.

### Schema

The YAML schema for frameworks is enforced in two places:
- **Runtime**: `src/schema.ts` (Zod) — validates when frameworks are loaded
- **Tooling**: `schemas/framework.schema.json` (JSON Schema) — validates in editors and CI

Both must be kept in sync. The Zod schema is authoritative at runtime.

---

## Layer 2: Reference implementation

The TypeScript CLI (`src/`) exists for two purposes:
1. **Testing** — CI can run `npm test` and `npm run validate` to verify frameworks and pipeline logic
2. **Packet generation** — Claude Code can call the CLI to produce a structured analysis scaffold

The CLI is not the main user-facing interface.

### Public API — `ReasoningEngine`

The primary programmatic entry point is `ReasoningEngine` in `src/openreason/`:

```typescript
import { ReasoningEngine } from './src/openreason/index.js';

const engine = new ReasoningEngine();
const result = engine.analyze('Why are Iranians used as a contrast group against Somalis?');

// result.plan       — intent, activated frameworks, evidence model, compiled instructions
// result.reportScaffold — structured Markdown template ready for LLM completion
```

`ReasoningEngine.analyze(input)` is the concept the API exposes.
The internal steps (intent detection, framework resolution, instruction compilation)
are implementation details of the engine.

### `src/openreason/` — the reasoning layer

This sub-module is the new home for everything that is about *what OpenReason does*
rather than *how the CLI works*.

| Module | Responsibility |
|---|---|
| `src/openreason/index.ts` | `ReasoningEngine` class; public exports |
| `src/openreason/planner.ts` | `buildAnalysisPlan(input)` — runs the full pipeline, returns a structured `AnalysisPlan` |
| `src/openreason/evidence.ts` | `EVIDENCE_MODEL` with labels, names, meanings, confidence levels; `isValidEvidenceStatus()` |

### `src/` — internal pipeline modules (unchanged)

These modules are internal implementation details called by the reasoning layer.
They are also called directly by the CLI for backward compatibility.

| Module | Responsibility |
|---|---|
| `src/schema.ts` | Zod schemas and shared types (`Framework`, `IntentResult`, `AnalysisPlan`, `AnalysisResult`, …) |
| `src/loader.ts` | Read and validate YAML files from `frameworks/` |
| `src/router.ts` | Keyword-based intent detection |
| `src/resolver.ts` | Score frameworks against intent and input signals; select the best set |
| `src/compiler.ts` | Assemble framework content into analysis instructions (internal detail) |
| `src/engine.ts` | Deterministic Markdown packet for the CLI `analyze` command |
| `src/segmenter.ts` | Provider-independent plaintext/Markdown segmentation with stable IDs and source offsets |
| `src/cli.ts` | Expose pipeline as CLI commands (validate, inspect, segment, compile, analyze) |

### Deterministic document segmentation

`createDocument()` and `segmentDocument()` are an optional preparation layer before analysis. They do not call a model and do not change the existing intent-routing pipeline. Plaintext is split at blank lines. Markdown additionally creates explicit heading and fenced-code segments while retaining the active heading path.

Every segment has a stable ID and exclusive `startOffset`/`endOffset` values. This guarantees that `document.content.slice(startOffset, endOffset)` is exactly equal to the stored segment text, so later processing can always trace a result back to the original document.

### Full pipeline

```
engine.analyze(input)
    │
    ├── detectIntent(input)                 src/router.ts
    │   └── Returns: primaryIntent, confidence, matchedSignals
    │
    ├── loadFrameworks()                    src/loader.ts
    │   └── Returns: Framework[] from YAML files
    │
    ├── resolveFrameworks(intent, …)        src/resolver.ts
    │   └── Returns: activatedFrameworks, skippedFrameworks
    │
    ├── compileInstructions(…)              src/compiler.ts  [internal]
    │   └── Returns: Markdown instructions string
    │
    └── AnalysisResult
        ├── plan.intent
        ├── plan.frameworks
        ├── plan.evidenceModel
        ├── plan.instructions
        └── reportScaffold  (Markdown template for LLM completion)
```

### CLI commands

| Command | Purpose |
|---|---|
| `npm run validate` | Validate all YAML framework files against the schema |
| `npx tsx src/cli.ts inspect <file>` | Print the detected intent and selected frameworks as JSON |
| `npx tsx src/cli.ts segment <file>` | Print deterministic document and segment JSON with stable IDs and offsets |
| `npx tsx src/cli.ts compile <file>` | Write compiled analysis instructions to a file |
| `npx tsx src/cli.ts analyze <file> --out reports/<name>.md` | Generate a full analysis packet |
| `npm run cc:smoke` | Full health check: validate → test → build → analyze |

### Known implementation limitations

- The intent router uses keyword counting. It is brittle for inputs using non-standard vocabulary.
- The framework resolver has a hardcoded fallback to three specific framework IDs.
- The analysis packet engine (`src/engine.ts`) has a hardcoded special case for the Iran/Somalia example. The `ReasoningEngine` path does not go through this branch.

These are v0.1.0 proof-of-concept limitations, not design decisions.

---

## Layer 3: Integration layer

### Claude Code (primary interface)

Claude Code is the primary user interface for OpenReason.

```
User writes natural language
    │
    ▼
Claude Code reads CLAUDE.md (persistent instructions)
    │
    ▼
Claude Code reads relevant frameworks from frameworks/
    │
    ▼
Claude Code runs CLI if useful (analysis packet)
    │
    ▼
Claude Code produces final structured analysis
with evidence statuses in the response
```

The `CLAUDE.md` file encodes:
- The evidence-status model
- How to select frameworks
- How to structure an analysis response
- The vocabulary Claude Code should use when describing framework status
- What Claude Code must never do (invent citations, attribute motive as fact, etc.)

Slash commands available:
- `/openreason-analyze` — analyse material using OpenReason (primary command)
- `/openreason-framework` — create or improve a framework
- `/openreason-audit` — audit repository consistency
- `/openreason-test` — run the smoke test

### Custom GPT adapter

`custom-gpt/` contains instructions for running OpenReason in a ChatGPT Custom GPT.
ChatGPT cannot run the TypeScript pipeline, so the adapter relies on uploaded framework files as knowledge.
This is a degraded but usable mode.

### MCP server (planned)

A future MCP server will expose OpenReason tools directly to any MCP-compatible client.
Planned tools: `validate_frameworks`, `analyze_input`, `search_frameworks`, `create_framework`.
See `docs/MCP_ARCHITECTURE.md`.

---

## How the layers interact

A typical analysis request flows like this:

1. **User** writes: *"Analyse this political statement using OpenReason."*
2. **Claude Code** reads `CLAUDE.md`, identifies the request as an analysis task.
3. **Claude Code** reads the relevant `frameworks/*.yaml` files to understand available methods.
4. **Claude Code** optionally runs `npx tsx src/cli.ts analyze <input> --out reports/...` to produce a packet.
5. **Claude Code** reads the packet, then produces a final structured response.
6. **User** sees an analysis with explicit evidence labels, framework attribution, and stated limitations.

The reference implementation (Layer 2) supports steps 4–5.
The conceptual layer (Layer 1) defines the vocabulary and constraints for step 6.
The integration layer (Layer 3) enables the conversation in steps 1–2 and 6.

---

## Adding a new framework

New frameworks extend Layer 1 only — they do not require any code changes.

1. Create `frameworks/<domain>/<id>.yaml`
2. Follow the schema in `schemas/framework.schema.json`
3. Run `npm run validate` to check the file
4. Add a router test if the framework introduces new intent or trigger signals

See `docs/FRAMEWORK_AUTHORING.md` for the full guide.
