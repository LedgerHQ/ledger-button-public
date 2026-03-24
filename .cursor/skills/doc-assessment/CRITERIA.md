# Documentation Assessment Criteria

## Importance weights

Use these weights when computing the overall score (normalize so the final score is 1–10):

| Level        | Weight | Meaning |
|-------------|--------|---------|
| must_have   | 5.0    | Essential; doc fails its purpose without it |
| should_have| 3.0    | Significantly improves usability |
| nice_to_have| 1.0    | Enhances but not strictly necessary |

---

## Criteria (checklist)

**Document type** (metadata only, not scored)  
Identify: tutorial, how-to guide, reference, or explanation.  
`applies_to`: all. `metadata`: true.

---

### Core content quality

**Minimum content threshold**  
Documentation contains substantial value: at least one of (1) ~200+ words of substantive text, (2) multiple informative images/diagrams with context, (3) embedded video or interactive elements, (4) substantial code examples, or (5) a combination that delivers clear value.  
**CRITICAL:** If not met for tutorial/how-to/explanation, cap overall score at the lowest tier.  
Importance: must_have. Applies to: tutorial, how-to, explanation.

**Clear and concise language**  
Uses clear, simple language without unnecessary jargon.  
Importance: must_have. Applies to: tutorial, how-to, reference, explanation.

**Completeness**  
Covers all necessary information without gaps or assumptions.  
Importance: must_have. Applies to: tutorial, how-to, reference, explanation.

**Publication readiness**  
Complete and ready for public use; no placeholders (TBD, TBW, WIP, etc.).  
Importance: should_have. Applies to: tutorial, how-to, reference, explanation.

**Title and structure coherence**  
Title matches content; sections follow a logical progression.  
Importance: should_have. Applies to: tutorial, how-to, reference, explanation.

---

### Theoretical content (explanations and references)

**Conceptual clarity**  
Concepts explained with appropriate depth and examples.  
Importance: must_have. Applies to: explanation, reference.

**Logical flow**  
Information builds progressively with clear relationships between concepts.  
Importance: must_have. Applies to: explanation, reference.

**Contextual information**  
Explains why and when concepts matter, not just what they are.  
Importance: must_have. Applies to: explanation.

---

### Practical content (tutorials and how-tos)

**Code example completeness**  
Code is executable: complete functions/methods, defined/imported variables and dependencies, setup and configuration, context for where/when to use, standard syntax.  
Importance: must_have. Applies to: tutorial, how-to.

**Workflow completeness**  
Either self-contained end-to-end examples or clear place in a larger workflow with prev/next navigation; each page is a complete logical unit or clearly references dependencies; context for where the step fits; links to related resources.  
Importance: must_have. Applies to: tutorial, how-to.

**Error handling and troubleshooting**  
Addresses issues via: 2–3 common errors with solutions, troubleshooting for complex procedures, explanation of errors/logs, preventive guidance, when to seek more help.  
Importance: must_have. Applies to: how-to.

**Version information accessibility**  
Version requirements clear on the page or linked from a primary page; version-dependent differences highlighted; version info visible.  
Importance: should_have. Applies to: tutorial, how-to.

---

### Usability and navigation

**Introduction clarity**  
Purpose clear in the introduction; indicates if it builds on other docs.  
Importance: should_have. Applies to: tutorial, how-to, reference, explanation.

**Visual elements effectiveness**  
Text references visuals (diagrams, screenshots) and gives context; visuals integrated with explanation.  
Importance: should_have. Applies to: tutorial, how-to, explanation.

**Cross-document navigation**  
Functional links to prerequisites, related content, and next steps.  
Importance: must_have. Applies to: tutorial, how-to, reference, explanation.

**Main takeaways**  
Summary of key points or concepts.  
Importance: nice_to_have. Applies to: explanation.

**Image accessibility**  
Meaningful alt text; no empty/placeholder alt; descriptive length. If the page has no images, mark Not Applicable and exclude from scoring.  
Importance: should_have. Applies to: tutorial, how-to, reference, explanation.

---

### Cognitive load

**Step complexity**  
Instructions in digestible steps (ideally ≤5 per section).  
Importance: should_have. Applies to: tutorial, how-to.

**Decision points management**  
Limits choices (e.g. 3–5 per section), explains implications, recommends defaults, uses tables/lists, separates major decision points. If no decision points, mark Not Applicable and exclude from score.  
Importance: nice_to_have. Applies to: tutorial, how-to.

**Warning and note implementation**  
If warnings/notes exist: ≤2–3 per major section, visually distinct severity, clear action-oriented language, placed before relevant content, consistent formatting. If the doc needs no warnings/notes, mark Not Applicable. Only penalize when content clearly warrants warnings that are missing.  
Importance: nice_to_have. Applies to: tutorial, how-to, reference, explanation.
