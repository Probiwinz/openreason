# Garth Jowett and Victoria O'Donnell — Propaganda and Persuasion

**ID:** `propaganda-jowett-odonnell`  
**Domain:** propaganda_analysis  
**Version:** 0.1.0  
**Verification status:** draft  
**Pack:** `propaganda`  
**Last updated:** 2026-06-29

---

## Purpose

This framework provides a systematic, definitionally grounded method for propaganda analysis. Jowett and O'Donnell's central contribution is a precise working definition of propaganda that distinguishes it from persuasion and from information — a distinction many commentators elide. Their ten-step analysis method provides a comprehensive procedure for assessing whether a communication constitutes propaganda and how it operates.

The framework does not automatically classify any communication as propaganda. It provides tools for a careful, evidence-grounded assessment.

## Scope

**Appropriate for:**
- Systematic analysis of suspected propaganda campaigns
- Institutional communication where communicator intent and audience interests may diverge
- Contexts where a rigorous definitional assessment of whether something qualifies as propaganda is needed
- Analysis requiring institutional context, historical setting, and audience identification

**Not appropriate for:**
- Quick technique identification (use `propaganda-ipa` for that)
- Texts with no discernible institutional context
- Analysis where the propaganda label is not directly at issue

**The intent constraint.** Jowett and O'Donnell define propaganda by *communicator intent*: propaganda serves the communicator's interests, often at the expense of the audience's. This is analytically powerful but creates an epistemic constraint — intent cannot be directly observed from a text. All classifications of a communication as propaganda are `H1` findings.

## Capabilities provided

- `propaganda_analysis` — definitional assessment and ten-step systematic analysis
- `social_effect_analysis` — assessment of effects and audience responses

## Workflow summary

1. Establish the communication's source, historical context, ideology, institutional setting, and target audience.
2. Work through all ten analysis steps, keeping direct observations separate from discourse, framing, effect, and intent inferences.
3. Use IPA or a rhetoric framework for the detailed technique analysis required in steps 6–7.
4. Classify the communication as propaganda only as an `H1` hypothesis, and state which contextual evidence is missing.

## The definition of propaganda

Jowett and O'Donnell define propaganda as:

> "the deliberate, systematic attempt to shape perceptions, manipulate cognitions, and direct behaviour to achieve a response that furthers the desired intent of the propagandist."

This definition has three components:
1. **Deliberate and systematic** — not incidental; organised and purposeful
2. **Shaping perceptions, manipulating cognitions, directing behaviour** — operating at multiple levels
3. **Furthers the propagandist's desired intent** — the key criterion: whose interests does this serve?

**Distinction from persuasion.** Persuasion, on Jowett and O'Donnell's account, may serve the audience's interests as well as the communicator's. It is more honest about its aims. The distinction is one of intent and transparency, not of technique — the same technique can appear in both.

**Distinction from information.** Information aims to provide accurate, complete content to enable the audience to make their own judgements. Propaganda structures the information environment to guide the audience toward a particular conclusion.

**Caveat.** This definitional distinction is contested in communication studies. Some researchers argue that intent is not reliably distinguishable in practice. The framework uses the definition as an analytical tool while acknowledging that classification is always H1.

## The ten-step analysis method

1. **The ideology and purpose of the propaganda campaign** — What worldview or belief system underlies the communication? What outcome does the propagandist aim to produce?

2. **The context in which propaganda occurs** — What is the historical, political, and social setting? Why now? What are the conditions that make this communication possible and effective?

3. **Identification of the propagandist** — Who is the communicator? What is their institutional position? What interests do they represent?

4. **The structure of the propaganda organisation** — Is there an identifiable organisation, campaign, or institution behind the communication? What is its structure and reach?

5. **The target audience** — Who is being addressed? What are their characteristics, values, and vulnerabilities? Is there a primary audience and a secondary audience?

6. **Media utilisation techniques** — How is the communication delivered? What channels, formats, and distribution mechanisms are used?

7. **Special techniques to maximise effect** — What persuasion techniques structure the message? (This is where IPA device analysis or rhetorical analysis feeds in.)

8. **Audience reaction to various techniques** — How do different audience segments respond? (When evidence is available.)

9. **Counterpropaganda, if present** — What opposing communication exists? How is it addressed or suppressed?

10. **Effects and evaluation** — What observable or inferable effects does the communication produce?

## Evidence mapping

| Status | When used |
|---|---|
| O1 | Verbatim quotes — specific language in the text being analysed |
| O2 | Explicit claims, institutional statements, or stated aims |
| D1 | Discourse interpretations: institutional context, audience targeting, ideological framing |
| F1 | Framing interpretations: how the communication defines the problem, cause, and solution |
| S1 | Possible or observed social effects and audience responses |
| H1 | All intent-based claims, including propaganda classification itself |

**No `R1` in this framework directly** — rhetorical technique analysis is handled by `propaganda-ipa` or `rhetoric-aristotle`. This framework operates at the definitional and institutional level.

## Decision rule rationale

