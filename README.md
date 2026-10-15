# Crossroads: The Silk Roads

> **Current licensing policy — Forge Game License 2.0 (FG2-CROSSROADS-THE-SILK-ROADS-20261015).** This licensing-only edition requires separate permission for either public hosting or AI training by above-threshold entities on qualifying new Forge-controlled material. Previously supplied gameplay/media retain MIT, earlier Forge and other applicable grants. No retroactive restriction is claimed. See [release scope](LICENSING.md), [complete current terms](LICENSE), [preserved prior terms](LICENSE-LEGACY-PRE-FORGE-2.0.txt), [offline licensing page](FORGE-LICENSING.html) and [new download](https://github.com/titans-forge/Crossroads-The-Silk-Roads/releases/tag/forge-license-2.0-20261015). Earlier statements below describe the earlier game and preserved grants.


Every road carries more than goods.

[Play](https://titans-forge.itch.io/crossroads-the-silk-roads) · [Forge collection](https://github.com/titans-forge/educational-games)

The upgraded edition is supplied under [Forge Game Hosting License 1.0](LICENSE).
See [the checkpoint](LICENSING.md) for covered material, earlier grants and the
commercial hosting threshold. Visual media and dependencies retain their terms.

Lead Samira's fictional merchant household from Merv toward Bactra, the Pamirs, Kashgar, and Dunhuang, around AD 200. Decisions connect trade, family obligations, local knowledge, and historical evidence.

## This edition — 0.3.1

- Story journey offers generous credit and visible recovery costs. Caravan challenge adds tighter supplies, capacity, and credit limits.
- Cargo persists through the journey. Selling goods removes them; accounts, favors, passengers, and manuscripts retain consequences.
- Northern and southern Tarim routes add different encounters. A full eastbound campaign contains 28 decisions; earlier settlement and relay endings remain available.
- Every choice previews its costs and duration, then pauses for an aftermath, including the final choice. Long travel intervals are explicitly compressed and provisioned.
- The atlas places nine cities and regions on an approximate coordinate map. The journal keeps every decision, household contact, promise, and source link.
- Five optional application questions provide first-attempt feedback. A glossary and [teaching guide](docs/TEACHING_GUIDE.md) support discussion and distinguish historical evidence from reconstruction.
- Chapter debriefs let players return to skipped reflections from completed chapters. Scores distinguish attempted, skipped, and unreached questions; first answers remain immutable and portable saves retain the records.
- Final debriefs give each ending its own title, recall up to three recorded turning points, and show an illustrated household roster with destinations. These summaries use the saved journey, not generated or invented outcomes.
- The retained-glass option explicitly names the later Kashgar offer, not an unavailable Bactra sale. Gate care and recruitment wording follow recorded choices; these presentation repairs do not change economic rules or campaign length.
- New journeys use revised strategy rules: reputation changes broker fees, manuscripts earn later referrals, recruited interpreters help at the frontier, and reciprocal obligations earn material support. The choice previews and aftermath explain these connections.
- Version 4 portable saves keep older journeys on their original economic rules, preserve progress, and preview imports before replacement. Invalid browser saves remain recoverable.
- Reading controls offer larger text, optional letter shortcuts, and detailed or summarized people effects. Letter shortcuts work only while focus is inside the decision panel.
- An optional local learner playtest includes opening, closing, and delayed application questions, pausable decision timing, and exportable records. Nothing is uploaded. See the [playtest protocol](docs/PLAYTEST_PROTOCOL.md).
- Responsive layouts retain household health and trust. Dialogs isolate keyboard controls, trap focus, close with Escape, and restore focus. Existing artwork now uses compressed WebP assets; PNG masters remain in source.

## Run locally

Requires Node.js compatible with the installed Vite release.

```bash
npm install
npm run dev
```

Progress saves after every choice in this browser. Use **Atlas & journal → Export journey** to keep a portable JSON file. **Import journey** reviews a save before replacing the active campaign. Older campaigns retain their recorded progress and original economic rules. The oldest formats reconstruct added inventory and obligations from their decisions; migration notes explain this before import.

Choose with the pointer or Tab and Enter. When focus is inside the decision panel, A/B/C select the first three choices; D selects a fourth choice and E a fifth when available. The letters beside the offers identify the current shortcuts, including emergency relief. Disable letter shortcuts in Reading and controls if preferred. Shortcuts pause inside dialogs and form controls. Use Tab to move through controls and Escape to close a dialog. Restart requires confirmation.

## Verify and build

```bash
npm test
npm run build
```

Tests cover content integrity, campaign rules, both route branches, outcomes, first-attempt reflections, strict save validation, legacy migration, strategy payoffs, voluntary playtest records, and storage failures. Production builds include a content gate and TypeScript check.

Package the **contents** of `dist/` with `index.html` at the archive root for HTML5 hosting. The game makes no runtime API requests and requires no account. Serve the build locally or on an ordinary static host; offline availability still depends on the host/browser caching or retaining the downloaded build. No service worker is installed.

## Scope and educational limits

The household, dialogue, prices, and outcomes are fictional. The setting draws on documented trade networks; later evidence is identified as comparison. Routes and elapsed days are illustrative, not a reconstruction of one attested itinerary. Resource units represent simplified caravan stores. Application questions measure answers in this session, not long-term retention or historical mastery. The teaching guide provides source notes and a suggested classroom discussion.

## Journey outlook and regional art

The landscape above each decision follows the current stage, including distinct northern and southern Tarim composites. Enlarge it to inspect the full illustration. Art is illustrative, not archaeological evidence; provenance notes for the new assets are in `src/assets/TARIM_ART.md`.

Open **Road ahead** for upcoming stops, cargo-sensitive opportunities, capacity, separate debt obligations, and existing network benefits. These notes use the current campaign and preserve legacy rule differences. They do not forecast weather, promise profit, or add survival mechanics. **Cargo & accounts** expands the detailed supply ledger.

## Market choices

The supply rail shows total obligations, including Vima's separate claim, without requiring the ledger to be expanded. **Cargo & accounts** and each chapter review separate cash, caravan credit, inherited obligations, and the cash-only settlement shortfall. This is an account statement, not an automatic payment or a cargo valuation. Chapter reviews also explain the unchanged People and Livelihood formulas, with health/trust meters and itemized score contributions. Final handoff prose checks recorded cargo transfers so an empty handoff does not invent another sale.

New journeys use gameplay rules 3, retaining rules-2 network benefits and adding two single-use provisioning bargains: wool for provisions on the approach to Bactra, and a partial glass exchange at Kashgar. Each is a fourth option at an existing encounter, not a repeatable shop. Older rules-1 and rules-2 campaigns retain their original offers; start a new journey to use the additions. Portable save format remains version 4, with the gameplay rules version recorded separately; older game builds reject unsupported rules rather than silently repricing them.

**Compare the bargains** shows final balances at five trade encounters using the settlement engine, including Story assistance. Unavailable offers display their reason instead of hypothetical balances. Silver is a cash/credit balance, not profit; Vima's claim remains separate unless an offer settles it. The trade prices and quantities are fictional gameplay terms, not historical measurements. Learner records retain their rules version so old and new campaigns can be separated in analysis.

On phones, the bargain comparison uses labelled balances for each offer instead of a sideways-scrolling table. At the Kashgar fork, **Compare the two roads** previews both branches with illustrations, opportunities, and engine-calculated departure balances. These are not forecasts of total route profit.

Campaign imports are cancellable while reading. Selecting another file invalidates the earlier read, including delayed failures. A validated file still requires explicit confirmation before replacing the current journey.

## Run a learner pilot

Open **Reading and controls → Open learner playtest**, or use **Optional learner playtest** before starting. Participation is optional and begins only after explicit consent and the opening questions. Use the protocol to observe 6–8 first-time players; an automated browser check is not a learner session. Closing an unfinished question set discards only that unsubmitted set.

Export the final record from each participant’s browser into a local folder. To analyze exported records:

```bash
npm run analyze-playtests -- /absolute/path/to/records /absolute/path/to/results
```

The analyzer writes JSON and CSV summaries, keeps incomplete sessions separate, excludes interrupted timing, and rejects conflicting duplicate records. Same-day follow-up answers are practice, not delayed retention. Results from this small exploratory pilot cannot establish learning effectiveness or population-wide ratings.
