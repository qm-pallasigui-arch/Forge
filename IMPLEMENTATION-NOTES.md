# FitMap implementation and verification

## Changes

- Body layout: always-visible display modes, Layers limited to Illustration/Depth, bottom Front/Back controls, contained exercise sheet, stronger region outlines, explanatory legends, 480 dp maximum width, fitness disclaimers.
- Equipment-aware weights: paired barbell plates with Add/Remove/Undo, half-kilogram controls for other equipment, exact entry clamped to 0-999 kg, no bodyweight controls and normalized bodyweight zero, accessible progression radios.
- Plan and local reminders: seven independent weekday plans, time chooser, muscle chips, Today card, workout logging, permission and privacy controls, five-second test notification, 28-day calendar scheduling, foreground/edit replanning, Snooze and Skip.
- Storage migrates `fitmap.native.v1` into the requested versioned keys, retaining the original data. Existing notes, timestamps, routine and preferences are preserved. Log workout stamps front/back Recent timestamps for trained muscle IDs.
- The reminder ZIP did not exist. The owner explicitly authorized an original implementation. No source from the missing ZIP was used.

## Files changed (relative to mobile)

Layout/UI: `src/app/index.tsx`, `src/app/_layout.tsx`, `src/app/routine.tsx`, `src/components/BodyMap.tsx`, `src/components/Controls.tsx`, `src/components/ExerciseSheet.tsx`, `src/components/LayersSheet.tsx`.

Weights: `src/app/routine.tsx`, `src/components/WeightControl.tsx`, `src/shared/weight.ts`, `tests/register.cjs`, `tests/weight.test.cjs`.

Reminders and integration: `package.json`, `package-lock.json`, `app.json` (notifications plugin only), `src/app/_layout.tsx`, `src/app/plan.tsx`, `src/app/index.tsx` (legend encoding correction), `src/state/FitMapStore.tsx`, `src/state/persistence.ts`, `src/notify/scheduler.ts`, `src/notify/platform.ts`, `src/notify/useReminders.tsx`, `tests/scheduler.test.cjs`, `tests/persistence.test.cjs`, `IMPLEMENTATION-NOTES.md`.

The owner's existing README and EAS/iOS app configuration edits were preserved. Generated `android/`, `dist/`, APK copies, Metro logs and browser checks/screenshots under `../.tmp/anatomy/` are ignored build/verification artifacts.

## Commands

Run from `C:\Users\redlo\Downloads\FitMap_updated\mobile`:

```powershell
npx expo install expo-notifications --npm
npm run typecheck
npm run lint
npm test
npx expo export --platform android
npx expo prebuild --clean --platform android --npm
```

Local Android compilation (no phone attached, so no installation attempted):

```powershell
cd android
$env:JAVA_HOME='C:\Program Files\Java\jdk-21'
$env:ANDROID_HOME="$env:LOCALAPPDATA\Android\Sdk"
.\gradlew.bat :app:assembleDebug -x lint -x test --build-cache --max-workers=2
```

Metro was restarted with `npx expo start --dev-client --port 8081 --host lan --clear` (invoked through the installed Expo CLI using Node). The old development APK cannot provide the new notifications native module; install the rebuilt APK first.

## Behavioral decisions and limitations

- Permission is inspected at launch but requested only by the explicit enable controls. Denial shows the Android Settings guidance. No remote push token or server is used.
- Snooze and Skip open the app to process their action. Snooze lasts ten minutes. Changing the routine, schedule or notification preferences cancels an outstanding snooze to avoid stale text. Log/Skip cancels reminders for that calendar date.
- Times use the device's local calendar/time zone. Foregrounding renews the 28-day window. If the app is never opened after that window, it has no later reminders scheduled.
- No exact-alarm permission was added. Delivery timing can vary with Android power management.
- Back art still uses the existing rendering; a matching back reference was not supplied. Drill-down exercise tags still need the owner's training-domain review.
- Prebuild reports that expo-system-ui would be required to enforce the system-wide dark-style configuration. It was not added because the spec limits new dependencies; the app's own screens are explicitly dark.

## Physical Android checklist (not yet verified)

1. Install the rebuilt development APK, start Metro from `mobile`, and open the project on the same LAN.
2. Enable reminders in Plan, grant permission, and send the test. Confirm arrival in about five seconds.
3. Set today's enabled plan a few minutes ahead with muscles that have saved exercises. Swipe the app away and confirm delivery.
4. Try Snooze and Skip after swiping the app away; both should open FitMap and apply their action. Confirm no second reminder after Skip or Log workout.
5. Schedule another reminder, reboot the phone, and verify delivery.
6. Repeat with battery saver enabled and record timing drift.
7. Deny permission and verify the Settings message and absence of crashes. Re-enable permission in Settings and return to Plan.
8. Check TalkBack labels, font scaling, body selection, upper/lower muscle sheets and numeric keyboard behavior on the phone.

Physical notification checks are required by the specification, so the full definition of done remains pending until these results are recorded.

## Verification results

- TypeScript: `npm run typecheck` passed against installed Expo SDK 58 / expo-notifications 58.1.9 types.
- Lint: `npm run lint` passed with no errors or warnings.
- Automated tests: 14 passed (8 scheduler, 3 weight, 3 persistence/migration). Scheduler calendar tests use America/New_York to cover a DST transition.
- Android Hermes export: passed, including the final snooze-content update (`npx expo export --platform android --max-workers 1`).
- Android native build: `BUILD SUCCESSFUL in 26m 8s`, all four architectures; APK signature verified with SDK 37 apksigner.
- Plan browser checks passed at 360 x 800 and 390 x 844: legacy migration, logging, Recent stamps, time editing and persistence after reload. This is secondary UI evidence, not Android notification delivery evidence.
- Metro became unresponsive during the clean native build. After compilation and restart, `/status` and the preview page returned successfully and the Plan browser checks passed. A short local CPU profile showed the restarted process idle normally. No speculative application fix was applied.
- Physical Android delivery, reboot, battery saver, notification action and permission-denial checks remain unverified.

APK: `../FitMap-development.apk` (also `artifacts/FitMap-development.apk`).
SHA-256: `BE553363496638DA7F935D3AF3D4A197E2B99DA4C7645AC70E5EFDCCC7929CF0`.
This is a development build and needs the running Expo server to load FitMap.
- Final Body browser checks passed at 360 x 800, 390 x 844 and 1000 x 900: upper/lower muscle sheets remain above the Front/Back controls, toggle targets are at least 44 dp, and display mode survives Front/Back switching.
- Final weight browser checks passed: exact 17 kg entry, paired barbell plates, Undo, hidden bodyweight controls and progression selection. The browser fixture was updated to clear versioned keys before seeding legacy data; otherwise the migrated empty routine correctly took precedence.
