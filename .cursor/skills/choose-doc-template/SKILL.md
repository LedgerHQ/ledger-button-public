---
name: choose-doc-template
description: Decision tree for choosing the right documentation template (tutorial, how-to, reference, or explanation) following the Diátaxis framework. Use when the user wants to create new docs, isn't sure which type to use, needs to classify existing content, or pick a doc type.
source: https://diataxis.fr/
metadata:
  document_type: meta
  framework: diataxis
---

# Template Decision Tree

Use this tree to pick the right writing template for your documentation. Follow the questions in order; each answer leads to a branch or a template.

For a quick lookup without walking the tree, see [QUICK-REFERENCE.md](QUICK-REFERENCE.md).

---

## How to use this with an agent (in your editor)

**You** describe what you want to document (topic, audience, or goal). **The agent** uses this file to choose the right template and can then load that template to help you write. Project conventions (frontmatter, invariants) are in the **doc-conventions** rule; it also points to the write-* and voice-and-style skills.

| What you do | What the agent does |
|-------------|---------------------|
| **@-mention this file** — e.g. "I need to document our auth flow" | Applies the signal-word rules and decision tree, states the template in the first sentence, explains why in one sentence, and points to the write-* skill to load next. |
| **Ask directly** — "Which template for a doc that explains why we use OAuth?" | Uses the tree (e.g. "understand why" → Explanation) and recommends the template; you can then load the chosen skill to write. |
| **Describe the doc** — "I'm writing a step-by-step for integrating the SDK" | Maps "step-by-step for integrating" to How-to (reader has a goal), recommends the write-how-to-guide skill, and can use it to draft or structure the doc. |
| **Use company style** — "Use our company voice" or "Follow our style guide" | After choosing a template, also apply the [voice-and-style](../voice-and-style/SKILL.md) skill for tone and vocabulary. |

**Progressive disclosure:** After choosing a template, load only that skill folder (e.g. `write-how-to-guide/`); do not load all four doc-type skills.

---

## Agent response format

When recommending a template, always follow this structure — no exceptions:

1. **State the template name in your first sentence.** Example: "**How-to guide.**" or "**Explanation.**"
2. **One sentence explaining why** — link the user's stated purpose to the Diátaxis category (e.g. "You're covering design rationale, not task steps.").
3. **End with the skill to load.** Example: "Load the [`write-how-to-guide`](../write-how-to-guide/SKILL.md) skill."

Do not walk through the decision tree in your response. Do not explain which section or branch you followed. Give the answer, the reason, the next step — in that order.

**Example of a correct response:**

> **How-to guide.** The reader has a specific goal and already knows the product — they need clear steps, not a lesson. Load the [`write-how-to-guide`](../write-how-to-guide/SKILL.md) skill.

**Example of an incorrect response (do not do this):**

> Let me check two things: first, does the reader want to get something done? Yes. Second, do they already know the product? Yes, you said they do. So we go to Section 2 — that gives us **How-to guide**. Load the skill.

**When to ask a clarifying question:** Only if the input contains *no signal* about the reader's purpose or knowledge level. If the input contains any of the following, decide directly without asking:
- Task verbs ("configure", "connect", "integrate", "fix", "deploy", "set up") → go to B/Section 2
- Understanding signals ("why", "how it fits", "context", "trade-offs", "designed this way") → C (Explanation)
- Learning signals ("new to", "getting started", "familiar", "beginner") → D (Tutorial)
- Lookup signals ("options", "parameters", "API", "flags", "format of") → A (Reference)

---

## 1. What is the primary purpose of the document?

**A. The reader will look up facts** — e.g. "What does this API do?", "What options does this command accept?", "What is the format of X?"

→ **[Reference](../write-reference/SKILL.md)**  
*Technical description of the machinery: APIs, commands, options, configuration, behaviour. Structure follows the product so users can find things quickly.*

---

**B. The reader wants to get something done** — e.g. "How do I configure X?", "How do I fix Y?", "How do I integrate Z?"

→ Go to **Section 2**.

---

**C. The reader wants to understand** — e.g. "Why is it designed this way?", "How does this fit with the rest?", "What are the trade-offs?"

→ **[Explanation](../write-explanation/SKILL.md)**  
*Discursive treatment of a topic: context, background, design choices, alternatives. Understanding-oriented; can be read away from the product.*

---

**D. The reader is learning** — e.g. "I'm new; I want to get familiar with the product/workflow by doing something guided."

→ **[Tutorial](../write-tutorial/SKILL.md)**  
*Lesson-style, learning by doing. You choose what they do; outcome is confidence and familiarity, not just a one-off task.*

---

## 2. (Only if you chose B) Does the reader already know what they want and how the product works?

**Yes** — They have a specific goal or problem; they need clear steps, not a lesson.

→ **[How-to guide](../write-how-to-guide/SKILL.md)**  
*Goal-oriented directions: one task, one path. Addresses "How do I do X?" for someone who is already competent.*

**No** — They're still learning the product or workflow; they need a guided experience.

→ **[Tutorial](../write-tutorial/SKILL.md)**  
*Learning-oriented: you lead them through a concrete journey so they gain confidence and familiarity.*
