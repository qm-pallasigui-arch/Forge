# Round 3 implementation and verification

Completed 22 November 2026. No dependencies or native configuration were added. The existing development APK can load these changes from Metro.

## Delivered

- Routine entries have Monday-first `days` (0-6). Plan stores only `on` and `time` per weekday. Separate exercises can belong to Monday and Wednesday even when both train Chest.
- Plan day cards open the Body screen in day-target mode. A banner names the day, existing muscles are tinted, Add names the day, and existing assignments offer removal. Done/system Back return to Plan; tabs clear the target. Day removals have Undo. Onboarding is temporarily hidden in target mode, retains progress and resumes normally afterwards.
- One state machine supplies Start, Resume and Start another workout. Logged sessions suppress reminders, not workout entry. A day without assigned exercises falls back to the whole routine, with an explicit count. Whole routine is also available when the day's selection is smaller.
- Plan has Week and History, with no new tab. History shows weekly session/set/weighted-volume counts, 28 daily dots, monthly groups, figure thumbnails and individual details. Details include sets, duration, weight volume, previous-session changes, at most two genuine new-weight highs, Repeat and confirmed Delete.
- History snapshots are independent of later routine edits. Repeat uses current routine prescriptions, omits entries removed from the routine and explains unavailable exercises. It resumes an active workout rather than overwriting it.
- Bodyweight contributes no weight volume and is displayed with reps rather than a weight in history and workout comparisons.

## Storage and migration

- `fitmap.state.v2` replaces the old collection of state keys. `fitmap.history.v1` stores validated Session snapshots, newest last, capped at 1000. Older keys remain untouched but are not read once v2 exists.
- Old Sunday-first muscle plans are explicitly reordered to Monday-first. Every matching weekday is assigned to the entry. Day plans lose their muscle arrays.
- Existing completed Workout snapshots are converted with exercise details intact. Date-only logs become marked migrated sessions with date/muscles and zero duration. A date already represented by a detailed old session does not gain a duplicate date-only row.
- History validation is all-or-empty on malformed data. Duplicate session IDs are rejected. Corrupt history does not resurrect old date logs. The oldest sessions are dropped beyond 1000.
- Logged dates, notification suppression and last-time comparisons are derived from history. The prior separate last-log key is no longer written or used in v2.
- Backup export is version 2 and includes history and day membership. Version 1 imports migrate. Version 2 imports retain strict schema validation and confirmation.

## Adaptations to the instruction names

The project already had completed Workout snapshots in `fitmap.history.v1`; these were migrated rather than discarded. `planReminders` is the existing equivalent of `buildNotifications`; new `dayLabel` and `exerciseCount` helpers use entry membership. The existing exercise `id` identifies both its routine entry and catalog exercise, so both snapshot IDs carry that value. A multi-day entry shares its prescription across its assigned days.

## Validation

| Stage | Typecheck / lint | Unit tests | Build |
|---|---|---|---|
| Data model and migrations | Passed | 38 passed | Android Hermes bundle passed |
| Shared Start state | Passed | 39 passed | Android Hermes bundle passed |
| Day-target Body flow | Passed | 39 passed | Android Hermes bundle passed |
| History and final integration | Passed | 45 passed | Android Hermes and web bundles passed |

Commands: `npm run typecheck`, `npm run lint`, `npm test`, `npx expo export --platform android --max-workers 1 --output-dir ../.tmp/round3-android`, and equivalent web export to `../.tmp/round3-web`. No native dependency/config changes required a new APK or prebuild.

Browser acceptance passed at 360x800 and 390x844:

- Active onboarding stays hidden during targeting and completes through real actions afterwards.
- Monday/Wednesday hold different chest exercises, day removal/Undo works, and leaving through tabs clears the target.
- Finish two sessions in one day; Start another remains available; close the entire browser process, reopen, and both history records remain.
- History list/detail, Repeat using current values, discard without losing history, deletion cancellation and confirmed deletion.
- Enlarged 28px text stress checks at both sizes, with screenshots. This is a browser proxy, not a claim about Android system fonts.
- Previous workout regressions passed: rest adjustment, undo, final-set rest rule, automatic next exercise, finish summary, weights/reps, and persistence.
- Previous backup regression passed: export, cancel import, restore, invalid-file rejection, reminders disabled on import, and no browser runtime errors.

