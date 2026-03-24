---
name: doc-assessment
description: Scores documentation quality against a fixed checklist and importance weights. Use when assessing MDX or documentation pages, generating doc quality reports, or when the user asks for documentation assessment, readability index, or doc scoring.
---

# Documentation Quality Assessment

Evaluates a single documentation page against criteria and importance weights, then returns structured JSON (criteria_scores, strengths, issues, recommendations, overall_score).

## When to use

- User provides document content (and optionally doc type, image stats). Doc type may come from front matter, inference, or the user’s answer when you ask.
- Task is to score the doc, produce a quality report, or run a readability/assessment pipeline.

## Workflow

1. **Resolve document type** (one of `tutorial`, `how-to`, `reference`, `explanation`):
   - **Front matter first**: Check YAML front matter for type. Common keys: `category`, `document_type`. Use the value only if it is one of the four allowed types (normalize to lowercase; map variants like "howto" to `how-to`).
   - **If not in front matter**: Infer from content and structure (e.g. step-by-step vs reference-style, headings, code examples).
   - **If still unclear**: Ask the user: *"What is the document type for this page (tutorial | how-to | reference | explanation)?"* so the correct criteria are applied. Do not guess; asking ensures consistent scoring with the batch pipeline.
2. **Load applicable criteria**: Read [CRITERIA.md](CRITERIA.md). Use only criteria whose `applies_to` includes the document type. Skip criteria with `metadata: true` for scoring.
3. **Criterion names**: Use the **exact criterion names** from CRITERIA.md (e.g. "Minimum content threshold", "Clear and concise language", "Cross-document navigation") in `criteria_scores` so scores can be aggregated consistently with the doc_analysis pipeline.
4. **Score**: For each applicable criterion, assign 0–10 (0 = failed/missing, 10 = excellent), with a brief explanation.
5. **Image accessibility**: If the page has no images, mark "Image accessibility" as Not Applicable and **exclude from the overall** (omit from weighted sum). If image stats are provided (e.g. total_images, with_alt, missing_alt), use them to inform this criterion.
6. **Overall score**: Compute in code:
   - **Formula**: `overall = sum(score × weight) / sum(weight)` over **applicable criteria only**, **excluding N/A** (do not include N/A criteria in the sum). Weights: must_have 5.0, should_have 3.0, nice_to_have 1.0. Clamp result to 1–10.
   - **Cap**: If document type is tutorial, how-to, or explanation and "Minimum content threshold" is not met (score &lt; 2), set overall to **1.0** regardless of other scores.
7. **Extras**: List 3–5 strengths, 3–5 issues, 3–5 specific recommendations.

## Output format

Return valid JSON only, no markdown code fence around it when consumed by an API. Structure:

```json
{
  "criteria_scores": {
    "Criterion name": {
      "score": 8,
      "explanation": "Brief explanation"
    }
  },
  "strengths": ["strength1", "strength2", "..."],
  "issues": ["issue1", "issue2", "..."],
  "recommendations": ["recommendation1", "..."],
  "overall_score": 7.5
}
```

- `overall_score`: number from 1.0 to 10.0, computed from criterion scores using the formula above (N/A excluded, min content cap applied when applicable).
- For Not Applicable criteria, omit from the weighted aggregate; in output either omit from `criteria_scores` or include with `"n/a": true` and no numeric score in the overall.

## Optional input context

- **doc_type**: `tutorial` | `how-to` | `reference` | `explanation` — may be provided by the user (e.g. after you ask when type is not in front matter or inferable).
- **image_stats**: `{ "total_images", "with_alt", "missing_alt", "empty_alt", "short_alt", "ratio_with_alt" }` — use to inform "Image accessibility" and general clarity.

## Additional resources

- Full criteria list, descriptions, and importance: [CRITERIA.md](CRITERIA.md)
