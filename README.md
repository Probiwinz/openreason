# OpenReason

> **Structured reasoning for AI analysis — transparent, traceable, and open to review.**

OpenReason is a method and a tool for making AI-assisted analysis visible.

When an AI analyzes an argument, a speech, a news article, or a public statement, it usually produces a conclusion. OpenReason produces the *reasoning* — and labels every step so you can see whether it is a direct observation, a logical inference, a discourse interpretation, or only a hypothesis.

The goal is not to make the AI "always right." The goal is to make its work reviewable.

---

## The problem with standard AI analysis

Ask a modern AI to analyze *"Technology will solve climate change. We do not need more regulation,"* and you will get a fluent response. It may sound balanced and well-reasoned.

But you cannot see:

- Which analytical tradition the AI drew on
- Which claims are taken directly from the text vs. inferred vs. interpreted
- Whether its framing observations are observations or interpretations
- What assumptions are baked in
- Whether another analyst would reach the same conclusions

If you change the input slightly, the response shifts too — with no stable method behind it.

OpenReason proposes a different approach:

```
Input
→ Detect what kind of analysis is needed
→ Select documented analytical frameworks
→ Apply the evidence-status model
→ Produce a structured, reviewable report
```

Every step is explicit. Every claim carries a label. Every framework is a documented method with stated limitations.

---

## A worked example

**Statement:** *"Technology will solve climate change. We do not need more regulation."*

This statement is about a real and complex domain. OpenReason does not adjudicate whether the empirical claim is correct. What it can do is analyze the argument's structure, its framing choices, and what it leaves out. Here is what that looks like across four framework packs.

---

### Logic Pack — argument structure

*Framework: Douglas Walton — Informal Logic. Status: draft.*

The Logic Pack asks: what is claimed, what supports it, and does the conclusion follow?

**Claim map:**

> [O2] The speaker asserts that technology will solve climate change.
> [O2] The speaker asserts that no additional regulation is needed.

**Logical analysis:**

> [L1] The second claim is presented as following from the first, but the inference has a gap: even if technology will eventually resolve the problem, this does not by itself establish that regulation is unnecessary during the transition period. The argument would need additional premises to close this gap.

> [L1] The first claim is a prediction without a stated timeframe, mechanism, or probability. As presented, the burden of proof is not addressed.

> [H1] A possible unstated premise is that technological development and regulatory approaches are in direct conflict — that more regulation would slow or prevent technological solutions. This is an assumption doing significant work in the argument; it would need to be examined before the conclusion holds. Whether this premise is correct is a separate empirical question.

---

### Framing and Rhetoric Pack — how the problem is defined

*Frameworks: Robert Entman — Framing Analysis; Aristotle — Rhetoric. Both: draft.*

The Framing Pack applies Entman's four-part model: what is the problem, what causes it, what moral evaluation is implied, what solution becomes natural?

**Framing analysis:**

> [F1] **Problem definition:** Climate change is framed as a technological problem — something that will be solved by innovation. Political, social, or governance dimensions are absent from this frame.

> [F1] **Causal framing:** The cause of potential failure is implicitly the lack of sufficient technology, not governance gaps, market failures, or coordination problems.

> [F1] **Implied solution:** Waiting for technology, rather than regulatory action, becomes the natural response. Regulation is positioned as unnecessary — even as a potential obstacle.

> [F1] **What is omitted from the frame:** The statement does not address what happens if technological solutions are delayed, who governs their development, how transition costs are distributed, or what the appropriate timeframe for action is.

**Rhetorical analysis:**

> [R1] The argument appeals to technological optimism — a broad cultural faith in human ingenuity that many audiences share. This is a form of *logos* that borrows credibility from a general worldview rather than from specific evidence.

> [R1] The enthymeme — the unstated premise the audience must supply for the argument to work — is something like: *"technology has always found solutions to humanity's major problems."* This unstated premise does much of the rhetorical work. Whether it applies to climate change specifically is not argued; the audience is invited to bring it themselves.

---

### Discourse Pack — language and representation

*Framework: Teun A. van Dijk — Critical Discourse Analysis. Status: draft.*

The Discourse Pack asks how the statement constructs shared understanding through language.

