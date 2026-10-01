# Crossroads 0.3.1 — release fixes

September 21, 2026 (Eastern). Local release candidate; not uploaded.

## Changes

- Roshna's offer now states the actual cargo sale and proceeds, or explicitly says no sale is needed. Existing inventory and payment rules are preserved.
- Final choices identify whether the journey ends after the aftermath or continues to another chapter. Labels are checked against actual engine outcomes for chapters 2, 4 and 5.
- Arash's fever and altitude encounters explain that health is general resilience, not a diagnosis. The note is tied to the current encounter, with no new persistent condition or save format.
- Positive trust and standing rewards at 100 explicitly report the cap. Actual partial increases remain numerically correct. No relationship rebalance.
- Removed misleading market-hours risk from the physician offer and explained deterministic costs and absence of real-time deadlines.
- Compacted the landscape, retained full-size enlargement, added a keyboard-focusable Go to choices link, tightened mobile copy, and varied the focal positions of existing Tarim landscapes. All original art files remain unchanged.
- Replaced two obsolete Dunhuang URLs, a redirected UNESCO PDF and an inaccessible legacy IDP manuscripts URL. New package version is 0.3.1; rules and portable save versions are unchanged.

## Source repair evidence

Checked September 21, 2026:

- [IDP / British Library: Dunhuang Limes](https://idp.bl.uk/discover/collection-categories/dunhuang-limes/) describes frontier structures, beacon towers, garrisons and Han wooden documents. Used for frontier administration, beacon context and documentary collections. Fictional transactions are not presented as documented events; collections span several periods.
- [UNESCO: About the Silk Roads](https://www.unesco.org/en/silk-roads/about-silk-roads?hub=196704) supplies broad relay/network context for the final handoff, not evidence of Samira's specific transaction.
- The old UNESCO PDF redirected to the programme homepage. The old IDP manuscripts URL returned 403 to the research tool; replaced with a readable relevant collection page, without claiming the URL is universally unavailable.
- Iranica Caravan, Commerce III, Bactria I and Chinese-Iranian Relations XIII pages and UNESCO's Chang'an–Tianshan listing remained accessible. This was a targeted reference repair, not a complete historical certification of every sentence or illustration.

## Verification

- 217 tests / 17 files passed, including six new regression cases for actual cargo sales, ending labels and capped trust.
- TypeScript and Vite production build passed.
- Production build restored the previous chapter-4 exported save; survived reload; short Kashgar ending displayed its aftermath, completed and persisted on reload. No browser console errors recorded.
- Phone 390×844: no sideways overflow; first fork choice begins at approximately y=811. Longer encounters still require scrolling. Go to choices moves keyboard focus to the option group. Representative desktop and phone screenshots are in `audits/2026-09-21/*-fork-fixed.png`.
- ZIP entries were read back and compared byte-for-byte with every file in `dist`; root index.html and both Tarim assets are present. Exact hashes are in `../releases/v0.3.1-manifest.json`.

## Release boundary

Upload `../releases/Crossroads-The-Silk-Roads-v0.3.1-itch.zip`, not the old root ZIP. The old ZIP was preserved. Hosted itch launch verification remains to be performed after upload. Audio, additional scenes and broad balancing are deferred; they are not required for this focused release.

## Suggested release description

Lead a trading household from Merv toward Dunhuang. Trade goods, care for your people, negotiate obligations and choose a road around the Tarim Basin. Settle along the way or complete the eastern journey. Historical context accompanies a fictional household story.

Play with mouse or touch; A–E shortcuts work while the decision panel has focus. Saves remain in your browser; export a journey file to keep a portable copy. Story mode offers assistance on credit; Caravan challenge makes shortages more demanding. Existing AI-assisted illustrations remain in the build; retain accurate AI disclosure on the store page.

## Published

Published September 21, 2026 (Eastern) at https://titans-forge.itch.io/crossroads-the-silk-roads. Hosted launch, first decision, aftermath and reload persistence verified. See ../releases/v0.3.1-publication-receipt.json.
