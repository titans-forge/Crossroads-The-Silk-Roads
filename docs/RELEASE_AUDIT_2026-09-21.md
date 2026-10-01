# Crossroads: The Silk Roads — release audit

Audited September 21, 2026 (Eastern). Current source: version 0.3.0, gameplay rules 3. Chosen ahead of Living Waters because it already has a complete, compact journey and a working release pipeline. Living Waters was not inspected in this pass.

## Verdict

Close enough for two focused update passes, then an itch.io release. Keep the household story, existing art, transparent accounts, optional reflections, and offline design. A major simulation rewrite is not warranted for this release. No crash or progression blocker was observed in the tested route. The existing ZIP must not be uploaded: it is stale.

## What was actually checked

- Played all 28 decisions of a Story journey from Merv through Bactra, the Pamirs, Kashgar, northern Tarim, and Dunhuang. Chose the return-west ending. Final result: People 90, Livelihood 88, day 190, 54 silver, seven camels, Vima's account settled. Narin remained a Bactra contact.
- Exported the Kashgar checkpoint through the UI; restored it through the file picker and confirmation preview; reloaded successfully. Played both distinct southern encounters, buying jade at Yarkand and selling an inspected bundle at Khotan, then reached Dunhuang.
- Started Caravan challenge and inspected its opening two encounters. This was not a full manual challenge playthrough.
- Answered one reflection and verified its first-attempt result survived the journey. Inspected the atlas, source panel, restart confirmation, and route comparison.
- Desktop: 1703×833. Phone: 390×844. Phone route comparison remained readable and page width stayed 390px. No browser console errors recorded.
- All 211 tests in 16 files passed; TypeScript and production build passed. Existing balance tests exercise 300 seeded campaigns per mode; these are automated rule checks, not human play sessions.
- Spot-checked three historical source links. No comprehensive historical/art certification, screen-reader audit, or human learner study is claimed.

Evidence: [audit record](audits/2026-09-21/audit-evidence.json), [completed journey](audits/2026-09-21/completed-northern-journey.json), [route checkpoint](audits/2026-09-21/northern-fork-checkpoint.json), [desktop](audits/2026-09-21/desktop-challenge.png), [phone](audits/2026-09-21/mobile-challenge.png).

## Prioritized fixes and upgrades