> [D1] The word "we" constructs a collective subject without specifying who is included or who decides. This implicit universalism may conceal differences in interest, exposure to climate risk, and access to technological solutions.

> [D1] "Need" ("we do not *need* more regulation") presents a contested normative position as a statement of shared necessity. This is a linguistic move that can pre-empt disagreement by framing a policy preference as an objective determination.

> [O2] The statement does not name any group negatively or make a comparison across groups. The van Dijk framework has less to say here than it would about a statement involving explicit group contrast.

*Note: the Discourse Pack is most powerful when the input involves group representation, othering, or ideological polarisation. This statement activates it at a lower intensity.*

---

### Psychology Pack — cognitive effects

*Frameworks: Kahneman & Tversky — Dual-Process Theory; Haidt — Moral Foundations Theory. Both: draft.*

The Psychology Pack identifies structural patterns in communication that research associates with cognitive shortcuts and moral-foundation appeals. All findings are possible effects (`C1`) or hypotheses (`H1`) — the pack does not establish that any specific audience was cognitively affected.

> [C1] The statement's confident declarative framing ("will solve," "do not need") may reduce the likelihood of deliberate evaluation by presenting contested predictions as settled facts — a pattern research associates with System 1 (fast, automatic) processing.

> [C1] "Technology will solve" invokes optimism about future technological capability. Research associates this pattern with reduced urgency about alternative interventions.

*Note: The Psychology Pack frameworks are draft — their concepts have not been verified against the original cited sources. All findings are stated at C1/H1 and are possibilities, not established outcomes.*

---

### What the evidence model shows

Looking across the four packs, the evidence graph for this statement looks like:

```
[O2] Speaker asserts: technology will solve climate change.
[O2] Speaker asserts: no additional regulation is needed.
  ↓
[L1] The inference from the first claim to the second has a logical gap.
[L1] The prediction in the first claim is unanchored — no timeframe, mechanism, or probability.
[H1] A possible unstated premise: regulation and technological progress are in conflict.
  ↓
[F1] The framing positions climate change as a technological problem.
[F1] The frame omits governance, timing, and transition risk.
[R1] The rhetorical strategy relies on an unstated premise about technological progress.
[D1] "We" and "need" perform rhetorical work that may not be visible on first reading.
  ↓
[H1] None of this analysis proves what the speaker believes or intends.
     It describes the structure and the gaps.
```

Each label tells you how much weight to place on the step above it. The O2 items are facts about what was said. The L1 items follow from logical analysis. The F1 and D1 items are interpretations that require the frameworks to support them. The H1 items are the analyst's most cautious conclusions — plausible, but not proven.

---

## The evidence-status model

Every analytical claim in an OpenReason analysis must carry one of these labels:

| Label | Name | Meaning |
|---|---|---|
| O1 | Direct observation | A verbatim quote, a directly observable fact, something in the text |
| O2 | Explicit claim | A position or assertion the speaker explicitly makes |
| L1 | Logical inference | Follows from the logical structure of the argument |
| D1 | Discourse interpretation | How groups, relationships, or power are constructed in language |
| R1 | Rhetorical interpretation | How persuasion operates through the text |
| F1 | Framing interpretation | What is defined as the problem, cause, or solution |
| C1 | Possible cognitive effect | How the text may affect how a reader thinks — stated with caution |
| S1 | Possible social effect | How the text may affect groups or social dynamics — stated with caution |
| H1 | Hypothesis | A plausible explanation, not proven by the text alone |
| X1 | Speculation | Weakly supported; used only when explicitly requested |

The model enforces one core discipline: **observation and interpretation must not be mixed.** You cannot jump from *what is said* (O2) to *what it means* (D1/F1) to *why it was said* (H1) without showing each step.

This matters because the same piece of text can be analyzed at many levels. An observation is not an interpretation. An interpretation is not a hypothesis. A hypothesis is not a fact.

---

## Learn more — The OpenReason Book

**[docs/book/README.md](docs/book/README.md)**

The book explains every concept in this README in depth — written for researchers, journalists, students, and analysts who want to understand *why* the system works the way it does, not just how to run it.

