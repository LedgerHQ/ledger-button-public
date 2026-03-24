# How-to Guide Examples

Add short examples of good how-to guides here. Load this file when the user asks for a sample or when you need a concrete pattern to follow.

## Example 1: Minimal structure

**Title:** How to enable two-factor authentication

1. **Introduction** — "This guide shows you how to enable 2FA for your account. You need an authenticator app installed."
2. **Instructions** — Steps: Open Settings → Security → Enable 2FA → Scan QR code → Enter code → Save.
3. **Troubleshooting** — "If the code is rejected, check that your device time is in sync."
4. **End** — "You can now sign in with your password and authenticator code. For recovery options, see [reference]."

Use the same pattern: problem stated up front, ordered steps, brief troubleshooting, link out to reference/explanation.

---

## Example 2: Real-world how-to (technical, with code)

Use this when you need a richer pattern (code, tables, multiple subsections). The structure below is drawn from a technical how-to titled *Build a Custom Command* (extending a class, implementing methods, then using the result).

### What makes it work

- **Precise title** — "Build a Custom Command" states exactly what the reader will do.
- **Intro = task + recommendation** — Opens with what you can do (extend `Command`, implement `getApdu` and `parseResponse`) and recommends this over `sendApdu`.
- **Explicit prerequisites** — Bullet list (version, knowledge, link to Getting Started) so the reader can qualify before starting.
- **Single path, then detail** — "Quick Example" gives one complete, copy-pasteable flow; "Usage" shows how to run it. Builder/Parser come after as reference-style subsections with tables.
- **Troubleshooting in layers** — Common patterns (code), error codes (table with solution column), debugging tips (numbered), custom errors (code). Reader can find their case quickly.
- **End with references** — Links to built-in command examples and sample apps instead of inlining everything.

### Structure mapping (Diátaxis)

| Section in doc | Diátaxis role |
|----------------|---------------|
| First paragraph + Prerequisites | **Introduction** — task, scope, prerequisites, links |
| Quick Example + Usage | **Instructions** — one coherent path; "Usage" is the payoff step |
| ApduBuilder / ApduParser usage | **Instructions** — follow-up steps; tables defer full reference |
| Error Handling and Troubleshooting | **Error handling and troubleshooting** — patterns, codes, tips |
| Examples and References | **End** — point to reference and examples, no duplication |

### Patterns to reuse

- **Prerequisites block** — Short bullet list + one link to setup/getting started.
- **Quick Example then Usage** — One full working example, then "how to use it" in real code.
- **Reference-style subsections** — After the main path, add "X Usage" with a short example and an "Available methods" table; keep the guide actionable, link to full reference for exhaustive lists.
- **Troubleshooting table** — Columns such as: Status/Code, Error type, Description, Solution.
- **Debugging tips** — 2–4 numbered, concrete tips (e.g. enable logging, validate before send, check lengths).
- **Outro** — "Study these…" / "See complete implementations in…" with links; no long prose.

When writing or reviewing a how-to, compare its flow to this: intro → one clear path → optional reference-style detail → troubleshooting → links out.