| Priority | Finding and evidence | Recommended change | Acceptance |
|---|---|---|---|
| 1 — release blocker | `Crossroads-The-Silk-Roads-itch.zip` is the older September 7 package. Its JS/CSS hashes differ from the current build and it lacks both Tarim route images. | After updates, generate a versioned ZIP from current `dist`, with a manifest and checksum. | Root `index.html`, all referenced assets present, no stale bundle, successful hosted launch and save smoke test. |
| 2 — historical sourcing | The source labelled “UNESCO Silk Roads: Dunhuang” redirects to the general programme homepage, losing the cited evidence. Used at least twice in `src/data/journey.ts`. | Replace it with a currently accessible, claim-specific institutional source. Check the remaining source URLs for silent redirects, especially legacy UNESCO paths. | Each historical-context link lands on relevant supporting content; record title, date and the claim it supports. A 200 status alone is insufficient. |
| 3 — decision pacing | At normal desktop height the first opening choice is visible but others extend below the fold. At 390×844 the Kashgar fork shows no choice on its initial screen; the southern choice begins about 1058px down. The main art is repeated behind the card and in the panorama. | Reduce repeated vertical chrome, make the panorama compact/collapsible during decisions, shorten repeated effect text, and offer a clear jump to choices. Keep enlarge-art access. | First actionable choice visible on representative phone screens; the primary choices easier to compare on desktop; no tiny text, cropped controls or sideways page scrolling. |
| 4 — offer/rule mismatch | Roshna's high-guide offer always says “Sell cargo”; with 12 lots and six camels the actual sale is zero. `rules.ts` correctly makes the sale conditional, but only the aftermath explains that no sale was needed. | Make the offer text conditional too, showing exact lots sold or “existing cargo fits.” Check nearby cache/scout and transfer language against actual state. | Preview, inventory delta, silver delta, and aftermath agree in both under-capacity and overloaded cases. |
| 5 — illness presentation | The mountain encounter says Arash is confused and breathless while his health display was 97; choosing descent brought it to 100. Earlier fever similarly appeared without a corresponding visible condition. | Explain that health is general resilience and surface a temporary encounter condition, or add a small explicit condition state. Do not silently change every save's economics. | A player can understand why urgent care is needed despite a high health number; resolved conditions disappear and saves remain compatible. |
| 6 — ending expectations | “Send Arash with the cargo” ends the playable household campaign at Bactra, but the choice does not explicitly say this ends the run. Settlement options imply this more clearly. | Add a discreet “Ends this journey” label to early endings, and a “Continues east” label where useful. Keep the aftermath before the ending. | A new player can knowingly choose a short ending without thinking the game abruptly stopped. |
| 7 — relationship feedback | All four trust values reached 100 by northern Tarim on this cooperative run; several later rewards then had no visible effect. Standing also reached 100. | First show capped benefits honestly. Consider diminishing late rewards or one or two meaningful competing obligations only after comparing more routes. | No promised trust increase when already capped; late decisions still have an understandable consequence. This is a balance observation from one run, not a population claim. |
| 8 — geographic/art variety | Seven landscapes support 28 decisions. A repeated regional image and repeated background give scenes similar compositions. Kucha/Turfan and Yarkand/Khotan each share a composite. | Use the existing art better first: regional focal crops, a small journey-progress transition, and clearer location labels. Only commission a targeted landmark/scene if a visible gap remains. | Locations feel distinct without disguising illustration as archaeological evidence or degrading the existing art. |
| 9 — risk language and time | Offers speak of risk, storms and market timing, but outcomes are deterministic and most time pressure is represented by fixed costs. Story mode explicitly provisions long travel montages. | Rewrite “risk” language where it implies an unseen chance roll or deadline. Explain that displayed costs are the model. Preserve deterministic, accessible play. | No implication of a hidden probability/deadline that does not exist. Exact previews remain available; no new random subsystem needed. |
| 10 — atmosphere and replay | There is no audio layer in the inspected source. The ending has good personal summaries but little reason to immediately try the other road. | Optional later polish: restrained licensed ambience with a mute control; an ending prompt pointing to the untraveled branch or Challenge mode. | Audio off or opt-in by default, clean rights record, and no required download bloat. Not a release blocker. |

## Two bounded update passes

### Pass 1: trust in the decisions

- [ ] Repair redirected historical references and record source-to-claim matches.
- [ ] Fix Roshna's conditional sale wording and label early endings.
- [ ] Clarify illness versus general health, and avoid misleading risk/time language.
- [ ] Add only focused tests for the conditional logic and ending indicators; preserve old save rules.

### Pass 2: presentation and release

- [ ] Compact the phone/desktop decision layout while preserving readable text and enlarged art.
- [ ] Improve geographic continuity using current images; fix capped-effect messaging.
- [ ] Run the full checks and browser smoke tests on the production build.
- [ ] Build a fresh versioned itch ZIP and record its hash.
- [ ] Prepare accurate screenshots, a short player-facing description, controls and AI disclosure; publish and test the hosted build.

Defer broad rebalance, new chapters, procedural encounters, elaborate audio, and research claims. We can release a polished educational narrative game without expanding its scope.

## Source spot checks

- [UNESCO — About the Silk Roads](https://www.unesco.org/en/silk-roads/about-silk-roads?hub=196704): relevant overview remains accessible and supports the network/relay framing. It is broad context rather than evidence for each fictional transaction.
- [Encyclopaedia Iranica — Sogdian Trade](https://www.iranicaonline.org/articles/sogdian-trade/): article remains accessible; chronology still needs to be tied to the specific game claim.
- [Old Dunhuang link](https://en.unesco.org/silkroad/content/dunhuang): redirected during this audit to [UNESCO's programme homepage](https://www.unesco.org/en/silkroads). That landing page does not provide the expected Dunhuang article.

No game code was changed or uploaded in this audit. Only audit documents, exported playthrough evidence and screenshots were added; `dist` was rebuilt for verification. The old ZIP was preserved.

## Implemented follow-up

The 0.3.1 pass addresses the concrete decision, feedback, reference and layout issues and supplies a fresh ZIP. See [release fixes and verification](RELEASE_FIXES_0.3.1.md). The checklist above preserves the original plan; publishing/hosted verification and a comprehensive source audit are not claimed complete.
