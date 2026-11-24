# Round 4: screen layout and purpose

Implemented in the Expo app under `mobile/`. The root Vite application is a separate project and was not changed. No dependencies, native configuration, storage migrations, or screen-timeout behavior were added.

## Navigation and Plan

- Three visible tabs: Body, Plan, History. A dot on Plan indicates a running session. The former Routine URL redirects to Plan so old links and notification payloads still work.
- Today shows exactly one state, in priority order: running session, completed session(s), assigned workout, nothing planned. Each state has its own primary action.
- A Monday-first week strip shows actual dates, previous/next weeks, today, planned days and completed dates. The schedule repeats weekly. New reminder days remain off.
- One selected day contains expandable exercise rows, sets/reps, weight and plate controls, removal with confirmation, swipe removal with Undo, and model-based day assignment.
- Copy replaces the destination day's membership and reminder settings after an explicit Replace action. Clear requires confirmation and affects only that day. Neither changes active sessions or history.
- Reminder controls live in a sheet. The main screen shows the next reminder or the reason reminders are unavailable/off/blocked.

## Workout

- One expanded exercise with front/back muscle thumbnails, a muscle chip, editable weight/reps, last-time values and Use again, numbered set controls, and Complete set N.
- The current exercise's Complete action is filled. Sticky Finish is outlined while sets remain, then filled when the workout is complete. It is always enabled and displays completed/total sets.
- Finishing early asks about remaining sets. With zero completed sets, Finish offers a discard confirmation rather than saving an empty history entry.
- Rest controls stay above Finish; the final set starts no rest. Existing timer persistence, foreground vibration, set undo and history logging remain.
- Exercise Skip is in its overflow menu. Workout Discard remains in the header menu with confirmation. Completed exercises collapse; another exercise can be reopened for undo.
- Add exercise opens a full-screen native modal containing the Body view. Adds are immediately persisted to the active session and inserted after the current exercise. Done opens the first new exercise. Duplicate additions are ignored.
- Also add to today's plan defaults off. Opting in adds day membership without changing existing prescriptions on other days. Session-only additions never change the plan.

## Settings and History

- Body alone has the gear button. Illustration/Depth view sits next to the figure.
- Settings sections: Appearance (Classic, Blueprint, Neon swatches), Data (backup/restore), Help (replay guide), About.
- History is a separate tab. The compact weekly summary stays pinned; activity dots, monthly groups and session cards scroll underneath. Existing comparisons, repeat and confirmed deletion remain.
- Counts pluralize; cards use neutral borders; switches use an accent track and white thumb; controls have visible containers.

## Adaptations to the screenshot brief

- `schedule.on` now governs the **Remind me** switch. Day membership governs planned workouts. Turning reminders off must not hide assigned exercises or unexpectedly start the whole exercise collection.
- Exercise prescriptions remain shared across assigned days, as in round 3. Copying a day does not duplicate prescriptions. The copy dialog explains this.
- At limited model height (including large text), an expanded workout picker uses the available screen height. Collapse/Close returns to the model. This keeps the list and plan switch usable.
- The current model is the existing layered illustration, not a new anatomical mesh. The workout thumbnails use its front and back artwork.
- No new APK is required for these JavaScript changes. Validation builds are Expo Android bundle exports, not a new signed APK or Play AAB.

## Validation

Commands, run from `mobile/` with npm:

```powershell
npm run typecheck
npm run lint
npm test
npx expo export --platform android --max-workers 1 --output-dir ../.tmp/round4-android
npx expo export --platform web --max-workers 1 --output-dir ../.tmp/round4-web
$env:PLAYWRIGHT_PATH='C:\Users\redlo\Downloads\FitMap_updated\.tmp\browser\node_modules\playwright'
node tests/e2e/round4.cjs
```

The four implementation stages each received typecheck, lint, unit tests and an Android bundle build. Final verification on 24 November 2026 passed:

- Typecheck: no errors.
- Lint: no errors or warnings.
- Unit tests: 49 passed, zero failures.
- Android Hermes bundle export and web export: successful.
- Browser end-to-end flow: passed at 360×800 and 390×844, including large-text layout checks and a full browser restart; no captured page errors.
- `git diff --check` for implementation files: clean.

[Screenshot gallery: 34 browser previews](../../screenshots/round4/index.html). Reviewed the compact workout, Plan, Settings, History and expanded picker layouts. The final large-text picker wraps long exercise names and Add buttons onto separate rows.

Unit coverage includes Today precedence (including completed history after all exercises are removed), reminder-off assignments, week/month/year boundaries, copying days without mutation, and session insertion with duplicate protection. Existing persistence, backup, set/rest, progression and notification-scheduler tests remain included.

The browser flow covers Plan states, dates, day editing/removal/Undo/copy, session-only model adds, optional day assignment, full browser restart with the same active session, set completion/undo/rest rules, history and themes. It runs at 360×800 and 390×844. Large-text checks use a 28 px browser proxy, not Android's system font setting.

## Phone checks still required

- Largest Android font and display size at both target sizes: scroll the day editor, workout, expanded picker, Settings and History. Confirm all controls are reachable without overlap.
- TalkBack: set labels include exercise, set number, total and done/not done; Complete set N announces its action. Verify focus within the picker and confirmation dialogs, including Android system Back.
- Confirm background reminder delivery, notification actions, reboot/battery-saver behavior, blur performance and foreground rest vibration on a physical phone.

## Changed files

- `src/app/_layout.tsx`: visible tabs, legacy route hiding, in-progress dot.
- `src/app/history.tsx`: new History screen and summary deep-link handling.
- `src/app/index.tsx`: Settings gear, view controls, visible muscle-list control, session picker and compact-height expansion.
- `src/app/plan.tsx`: state-driven Today, dated weeks, one day editor, copy/clear, reminder sheet.
- `src/app/routine.tsx`: legacy redirect to Plan.
- `src/app/workout.tsx`: focused set layout, steppers, last-time reuse, picker, confirmations and completion focus.
- `src/components/Controls.tsx`: destructive choices and shared switch styling.
- `src/components/DayExercise.tsx`: expandable per-day editor and removal/Undo.
- `src/components/ExerciseSheet.tsx`: session add mode, plan opt-in, responsive rows and copy.
- `src/components/HistoryPanel.tsx`: pinned summary, neutral cards, pluralization and destructive styling.
- `src/components/LayersSheet.tsx`: Settings sections and theme swatches.
- `src/components/TabIcon.tsx`: History icon.
- `src/components/WeightControl.tsx`: two-line weight/next-workout summary.
- `src/components/WorkoutEntry.tsx`: singular/plural entry labels and secondary-action container.
- `src/shared/plan-layout.ts`: Today state, week dates and immutable day-copy helpers.
- `src/shared/session-picker.ts`: typed picker contract and immutable ordered session insertion.
- `src/shared/workout-entry.ts`: use day assignment independently of reminder permission/switch.
- `src/state/Experience.tsx`: bordered resume control and Settings wording.
- `src/state/FitMapStore.tsx`: copy/clear day, explicit theme choice and atomic session/optional-day additions.
- `tests/round4.test.cjs`: new logic tests.
- `tests/e2e/round4.cjs`: new end-to-end and screenshot flow.
- `release/ROUND4-IMPLEMENTATION.md`: this report.

Generated review artifacts live outside the Git repository in `screenshots/round4/` and `.tmp/round4-*`. Existing user changes in `README.md` and `app.json` were not included in the commits.
