# Institute for Propaganda Analysis — Seven Propaganda Devices

**ID:** `propaganda-ipa`  
**Domain:** propaganda_analysis  
**Version:** 0.1.0  
**Verification status:** draft  
**Pack:** `propaganda`  
**Last updated:** 2026-06-29

---

## Purpose

This framework identifies the seven propaganda devices described by the Institute for Propaganda Analysis in 1937: name calling, glittering generalities, transfer, testimonial, plain folks, card stacking, and bandwagon. Each device is a recognisable persuasion pattern; identifying them in a text reveals the techniques being used. The framework does not establish whether a text is propaganda — that determination requires intent assessment, which is H1.

## Scope

**Appropriate for:**
- Initial screening of political, commercial, or wartime communication for recognisable persuasion devices
- Educational and media literacy contexts where naming techniques is analytically useful
- Supplementary analysis alongside a deeper framework (use Jowett & O'Donnell for systematic propaganda analysis)

**Not appropriate for:**
- Establishing that a text *is* propaganda — this requires intent assessment at H1
- Replacing rhetorical analysis (use `rhetoric-aristotle` or `rhetoric-perelman`) or framing analysis (use `framing-entman`)
- Systematic propaganda analysis covering definition, institutional context, and intent (use `propaganda-jowett-odonnell`)

**Historical context — read before applying this framework.** The IPA was a US civic organisation active 1937–1942. Its seven devices were designed to help citizens recognise wartime and political propaganda, not as a scholarly taxonomy. The framework is historically significant — the devices have been widely cited and taught for 80+ years — but it predates modern communication research, lacks theoretical rigour, and does not clearly distinguish propaganda techniques from ordinary persuasion. These limitations are not reasons to dismiss the framework but to use it with calibrated expectations.

## Capabilities provided

- `propaganda_analysis` — identification of the seven recognised propaganda devices
- `rhetoric_analysis` — the devices overlap substantially with rhetorical analysis (most are forms of appeal)

## Workflow summary

1. Record the exact words and explicit claims that may realise a device (`O1`/`O2`).
2. Check each candidate against the seven device definitions and label supported interpretations `R1` or `D1`.
3. Separate device identification from propaganda classification; any claim about intent or classification remains `H1`.
4. Use Jowett and O'Donnell when institutional context, audience, campaign structure, or systematic intent must be assessed.

## The seven devices

### Name Calling

Attaching an emotionally charged negative label to a person, group, or idea without substantive argument. The label is designed to produce rejection based on association rather than evaluation.

*Example pattern:* "Our opponents are socialists/extremists/traitors" without arguing why.

*Analytical note:* Name calling is pervasive in political communication and is not by itself a sufficient marker of propaganda. Assess whether the label is substantiated by argument. If it is, the rhetorical choice may be strong; if it is not, it is doing the work of argument it has not earned.

### Glittering Generalities

Using vague, emotionally positive abstractions — freedom, democracy, family values, the national interest — without specific referents. The appeal is to a value the audience already endorses; the specific content remains unspecified.

*Example pattern:* "This policy protects liberty and stands for our values."

*Analytical note:* Most political communication contains glittering generalities. The analytical question is whether the abstraction is doing substantive argumentative work or substituting for it. What specific policy or action does the abstraction map to?

### Transfer

Associating a person, product, or idea with a respected symbol, institution, or authority to transfer that credibility. Also works negatively: associating something with a disrespected symbol to transfer discredit.

*Example pattern:* Invoking national symbols, religious authority, or respected historical figures to endorse an unrelated claim.

*Analytical note:* Transfer overlaps with Aristotle's ethos (authority appeal) and Perelman's argument from authority. The IPA's addition is the emphasis on *symbolic* rather than expert authority — the association with a flag or church is not an argument from expertise.

### Testimonial

A respected or famous person endorses a position, product, or candidate. The credibility of the endorser is transferred to the endorsed claim regardless of whether the endorser has relevant expertise.

*Analytical note:* Assess whether the authority figure's endorsement is in their area of expertise. A scientist endorsing a scientific claim is an argument from authority; a celebrity endorsing a political position is a testimonial. The distinction matters for how much epistemic weight the endorsement carries.

### Plain Folks

The speaker presents themselves as an ordinary person sharing the audience's background, values, and concerns. The appeal is to solidarity rather than expertise: "I am one of you."

*Example pattern:* A politician eating local food, invoking their working-class origin, or speaking in regional dialect.

*Analytical note:* Plain folks is the opposite of the ethos-as-expertise appeal. It works by claiming ordinariness rather than authority. The analytical question is whether the plain folks presentation is consistent with the speaker's actual background and actions.

### Card Stacking

Presenting only evidence, examples, and arguments that support one position while ignoring, minimising, or suppressing contrary evidence. The audience receives a selective picture presented as complete.

*Analytical note:* Card stacking is analytically related to Entman's "omissions" (what the frame leaves out). It is present in virtually all persuasive communication; the analytical question is how systematic and significant the suppression is. Card stacking is most significant when the omitted evidence would substantially change the picture.

### Bandwagon

Appealing to the perception that "everyone" agrees, "the tide is turning," or that the audience will be left behind if they do not act. The appeal is to conformity and social proof rather than to the merits of the position.

*Example pattern:* "People across the country are joining this movement" — without evidence of the scale or nature of the support.

*Analytical note:* Bandwagon is an appeal to social proof. The analytical question is whether the popularity claim is accurate and whether popularity is relevant to the truth of the position.

## Evidence mapping

| Status | When used |
|---|---|
| O1 | Verbatim quotes where the device is visible in specific language |
| O2 | Explicit claims the text makes |
| R1 | Rhetorical interpretations: which device is present, how it functions |
| D1 | Discourse interpretations: how the device constructs social identities or positions |
| S1 | Possible social effects of specific device use |
| H1 | Any hypothesis about intent, including whether the text constitutes propaganda |

**Critical discipline:** Identifying a device is an `R1` or `D1` finding. Claiming the text is propaganda is `H1`. Never present a device identification as equivalent to a propaganda classification.

## Decision rule rationale

The seven decision rules map directly to the seven devices. Each is labelled `[R1]` because device identification is a rhetorical interpretation — it requires the analyst to read the text's purpose, not just its content. The same sentence can contain a name-calling device in one context and a substantiated critique in another.

- **Name calling [R1]** — The analytical move is to distinguish emotive labelling from substantiated argument. If the negative label is supported by reasoning, the critique may be legitimate rhetoric; if the label is doing the work that reasoning should do, it is name calling.
- **Glittering generalities [R1]** — The key analytical question is specificity: what concrete claim does the abstraction map to? If none can be identified, the abstraction is substituting for content.
- **Transfer [R1]** — The analytical move is to identify what is being associated (person/idea) with what (symbol/authority) and to assess whether the association is argumentatively earned or merely asserted.
- **Testimonial [R1]** — Assess the relevance of the endorser's expertise to the endorsed claim.
- **Plain folks [R1]** — Assess whether the presentation is consistent with the speaker's background and actions.
- **Card stacking [R1]** — Requires knowing what contrary evidence exists. This is a limitation of the framework: the analyst must have domain knowledge.
- **Bandwagon [R1]** — The analytical question is whether the popularity claim is accurate and whether it is relevant to the truth of the position.

## Worked example

*Note: This example has not been verified against source texts. It illustrates the framework's application.*

**Input:** "Every decent person in this country knows that these radical extremists want to destroy our way of life. Our great nation's traditions, defended by generations of heroes, are under threat. Even the mayor agrees — this is the most dangerous moment we've faced. Don't be left behind."

**Application:**
- [O1] "radical extremists," "decent person," "way of life," "great nation's traditions," "heroes," "most dangerous moment," "don't be left behind."
- [R1] **Name calling:** "radical extremists" is a charged negative label without substantive argument about what the group believes or does.
- [R1] **Glittering generalities:** "our way of life," "great nation's traditions" — positive abstractions with no specific referents.
- [R1] **Transfer:** "generations of heroes" — the speaker associates their position with an unspecified tradition of heroism, transferring that credibility without argument.
- [R1] **Testimonial:** "Even the mayor agrees" — an authority appeal that may or may not reflect the mayor's actual position, and does not establish the claim's validity regardless.
- [R1] **Bandwagon:** "Don't be left behind" — an appeal to social conformity and fear of exclusion.
- [H1] Whether this combination of devices constitutes propaganda — in the sense of serving the communicator's interests through systematic deception — cannot be established from this text fragment alone. The devices are present; propaganda classification requires intent and institutional context assessment (use Jowett & O'Donnell).