| Chapter | What it covers |
|---|---|
| [1. Why OpenReason](docs/book/01-why-openreason.md) | The problem with opaque AI analysis and what transparency means |
| [2. The Evidence Model](docs/book/02-evidence-model.md) | How to separate observation, inference, interpretation, and hypothesis |
| [3. Framework Packs](docs/book/03-framework-packs.md) | What frameworks and packs are, and how they work together |
| [4. Writing Frameworks](docs/book/04-writing-frameworks.md) | How to document an analytical method so it can be used and checked |
| [5. Using Claude Code](docs/book/05-using-claude-code.md) | How Claude Code acts as the front-end for OpenReason |
| [6. Verification](docs/book/06-verification.md) | Why frameworks need to be checked and how to check them |
| [7. Examples](docs/book/07-examples.md) | A full worked analysis showing every concept in practice |

---

## Packs, capabilities, and frameworks

OpenReason organises its analytical methods in three layers:

### Capabilities

A capability is a type of analysis. Examples: `argument_analysis`, `framing_analysis`, `propaganda_analysis`. Capabilities are stable names — they don't change as frameworks are added or improved.

### Packs

A pack is a bundle of capabilities and the frameworks that provide them. Each framework in a pack has a **maturity level** that tells you honestly how ready it is:

| Maturity | What it means |
|---|---|
| `draft` | Framework file exists and validates; not yet verified against its cited sources |
| `planned` | Documented as a future framework; no implementation yet |

Current packs:

| Pack | Capabilities | Draft frameworks | Notes |
|---|---|---|---|
| `logic` | argument_analysis, fallacy_detection | Douglas Walton, Stephen Toulmin, Anthony Weston, T. Edward Damer | 4 draft |
| `discourse` | discourse_analysis, group_representation_analysis, social_effect_analysis | Teun A. van Dijk, Norman Fairclough, Ruth Wodak | 3 draft |
| `framing-rhetoric` | framing_analysis, rhetoric_analysis | Robert Entman, Aristotle, George Lakoff, Chaïm Perelman and Lucie Olbrechts-Tyteca | 4 draft |
| `psychology` | cognitive_effect_analysis, social_effect_analysis | Daniel Kahneman and Amos Tversky, Jonathan Haidt | 2 draft — all findings C1/H1 |
| `propaganda` | propaganda_analysis, social_effect_analysis | Institute for Propaganda Analysis, Garth Jowett and Victoria O'Donnell | 2 draft — classification always H1 |

All 15 frameworks are draft — their content has not been formally verified against the original cited sources.

### Frameworks

A framework is the analytical method itself — a documented YAML file that specifies when to use it, what questions to ask, what decision rules apply, what evidence statuses it produces, and what its limitations are. Frameworks are not prompt snippets. They are machine-readable analytical specifications with citations and stated constraints.

See [docs/frameworks/PACKS.md](docs/frameworks/PACKS.md) and [docs/frameworks/MATURITY_LEVELS.md](docs/frameworks/MATURITY_LEVELS.md) for the full reference.

---

## Claude Code quickstart

OpenReason is designed to be used through Claude Code. You do not need to know TypeScript, npm, or how the pipeline works internally.

**1. Clone the repository**

```bash
git clone https://github.com/stAlbrecht168/openreason.git
cd openreason
```

**2. Open Claude Code**

```bash
claude
```

**3. Ask OpenReason to analyze something**

Type naturally:

```
Analyze this statement using OpenReason:
"Technology will solve climate change. We do not need more regulation."
```

Claude Code will read the project instructions, select the relevant framework packs, apply the evidence model, and produce a structured report — without asking you to run any commands.

**4. Ask Claude Code to run validation when needed**

If you want to verify the repository is healthy:

```
Run the OpenReason tests and tell me the results.
```

Claude Code will run framework validation, tests, and the build, and report the results in plain language.

---

### Slash commands

Once inside the repository, these commands are available:

| Command | What it does |
|---|---|
| `/openreason-analyze` | Analyze material using OpenReason |
| `/openreason-framework` | Create or improve an analytical framework |
| `/openreason-audit` | Audit repository consistency |
| `/openreason-test` | Run validation and tests, report in plain language |

---

## What is implemented and what is planned

OpenReason v0.2.0 is a working proof of concept with 15 draft frameworks across 5 packs. Here is an honest account of what exists:

