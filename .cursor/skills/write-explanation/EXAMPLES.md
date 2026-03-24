# Explanation Examples

Add short examples of good explanation docs here. Load this file when the user asks for a sample or when you need a concrete pattern.

## Example 1: Minimal structure

**Title:** About connection pooling

1. **Introduction** — "This page explains why we use connection pooling and how it fits with the rest of the system."
2. **Discussion** — Context (e.g. why pooling was introduced), connections to other concepts, alternatives (e.g. per-request connections vs pool), trade-offs.
3. **Summary** — "Pooling reduces latency and load; size and timeouts are the main knobs."
4. **Further reading** — Links to reference (config options), how-to (tuning the pool).

Use the same pattern: frame the topic, discuss why and how it fits, optional summary, link out to reference/how-to/tutorial.

---

## Example 2: Product/feature overview (problem–solution–value)

Use this when the explanation introduces a product, feature, or initiative and aims to build understanding and buy-in. The structure below is drawn from a product overview that explains a user-facing solution (Clear Signing) and why it matters.

### What makes it work

- **Intro = one-line value** — Title plus a single sentence that states the problem and the transformation (e.g. "X is a problem; [Topic] turns it into Y"). Reader immediately knows why this matters.
- **Problem first** — Dedicated section that names the problem (e.g. "Blind signing"), explains the challenge in plain language, and optionally contrasts risks vs benefits (side-by-side or list). Establishes *why* the solution exists.
- **Solution in plain language** — What the thing is and what it does, without implementation detail. Optional: one sentence on how the reader (e.g. developer) fits in. Image or example with caption to make it concrete.
- **Real-world examples** — Before/after or concrete scenarios (e.g. token swap, NFT purchase) in tabs or short blocks. Illustrates the topic; not step-by-step instructions.
- **Why it matters (perspective)** — Segment by audience (e.g. "For Users", "For Protocols") or by dimension. Short benefits or trade-offs so the reader sees relevance to them. Explanation can admit value and perspective.
- **How it works (conceptual)** — High-level flow in 3–5 steps (e.g. Create → Submit → Integrate → Benefit). Describes the process at "about" level; no detailed how-to. Link to get-started or how-to for actual steps.
- **Connections to standards / bigger picture** — One block: standard name, one-sentence definition, link to spec. Optional callout for a key guarantee (e.g. security, compatibility). Builds the web of understanding.
- **Further reading** — Two or three links with clear labels (e.g. "Start Building →" with one-line description, "Technical Documentation →"). Points to how-to and reference; no long prose.

### Structure mapping (Diátaxis)

| Section in doc | Diátaxis role |
|----------------|---------------|
| Title + one-line value statement | **Introduction** — frame the topic, state why it matters |
| The Problem (+ contrast: risks vs benefits) | **Discussion** — context, why things are the way they are |
| The Solution (+ image/example) | **Discussion** — what it is, how it fits; bounded, no how-to |
| Real-World Examples (before/after, scenarios) | **Discussion** — concrete illustration, alternatives/perspective |
| Why It Matters (by audience) | **Discussion** — connections, value, perspective |
| How It Works (high-level steps) | **Discussion** — conceptual flow; link to how-to for details |
| Built on Open Standards + callout | **Discussion** — connections to ecosystem, key guarantee |
| Ready to… / Further reading links | **Further reading** — link to how-to, reference, tutorial |

### Patterns to reuse

- **Problem → Solution arc** — Open with the problem; then "The Solution" in plain language. Keeps explanation focused and motivating.
- **Contrast blocks** — Side-by-side or list: "Risks / drawbacks" vs "Benefits" or "Before" vs "After." Helps the reader reflect and compare.
- **Before/after examples** — Tabs or cards showing the same scenario without vs with the solution (e.g. raw data vs readable summary). Stays illustrative, not instructional.
- **Audience-based "Why it matters"** — Tabs or subsections (For Users, For Developers, For Protocols) with 3–5 short benefit points each. Supports reflection and relevance.
- **Conceptual "How it works"** — Numbered or stepped flow at high level (4–5 steps). No implementation detail; link to get-started or how-to for steps.
- **Standard / ecosystem block** — One paragraph: standard name, what it is, link. Optional tags (e.g. Interoperable, Open Source). Optional callout for one critical guarantee.
- **CTA + further reading** — One short "Ready to…?" block if appropriate, then a small grid of links: "Start Building →" (how-to), "Technical Documentation →" (reference). One line per link.

When writing or reviewing explanation, check: Is the topic framed with context (problem/why)? Is the discussion bounded (no how-to steps or reference tables in-line)? Are connections and perspective present? Does it end with clear links to how-to and reference?
