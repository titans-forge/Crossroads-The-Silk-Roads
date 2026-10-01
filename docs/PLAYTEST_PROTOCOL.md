# Crossroads: a first observed learning pilot

This protocol is ready to run. **No player results have been collected or inferred here.** Its purpose is to find obstacles to play, inspect how first-time players reason, and decide what to test next. Six to eight participants and three questions per phase cannot validate a learning assessment, establish game effectiveness, or justify a ten-out-of-ten quality claim.

The suggested audience is roughly age 13 and above, matching the existing teaching guide. That age is an instructional choice, not a measured reading level. Recruit first-time players from the actual intended teaching audience. Use the teacher or host's usual voluntary participation arrangements; declining the pilot must still allow ordinary play. Do not recruit only the developers or experienced strategy-game players and describe them as representative students.

## What is being examined

The original items in `src/data/playtest.ts` cover three concepts already taught by the game:

| Concept | Before play | After play | Later review |
| --- | --- | --- | --- |
| Route feasibility | Seed delivery and an uncertain water stop | A heavy exhibition crate and repair services | A changed season, load, and bridge |
| Connected regional journeys | Evidence linking pottery handoffs | A resident partner connecting carriers | Delivery when the first carrier stops |
| Limits of historical evidence | A later cart illustration | A game's exact toll and its general source | One later household inventory |

The forms target similar reasoning through different situations. They are **not calibrated alternate forms**: changes in scores can reflect question difficulty, wording, guessing, or prior knowledge. They sample only three of the game's concepts. The game's five chapter reflections remain separate formative feedback; their scores are not interchangeable with these pilot probes.

This design is informed by primary research, with a limited claim for each design decision:

