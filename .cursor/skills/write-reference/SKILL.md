---
name: write-reference
description: Guide for writing reference documentation following the Diátaxis framework. Use when the user wants to write or improve reference material—technical description of the machinery and how to operate it, for consultation (not learning or task completion).
source: https://diataxis.fr/reference/
metadata:
  document_type: reference
  framework: diataxis
---

# Reference Writing (Diátaxis)

**Instructions:** Use this skill by (1) confirming the document type with the user if unclear, (2) applying the Structure section below to draft or restructure, (3) before finishing, running through [CHECKLIST.md](CHECKLIST.md). When editing docs in this project, follow the **doc-conventions** rule for frontmatter and invariants (the rule applies when `docs/` files are open). Use this skill for structure and the **voice-and-style** skill for tone and vocabulary. When the reference describes **this project's** APIs, commands, or config, use the **project's code** (e.g. search the project for symbols, paths, and examples) so the doc matches the implementation.

**Content integrity rule:** Only write content you can verify from the project's codebase, the user-provided input, or an authoritative external source. If information is missing, incomplete, or ambiguous, insert a `[TODO: verify — <what's missing>]` placeholder and flag it for the author. Never invent, assume, or fabricate technical details, API signatures, behavior, parameters, or background context to fill gaps.

Use this when writing **reference** material: **technical description** of the system, API, or product—how it works and how to operate it. Reference is **information-oriented**; the reader **consults** it while working, for truth and certainty.

For examples, see [EXAMPLES.md](EXAMPLES.md) when needed.

**Optional: Context7 MCP.** When the reference documents an **external API, library, or framework**, use Context7: `resolve-library-id` for the library name, then `query-docs` to fetch current documentation. Use that to verify or update the doc so it stays accurate. Skip if the reference is only for internal/product-specific content.

## When to Use This Type

- The content **describes** the product (APIs, commands, options, configuration, behaviour).
- The reader looks up **facts**—what exists, what it does, what the rules are.
- Structure follows the **structure of the product** (modules, commands, parameters) so users can find things quickly.

## Required Output Sections

Every reference page **must** contain all four sections below, in this order. Missing any section is an error.

| # | Section | Required? | Notes |
|---|---------|-----------|-------|
| 1 | Overview | **Required** | 1–3 sentences; scope of this reference |
| 2 | Systematic description | **Required** | All items described using the item template |
| 3 | Examples | Recommended | At least one short code snippet |
| 4 | Cross-references | **Required** | Minimum 2 links |

## Structure

1. **Overview / entry point**
   - Brief statement of what this reference covers (e.g. a module, a CLI, an API).
   - No long intro; get to the facts.

2. **Systematic description**
   - Organise by the **product's structure** (e.g. by namespace, command, endpoint, config section).
   - Use consistent patterns (e.g. same headings and order for every command or endpoint).

   **Required template — apply to every item (API method, config option, command, error code, etc.):**
   - **Name:** The identifier in `code` format (for TypeScript APIs, include the full signature: `methodName(param: Type): ReturnType`)
   - **Purpose:** One sentence stating what this item does
   - **Parameters / Options / Fields:** List each with: name · type · required/optional · description. Use a table for 3+ parameters.
   - **Behaviour:** What happens when used; what it returns, emits, or triggers; conditions under which it changes state
   - **Constraints:** Must/must-not rules (omit this field only if no constraints apply)
   - **Example:** Short code snippet showing usage (omit only if genuinely not illustrative)

3. **Examples (optional but valuable)**
   - Short examples that illustrate usage without turning into a how-to or tutorial.
   - Example of a command call, an API request, or a config snippet with minimal context.

4. **Cross-references** *(required — do not omit)*
   - Include **at minimum two links**: one to a related reference page and one to a how-to guide or explanation doc for this topic.
   - If these docs do not yet exist, use a descriptive placeholder link (e.g. `[How-to: Connect to a device](../how-to/connect.md)`).
   - Typical entries: related API reference, setup how-to, background explanation, canonical external spec.

## Diátaxis Principles

- **Describe, and only describe.** Neutral, factual description. No instruction, no opinion, no teaching.
- **Austere and consistent.** Same format and style throughout; no narrative or marketing.
- **Respect the structure of the machinery.** Documentation structure should mirror the product so users can navigate both at once.
- **Adopt standard patterns.** Use conventions your audience expects (e.g. same fields for every API endpoint).
- **Provide examples** to illustrate usage without turning into a how-to; keep them short and factual.

## TypeScript API Conventions

When documenting TypeScript APIs, apply these conventions in the **Name** field and parameter lists:

- Full signature: `methodName(param: Type, optional?: Type): ReturnType`
- Union types: `'debug' | 'info' | 'warn' | 'error'`
- Optional parameters: `options?: ConnectOptions`
- Generic return types: `Promise<DeviceConnection>`, `Observable<TransportEvent>`
- Read-only properties: `readonly deviceModel: DeviceModel`
- Overloads: list each signature separately using the item template

## Language

- State **facts**: *"Django's default logging configuration inherits Python's defaults. It's available as `django.utils.log.DEFAULT_LOGGING`."*
- **List** items: *"Sub-commands are: a, b, c, d."* — same for options, flags, error codes, etc.
- **Constraints**: *"You must use a. You must not apply b unless c. Never d."* — where appropriate.

## What to Avoid

- **Explaining *why* or design rationale** (link to explanation instead). Never write historical context, design motivation, or conceptual background inline.
  - ❌ "APDU was designed to follow ISO 7816-4 for smart card communication, providing a flexible command structure…" → ✅ "APDU is the command format used by hardware wallet protocols. Fields: CLA, INS, P1, P2, Lc, Data, Le."
  - ❌ "Sessions use a lifecycle pattern to ensure resources are released properly" → ✅ "A session has three states: `closed`, `opening`, `open`."
  - ❌ "Error codes reflect the device's security model, where higher CLA bytes indicate app-layer errors" → ✅ List the codes, names, and trigger conditions without explaining the security model.
- **Step-by-step instructions** for tasks (link to how-to). Never use "first", "then", "next", "finally" to sequence actions.
- **Teaching or narrative** (link to tutorial). No "you will learn", no concept introductions, no worked examples that walk the reader through reasoning.
- **Marketing language**: no "powerful", "easy-to-use", "seamless", "flexible". Every sentence is a fact, not a claim.
- Mixing reference with how-to or explanation in the same page; link instead.
