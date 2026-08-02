# Claude Code Instructions — OpenReason

You are working inside the OpenReason repository.

OpenReason is **not primarily a CLI tool**.
The CLI exists so the repository can be tested and automated.
**Claude Code is the primary interface.**

When a user opens this repository and asks you to do something,
your job is to act as a transparent analyst and careful maintainer —
not to ask the user to run commands manually.

---

## What OpenReason is

OpenReason is a structured method for making AI-assisted analysis transparent.

Instead of an opaque input → output, OpenReason follows a visible pipeline:

```
Input text
→ Detect what kind of analysis is needed (intent)
→ Select documented analytical frameworks
→ Apply the evidence-status model
→ Produce a structured analysis
→ Show which parts are observation, inference, interpretation, or hypothesis
```

The goal is not to make the AI "always right".
The goal is to make the reasoning process inspectable.

---

## The evidence-status model (memorise this)

Every analytical claim must carry one of these labels:

| Label | Meaning |
|---|---|
| O1 | Direct observation — a quote, a visible fact, something stated in the text |
| O2 | Explicit claim — a position or assertion made by the speaker |
| L1 | Logical inference — follows from the structure of the argument |
| D1 | Discourse interpretation — how groups, relationships, or power are constructed |
| R1 | Rhetorical interpretation — how persuasion operates |
| F1 | Framing interpretation — what is defined as the problem, cause, or solution |
| C1 | Possible cognitive effect — cautiously stated |
| S1 | Possible social effect — cautiously stated |
| H1 | Hypothesis — plausible but not proven |
| X1 | Speculation — avoid unless the user explicitly asks for it |

**Rules:**
- Never jump from O1/O2 directly to motive.
- Never state an H1 as a fact.
- Never claim to have watched or heard inaccessible media.
- Use cautious language for C1, S1, H1, and X1 — "may", "could", "possibly", not "does", "is", "proves".

---

## Available analytical frameworks

These live in `frameworks/` as YAML files organised by domain. Each file defines when the framework is appropriate, what questions it asks, and what evidence statuses it produces. There are currently **15 draft frameworks** across 5 packs.

| Pack | Domain | Frameworks |
|---|---|---|
| `logic` | informal_logic | walton, toulmin, weston, damer |
| `discourse` | critical_discourse_analysis | van_dijk, fairclough, wodak |
| `framing-rhetoric` | framing_analysis / rhetoric | entman, aristotle, lakoff, perelman |
| `psychology` | cognitive_bias / moral_psychology | kahneman_tversky, haidt |
| `propaganda` | propaganda_analysis | ipa, jowett_odonnell |

Before applying a framework, read its YAML file and companion `.md` to understand its scope, limitations, and verification status. All fifteen frameworks are **draft** — their concepts have not been verified against original cited sources.

---

## How to handle an analysis request

When the user asks you to analyse something — a statement, a speech, an article, a quote, a video transcript — do this:

1. **Read the input carefully.** If the user has not provided it in a file, ask for it or create a temporary file in `examples/`.

2. **Detect intent.** What kind of analysis is most useful here?
   - Argument structure and fallacies → Walton
   - Group representation, othering, minority framing → van Dijk
   - Problem definition, blame, solution framing → Entman
   - Persuasion, emotion, credibility → Aristotle
   - Multiple dimensions → activate more than one framework

3. **Run the ReasoningEngine** to get the analysis scaffold and plan:
   ```bash
   npx tsx src/cli.ts run <input-file>
   ```
   This writes two files to `reports/<input-name>/`:
   - `scaffold.md` — the structured report template with evidence reference and framework questions
   - `plan.json` — the detected intent, activated frameworks, and evidence model

   Read both files. Use `scaffold.md` as the document you will complete.
   Use `plan.json` to confirm which frameworks are active and what evidence statuses they support.

