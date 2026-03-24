# Doc: Create or improve

One command to **create** or **improve** documentation: the agent finds the right [Diátaxis](https://diataxis.fr/) type (tutorial, how-to, reference, or explanation), drafts or restructures (including transforming one type into another), and **always** applies company tone and voice.

---

## When the input is a priority doc analysis report (JSON)

If the user provides a path to or content of a **top-priority doc analysis** JSON (e.g. from a readability/assessment pipeline), use the **apply-doc-analysis-report** skill. It consumes the report’s issues, recommendations, and low criteria, maps report paths to this repo (`pages/docs/` by default), and for each page runs the create-or-improve flow below (type, draft/restructure, voice, frontmatter). See [apply-doc-analysis-report](.cursor/skills/apply-doc-analysis-report/SKILL.md).

---

## When the doc is empty or the user says "I want to write about X"

1. **Choose type:** Use the **choose-doc-template** skill. From the user’s description (topic, audience, goal), pick the right type. If unclear, ask one short question (e.g. "Is the reader learning from scratch or do they already know what they want?").
2. **Draft and structure:** Use the matching **write-*** skill (write-tutorial, write-how-to-guide, write-reference, or write-explanation) to create an outline or draft. Follow that skill’s Structure and CHECKLIST. Where the doc describes this project’s APIs, config, or workflows, **search the codebase** so names, paths, and examples match the implementation.
3. **Apply voice:** **Always** apply the **voice-and-style** skill (tone, vocabulary, American English). Use VOCABULARY.md and EXAMPLES.md. Align with the **doc-conventions** rule.
4. **Frontmatter:** Set `title` and `category` (e.g. `how-to`, `reference`, `tutorial`, `explanation`) in frontmatter.

---

## When the doc already has content

1. **Determine current state**
   - **Assigned category:** From **doc-conventions**: frontmatter `category` first, then path (`beginner`→tutorial, `integration`/`how-to`→how-to, `reference(s)`→reference, `explanation`→explanation).
   - **Content classification:** Use the **choose-doc-template** skill (decision tree or QUICK-REFERENCE) to classify what the content *is* (reference, how-to, tutorial, explanation). Read title, intro, headings, and key phrases.

2. **Choose target type**
   - If the user **asked to change type** (e.g. "turn this into a how-to", "make it a reference", "convert to explanation"), use that as the target type.
   - Else if the user specified a type in this run, use that.
   - Otherwise: if **assigned** and **content** match, keep that type; if they differ, recommend the **assigned** type (so the page matches its declared template) and confirm briefly before changing. If there is no assigned category, recommend a type from the content and **choose-doc-template**; confirm before changing.

3. **Draft, restructure, or transform**
   - Where the doc describes this project’s APIs, config, or workflows, use the **project codebase** (search or open relevant source files) so examples, names, and paths are accurate.
   - Load and apply the matching **write-*** skill for the target type:
     - [write-explanation](.cursor/skills/write-explanation/SKILL.md)
     - [write-how-to-guide](.cursor/skills/write-how-to-guide/SKILL.md)
     - [write-reference](.cursor/skills/write-reference/SKILL.md)
     - [write-tutorial](.cursor/skills/write-tutorial/SKILL.md)
   - Restructure and rewrite using that skill’s **Structure**, **Diátaxis principles**, **Language**, and **What to Avoid**. Preserve factual content and links; change organisation, tone, and framing so the page clearly fits the target type (e.g. narrative → steps for how-to, steps → discussion for explanation).
   - Run through that skill’s **CHECKLIST.md** and fix any gaps.
   - Update frontmatter **`category`** to the target type.

4. **Apply voice:** **Always** apply the **voice-and-style** skill (tone, vocabulary, American English). Use VOCABULARY.md and EXAMPLES.md. Align with **doc-conventions**.

---

## Summary to give the user

- **Type chosen:** (e.g. how-to) and one-line reason (user request, assigned, or recommended from content).
- **What you did:** Drafted / restructured / transformed; sections added or changed; frontmatter updated; voice applied.
