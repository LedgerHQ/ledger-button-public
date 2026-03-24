# Vocabulary: Prefer / Avoid

Use this list when applying the voice-and-style skill. Prefer the left column; avoid the right (unless the note says otherwise). Add or change rows to match your company style.

**American English (Chicago Manual of Style):** Use the "Prefer" column for spelling and usage; the "Avoid" column includes British spellings and discouraged forms. See the Chicago Manual of Style (18th edition) and [REFERENCE.md](REFERENCE.md).

---

## General usage

| Prefer | Avoid | Note |
|--------|--------|------|
| sign in | log in | Consistent with product UI |
| sign out | log out | |
| user | customer | Use "customer" only in product/marketing contexts |
| use | leverage | Use "leverage" only when meaning strategic advantage, not as a synonym for "use" |
| use | utilise / utilize | Prefer "use" |
| Click **X** / Select **X** | click on the button / click on X | Name the UI element and bold it; avoid vague "click on" without the label |
| connection | connexion | "Connexion" is French; use English "connection" |
| end-user (as adjective) | end user (as adjective) | Hyphenate in compound adjectives (e.g. "end-user experience") |

---

## American English spelling (Chicago Manual of Style)

Prefer American English spellings in all documentation.

| Prefer | Avoid | Note |
|--------|--------|------|
| organize, organized, organization | organise, organised, organisation | Also: recognize, analyze, authorize, characterize, customize, emphasize, harmonize, prioritize, summarize |
| color, favor, honor, labor, neighbor, behavior | colour, favour, honour, labour, neighbour, behaviour | |
| center, fiber, meter (unit), theater | centre, fibre, metre (unit), theatre | "Meter" = measuring device or unit of length in AmE |
| defense, license (noun), offense | defence, licence (noun), offence | |
| traveling, canceled, labeled | travelling, cancelled, labelled | Single l in inflected forms; fulfill, enrollment |
| catalog, dialog, program | catalogue, dialogue, programme | |
| gray | grey | |
| practice (verb and noun) | practise (verb) | American English uses "practice" for both verb and noun |
| dependent (adjective and noun) | dependant | AmE uses "dependent" for both |
| percent (one word in running text) | per cent (two words) | Chicago style; use "%" with figures in technical contexts |

---

## Product / feature names

| Prefer | Avoid | Note |
|--------|--------|------|
| Ledger Wallet | Ledger Live | App name; use Ledger Wallet in new and updated content |
| signer | wallet (hardware sense) | For the physical signing device; "wallet" stays for the app (Ledger Wallet) |
| all-in-one crypto app | companion app | For the Ledger Wallet app when describing its role |
| Ledger OS | BOLOS | Internal codename; use Ledger OS in user-facing docs |
| Secret Recovery Phrase | seed phrase (in user-facing copy) | Ledger uses "Secret Recovery Phrase"; "seed phrase" is common in crypto but prefer Ledger term in docs |
| Clear Signing | — | Human-readable transaction display; use as-is (developers.ledger.com) |
| Secure Element | — | Certified chip that isolates keys; use as-is |
| HSM | — | Keep "HSM" (Hardware Security Module); do not replace |

---

## Device → signer and product terminology

**Context matters.** Ledger is moving from "hardware wallet" to "signer" to reflect that the device signs transactions and proves intent; it does not store crypto (assets live on the blockchain). In developer docs, "device" still appears in API names (e.g. Device Management Kit, "connect to a device"). Use "signer" in user-facing and Academy-style content; keep "device" where the developer portal or code does.

| Prefer | Avoid | Note |
|--------|--------|------|
| signer | device | Default for the physical signing product; use "device" only where context or transition requires it |
| Ledger signer | Ledger device | |
| Ledger secure digital signer / [L] secure digital signer | Ledger device | Use when you need to emphasise "secure digital signer"; [L] is shorthand where appropriate |
| secure touchscreen signer | secure touchscreen device | "Device" may remain during transition where needed |
| signer | hardware wallet | For the physical product |
| Ledger signer | Ledger hardware wallet | |
| signer | PSD / Personal security device | Prefer "signer" in user-facing docs |

### Ledger signer product names (trademarks)

Use the official trademarked names. Do not use generic "Ledger device" when referring to a specific product.

| Prefer | Avoid | Note |
|--------|--------|------|
| secure touchscreen signers | latest generation signers | When talking about Ledger Stax™, Ledger Flex™, Ledger Nano™ Gen5 as sa group |
| Classics / Original Ledger Nano signers | "Ledger Nano range of devices" (pre-touchscreen) | When referring to the pre-touchscreen Nano line as a group (Ledger Nano S Plus™, Ledger Nano X™) |
| secure touchscreen signer | secure touchscreen device | Prefer "signer" in user-facing and Academy content |

---

## Commonly misused words and expressions (Chicago style)

Align with the Chicago Manual of Style chapter 5 (Grammar and Usage). Examples:

| Prefer | Avoid / use carefully | Note |
|--------|------------------------|------|
| which (for non-restrictive clauses) | that (for non-restrictive) | "The report, which was published in 2025, …" |
| that (for restrictive clauses) | which (for restrictive) | "The report that we published in 2025 …" |
| fewer (countable) | less (for countables) | "Fewer items"; "less time" (uncountable) |
| affect (verb) / effect (noun, usually) | affect/effect confused | "Effect" as verb = to bring about |
| ensure | insure | Use "insure" only for insurance |
| among | amongst | Prefer "among"; "amongst" is chiefly British |
| while | whilst | Prefer "while"; "whilst" is chiefly British |
| consistent with | consistent to | |
| different from / different than | — | Both acceptable in American English; "different from" is more formal |
| focused, focusing | focussed, focussing | One "s" in American English |

---

## Terms to avoid entirely

- Internal codenames, deprecated jargon, off-brand phrases (e.g. BOLOS → Ledger OS; "hardware wallet" for the physical product → signer).
- British-only spellings when writing American English (see tables above).

---

## Terms to use sparingly

- **leverage** — prefer "use" unless meaning strategic advantage.
- **utilize** — prefer "use".
- **amongst / whilst** — avoid; use "among" / "while" instead.
