---
name: write-explanation
description: Guide for writing explanation documentation following the Diátaxis framework. Use when the user wants to write or improve explanation—understanding-oriented content that discusses a topic, provides context, and helps the reader reflect.
source: https://diataxis.fr/explanation/
metadata:
  document_type: explanation
  framework: diataxis
---

# Explanation Writing (Diátaxis)

**Instructions:** Use this skill by (1) confirming the document type with the user if unclear, (2) applying the Structure section below to draft or restructure, (3) before finishing, running through [CHECKLIST.md](CHECKLIST.md). When editing docs in this project, follow the **doc-conventions** rule for frontmatter and invariants (the rule applies when `docs/` files are open). Use this skill for structure and the **voice-and-style** skill for tone and vocabulary. When the explanation refers to **this project's** APIs, concepts, or file structure, use the **project's code** (e.g. search the project) so names and examples are accurate.

**Content integrity rule:** Only write content you can verify from the project's codebase, the user-provided input, or an authoritative external source. If information is missing, incomplete, or ambiguous, insert a `[TODO: verify — <what's missing>]` placeholder and flag it for the author. Never invent, assume, or fabricate technical details, API signatures, behavior, parameters, or background context to fill gaps.

Use this when writing **explanation**: **discursive treatment of a topic** that deepens and broadens understanding. Explanation is **understanding-oriented**; it answers *"Can you tell me about…?"* and supports **reflection**, not immediate action.

For examples, see [EXAMPLES.md](EXAMPLES.md) when needed.

## When to Use This Type

- The reader wants **context, background, or understanding**—why things are the way they are, how they fit together.
- The content is **about** a topic (design, history, choices, trade-offs), not a procedure or a technical catalogue.
- It can be read **away from the product** (e.g. to understand the craft or the domain).

## Structure

1. **Introduction**
   - Frame the **topic** (e.g. *"About user authentication"*, *"About database connection policies"*).
   - State what aspect you're covering and why it matters; mention if this builds on or links to other docs.

2. **Discussion**
   - **Context and background**: why things are so—design decisions, history, constraints.
   - **Connections**: link to related concepts, other docs, or the bigger picture.
   - **Alternatives and perspective**: different approaches, trade-offs, or opinions where relevant.
   - Keep the topic **bounded**: don't turn explanation into how-to or reference; link to those instead.

3. **Summary / main takeaways (optional but good)**
   - Short summary of key points for readers who skim.

4. **Further reading**
   - Links to related explanation, reference, how-to guides, or tutorials.

## Diátaxis Principles

- **Make connections.** Link to other concepts and docs; help build a web of understanding.
- **Provide context.** Explain *why*—design, history, constraints—and give examples.
- **Talk *about* the subject.** Discussion, not instruction: bigger picture, choices, alternatives, reasons.
- **Admit opinion and perspective.** Explanation can weigh options and different viewpoints; it's discussion, not a spec.
- **Keep explanation bounded.** Don't absorb how-to steps or reference tables; link to them and stay at the "about" level.

## Language

- *"The reason for x is because historically, y…"* — explain.
- *"W is better than z, because…"* — offer judgement where useful.
- *"An x in system y is analogous to a w in system z. However…"* — provide context.
- *"Some users prefer w (because z). This can be a good approach, but…"* — weigh alternatives.
- *"An x interacts with a y as follows:…"* — clarify behaviour where it aids understanding.

### Prose over numbered or bulleted sequences

Explanation should flow as connected paragraphs, not as numbered or bulleted sequences. Even when describing a process, lifecycle, or "how something works" conceptually, use prose transitions instead of lists:

- **Prefer:** *"When a session opens, the transport layer negotiates the connection. This means the device's capabilities become visible to the SDK, which can then route commands through the established channel."*
- **Avoid numbered steps:** *"1. The session opens. 2. The transport negotiates. 3. Commands are routed."*
- **Avoid bulleted sequences:** *"• Session opens • Transport negotiates • Commands are routed"*

Numbered or bulleted lists are appropriate only for Further Reading links or genuinely unordered items (e.g. a list of independent design goals). For anything that describes cause, effect, sequence, or lifecycle, write in connected prose using transitions like *"This means…"*, *"As a result…"*, *"The reason for this is…"*

## What to Avoid

- Turning explanation into a **how-to** (step-by-step instructions) or **reference** (lists of options/APIs).
- Unbounded scope: keep one topic per doc; link to others.
- Hiding opinion where it would help (e.g. trade-offs, recommendations); explanation can and should consider alternatives and perspective.
- **Inventing design history, rationale, or trade-offs** that are not documented in the codebase or provided by the user. Explanation encourages context and background, but that context must come from verifiable sources—never from assumptions about why things were built a certain way.

### Reference-style patterns to recognise and avoid

These patterns belong in reference docs, not explanations. If you find yourself writing any of these, stop and rephrase as prose:

- **Comparison tables** — e.g. a "BLE vs USB" table with columns for speed, reliability, power use. Discuss trade-offs in flowing prose instead.
- **Field or byte breakdowns** — e.g. listing APDU fields (CLA, INS, P1, P2, Lc, Data, Le) as a table or bullet list of specs. Describe the design intent in sentences instead.
- **API method or property enumerations** — e.g. listing `DeviceSession` methods or constructor parameters. Mention what the abstraction *does* conceptually; link to reference for the full API.
- **Exhaustive option lists** — e.g. enumerating every possible configuration value. Pick the most interesting trade-off and discuss it; link to reference for completeness.
