---
name: voice-and-style
description: Applies company tone, voice, and vocabulary to documentation. Use when the user wants docs to follow a specific tone or company style, or when writing docs for this project and a style guide exists. Supports American English (Chicago Manual of Style, 18th edition).
metadata:
  document_type: meta
  applies_to: all
---

# Voice and Style

Apply this **in addition to** the chosen doc-type skill (explanation, how-to, reference, tutorial). It refines generic phrasing with company preferences for tone, voice, and vocabulary.

**Instructions:** When the user asks for company style or when writing docs for this project: (1) apply **American English (Chicago Manual of Style)** conventions below when relevant, (2) apply the Tone and Voice sections, (3) use the Vocabulary preferences, (4) follow the Do / Don't examples. For the full vocabulary list see [VOCABULARY.md](VOCABULARY.md); for phrasing examples see [EXAMPLES.md](EXAMPLES.md); for the style guide source see [REFERENCE.md](REFERENCE.md).

When editing docs in this project, the **doc-conventions** rule may be in context and points to this skill for tone, vocabulary, and examples.

---

## American English (Chicago Manual of Style)

When writing or editing for an American English audience, follow the **Chicago Manual of Style** (18th edition). Summary of conventions:

### Spelling (American English)

Use American English spelling (-ize/-ization, -or, -er, -nse, single l, etc.). Full prefer/avoid: [VOCABULARY.md](VOCABULARY.md). Avoid British-only spellings unless the audience or product explicitly uses British English.

### Punctuation and formatting

- **Quotation marks:** Prefer single quotes for normal quotations ('…'); use double for quotes within quotes. (Some EU institutions use double quotes; align with your house style.)
- **Serial comma (Oxford comma):** Use consistently in lists (e.g. "A, B, and C") for clarity.
- **Dashes:** Use en dash (–) for ranges (e.g. 2020–2025). **Do not use em dash (—)** — it is a common AI writing marker and almost always replaceable with a period, comma, colon, or parentheses.
- **Spacing:** One space after colons and semicolons in English. Follow your project’s house style.

### Numbers and dates

- **Numbers:** Spell out one through one hundred when used in running text (unless technical: percentages, decimals, serial numbers); use figures for 101 and above, or consistently throughout when numbers appear frequently. Be consistent in a given document.
- **Dates:** Long form: "February 13, 2025" (month day, year with comma). Use the format your project specifies.
- **Percentages:** Write "percent" (one word) in running text; use "%" with figures in technical or tabular contexts.

### Capitalisation

- **Headings:** Sentence case for headings (capitalise first word and proper nouns only), unless your house style uses title case for H1.
- **Institutions and terms:** Capitalise official bodies (Council of Europe, European Commission); lowercase generic terms (the committee, the commission) unless they refer to the specific body in that document.

### What to avoid (American English)

- British spellings (e.g. organise, colour, centre) unless required by audience.
- Commonly misused words: see [VOCABULARY.md](VOCABULARY.md) and Chicago Manual of Style chapter 5 (Grammar and Usage).

**Source:** Chicago Manual of Style, 18th edition. University of Chicago Press, 2024. See [REFERENCE.md](REFERENCE.md).

---

## Tone

- **Register:** Clear, professional, and accessible. Match Ledger’s voice: confident and human without being casual or promotional in technical docs.
- **Person:** Use "you" for the reader and "we" for Ledger (or the product). Keep the reader in focus.
- **Confidence:** Use "we recommend" and "you should" where appropriate; avoid hedging like "you might want to consider" unless real alternatives exist.
- **Warmth:** Brief, practical acknowledgements (e.g. "If you run into issues…") are fine; avoid marketing fluff or excessive enthusiasm in technical content.

---

## Voice

- **Active voice:** Prefer active over passive. ("The API returns a token" not "A token is returned by the API.")

  Common patterns to fix:
  - "X is not supported" → "We do not support X"
  - "Fired when X changes" (event descriptions) → "Fires when X changes"
  - "X is returned by Y" → "Y returns X"
  - "X must be set" → "Set X to…"
