#!/usr/bin/env node
/** Local, exploratory analysis of explicitly selected Crossroads pilot exports. */
import fs from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const MAX_FILES = 1_000;
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
if (args.length < 1 || args.length > 2) {
  process.stderr.write('Usage: node scripts/analyze-playtests.mjs <directory> [output-dir]\n');
  process.exit(1);
}

const stats = values => {
  if (!values.length) return { n: 0, mean: null, median: null, min: null, max: null };
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const round = number => Math.round(number * 1_000) / 1_000;
  return { n: values.length, mean: round(values.reduce((sum, value) => sum + value, 0) / values.length), median: round(sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2), min: sorted[0], max: sorted.at(-1) };
};
const canonical = value => Array.isArray(value) ? `[${value.map(canonical).join(',')}]` : value && typeof value === 'object' ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}` : JSON.stringify(value);
const correct = answers => answers.length === 3 ? answers.filter(answer => answer.correct).length : null;
const unsure = answers => answers.length ? answers.filter(answer => answer.optionId === 'unsure').length : null;
const cell = value => {
  if (value === null || value === undefined) return '';
  let text = String(value);
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};
const csv = (columns, rows) => [columns.join(','), ...rows.map(row => columns.map(column => cell(row[column])).join(','))].join('\n') + '\n';

async function main() {
  const inputDirectory = await fs.realpath(path.resolve(args[0]));
  if (!(await fs.stat(inputDirectory)).isDirectory()) throw new Error('Input must be a directory of pilot JSON exports.');
  const outputDirectory = path.resolve(args[1] ?? path.join(inputDirectory, 'analysis'));
  const realOutput = await fs.realpath(outputDirectory).catch(() => outputDirectory);
  if (realOutput === inputDirectory) throw new Error('Choose an output subdirectory or a separate directory so source exports cannot be overwritten.');
  const files = (await fs.readdir(inputDirectory, { withFileTypes: true })).filter(entry => entry.name.toLowerCase().endsWith('.json')).sort((a, b) => a.name.localeCompare(b.name));
  if (files.length > MAX_FILES) throw new Error(`Input has more than ${MAX_FILES} JSON entries. Split it into explicit batches; no partial report was written.`);

  // Bundle the application's current validator and content in memory. No duplicated
  // session schema, generated source files, downloaded packages, or network requests.
  const bundled = await build({
    stdin: { contents: "export {validatePilot} from './src/playtest/session.ts'; export {allEncounters} from './src/data/journey.ts'; export {northRouteEncounters,southRouteEncounters} from './src/data/routes.ts'; export {probeQuestions} from './src/data/playtest.ts';", resolveDir: projectRoot, sourcefile: 'pilot-analysis-entry.ts', loader: 'ts' },
    bundle: true, write: false, platform: 'node', format: 'esm', target: 'node20', logLevel: 'silent',
  });
  const { validatePilot, allEncounters, northRouteEncounters, southRouteEncounters, probeQuestions } = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);
  const rejected = [];
  const entries = [];
  for (const file of files) {
    if (!file.isFile() || file.isSymbolicLink()) { rejected.push({ file: file.name, reason: 'Not a regular JSON file; directories and symlinks are not read.' }); continue; }
    const filePath = path.join(inputDirectory, file.name);
    try {
      const handle = await fs.open(filePath, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW);
      let raw;
      try {
        const info = await handle.stat();
        if (!info.isFile() || info.size > MAX_FILE_BYTES) { rejected.push({ file: file.name, reason: `Not a regular file within ${MAX_FILE_BYTES} bytes.` }); continue; }
        const buffer = Buffer.alloc(MAX_FILE_BYTES + 1);
        let used = 0;
        while (used < buffer.length) { const { bytesRead } = await handle.read(buffer, used, buffer.length - used, used); if (!bytesRead) break; used += bytesRead; }
        if (used > MAX_FILE_BYTES) { rejected.push({ file: file.name, reason: 'File grew beyond the input byte limit.' }); continue; }
        raw = buffer.subarray(0, used);
      } finally { await handle.close(); }
      let record;
      try { record = JSON.parse(raw.toString('utf8')); }
      catch { rejected.push({ file: file.name, reason: 'Invalid JSON.' }); continue; }
      const valid = validatePilot(record);
      const id = record && typeof record === 'object' && !Array.isArray(record) && typeof record.id === 'string' && record.id.length <= 200 ? record.id : null;
      if (!id) { rejected.push({ file: file.name, reason: 'Not a supported valid pilot record.' }); continue; }
      entries.push({ file: file.name, record: valid ? record : null, id, valid, canonical: valid ? canonical(record) : null });
    } catch { rejected.push({ file: file.name, reason: 'File could not be read.' }); }
  }

  const byId = new Map();
  for (const entry of entries) { const list = byId.get(entry.id) ?? []; list.push(entry); byId.set(entry.id, list); }
  const accepted = [];
  const identicalDuplicates = [];
  const conflictingIds = [];
  for (const [id, versions] of byId) {
    const valid = versions.filter(entry => entry.valid);
    if (versions.length > 1 && (valid.length !== versions.length || new Set(valid.map(entry => entry.canonical)).size > 1)) {
      conflictingIds.push({ id, files: versions.map(entry => entry.file) });
      rejected.push(...versions.map(entry => ({ file: entry.file, reason: 'Conflicting records share this session ID; all copies were excluded.' })));
    } else if (!valid.length) {
      rejected.push(...versions.map(entry => ({ file: entry.file, reason: 'Not a supported valid pilot record (including unknown versions or inconsistent fields).' })));
    } else {
      accepted.push(valid[0]);
      if (valid.length > 1) identicalDuplicates.push({ id, keptFile: valid[0].file, duplicateFiles: valid.slice(1).map(entry => entry.file) });
    }
  }

  const endingEncounters = new Set(allEncounters.filter(encounter => [2, 4].includes(encounter.chapter)).filter(encounter => !allEncounters.some(later => later.chapter === encounter.chapter && allEncounters.indexOf(later) > allEncounters.indexOf(encounter))).map(encounter => encounter.id));
  function exposure(session) {
    if (!session.completedJourney) return session.interrupted ? 'interrupted_partial' : session.phase === 'playing' ? 'in_progress' : 'stopped_partial';
    const routeEncounters = session.route === 'north' ? northRouteEncounters : session.route === 'south' ? southRouteEncounters : [];
    const full = [...allEncounters.filter(encounter => encounter.chapter < 5), ...routeEncounters, ...allEncounters.filter(encounter => encounter.chapter === 5)];
    const sequence = session.trials.map(trial => trial.encounterId);
    if (full.length === 28 && sequence.length === 28 && sequence.every((id, index) => id === full[index].id)) return 'full_eastbound_28';
    if (sequence.length === 26 && sequence.every((id, index) => id === allEncounters[index]?.id)) return 'legacy_frontier_26';
    if (endingEncounters.has(sequence.at(-1)) && ['arash-east', 'bactra-house', 'kashgar-house', 'emergency-relief'].includes(session.trials.at(-1)?.choiceId)) return 'early_ending';
    return 'completed_with_incomplete_trace';
  }
  const rows = accepted.map(entry => {
    const s = entry.record;
    const before = correct(s.before), after = correct(s.after), later = correct(s.later);
    const hasDelay = later !== null && Number.isInteger(s.followupDelayDays);
    const followup = !hasDelay ? 'not_submitted' : s.followupDelayDays === 0 ? 'same_day_practice' : s.followupDelayDays < 3 ? 'early_practice_1_2_days' : s.followupDelayDays <= 7 ? 'planned_delayed_3_7_days' : 'extended_delayed_over_7_days';
    const matched = s.completedJourney && !s.interrupted && before !== null && after !== null;
    const delayed = matched && later !== null && hasDelay && s.followupDelayDays >= 3;
    const timed = s.trials.filter(trial => !trial.timingIncomplete);
    return {
      session_id: s.id, source_file: entry.file, mode: s.mode, rules_version: s.rulesVersion, content_version: s.contentVersion, route: s.route, phase: s.phase,
      journey_status: s.interrupted ? 'interrupted' : s.completedJourney ? 'completed' : s.phase === 'playing' ? 'playing' : 'stopped_partial', exposure: exposure(s),
      before_answered: s.before.length, before_correct: before, before_unsure: unsure(s.before), after_answered: s.after.length, after_correct: after, after_unsure: unsure(s.after), later_answered: s.later.length, later_correct: later, later_unsure: unsure(s.later),
      followup_delay_days: s.followupDelayDays ?? null, followup_classification: followup,
      eligible_prepost: matched, prepost_delta: matched ? after - before : null, eligible_delayed: delayed,
      recorded_decisions: s.trials.length, timing_incomplete_trials: s.trials.length - timed.length, timed_trials: timed.length, active_ms_total: timed.length ? timed.reduce((sum, trial) => sum + trial.activeMs, 0) : null, help_opens_total: s.trials.reduce((sum, trial) => sum + trial.helpOpens, 0),
      clarity: s.feedback?.clarity ?? null, enjoyment: s.feedback?.enjoyment ?? null, challenge_rating: s.feedback?.challenge ?? null, would_replay: s.feedback?.wouldReplay ?? null,
    };
  });
  const segmentColumns = ['mode', 'rules_version', 'content_version', 'route', 'journey_status', 'exposure'];
  const segmentKey = row => JSON.stringify(segmentColumns.map(column => row[column]));
  const groups = new Map();
  rows.forEach((row, index) => { const key = segmentKey(row), group = groups.get(key) ?? []; group.push({ row, session: accepted[index].record }); groups.set(key, group); });
  const reportGroups = [];
  const encounterRows = [];
  for (const values of groups.values()) {
    const segment = Object.fromEntries(segmentColumns.map(column => [column, values[0].row[column]]));
    const matched = values.filter(({ row }) => row.eligible_prepost).map(({ row }) => row);
    const delayed = classification => {
      const eligible = values.filter(({ row }) => row.eligible_delayed && row.followup_classification === classification).map(({ row }) => row);
      return { n: eligible.length, after: stats(eligible.map(row => row.after_correct)), later: stats(eligible.map(row => row.later_correct)), change: stats(eligible.map(row => row.later_correct - row.after_correct)), selfReportedDelayDays: stats(eligible.map(row => row.followup_delay_days)) };
    };
    const transitions = (concept, from, to, included) => {
      const first = probeQuestions[from].find(question => question.concept === concept);
      const second = probeQuestions[to].find(question => question.concept === concept);
      const counts = { n: 0, correctToCorrect: 0, correctToIncorrect: 0, incorrectToCorrect: 0, incorrectToIncorrect: 0, unsureBefore: 0, unsureAfter: 0 };
      for (const { session, row } of values) {
        if (!included(row)) continue;
        const a = session[from].find(answer => answer.questionId === first.id), b = session[to].find(answer => answer.questionId === second.id);
        if (!a || !b) continue;
        counts.n += 1;
        counts[a.correct ? b.correct ? 'correctToCorrect' : 'correctToIncorrect' : b.correct ? 'incorrectToCorrect' : 'incorrectToIncorrect'] += 1;
        if (a.optionId === 'unsure') counts.unsureBefore += 1;
        if (b.optionId === 'unsure') counts.unsureAfter += 1;
      }
      return counts;
    };
    reportGroups.push({
      segment, nSessions: values.length,
      phaseCounts: { before: values.filter(({ row }) => row.before_answered === 3).length, after: values.filter(({ row }) => row.after_answered === 3).length, later: values.filter(({ row }) => row.later_answered === 3).length },
      matchedPrePost: { n: matched.length, before: stats(matched.map(row => row.before_correct)), after: stats(matched.map(row => row.after_correct)), change: stats(matched.map(row => row.prepost_delta)) },
      delayedWithin3To7Days: delayed('planned_delayed_3_7_days'), delayedBeyond7Days: delayed('extended_delayed_over_7_days'),
      practiceFollowupsExcluded: values.filter(({ row }) => ['same_day_practice', 'early_practice_1_2_days'].includes(row.followup_classification)).length,
      conceptTransitions: probeQuestions.before.map(question => ({ concept: question.concept, matchedPrePost: transitions(question.concept, 'before', 'after', row => row.eligible_prepost), delayedWithin3To7Days: transitions(question.concept, 'after', 'later', row => row.eligible_delayed && row.followup_classification === 'planned_delayed_3_7_days'), delayedBeyond7Days: transitions(question.concept, 'after', 'later', row => row.eligible_delayed && row.followup_classification === 'extended_delayed_over_7_days') })),
      timingIncompleteTrials: values.reduce((sum, { row }) => sum + row.timing_incomplete_trials, 0),
      feedback: { clarity: stats(values.map(({ row }) => row.clarity).filter(value => value !== null)), enjoyment: stats(values.map(({ row }) => row.enjoyment).filter(value => value !== null)) },
    });
    const encounters = new Map();
    for (const { session } of values) for (const trial of session.trials) {
      const key = JSON.stringify([trial.encounterId, trial.choiceId]);
      const list = encounters.get(key) ?? [];
      list.push(trial); encounters.set(key, list);
    }
    for (const list of encounters.values()) {
      const timed = list.filter(trial => !trial.timingIncomplete);
      const duration = stats(timed.map(trial => trial.activeMs));
      encounterRows.push({ ...segment, encounter_id: list[0].encounterId, choice_id: list[0].choiceId, recorded_trials: list.length, timed_trials: timed.length, timing_incomplete_trials: list.length - timed.length, active_ms_mean: duration.mean, active_ms_median: duration.median, active_ms_min: duration.min, active_ms_max: duration.max, help_opens_total: list.reduce((sum, trial) => sum + trial.helpOpens, 0) });
    }
  }

  const report = {
    format: 'crossroads-exploratory-pilot-analysis', version: 1, exploratory: true, causalEvidence: false,
    limits: ['This small observational pilot does not establish game effectiveness, mastery, or a causal learning effect.', 'Question forms share concepts but have not been calibrated for equal difficulty.', 'Missing phases remain missing. Pre/post summaries use only matched completed journeys; exposure groups remain separate.', 'Delayed summaries exclude self-reported delays below 3 days; 3–7 days and longer intervals are separate.', 'Active milliseconds describe captured visible interaction, not attention. Incomplete timing records are excluded from duration aggregates.', 'Only current supported export/content versions pass the application validator. Unknown versions are rejected, not silently migrated.', 'The validator checks record structure; an export is not proof that play or reported delays occurred. Review observation notes and consent to sharing separately.'],
    input: { jsonEntries: files.length, perFileByteLimit: MAX_FILE_BYTES, fileLimit: MAX_FILES, recursive: false },
    acceptedSessions: accepted.length, identicalDuplicateFiles: identicalDuplicates.reduce((sum, item) => sum + item.duplicateFiles.length, 0), identicalDuplicates,
    conflictingSessionIds: conflictingIds, rejectedFiles: rejected,
    groups: reportGroups,
  };
  const sessionColumns = ['session_id', 'source_file', ...segmentColumns.slice(0, 4), 'phase', ...segmentColumns.slice(4), 'before_answered', 'before_correct', 'before_unsure', 'after_answered', 'after_correct', 'after_unsure', 'later_answered', 'later_correct', 'later_unsure', 'followup_delay_days', 'followup_classification', 'eligible_prepost', 'prepost_delta', 'eligible_delayed', 'recorded_decisions', 'timing_incomplete_trials', 'timed_trials', 'active_ms_total', 'help_opens_total', 'clarity', 'enjoyment', 'challenge_rating', 'would_replay'];
  const encounterColumns = [...segmentColumns, 'encounter_id', 'choice_id', 'recorded_trials', 'timed_trials', 'timing_incomplete_trials', 'active_ms_mean', 'active_ms_median', 'active_ms_min', 'active_ms_max', 'help_opens_total'];
  await fs.mkdir(outputDirectory, { recursive: true });
  await fs.writeFile(path.join(outputDirectory, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  await fs.writeFile(path.join(outputDirectory, 'sessions.csv'), csv(sessionColumns, rows));
  await fs.writeFile(path.join(outputDirectory, 'encounters.csv'), csv(encounterColumns, encounterRows));
  process.stdout.write(`Exploratory report: ${accepted.length} accepted sessions, ${rejected.length} rejected files, ${report.identicalDuplicateFiles} identical duplicate files removed.\nOutputs: ${outputDirectory}\n`);
}
main().catch(error => { process.stderr.write(`Analysis stopped: ${error instanceof Error ? error.message : 'Unknown error'}\n`); process.exitCode = 1; });
