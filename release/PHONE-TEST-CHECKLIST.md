# Physical Android test record

Status: NOT RUN. No phone was attached; owner chose to test later.
Record phone model, Android version, build hash, time zone, battery settings, scheduled time, actual arrival time and result for each row. Use the new APK and the same LAN as Metro. Do not clear your real app data. Export a backup before destructive tests.

| Check | Steps and pass condition | Result / evidence |
|---|---|---|
| Basic notification | Plan > enable reminders, grant permission, send test. Arrives about five seconds later. | Pending |
| App dismissed | Set today's plan two minutes ahead with saved exercises. Swipe app out of Recents (do not Force stop). Record arrival; target within one or two minutes. | Pending |
| Snooze | Tap Snooze 10 min. App opens. Dismiss again. One reminder arrives about ten minutes later. | Pending |
| Skip | Tap Skip today. App opens; today's status shows skipped. No later reminder for that date. | Pending |
| Reboot | Schedule a future reminder, reboot before its time, unlock phone and record whether it arrives. | Pending |
| Power managers | Repeat with battery saver and default Xiaomi/Samsung restrictions where available. Record drift rather than claiming exact delivery. | Pending |
| Permission denied | Deny notification permission on a test installation. Plan offers Settings; app remains usable. Enable in Settings, return and retry. | Pending |
| Renewal | Logic test covers day 26. For on-device validation, use a dedicated QA build with a shortened horizon; verify generic message, no workout actions, opens Plan. Do not change the real phone clock. | Pending |
| Blur / rotation | Drag repeatedly with an open card on a budget phone. Record screen and frame timings. Pin follows, card stays still, no touch blockage. | Pending |
| Accessibility | Enable TalkBack and largest font/display size. Complete onboarding through muscle list, add, workout checkboxes, backup and Plan. All actions reachable and labels announced. | Pending |
| Timer / session | Check a set, leave app for over 90 seconds, return: rest complete. Kill/reopen: checked sets remain. Finish logs only checked muscle groups. | Pending |
| Guide scrolling | At 360px width, scroll with Add highlighted: border stays on the real button and bottom card stays fixed. Skip/resume and complete the three actions. | Pending |
| Start / progression | Start from Body, Plan and notification. Resume after cold start. Finish all sets: stored increment applies once. Partial exercise weight stays unchanged. | Pending |
| Backup round-trip | Export to a private folder outside app storage. Modify a note. Import file, review summary, cancel once (no change), then confirm. Original note/routine/history restored; reminders off. | Pending |
| Malformed import | Choose invalid JSON and an unsupported backup version; error shown, current routine unchanged. | Pending |
| Native file handlers | Share to Files/Drive/email as desired; cancel picker/share without crash. Verify exported file opens and imports on another test device. | Pending |

Automated native smoke flow: tests/e2e/routine-persistence.yaml. It clears app data and must only run against a dedicated test installation of a standalone preview build: `maestro test tests/e2e/routine-persistence.yaml`. Not executed here. Official command reference: https://docs.maestro.dev/reference/commands-available/launchapp

