# Workout screen redesign

Implemented 22 November 2026. Normal screen timeout retained at the owner's request; no dependency or app-config changes and no APK rebuild required. Reload the existing development client through Metro.

## Behavior

- Muscle-name header, back arrow, elapsed time, overflow menu. Workout hides the tab bar. Discard is only in the menu and requires confirmation.
- Sticky accent Finish button. Partial confirmation says how many sets remain. Summary shows sets, elapsed minutes, changed exercise weights and next enabled scheduled day.
- Pinned rest bar with remaining time, progress, -15 seconds, +30 seconds and Skip. Final set across all non-skipped exercises starts no rest; undo cancels rest. Expiry announces completion and gives a short Android vibration while JavaScript is running. No sound or background rest notification was added; locked-phone alert delivery is not guaranteed.
- Filled completed sets, gray unfinished outlines, next-set ring, numbered circles and explicit done/not-done accessibility labels and announcements.
- Last-session weight/reps stored at finish under fitmap.lastlog.v1, only for exercises with completed sets. Existing completed history migrates to this log. JSON backups include it; older backups without the key still import.
- Session-only weight changes in 0.5 kg steps (0-999), rep controls, and existing barbell plate picker. Full completion applies progression from the session weight, unless the routine weight was independently edited. Partial exercises do not progress.
- Completed exercises collapse, next unfinished expands and scrolls into view. Cards can be reopened to undo. Skipping preserves checked sets and allows later reopening. Add exercise and Include the rest extend only the active session.
- Filtered sessions explain their count versus the routine. No streaks, charts, history screen or sound added.

## Validation

Typecheck and lint passed. 34 unit tests passed, including set completion/undo, final-set rest, rest adjustment bounds, edited prescriptions, last-log persistence, progression and old backup compatibility. Android Hermes export passed.

Browser acceptance passed at 360x800 and 390x844: rest adjustment/undo/final set, automatic expansion, partial confirmation, quick weight/reps, finish summary, last log and discard cancellation. A 28px text stress test at both sizes kept Finish visible and avoided horizontal overflow. This is a browser proxy, NOT verification of Android's largest system font.

Separate browser-process restart flow passed for routine and active session persistence, completion/progression, JSON export/import/cancel and malformed-file rejection. No browser runtime errors observed.

Screenshots: ../../screenshots/workout-redesign/ (rest, summary and large-text variants for both widths).

## Physical checks still needed

Use the existing phone checklist plus: largest system font and display size, TalkBack announcements and reachability, rest vibration with screen awake, normal screen timeout, reopening after locked rest, and barbell plate controls. No phone was connected. Optional background rest notification is not implemented.

## Every file changed for this redesign

1. src/app/workout.tsx — full workout screen, rest bar, confirmations, summary and session controls.
2. src/app/_layout.tsx — hide tab bar on workout route.
3. src/components/WeightControl.tsx — optional session update callback; routine behavior retained.
4. src/shared/workout.ts — rest rules, adjustment, session edits, skip metadata, last-log generation and progression.
5. src/shared/backup.ts — older-backup compatibility for lastLog.
6. src/state/FitMapStore.tsx — session editing/adding/skipping, rest adjustment, finish logging and persistence.
7. src/state/persistence.ts — lastLog storage, validation and history migration; extended workout hydration.
8. tests/workout-backup.test.cjs — five additional regression tests.
9. tests/e2e/workout-redesign.cjs — two-size UI and large-text stress acceptance.
10. tests/e2e/workout-backup.cjs — updated accessible set labels, summary navigation and export path override.
11. tests/e2e/guide.cjs — updated set label.
12. release/WORKOUT-REDESIGN.md — this report.

Generated review artifacts: screenshots/workout-redesign/rest-360.png, rest-390.png, summary-360.png, summary-390.png, large-text-360.png and large-text-390.png (in the parent project). Temporary exports and test profiles remain under ../.tmp. Earlier uncommitted work and user README/app.json edits were preserved.
