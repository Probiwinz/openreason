# Tests — OpenReason

This directory contains all automated tests for the OpenReason project.

Tests are written in TypeScript and run with [Vitest](https://vitest.dev/).

---

## Running the tests

```bash
npm test
```

For a faster check that skips the build:

```bash
npm run cc:check
```

For a plain-language health report (preferred for Claude Code):

```bash
npm run cc:health
```

---

## Test files

| File | What it tests |
|---|---|
| `integration.test.ts` | End-to-end: `ReasoningEngine.analyzeFile('examples/technology-regulation.md')` — scaffold structure, framework activation, plan serialisability |
| `evidence.test.ts` | The `EVIDENCE_MODEL` structure, `isValidEvidenceStatus`, `getEvidenceEntry` |
| `maturity.test.ts` | `VerificationStatusSchema`, framework `verification_status` defaults |
| `packs.test.ts` | Pack loading, structure, `MaturityLevelSchema`, capability coverage |
| `consistency.test.ts` | Pack entries cross-referenced against framework YAML files |
| `examples.test.ts` | Evidence labels in `examples/*.analysis.md` files |
| `readme.test.ts` | README maturity claims vs. actual framework YAML content |
| `resolver.test.ts` | Framework activation for different input types |
| `router.test.ts` | Intent detection for various prompt patterns |
| `compiler.test.ts` | Instruction compilation smoke tests |
| `engine.test.ts` | `ReasoningEngine.analyze()` output shape and content |
| `segmenter.test.ts` | Deterministic plaintext/Markdown segmentation, stable IDs, heading context, and exact offsets |

---

## What each test file covers in detail

### `evidence.test.ts`
- `EVIDENCE_MODEL` contains exactly 10 entries in the correct order
- Every entry has a non-empty name, meaning, and valid confidence level
- `isValidEvidenceStatus` accepts all valid labels and rejects typos and invalid values
- `getEvidenceEntry` returns correct metadata for specific labels

### `maturity.test.ts`
- `VerificationStatusSchema` accepts `draft`, `reviewed`, `verified`, `contested`
- `VerificationStatusSchema` rejects unknown values
- All loaded frameworks have a `verification_status` field
- All current frameworks default to `draft`
- The four expected framework IDs are present

### `packs.test.ts`
- All five packs load and pass schema validation
- Every pack has a non-empty id, description, at least one capability, and at least one framework entry
- Every framework entry in every pack has a valid `MaturityLevelSchema` value
- All five expected pack IDs are present
- All nine required capabilities are covered across the packs

### `consistency.test.ts` ← new
- Pack entries with maturity `draft` or `implemented` have a corresponding framework YAML file
- Pack entries with maturity `planned` do NOT have a framework YAML file
- Every framework YAML file is referenced by at least one pack
- Every framework has at least one limitation
- Every framework has at least one reference with a title
- Every framework includes `H1` in its `evidence_statuses`
- Every framework has at least one `analysis_question` and one `decision_rule`

### `examples.test.ts` ← new
- At least one `*.analysis.md` file exists in `examples/`
- All evidence labels in analysis files are valid OpenReason statuses
- Every analysis file contains at least one `O1` or `O2` observation anchor
- Every analysis file contains at least one `H1` hypothesis-level claim

### `readme.test.ts` ← new
- README acknowledges that frameworks are draft status
- README references each implemented framework by ID or name
- README does not claim any framework is "verified" unless a framework YAML actually is

### `resolver.test.ts`
- `discourse-van-dijk` activates for group contrast inputs
- `logic-walton` activates for fallacy/argument inputs
- `rhetoric-aristotle` activates for persuasion inputs
- A non-empty fallback is returned when no signal matches
- Skipped and activated framework sets are disjoint
- Every skipped framework has a reason string

### `router.test.ts`
- Discourse intent detected for group comparison prompts
- Logical intent detected for fallacy prompts

### `compiler.test.ts`
- Frameworks load from YAML (at least 4)
- Compiled instructions include evidence statuses and activated framework IDs

### `engine.test.ts`
- `ReasoningEngine.analyze()` returns correct plan structure
- Plan contains expected fields: input, frameworks, evidenceModel, intent, instructions
- Report scaffold contains all required section headings

### `segmenter.test.ts`
- Plaintext is split at blank lines without losing source offsets
- Markdown headings and fenced code blocks form explicit segments
- Heading paths are carried into following content
- Document and segment IDs are stable for identical input
- Every segment maps back exactly to its source text

---

## Adding a new test

1. Create a `tests/<name>.test.ts` file
2. Import from `../src/` using `.js` extensions (required for ES modules)
3. Use `describe()` and `it()` from vitest
4. Make the failure message human-readable — use the second `expect()` argument for context
5. Run `npm test` to verify

---

## Test philosophy

Tests in this project do three things:

1. **Prevent regressions** — if a code change breaks something that was working, a test should catch it
2. **Enforce project contracts** — consistency checks (pack/framework cross-reference, README accuracy) catch documentation drift that code tests cannot
3. **Document expected behaviour** — reading the tests should tell you what the system is supposed to do

Tests should produce informative failure messages. A test that says `AssertionError: expected 0 to be greater than 0` is much less useful than one that says `pack "logic" lists "logic-walton" as draft but no framework YAML was found`.
