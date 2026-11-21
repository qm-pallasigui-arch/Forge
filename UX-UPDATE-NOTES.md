# FitMap UX update

This update implements the supplied UX proposal in the existing Expo SDK 58 native app.

## Behavior

- Heatmap, Recent and Connect stay hidden until an exercise is added. Unlocking persists even if the routine is subsequently emptied.
- Front/Back follows drag rotation. The accessible muscle list includes Front/Back actions, and selections keep the current rotation when already on that side.
- Menu contains Illustration/Depth view, a labeled Theme control and Replay guide.
- Adding an exercise shows an actionable View toast. Button removal and left-swipe removal offer Undo, preserving the exercise values and its original position.
- Routine weights default to a single weight/progression summary. The loader expands on tap. The guide opens the first relevant control automatically.
- Passport is now Summary. The zero-progression label is Same and the compact summary says same weight next. There was no literal Hold label in the current native source.
- The five-step guide records actual rotate/select/add/routine/weight actions in any order. Skip retains progress in a resume pill. Replay resets guide steps without resetting the routine, unlocked modes or previously shown hints.
- Progress and one-time hint history live under `fitmap-onboarding-v1`. Storage failures are reported and failed reads do not overwrite saved progress.
- The spotlight uses measured native View refs rather than DOM-only attributes. It follows layout changes and scrolling. Its dimming views ignore pointer events, so users can continue exploring.
- Step messages are announced through AccessibilityInfo. Front/Back is an accessible alternative to dragging; muscle-list buttons replace canvas taps; ordinary Add, tab and weight buttons complete the remaining steps. For non-barbell exercises, changing weight completes step five; for bodyweight, changing sets or reps does.
- Recent remains the name of the existing timestamp view rather than Recovery, because its colors do not indicate physiological recovery. Mode explanations, plate-removal guidance and the swipe hint are recorded once per device.

## Selected-muscle card

The existing renderer is a rotating, layered SVG illustration, not a mesh with OrbitControls. Its PanResponder supplies the drag-start event. The pin uses the same illustration anchor, perspective, yaw and camera transform as the rendered figure; this is a projection onto the existing illustration surface, not a newly modeled anatomical mesh.

Selection focuses at 1.45x zoom, horizontally centered, at 30% of the body area for upper muscles and 64% for lower muscles. Compact cards use up to 210 px, prefer below/above respectively, flip when the alternative has more room, and remain inside the figure. Expanded cards can cover more of the figure by explicit user choice. Clearing selection returns to the full-body framing.

The card position is calculated from the settled anchor and area size, not live rotation. The pin and dashed connector move while the card stays fixed. When the selected side rotates away, the pin and line hide and the card remains. The body has no selection scrim; dimming only occurs during an active guide spotlight. Camera easing and pin pulses stop under reduced motion, and rotation has no inertial drift.

The owner explicitly approved installing `expo-blur` and rebuilding Android. BlurView targets the figure through BlurTargetView. This native addition requires installing the new APK once; Metro alone cannot supply it.

## Files changed

- `package.json`, `package-lock.json`: Expo-compatible blur dependency.
- `src/app/_layout.tsx`: experience provider/surface and Routine guide target.
- `src/app/index.tsx`: mode unlocking, camera/pin/card layout, accessible view controls and hints.
- `src/app/routine.tsx`: swipe removal, Undo and guided weight controls.
- `src/app/plan.tsx`: top safe-area handling moved to the shared surface.
- `src/components/BodyMap.tsx`: controlled yaw, camera transforms and drag events.
- `src/components/Controls.tsx`: explicit toggle pressed state for accessibility.
- `src/components/ExerciseSheet.tsx`: compact/expandable native-blur card, Summary and Add feedback.
- `src/components/LayersSheet.tsx`: Menu, Theme and Replay guide.
- `src/components/WeightControl.tsx`: collapsed summary, guide target, weight actions and removal hint.
- `src/state/Experience.tsx`: saved guide, hints, toasts, reduced motion, announcements and measured spotlight.
- `src/state/FitMapStore.tsx`: restoration without duplicating or modifying an exercise.
- `src/shared/onboarding.ts`, `src/shared/body-projection.ts`, `src/shared/gestures.ts`: validated guide state, projection/layout math and controlled responders.
- `tests/experience.test.cjs`: progress, persistence, side calculation, focus and card-boundary tests.
- `UX-UPDATE-NOTES.md`: this report.

Pre-existing owner edits to `README.md` and `app.json` are preserved. Generated native directories, exports, APKs, browser harnesses and screenshots are ignored artifacts.

## Device checks still needed

Install the newly built APK over FitMap, connect to Metro, and check native blur performance, real touch dragging, TalkBack, Android font scaling and reduced-motion settings. Preview screenshots and browser gestures are secondary evidence and do not establish these physical-device behaviors. Existing notification delivery/reboot checks from IMPLEMENTATION-NOTES.md also remain pending.

## Validation

- TypeScript typecheck passed.
- All 21 unit tests passed, including seven new onboarding and projection/layout tests.
- Web and Android/Hermes exports passed.
- Browser interaction checks passed at 360x800 and 390x844: complete guide, out-of-order actions, skip/resume, replay, reload persistence, Add/View, compact weights and removal Undo.
- Additional browser checks passed for rotation/toggle synchronization, far-side pin hiding, stable card position, lower-body card placement, once-only hints, swipe Undo with original ordering, and exact dumbbell entry.
- `git diff --check` passed.

Commands used for native setup/build: `npx expo install expo-blur --npm`, `npx expo prebuild --clean --platform android --npm`, then `gradlew.bat :app:assembleDebug -x lint -x test --build-cache --max-workers=2` with JDK 21 and the local Android SDK. This is a development APK and uses Metro for JavaScript.

- Final Expo lint passed.
- Android debug APK build passed; APK Signature Scheme v2 verification passed.
- Shareable APK: `../FitMap-development.apk` (293,407,928 bytes).
- SHA-256: `17ED08B5222A5C4B8042833BBE48C76E17C1F7F80951E3A091B9613045C37549`.