- **Sentence length:** Prefer short, clear sentences; one idea per sentence when possible.
- **Contractions:** Avoid contractions in body text (use "do not", "cannot", "it is"). CoE-style and technical docs favour full forms; imperatives can stay short without contractions.
- **Imperatives:** In how-to and tutorial, use clear imperatives (e.g. "Click **Save**", "Run the command"). In explanation and reference, use statements or "you can…" as appropriate.

---

## Vocabulary

Use preferred terms consistently; avoid terms that are internal, deprecated, or off-brand. **"signer" vs "device" — when to apply each:**
- User-facing prose referring to a Ledger hardware wallet → use **signer** (e.g. "connect your signer", "your users' signer")
- Official product names → keep as-is (Device Management Kit, Device Management API)
- Code samples, parameter names, API identifiers → keep original term unchanged
- References to non-Ledger hardware (third-party devices) → keep "device"

| Prefer | Avoid |
|--------|-------|
| sign in | log in |
| user | customer (in technical docs) |
| signer | device, hardware wallet, PSD (user-facing) |
| Ledger Wallet | Ledger Live |
| American spelling (e.g. organize, center) | British (organise, centre) |

**Full list and product names:** [VOCABULARY.md](VOCABULARY.md).

---

## Do / Don't

- **Do:** "Click **Save** to store your changes." — bold for UI elements.
- **Don't:** "Hit the save button." — avoid casual "hit"; name the label.

- **Do:** "You need a project ID. You can find it in the dashboard."
- **Don't:** "Users must have a project ID which can be found in the dashboard." — avoid passive and "users" when "you" is clearer.

More examples: [EXAMPLES.md](EXAMPLES.md).

---

## Formatting

- **Headings:** Sentence case (see Capitalisation above).
- **Lists:** Use parallel structure; no full stops on bullet points unless they are full sentences.
- **Emphasis:** Bold for UI labels and key terms; italics for first use of a defined term.
- **Acronyms:** On first use in a page, write the full term followed by the acronym in parentheses. Use the acronym alone for all subsequent occurrences on that page.
  - First use: "Hardware Security Module (HSM)"
  - Subsequent uses: "HSM"

---

## What to Avoid

Avoid: jargon or undefined internal terms (e.g. BOLOS → Ledger OS); deprecated or off-brand names (see [VOCABULARY.md](VOCABULARY.md)); British spellings in American English context; overly casual or stiff phrasing (see Tone).

---

## AI Tropes to Avoid

These patterns are statistically common in AI-generated text. Their presence signals machine-written prose and undermines trust. Eliminate them without exception.

### Punctuation
- **Em dash (—):** Never use. Replace with a period, comma, colon, or parentheses depending on the intent.
  - "The API is fast—and easy to use." → "The API is fast and easy to use."
  - "There is one requirement—a valid token." → "There is one requirement: a valid token."

### Filler words and hollow intensifiers
Avoid these words and phrases entirely; they add length without meaning:

| Avoid | Replace with |
|-------|-------------|
| seamlessly | (omit, or describe what actually happens) |
| leverage | use |
| delve into | explore, read, see |
| dive into | read, explore |
| it's worth noting that | (omit; just state the fact) |
| it is important to note that | (omit; just state the fact) |
| in today's world / in today's landscape | (omit) |
| cutting-edge | (omit, or name the specific capability) |
| game-changer / game-changing | (omit) |
| robust | (omit, or describe what makes it reliable) |
| comprehensive | (omit, or list what is covered) |
| powerful | (omit, or explain what it enables) |
| innovative | (omit) |
| straightforward | (omit; show it by being concise) |

### Sentence structure
- **Do not start sentences with "Furthermore,", "Moreover,", "Additionally,"** unless the logical connection requires it. Use "Also," or restructure.
- **Do not use "This allows you to…"** as a standalone follow-on sentence. Merge it into the preceding statement or drop it.
- **Do not use "In conclusion," or "To summarize,"** in technical docs. End sections directly.
- **Avoid stacked relative clauses** introduced by "which" or "that." Split into separate sentences instead.