- **Propaganda classification [H1]** — The most important rule. Classification as propaganda requires establishing communicator intent, which is inferred, not observed. The finding is always H1: a possible but unproven characterisation, grounded in the ten-step analysis.
- **Institutional context [D1]** — Identifying the organisational structure behind a communication is a discourse interpretation: how institutional power shapes what can be said, by whom, to whom. This is a D1 finding grounded in contextual evidence.
- **Ideological function [F1]** — When a communication presents one ideological position as natural or obvious (what Entman calls naturalising the frame), this is a framing function. It is F1 because it requires identifying what is treated as given rather than argued.
- **Target audience tailoring [D1]** — When communication is segmented by audience — different messages for different groups — this is a discourse-level finding about institutional strategy.
- **Techniques preventing critical evaluation [D1]** — Emotional saturation, repetition, and elimination of alternatives reduce the likelihood of deliberate evaluation. Identifying these is a D1 finding about the communication's structure.
- **Audience response [S1]** — Observable or measurable audience responses are `S1` findings. They are possible social effects, grounded in available evidence, not assumed from the communication alone.

## Worked example

*Note: This example has not been verified against source texts. It illustrates a partial application of the ten-step method to a short input.*

**Input context:** A government releases a series of posters during wartime showing enemy soldiers as monstrous figures, with captions linking the enemy to atrocities and calling for citizen participation in the war effort.

**Partial ten-step analysis:**
- [O2] Step 1 — Ideology: nationalism and wartime mobilisation are the underlying ideology. The purpose is to sustain public support for the war and to recruit civilian participation.
- [D1] Step 2 — Context: a state of declared war creates conditions in which emotional mobilisation is expected and critical evaluation of official communications is socially discouraged.
- [D1] Step 3 — Propagandist: the government communications office. Their institutional interest is military mobilisation and public morale.
- [D1] Step 4 — Structure: a state-level communications apparatus with coordinated production and distribution.
- [D1] Step 5 — Target audience: the general public, particularly working-age adults capable of supporting the war effort.
- [F1] Steps 6–7 — Techniques: dehumanising imagery of the enemy; emotional appeals to protection of the family; association of the enemy with fear; bandwagon appeals to national solidarity. (For technique detail, apply `propaganda-ipa`.)
- [S1] Step 8 — Audience reaction: if recruitment data or contemporaneous surveys exist, these would be included here. Without that evidence, audience response cannot be assessed from the posters alone.
- [H1] Propaganda classification: the combination of deliberate institutional production, audience targeting, emotional technique use, and the fact that the communication serves the state's military interests rather than balanced information provision supports the hypothesis that this is propaganda by Jowett and O'Donnell's definition. This is `H1` — a grounded hypothesis, not a certainty.

## Complementarity with IPA

- **IPA** — bottom-up, device-level: identifies which specific techniques are present
- **Jowett & O'Donnell** — top-down, definitional: assesses the communication institutionally and classifies it against a working definition

Use IPA for Steps 6–7 of the ten-step method. Jowett & O'Donnell provide the frame within which IPA findings are interpreted. A complete propaganda analysis uses both.

## Limitations

**Intent cannot be directly observed.** The definition depends on communicator intent; intent must be inferred from context, institutional position, and pattern of communication. This is why propaganda classification is always H1.

**The definition is contested.** Some communication scholars argue that the persuasion/propaganda distinction cannot be reliably operationalised in practice. The framework uses the distinction as an analytical tool with the explicit acknowledgement that it involves interpretive judgement.

**Ten-step analysis requires extensive contextual research.** Steps 2–5 and 8–10 require historical, institutional, and audience knowledge that cannot be derived from the text alone. An analyst without access to contextual information will produce a partial analysis.

**Applying the propaganda label carries implications.** Classifying communication as propaganda is a significant interpretive act with political implications. The label should only be applied after completing the full ten-step analysis and explicitly labelling the classification as H1.

**Does not itself identify specific techniques.** For device-level analysis, use `propaganda-ipa`. For rhetorical structure, use `rhetoric-aristotle` or `rhetoric-perelman`.

## Known gaps

- The framework does not yet include Jowett and O'Donnell's distinction between white (acknowledged source), grey (unclear source), and black (false source) propaganda, which is analytically important for disinformation analysis.
- The ten-step method is not yet operationalised as individual decision rules; the current rules are principles rather than a complete procedural mapping.
- The framework does not yet address digital propaganda — coordinated inauthentic behaviour, platform-level amplification, or algorithmic distribution.

## References

- Jowett, Garth S., and Victoria O'Donnell. *Propaganda and Persuasion*. SAGE Publications, 1986. Sixth edition: 2015. ISBN: 978-1452277325 (6th ed.).

*The sixth edition (2015) is the most current and is the recommended version for verification. Publication details from publicly available bibliographic records. ISBN should be verified before formal academic citation.*

## Verification record

**Date:** Not yet verified  
**Verified by:** Not yet verified  
**Sources consulted:** None  

| Concept | Status |
|---|---|
| definition of propaganda | — not yet checked against Jowett & O'Donnell (2015) |
| distinction from persuasion | — not yet checked |
| distinction from information | — not yet checked |
| ideology | — not yet checked |
| institutional context | — not yet checked |
| ten-step analysis | — not yet checked; the ten steps should be verified in order against the source |

*Priority: the definition (chapter 1 of the 6th edition) and the ten-step method (chapter 8 or equivalent). The definition is the most critical concept to verify precisely, as it grounds everything else in the framework.*

## Changelog

### 0.1.0 — 2026-06-29
- Initial implementation
- All fields populated per FRAMEWORK_SPECIFICATION.md v1.0
- Ten-step method documented with partial worked example
- Intent constraint documented: all propaganda classification is H1
- Complementarity with propaganda-ipa documented
- White/grey/black propaganda gap noted in known gaps