## Complementarity with Jowett & O'Donnell

This framework and `propaganda-jowett-odonnell` serve different purposes:

- **IPA** — bottom-up, device-level: "which specific techniques appear in this text?"
- **Jowett & O'Donnell** — top-down, definitional: "does this communication meet the definition of propaganda, and how does it function institutionally?"

A complete propaganda analysis uses both: IPA to catalogue the specific devices present, Jowett & O'Donnell to situate the communication in its institutional context and to assess whether the propaganda label is warranted.

## Limitations

**Device identification ≠ propaganda classification.** The most important limitation. The seven devices are present in most persuasive communication. Finding bandwagon or testimonial in a text does not establish it as propaganda; it establishes only that those techniques are in use.

**Overlap with ordinary rhetoric.** Every IPA device has a counterpart in rhetorical analysis. Testimonial = argument from authority. Transfer = ethos by association. Glittering generalities = pathos through shared values. The IPA framework does not clearly distinguish propaganda techniques from legitimate rhetoric.

**Historically limited taxonomy.** The devices were identified in 1937 for political education. They do not cover digital propaganda techniques (astroturfing, coordinated inauthentic behaviour, deepfakes), algorithmic amplification, or the structural features of propaganda identified in later research.

**Card stacking requires domain knowledge.** Identifying card stacking requires knowing what evidence has been omitted. An analyst without domain knowledge of the subject matter cannot reliably identify this device.

