# Integration: config.py ↔ Skill

This skill encodes the same assessment logic as `config.py` in the repo root.

## Mapping

| config.py | Skill |
|-----------|--------|
| `importance_levels` dict | CRITERIA.md “Importance weights” table |
| `checklist` (criteria + descriptions + importance + applies_to) | CRITERIA.md “Criteria (checklist)” section |
| `metadata: True` items | “metadata only, not scored” in CRITERIA.md |
| Per-page prompt built in `doc_analyzer.generate_gpt4o_prompt()` | SKILL.md workflow + CRITERIA.md loaded on demand |

## Using this skill

**In Cursor**  
Skill lives in `.cursor/skills/doc-assessment/`. The agent uses it when you ask to assess docs, score documentation, or generate a doc quality report. You can say: “Assess this doc against our criteria” and paste content (and optionally doc type and image_stats).

**Claude Code** (if you switch)  
Copy this folder to `.claude/skills/doc-assessment/`. Same SKILL.md + CRITERIA.md; Claude Code discovers it automatically.

**Claude API**  
1. Create a custom Skill via the Skills API and upload this directory (or zip SKILL.md + CRITERIA.md).  
2. In the request, pass the skill in the `container` / `skill_id` parameter and send a short user message plus the document content (and optional doc_type, image_stats).  
3. You no longer need to inject the full checklist in every request; the model uses the skill’s instructions and CRITERIA.md.

**Python (today)**  
Your current `doc_analyzer.py` builds one big prompt per page with full checklist + content. To mirror the skill flow with Claude API you would:  
- Keep sending one request per page (or batch if the API supports it).  
- User message: e.g. “Assess this documentation page. Doc type: {doc_type}. Image stats: {image_stats}. Content:\n\n{content}”.  
- Rely on the attached Skill for criteria and workflow instead of putting the full checklist in the message.  
- Parse the JSON response as you already do for `criteria_scores`, `strengths`, `issues`, `recommendations`, `overall_score`.

**Consistent scoring with doc_analysis**  
When running doc-assessment from Python (e.g. on mdx_docs or any index), use the repo's `score_aggregator` so overall scores match the doc_analysis pipeline:  
- `normalize_criteria_scores(raw_criteria_scores)` — map criterion names (e.g. snake_case) to CRITERIA.md Title Case.  
- `compute_overall_score(normalized_criteria_scores, doc_type)` — weighted overall (N/A excluded, min content cap for tutorial/how-to/explanation).  
Use this computed overall instead of any model-provided `overall_score`. `doc_analyzer.py` already does this for GPT-4o responses.

## Keeping in sync

When you change `config.py` (new criteria, new doc types, weight changes), update CRITERIA.md to match so the skill and the Python config stay aligned.