- Roediger and Karpicke compared study and retrieval conditions with tests immediately and after delays. The different immediate and delayed patterns support checking beyond the end of a play session. Their experiment does not establish an appropriate score threshold for this game. [Original study and abstract, 2006](https://profiles.wustl.edu/en/publications/test-enhanced-learning-taking-memory-tests-improves-long-term-ret/).
- Butler tested new inferential questions, including changed knowledge contexts, after a week. That supports using fresh situations when investigating transfer rather than merely repeating the game's questions. It does not validate these particular multiple-choice items or prove equivalent difficulty between forms. [Original paper, 2010](https://andymatuschak.org/files/papers/Butler%20-%202010%20-%20Repeated%20Testing%20Produces%20Superior%20Transfer%20of%20Learning%20Relative%20to%20Repeated.pdf).
- McDaniel and colleagues examined low-stakes quizzes with feedback in eighth-grade science classes. Their work supports treating questioning as part of instruction as well as observation. It does not establish that effects from those classes will occur in a Silk Roads game. [Original study and abstract, 2011](https://profiles.wustl.edu/en/publications/test-enhanced-learning-in-a-middle-school-science-classroom-the-e/).

Testing and feedback can themselves change learning. With no comparison group, the pilot cannot separate the game's contribution from pre-question cueing, chapter feedback, observation, or later practice. The design choices and exploratory thresholds below are ours, not thresholds validated by those studies.

## Preparation and assignments

Use one fixed game build and question content version for the initial group. The export format is `titans-forge-crossroads-playtest`, format version `1`, content version `2026-09-07.1`. Keep the rules version in each record: versions 1 and 2 must not be pooled without showing that distinction. If a blocking fix is needed during the pilot, preserve earlier results and identify the subsequent build separately.

For eight participants, suggest two in each of these four conditions: Story/north, Story/south, Challenge/north, Challenge/south. For six, use two in each Story route and one in each Challenge route. These assignments ensure some coverage; they are not enough to compare the modes or routes statistically. Spread different devices and input methods across conditions where practical, and observe rather than infer accessibility needs. Do not add device fingerprints or personal details to the exported record.

A route assignment applies only if that player reaches the branch. Settling earlier is a legitimate game ending. Record actual exposure and the ending reached instead of forcing a full eastbound journey or counting an early ending as a failure. Anyone may choose a gentler mode, pause, or exit; keep that deviation in the interpretation.

Plan a 45–60 minute slot, with approximately 3–5 minutes before, 25–40 minutes of play, 3–5 minutes after, and a brief conversation. These are planning estimates, not measured completion times or deadlines. Offer a second session if reading and play require it. Keep active observed time separate from breaks and elapsed wall time. Do not label an unfinished campaign “completed” when the slot ends.

## Neutral facilitator script

Read this before the baseline questions:

> We are trying to improve the game and its explanations. This is not a school grade or a test of you. Some choices can reasonably lead to different journeys. Please use the controls and reading tools as you normally would. You can say “not sure,” pause, skip the optional pilot, or stop whenever you want. If you choose the pilot, its record stays in this browser unless you decide to export and share it. No name or contact details are requested.

Then run the session in this order:

1. **Opt in and answer the three “before” questions.** Do this before explaining the concepts or demonstrating an advantageous choice. Read a prompt aloud if requested, without explaining its answer; note that assistance in the observer's account. “Not sure yet” is an explicit response, distinct from a missing answer.
2. **Let the player begin.** Explain only essential device controls. Say, “If you reach the route split, please try the assigned route; you can still finish earlier.” Avoid predictions such as “you will enjoy this” or “this option is best.”
3. **Observe without steering.** Watch the first decision, an outcome, the map, a resource tradeoff, and a chapter transition. Let the player open the glossary or source context when wanted. If they are stuck, ask, “What are you trying to do?” Ask permission before demonstrating a control, and record the intervention rather than treating the resulting success as unaided.
4. **Pause or stop cleanly.** Pausing should stop active-time capture. The observer should also note breaks without attributing hidden-tab time to reading difficulty. Preserve a partial record if the player voluntarily ends the pilot. Importing a different campaign or restarting interrupts the original observation; do not join two journeys into one apparently continuous trial.
5. **Take the three “after” questions before the interview.** Offer them after the chosen ending or after stopping, with the record clearly distinguishing completion from partial exposure. Do not explain a concept immediately before its probe. Capture first submitted responses once; do not correct and resubmit to improve the result.
6. **Ask a short neutral debrief.** Suggested prompts: “Which decision mattered most to your plan?” “Show me something the game remembered.” “What was difficult to understand or use?” “Would you choose to play another route?” Ask what informed an answer without telling the player what they should have noticed.

Use short de-identified observations, such as “looked for water on the left, then found it in the supplies panel.” Do not put names, classroom identifiers, health information, personal stories, or verbatim identifying remarks into notes or the JSON. The application collects fixed-choice ratings, not free-text personal notes. A separate observer account is optional and should remain under the host's control.

## Feedback and delayed review

Keep probe-specific answer keys and explanations hidden through the “before” and “after” phases. Normal chapter explanations are part of the game and remain available. When the delayed phase is finished, explanations can be shown. A participant may instead choose immediate practice and feedback; retain that as practice, not delayed evidence.

Offer the different three-question “later” form **3–7 days after the play session ends**. Arrange this through the existing host or classroom process; the game does not collect contact details or send reminders. The participant must return to the same browser and keep its local data to answer the remaining phase. A local export is available for analysis and safekeeping; this edition does not import playtest records into another browser. Do not delete the local record before the delayed check unless the participant chooses to stop. Do not create a key linking an anonymous session UUID to a name merely to match phases.

The UI asks for a **self-reported number of days since finishing**, stored as `followupDelayDays` from 0 to 365. It stores no exact session date. Zero means same-day practice; 1–2 days is outside the planned delayed window; more than 7 days is a later exploratory observation. Report the actual self-reported interval and its uncertainty. Do not label a record as retention evidence just because its internal phase is named `later` or `complete`.

Before delayed questions, ask neutrally whether there was another playthrough, discussion, answer review, or relevant lesson. Do not require students to avoid normal learning. Note additional exposure separately and limit the interpretation accordingly. If such context is unavailable, say so. Investigator exports include responses and correctness; reviewing an export may reveal answers and is another possible exposure.

## Reading the records

Keep three outcomes separate: usability observations, enjoyment/clarity ratings, and responses to the transfer probes. A high enjoyment rating does not establish learning. A short choice duration does not establish understanding, and a long duration does not establish confusion.

The local record contains an anonymous UUID, mode, rules/content versions, phase responses, bounded relative active milliseconds and help openings per recorded decision, pause state, optional fixed-choice feedback, completion/interruption flags, selected route, and self-reported follow-up delay. It contains no identity, device fingerprint, or exact date. Active time captures only what the interface can observe; it is not a measure of attention. Closing the page may lose the unfinished timing segment, so do not infer precision from milliseconds.

Score a substantive correct response as 1 and an incorrect or explicit “not sure yet” response as 0. Preserve the option identifier so uncertainty can be distinguished from a selected misconception. Missing answers remain missing. The API submits a phase only when all three responses are present; an unsubmitted phase is not a zero score.

For each concept, display before → after → later responses for the same session. Report totals out of 3 only when that phase is complete. Calculate a before/after difference only for sessions with both phases, and show the underlying item changes. Report partial or interrupted play separately from completed journeys. A completed earlier ending is still different from exposure to all five chapters. Never replace missing follow-ups with zero, carry the after score forward, or exclude inconvenient responses silently.

Because there is only one item per concept per phase, do not report mastery, reliable individual growth, or population effect sizes. A correct-to-incorrect change might indicate a misconception, a harder later item, or a guess; inspect the reasoning and wording. Correct-at-baseline responses leave little room to show improvement. Small mode/route subgroups support case descriptions, not winner rankings.

Optional observer reasoning notes can use a provisional rubric: **0** = restates an option or gives an incompatible reason; **1** = identifies a relevant condition, handoff, or source limit; **2** = explains its consequence in this scenario and a relevant limitation. Keep selection scores separate from these judgments. A second reader can review de-identified notes without seeing the first rating; preserve disagreements. This rubric is not validated.

## Exploratory decision rules

Treat these as **working hypotheses for the next iteration**, chosen before seeing results:

| Observation | Proposed response |
| --- | --- |
| Any reproduced progress loss or inability to continue with an available action | Fix and verify it before another observed session on that build. |
| The same control or explanation confuses two independently observed players | Prioritize that issue and test a concrete revision with fresh first-time players. |
| Two players make the same concept error after play and can explain their misconception | Review the game explanation and the probe wording together; do not assume only the player is wrong. |
| Most players already answer all baseline items correctly | Increase the assessment's useful challenge before claiming learning gains from unchanged high scores. |
| At least five of six, or six of eight, can explain a route constraint and a regional handoff without coaching | Treat this as a reason to test the revised product with a larger group, not a mastery or launch certification. |
| Fewer than four participants return within the planned 3–7 day window | Treat delayed feasibility as unresolved; report available cases and missing follow-ups without generalizing. |

Count participants and opportunities explicitly. Two problems among two people who reached a screen differ from two among eight. Separate spontaneous success, success after help, voluntary early endings, and technical interruptions. Do not change a threshold after seeing the data and then describe it as prespecified.

## Results template to fill only after observation

- Fixed build, rules/content versions, and setting: **not yet recorded**.
- Invited / opted in / started / reached each chapter / ended / interrupted: **not yet observed**.
- Device or input observations without identifiers: **not yet observed**.
- Completed before-and-after pairs; item-level patterns; unsure responses: **not yet observed**.
- Delayed returns, self-reported intervals, additional exposure, and missing cases: **not yet observed**.
- Reproduced usability problems with encounter/control and observed consequence: **not yet observed**.
- Player-chosen replay interest and reasons, kept separate from learning: **not yet observed**.
- Proposed revision, its evidence, and the next test that could disconfirm it: **not yet decided**.

Export and sharing are separate choices. Preview the local record before sharing it; there is no automatic upload or remote analytics. Deleting the pilot record should remove only its separate local key, not the ordinary campaign save. A participant can continue playing without joining the pilot or sharing any file.

## Analyze exported records locally

From a checkout with its normal development dependencies installed, run:

```sh
node scripts/analyze-playtests.mjs /path/to/pilot-exports /path/to/pilot-analysis
```

The second directory is optional; the default is an `analysis` subdirectory inside the input folder. If dependencies are absent, run the project's normal `npm install` first. The analyzer uses the `esbuild` dependency installed with Vite to bundle the application's current validator in memory. Analysis makes no network calls and downloads nothing.

Place only the intended pilot JSON exports directly in the input folder. Reading is nonrecursive, with at most 1,000 JSON entries and 2 MiB per file. Symlinks are not followed. Input files are never rewritten. Unknown formats/content versions and malformed records are listed as rejected; they are not automatically upgraded into comparable results.

The command creates three files:

- **`report.json`** contains exclusions, identical duplicates, conflicting IDs, segment counts, matched score summaries, concept transition counts, and explicit interpretation limits.
- **`sessions.csv`** keeps one row per accepted session, including missing-phase blanks, uncertainty counts, exposure/completion labels, self-reported delay, and eligibility for comparisons.
- **`encounters.csv`** summarizes recorded choices and captured durations within the same mode/rules/content/route/completion/exposure segments. Trials marked `timingIncomplete` retain their choice and help-opening counts but are omitted from duration aggregates. If no valid timing remains, duration cells are blank rather than zero.

A full eastbound trace requires the expected 28-encounter sequence for the reported route. Early endings, legacy 26-encounter frontier traces, ongoing play, partial interruptions, and completed journeys with incomplete traces remain separate. Pre/post comparisons require a completed, uninterrupted journey and both answer phases. The planned 3–7 day follow-ups are separate from longer delays; same-day and 1–2 day practice are excluded from delayed summaries.

**Keep one intended final export per session ID.** Identical copies are deduplicated. If exports with the same ID differ, every copy of that ID is rejected, even if one copy is otherwise valid. The analyzer never guesses which snapshot is latest or best. Review conflicting snapshots locally and place the explicitly selected record into a new analysis input folder; keep the originals as evidence. Inspect exclusions before interpreting any averages.

Automated checks use clearly labeled synthetic fixtures outside the product source. They exercise missing phases, incomplete timing, conflict rejection, early endings, and delayed eligibility. Synthetic verification is not player evidence and must never be combined with observed pilot records. Running the analyzer without real exports creates no invented observations or benchmark results.