**No definition of propaganda.** This framework provides devices without a definition. It cannot answer the question "is this propaganda?" For that, use Jowett & O'Donnell.

## Known gaps

- The framework does not yet include more recent propaganda technique taxonomies (e.g., Bernays's consent manufacturing, or Ellul's distinction between integration and agitation propaganda).
- The `decision_rules` do not yet include guidance on how to distinguish between the devices when they overlap (e.g., transfer and testimonial are closely related).
- The relationship between the IPA devices and Aristotle's rhetorical categories is not yet mapped.

## References

- Lee, Alfred McClung, and Elizabeth Briant Lee (eds.). *The Fine Art of Propaganda: A Study of Father Coughlin's Speeches*. Harcourt, Brace, 1939. Reprinted by Octagon Books, 1972.
- Institute for Propaganda Analysis. "How to Detect Propaganda." *Propaganda Analysis*, 1(1), November 1937. (Original pamphlet; in the public domain.)

*The 1939 book is the primary published source. The 1937 pamphlet is the founding document. The IPA's work was also collected in various later anthologies. Publication details are from publicly available bibliographic records.*

## Verification record

**Date:** Not yet verified  
**Verified by:** Not yet verified  
**Sources consulted:** None  

| Concept | Status |
|---|---|
| name calling | — not yet checked against Lee & Lee (1939) |
| glittering generalities | — not yet checked |
| transfer | — not yet checked |
| testimonial | — not yet checked |
| plain folks | — not yet checked |
| card stacking | — not yet checked |
| bandwagon | — not yet checked |

*Verification requires reading Lee & Lee (1939) chapters 2–4 and confirming the seven device definitions match. Note: the 1937 pamphlet is the original; the 1939 book applies the taxonomy to a specific case study. Both should be consulted.*

## Changelog

### 0.1.0 — 2026-06-29
- Initial implementation
- All seven devices documented with analytical notes
- Historical context note added — mandatory reading before application
- Complementarity with Jowett & O'Donnell documented
- Device ≠ propaganda classification discipline noted