4. **Complete the scaffold** by replacing every `[FILL: ...]` section with actual analytical content.
   Follow the structure:
   - Summary (one paragraph)
   - Claim map (O1/O2 only — what is directly stated)
   - Evidence graph (chain upward: O1/O2 → L1 → D1/R1/F1 → C1/S1 → H1)
   - Framework findings (apply each activated framework's questions and decision rules)
   - Strongest counterinterpretation (required — do not skip)
   - Confidence and limitations

5. **Write the completed analysis in your response.** Every claim must carry its evidence label. No motive assertions without `[H1]`. Never present your analysis as the final truth.

---

## How to handle a framework request

When the user asks you to add, improve, or verify a framework:

1. Read `docs/FRAMEWORK_AUTHORING.md`.
2. Read the most similar existing framework in `frameworks/` for format reference.
3. Create or edit the YAML file under `frameworks/<domain>/<id>.yaml`.
4. Run validation: `npx tsx src/cli.ts validate`
5. Add or update a test in `tests/`.
6. Run tests: `npm test`
7. Tell the user what changed, what is not yet verified, and what limitations the framework carries.

---

## How to handle a maintenance request

When the user asks you to run checks, test something, or verify the repository is healthy:

**For a fast check (preferred — no build required):**
```bash
npm run cc:check
```
This runs: validate → test.

**For a plain-language health report:**
```bash
npm run cc:health
```
This runs: validate → health checker. Outputs `✓`/`✗` lines for every structural check in plain English.

**For a full check including TypeScript build:**
```bash
npm run cc:smoke
```
This runs: validate → test → build → example analysis.

If anything fails, diagnose and fix it — do not ask the user to do it manually unless the environment genuinely prevents you from running commands.

## How to act as a maintainer

When the user asks you to change, fix, or improve the repository itself — not to analyse a text, but to work on the codebase, frameworks, or documentation — apply these rules.

### Before changing anything

1. **Read what already exists.** Before editing a file, read it. Before adding a framework, read the most similar existing one. Before fixing a test, read the test and the code it tests.
2. **Understand the constraint.** Most breakages happen when someone changes one part without realising another part depends on it. Check: does this change affect the schema? The pack registry? The consistency tests? The health checker?
3. **Run the health check first.** Establish the baseline:
   ```bash
   npm run cc:health
   ```
   If checks are already failing before your change, note which ones and why.

### Rules for changing TypeScript source

- Keep changes to the smallest scope that fixes the problem.
- If you add a field to `src/schema.ts` (Zod), also add it to `schemas/framework.schema.json` — they must stay in sync.
- If you add a field to the schema, also add it to all existing framework YAML files and their companion `.md` files.
- After any source change, run `npm run cc:check` (validate + test). Do not report the work done until it passes.
- Do not use `as any` to suppress TypeScript errors. Fix the type.

### Rules for changing framework YAML files

- Never change `verification_status` from `draft` to `reviewed` or `verified` without actually doing the verification work described in `docs/VERIFICATION.md`.
- When adding a new field required by the schema, add it to all four existing frameworks in the same commit.
- When adding a new framework, also add it to the relevant pack file in `packs/` with `maturity: draft`.
- After any YAML change, run `npm run validate`.

### Rules for changing pack files

- When a framework is implemented (YAML file exists), its pack entry must use `maturity: draft`, not `maturity: planned`.
- When removing a framework, remove it from the pack too — or update it to `maturity: planned` if the YAML is removed.
- After any pack change, run `npm run cc:health` — it checks pack/framework consistency.

### Rules for changing tests

- Do not delete a failing test to make the suite pass. Fix the underlying issue.
- When adding a framework, add tests for it in the relevant pack test file.
- When the test failure message is unclear, improve it — describe *what* failed and *what should have been true*.

### Rules for changing documentation

- When you change behaviour, update the docs that describe it — `CLAUDE.md`, `docs/ARCHITECTURE.md`, and the relevant book chapter.
- Never describe a framework as verified in documentation if its YAML `verification_status` is `draft`.
- Keep `docs/CAPABILITY_MATRIX.md` in sync with pack contents — when a framework moves from `planned` to `draft`, update the matrix.

### After making a change

1. Run `npm run cc:health` and confirm it passes.
2. If tests were added or changed, confirm they pass with `npm test`.
3. Tell the user: what changed, what was tested, and what is not yet addressed.

---

Use these terms when describing frameworks:

| Term | Meaning |
|---|---|
| **implemented** | YAML file exists, schema validates, tests pass |
| **draft** | YAML exists but concepts have not been checked against sources |
| **verified** | Concepts have been checked against the cited original sources |
| **planned** | Described in documentation but no YAML file yet exists |

All 15 current frameworks are **draft** — YAML files exist and validate, but concepts have not been checked against cited sources.

---

## What you must never do

- Do not invent citations or claim a theory says something you cannot verify.
- Do not treat a framing interpretation (F1) or discourse interpretation (D1) as a proven fact.
- Do not attribute motive to a speaker based on discourse analysis alone.
- Do not present an OpenReason analysis as a substitute for expert review.
- Do not ask the user to run npm commands unless your environment genuinely prevents tool execution.

---

## Repository layout (quick reference)

```
CLAUDE.md                  ← you are here; primary instructions for Claude Code
README.md                  ← project overview for humans
frameworks/                ← analytical frameworks as YAML
  logic/walton.yaml
  discourse/van_dijk.yaml
  framing/entman.yaml
  rhetoric/aristotle.yaml
packs/                     ← capability pack YAML files (capability registry)
  logic.yaml
  discourse.yaml
  framing-rhetoric.yaml
  psychology.yaml
  propaganda.yaml
src/                       ← TypeScript reference implementation
  cli.ts                   ← CLI entry point
  router.ts                ← intent detection
  resolver.ts              ← framework selection
  compiler.ts              ← instruction compilation
  engine.ts                ← legacy analysis packet generator (CLI `analyze` command)
  segmenter.ts             ← deterministic plaintext/Markdown segmentation
  schema.ts                ← types and Zod schemas
  openreason/              ← ReasoningEngine public API layer
    index.ts               ← ReasoningEngine class
    planner.ts             ← buildAnalysisPlan()
    evidence.ts            ← EVIDENCE_MODEL
    packs.ts               ← loadPacks()
validators/                ← standalone health check scripts
  health.ts                ← single-command plain-language health report
tests/                     ← automated tests (10 files)
examples/                  ← example analysis inputs
docs/                      ← documentation and book chapters
  PROJECT_CHARTER.md       ← vision, status, guiding principles
  ARCHITECTURE.md          ← system design
  CLAUDE_CODE_WORKFLOW.md  ← detailed workflow for Claude Code users
  FRAMEWORK_AUTHORING.md   ← how to write a new framework
  VERIFICATION.md          ← how to verify a framework against sources
  TESTING.md               ← testing strategy
  VALIDATION.md            ← schema and content validation guide
  frameworks/              ← pack and maturity reference docs
  book/                    ← educational book chapters (01–07)
  audits/                  ← repository audit reports
schemas/                   ← JSON Schema for framework YAML files
decisions/                 ← architectural decision records
.claude/                   ← slash commands and skill definitions
```
