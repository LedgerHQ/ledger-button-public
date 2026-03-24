---
name: write-how-to-guide
description: Guide for writing how-to guides following the Diátaxis framework. Use when the user wants to write or improve a how-to guide—a goal-oriented document that helps the reader get something done correctly and safely.
source: https://diataxis.fr/how-to-guides/
metadata:
  document_type: how-to
  framework: diataxis
---

# How-to Guide Writing (Diátaxis)

**Instructions:** Use this skill by (1) confirming the document type with the user if unclear, (2) applying the Structure section below to draft or restructure, (3) before finishing, running through [CHECKLIST.md](CHECKLIST.md). When editing docs in this project, follow the **doc-conventions** rule for frontmatter and invariants (the rule applies when `docs/` files are open). Use this skill for structure and the **voice-and-style** skill for tone and vocabulary. When the how-to describes **this project's** APIs, config, or workflows, use the **project's code** (e.g. search the project for symbols, paths, and examples) so steps and snippets match the implementation.

**Content integrity rule:** Only write content you can verify from the project's codebase, the user-provided input, or an authoritative external source. If information is missing, incomplete, or ambiguous, insert a `[TODO: verify — <what's missing>]` placeholder and flag it for the author. Never invent, assume, or fabricate technical details, API signatures, behavior, parameters, or background context to fill gaps.

Use this when writing **how-to guides**: goal-oriented directions that help the reader **get something done**—solve a problem or reach a result. The reader already knows what they want; your job is to guide their **action**.

For worked examples, see [EXAMPLES.md](EXAMPLES.md) when needed.

## When to Use This Type

- The reader has a **specific goal or problem** (e.g. *how to calibrate the radar array*, *how to configure reconnection back-off*).
- They are **already competent** in the domain; they need directions, not a lesson.
- The guide is **task-focused**, not product-tour or feature list.

## Structure

1. **Introduction**
   - The **first sentence MUST** be a goal statement using one of these exact patterns:
     - *"This guide shows you how to [specific action]."*
     - *"By the end of this guide, you will have [specific, concrete outcome]."*
   - Do NOT open with: *"In this guide, you will learn…"* / *"This guide covers…"* / *"This guide explains…"* / *"X is a [concept]…"*
   - Mention prerequisites or when this guide applies; link to related docs.

2. **Instructions (logical sequence)**
   - Ordered steps that form a single, coherent path through the task.
   - Use conditional imperatives where relevant: *"If you want x, do y. To achieve w, do z."*
   - Keep steps digestible (ideally ≤5 per section).
   - For complex procedures: include branching or decision points only when the task requires them; minimise cognitive load (e.g. 3–5 options per decision, with recommended default).

3. **Error handling and troubleshooting**
   - Include 2–3 common errors with clear solutions.
   - For complex procedures, add a short troubleshooting section (what to check, how to interpret logs).
   - Indicate when to seek additional support.

4. **End**
   - End with a statement of what the reader can now do (e.g. *"Your device is now connected. You can now send commands using…"*).
   - Include at least one link: to reference for options, or to the next logical step in their workflow.
   - Do NOT end abruptly after the last step; always provide a closing sentence and a link.

## Diátaxis Principles

- **Address user problems, not machinery.** Frame by what the user needs to achieve, not by product features.
- **Action only.** No teaching, no long explanation; link to tutorial or explanation if needed.
- **Omit the unnecessary.** Practical usability over completeness; start and end in a meaningful place.
- **Logical sequence.** Order steps so they make sense in time and dependency; respect the user's flow of work and thinking.
- **Seek flow.** Anticipate what the user needs next; avoid context-switching and unnecessary back-and-forth.
- **Title precisely.** The title MUST start with **"How to"** followed by an infinitive verb, e.g. *"How to integrate application performance monitoring"*. Never use gerunds ("Integrating…", "Configuring…", "Handling…") or topic labels ("USB Transport", "BLE Setup") as titles.

## Language

- *"This guide shows you how to…"* — state the problem or task.
- *"If you want x, do y. To achieve w, do z."* — conditional imperatives.
- *"Refer to the X reference guide for a full list of options."* — defer detail to reference.

## What to Avoid

- Turning the guide into a tutorial (teaching concepts step-by-step).
- Listing every option or feature; point to reference instead.
- Long explanations or background; link to explanation.
- Vague titles that don't say what the reader will do.

## Anti-pattern: Teaching vs. Action

**❌ Wrong — starts with background explanation:**
> "Bluetooth Low Energy (BLE) is a wireless communication protocol that allows devices to exchange data without a physical connection. Unlike traditional Bluetooth, BLE is optimised for low power consumption, making it ideal for mobile and IoT use cases. Understanding BLE is important before configuring it in your SDK."

**✓ Correct — opens with the task, then steps:**
> "This guide shows you how to configure BLE transport in the Device SDK.
>
> **Prerequisites:** BLE transport package installed, a BLE-capable system.
>
> 1. Install the BLE transport package…"

Apply this pattern to every technical topic (APDU commands, error handling, transport setup). Do **not** explain what a technology is; go directly to the goal statement and numbered steps.