Screenshots are in `../../screenshots/round3/index.html`. Tests use isolated browser profiles and do not touch the user's app data.

## Phone checks: NOT RUN

`adb devices` returned no attached devices. Still required on a real Android phone:

1. Enable the largest system font and display size. Check Plan Week, targeting banner/Add/Remove, History list/detail and confirmations at the available screen width. Use TalkBack to reach and announce every action.
2. Assign Bench Press to Monday and Cable Fly to Wednesday through the model. Use system Back while the exercise card is open; verify return to Wednesday. Repeat using Done. Switch tabs mid-target and ensure the banner clears.
3. Finish two workouts today, confirm Start another remains visible, close/reopen FitMap and confirm both history rows and their details remain.
4. Verify today's reminder is suppressed after either session; deleting one of two sessions must keep it suppressed. Check Resume from a notification and the whole-routine fallback.
5. Repeat a historical session after editing its routine weight; verify the new session uses the edited weight while the old summary remains unchanged. Test deletion cancel/confirm and native backup round-trip.

No physical-device, largest Android font or notification-delivery pass is claimed.

## Commits

A separate baseline commit (`ae08c62`) preserved the earlier uncommitted guide, backup and workout work without absorbing the user's README/app configuration edits.

- `12d191a` — data model, migrations and scheduler.
- `709ade3` — shared Start/Resume/Start another state.
- `c9c971d` — day-target Body workflow.
- Final History commit includes the history UI, summary functions, integration regressions and this report.

## Every file changed in round 3

- `src/app/_layout.tsx` — clear targeting when switching tabs.
- `src/app/index.tsx` — day banner, Done/system Back, day highlights, shared workout pill.
- `src/app/plan.tsx` — day assignments, Today state, Week/History, return scroll and summaries.
- `src/app/workout.tsx` — Monday-first next-day lookup and bodyweight comparison formatting.
- `src/components/BodyMap.tsx` — explicit highlight list and static thumbnail mode.
- `src/components/ExerciseSheet.tsx` — day-specific Add/existing/remove controls and Back handling.
- `src/components/WorkoutEntry.tsx` — shared state-machine labels and whole-routine option.
- `src/components/HistoryPanel.tsx` — history list, details, figures, repeat/delete.
- `src/notify/platform.ts` — dynamic notification Start label.
- `src/notify/scheduler.ts` — on/time schedule, entry-derived count/labels and session suppression.
- `src/notify/useReminders.tsx` — session-derived scheduling and shared Start action.
- `src/shared/backup.ts` — v2 backup and v1 migration.
- `src/shared/fitness.ts` — routine weekday membership.
- `src/shared/sessions.ts` — session schema, migration, validation, history-derived state.
- `src/shared/workout-entry.ts` — pure four-state workout entry logic.
- `src/shared/workout.ts` — unique session IDs and copied weekday arrays.
- `src/shared/history-summary.ts` — pure totals, dots, prior lookup, highlights and repeat selection.
- `src/state/Experience.tsx` — suspend guide while targeting and expose Plan scroll reference.
- `src/state/FitMapStore.tsx` — targeting, assignment, finish/delete, derived log/last-time values and v2 persistence.
- `src/state/persistence.ts` — storage version, defensive migration and hydration.
- `tests/persistence.test.cjs` — updated migration assertions.
- `tests/scheduler.test.cjs` — weekday assignment and session suppression assertions.
- `tests/workout-backup.test.cjs` — new history/backup expectations.
- `tests/round3.test.cjs` — migration, cap/invalid history, same-day sessions, state machine and summary tests.
- `tests/e2e/round3.cjs` — two-size end-to-end round 3 acceptance.
- `tests/e2e/guide.cjs` — updated Body Start label.
- `tests/e2e/workout-backup.cjs` — v2 storage regression coverage.
- `tests/e2e/workout-redesign.cjs` — history-derived last-time and v2 regression coverage.
- `release/ROUND3-IMPLEMENTATION.md` — this report.

Generated review artifacts: `screenshots/round3/index.html` and normal/enlarged Week, History and detail PNGs for both widths in the parent project. Temporary exports/profiles/check logs live under `../.tmp`. Existing user edits in README.md and app.json were preserved.