| Component | Status |
|---|---|
| Evidence-status model (O1–X1) | Implemented |
| Framework schema and validation | Implemented |
| 15 framework YAML files across 5 packs | Implemented, all draft |
| Capability pack YAML files | Implemented |
| Intent router | Implemented — keyword-matching heuristic, known limitations |
| Framework resolver | Implemented — scoring logic with hardcoded fallback |
| Analysis packet generator | Implemented — general scaffold; one worked example hardcoded |
| ReasoningEngine API (`engine.analyze(input)`) | Implemented |
| Claude Code interface (CLAUDE.md, slash commands) | Implemented |
| Test suite (pack-level and cross-framework tests) | Implemented |
| Health check validator (`npm run cc:health`) | Implemented |
| Framework verification against original sources | Not yet done for any framework |
| MCP server | Planned only |

**Known limitations:** The intent router counts keywords. The resolver has a hardcoded fallback. All 15 frameworks are draft-status and have not been verified against their cited sources. See [docs/PROJECT_CHARTER.md](docs/PROJECT_CHARTER.md) for the full account.

---

## How to contribute

OpenReason is designed so that useful contributions do not require writing code.

### Without writing code

- **Verify a framework** — Read a framework's YAML file, check its concepts against the cited sources, and report whether they match. This is the highest-value contribution right now. See [docs/frameworks/MATURITY_LEVELS.md](docs/frameworks/MATURITY_LEVELS.md).
- **Suggest or improve an example** — The example library is small. Real-world inputs that test different analytical capabilities are valuable.
- **Review an analysis for overclaiming** — Does the analysis stay within what its evidence labels permit? Does it jump from O2 to H1 without the chain?
- **Improve documentation** — Clearer explanations of theories, better worked examples, translations.
- **Propose a new framework** — Open an issue using the framework proposal template.

### Writing code or YAML

- **Verify a framework** — Pick any of the 15 draft frameworks, read the cited sources, and confirm the concepts match. This is now the most valuable contribution. See [docs/frameworks/MATURITY_LEVELS.md](docs/frameworks/MATURITY_LEVELS.md).
- **Improve the intent router** — The current keyword-matching approach is brittle. A better routing heuristic would improve pack selection across diverse inputs.
- **Add example inputs** — Inputs that exercise the logic, rhetoric, or discourse packs in ways the current example does not.
- **Fix schema inconsistencies** — See [docs/REPOSITORY_REVIEW.md](docs/REPOSITORY_REVIEW.md) for the current list.

### Before contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/frameworks/MATURITY_LEVELS.md](docs/frameworks/MATURITY_LEVELS.md). The most important rule: do not describe a framework as verified until it has actually been checked against its primary source.

---

## Using OpenReason without Claude Code

**ChatGPT:** You can adapt OpenReason for a Custom GPT by uploading the framework files and documentation as knowledge. ChatGPT cannot run the TypeScript implementation, but can use the frameworks as guidance. See [custom-gpt/README.md](custom-gpt/README.md).

**Programmatic use:** The `ReasoningEngine` class provides a TypeScript API:

```typescript
import { ReasoningEngine } from './src/openreason/index.js';
const engine = new ReasoningEngine();
const result = engine.analyze('Your text here');
// result.plan — intent, frameworks, evidence model
// result.reportScaffold — structured Markdown template
```

---

## Project philosophy

OpenReason is not a prompt collection.

It is a step toward **reviewable reasoning** — where the methods behind an AI analysis are as visible as the conclusion, where frameworks carry citations and limitations, and where observations, inferences, and hypotheses are distinct rather than blended.

This matters especially in political, social, and identity-related analysis, where the difference between an observation and an interpretation is often the difference between evidence and advocacy.

See [docs/MANIFESTO.md](docs/MANIFESTO.md) for the full statement of principles.

---

*OpenReason v0.2.0 — [Project Charter](docs/PROJECT_CHARTER.md) · [Architecture](docs/ARCHITECTURE.md) · [Claude Code Workflow](docs/CLAUDE_CODE_WORKFLOW.md) · [Framework Packs](docs/frameworks/PACKS.md) · [Capability Matrix](docs/CAPABILITY_MATRIX.md) · [The Book](docs/book/README.md)*
