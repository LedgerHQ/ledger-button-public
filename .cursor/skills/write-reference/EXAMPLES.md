# Reference Examples

Add short examples of good reference pages here. Load this file when the user asks for a sample or when you need a concrete pattern.

## Example 1: API endpoint (minimal)

**Name:** `POST /users`  
**Purpose:** Create a new user.  
**Parameters:** `name` (required), `email` (required), `role` (optional, default: `member`).  
**Behaviour:** Returns 201 with user object; 400 if validation fails.  
**Constraints:** Rate limit 100 req/min.  
**Example:** One request/response snippet, minimal context.

Use the same pattern for each endpoint or command: name, purpose, parameters, behaviour, constraints, short example.

---

## Example 2: Specification / format reference (technical)

Use this when the reference describes a standard, file format, or configuration schema (e.g. a metadata spec, API schema, or config reference). The structure below is drawn from a technical reference for a JSON-based specification (ERC-7730 Clear Signing).

### What makes it work

- **Brief overview** — Title + one-line description of what the reference covers. Optional callout linking to getting started or how-to so the page stays purely reference.
- **Quick navigation** — Anchor links to major sections so readers can jump to the part that matches the product structure (e.g. File Structure, Context, Metadata, Display, Format Types, Path System, Example, Validation).
- **Standard / product overview block** — Factual box: name, short definition, metadata (created, author, dependencies), link to canonical spec or schema.
- **Structure follows the product** — Sections mirror the spec: file structure first, then each top-level section (context, metadata, display), then format types, path system, then complete example and validation.
- **Consistent item pattern** — For each “thing” (section, format type, key): **name/code**, **purpose**, **parameters** (required/optional), **example** (short snippet), **output examples** where it helps. Same order and style every time.
- **Tables for parameters and references** — Parameter table: Parameter | Required | Description. Reference table: Reference | Description | Example. Keeps facts scannable.
- **Short examples only** — JSON or code snippets that illustrate the structure; no step-by-step instructions. "Complete Example" at the end shows one full valid instance.
- **Validation checklist** — Bullet list of constraints (e.g. "Include required $schema", "Use correct path roots") so readers can verify correctness.
- **Resources** — Links to schema, registry, or related reference; no long prose.

### Structure mapping (Diátaxis)

| Section in doc | Diátaxis role |
|----------------|---------------|
| Title + one-line description + callout | **Overview / entry point** — what this reference covers, links to how-to/explanation |
| Quick Navigation | **Navigation** — mirrors product structure |
| Standard Overview (fact box) | **Overview** — factual summary, metadata, link to canonical spec |
| File Structure, Context, Metadata, Display | **Systematic description** — by product/spec structure; each item: name, purpose, params, example |
| Format Types + Format Specifications | **Systematic description** — same pattern per format (params table, example, output examples) |
| Path System, Format Keys | **Systematic description** — reference tables and code snippets |
| Complete Example | **Examples** — one full instance, minimal context |
| Validation Checklist | **Systematic description** — constraints in list form |
| Resources | **Cross-references** — links to schema, registry, related docs |

### Patterns to reuse

- **Overview callout** — "This page is the technical reference for X. For a step-by-step guide, see [How-to]. For background, see [Explanation]."
- **Per-section blocks** — For each major part of the product: heading, one-sentence purpose, then list or grid of items with `code` - description (required/optional).
- **Per-item pattern** — Name/code → Purpose → Parameters (table: Parameter | Required | Description) → Example (snippet) → Output examples (when useful).
- **Path / identifier reference** — Table or grid: Identifier | Description | Example. Code snippet for syntax (e.g. array handling).
- **Validation checklist** — Short bullet list of must/must-not rules; no instructions.
- **Resources block** — 2–4 links with title + one-line description (e.g. "JSON Schema → Complete validation schema").

When writing or reviewing reference material, compare: does the structure mirror the product? Is every item described with the same fields? Are examples short and factual, with no how-to or teaching?
