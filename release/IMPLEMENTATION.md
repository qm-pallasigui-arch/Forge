# Reliability update implementation

## Implemented

- A single renewal notification on local day 26 asks the user to reopen FitMap before the 28-day workout schedule expires. It opens Plan and has no Snooze/Skip actions. Replanning replaces it; disabling reminders or having no scheduled workouts removes it.
- Native JSON file export/share and picker import through the three approved Expo modules. Versioned schema, 5 MB import limit, strict validation, preview, cancel and explicit replacement confirmation. Backups cover routine, notes, preferences, schedule, daily activity, completed session snapshots and active session. Onboarding remains device-local. Restored reminders are disabled until explicitly enabled.
- Workout mode starts from the Body pill, Routine, today's Plan or the notification Start action, snapshots exercise prescriptions, checks individual sets, starts a 90-second rest countdown and saves progress. Timer uses an absolute deadline, so returning from background recalculates remaining time; it has no background completion alarm.
- Resume survives app restart. Finish confirms partial/full completion, logs only muscles with completed sets and stores the session snapshot; duplicate Finish cannot create a second session. Discard requires confirmation and does not erase the routine.
- Workout/Backup are secondary routes with their tab buttons hidden. SDK 58 changed href:null into redirect behavior; end-to-end testing found this and the routes now use tabBarButton/tabBarItemStyle instead.
- Exact-alarm permissions are explicitly blocked in app config. The merged debug manifest contains neither SCHEDULE_EXACT_ALARM nor USE_EXACT_ALARM.
- Snooze already displayed 10 min; behavior remains 600 seconds and opens the app, as accepted for v1.

- The guide now has three real actions: select a muscle, add an exercise, start a workout. GuideTarget borders highlight the actual controls; the fixed bottom card reserves its own space. Scroll containers reveal the target on step entry. Progress migrates from v1 to fitmap-onboarding-v2, with skip, resume and replay preserved.
- Fully completed exercises receive their saved next-workout weight increment on Finish. Partial exercises and deliberate mid-session weight edits are preserved. Active sessions show Resume workout, including notification actions.

## Rendering and performance

Rotation angle and camera animation are already local state in BodyScreen; they do not write to FitMapStore. The rest countdown updates only its RestTimer component, not the shared store. Routine changes and completing a set intentionally update shared data. No speculative context split was added. Browser profiling output lives in ../.tmp/release-qa/rotation-profile.json when the end-to-end flow passes; it is desktop evidence, not native smoothness verification.

## Tests and release boundaries

See PHONE-TEST-CHECKLIST.md for the agreed owner-run physical checks. tests/e2e/workout-backup.cjs exercises browser process restart persistence, session resume/finish and file export/import. tests/e2e/routine-persistence.yaml is a prepared native Maestro flow for a dedicated standalone test installation and has not been run without a device. It clears test app data.

Back view uses custom rear paths and reuses the front silhouette/arm outlines; reference-matched rear anatomy and training tags remain release gates. No Play upload, production signing key, five-user study, rights approval or physical-device pass is claimed. RELEASE-READINESS.md records these items and draft privacy/Data safety inputs.

Native build commands: npx expo install expo-file-system expo-sharing expo-document-picker --npm; npx expo prebuild --clean --platform android --npm; gradlew.bat :app:assembleDebug -PreactNativeArchitectures=arm64-v8a,armeabi-v7a -x lint -x test --build-cache --max-workers=2. This APK targets ARM phones and does not include x86 emulators.


Validation: TypeScript, Expo lint and 29 unit tests passed. Web and Android Hermes exports passed. Android assembleDebug completed successfully; APK v2 signature verified. The 360px browser guide check passed (scrolling highlight, fixed card, three real actions).

APK: ../FitMap-development.apk (144126154 bytes). SHA-256: ACCF9315B5BBF722A5907941EB2A708D5148B23910E22C4CA9169744B327D8ED. Development client requires Metro; this is not a standalone Play release.

The full browser acceptance flow also passed: routine persistence across process restart, saved session resume, all-set progression, daily logging, export, cancelled import, restore, malformed-file rejection, and no browser runtime errors.
