# Release readiness

This development build is not approved for Play submission.

## Blocking evidence

- Phone tests: PHONE-TEST-CHECKLIST.md remains unexecuted by agreement with the owner.
- Back artwork is a custom rear-muscle schematic using the front silhouette. Rear delts reuse shoulder outlines; triceps reuse biceps outlines. Other rear muscles use manually authored paths. It is not a verified matching back illustration. Keep the build in testing until an anatomy reviewer approves or replaces it.
- Exercise catalog and subpart tags require a qualified training reviewer. The app contains SVG anatomy and text exercise definitions, not exercise photographs. Rights to the supplied front SVG and any derived artwork still require owner confirmation.
- Existing generated Android release configuration signs with the debug key. Do not upload an AAB produced by that configuration as a production artifact. No production keystore was generated, copied or exposed in this task.
- Production AAB requires the owner's release signing credentials/Expo account setup. The EAS production profile already specifies app-bundle. Back up the upload key and passwords in owner-controlled encrypted storage, outside the repository. No Play upload has been performed.
- Existing icon assets need brand review; do not ship template adaptive icon assets without checking their content.
- Current screenshots are browser development previews. Capture standalone Android release screens before using store screenshots.
- Privacy policy below is a draft and requires owner contact details, hosting and review. Data safety must be completed against the exact standalone release binary, including any enabled Expo update/diagnostic behavior.

## Product decisions to validate

Test the five-step guide with five new users. Record completion time, skips, confusion, and whether each step helps. Review usage of themes and Connect before removing them; no user research or adoption data was fabricated. Keep existing behavior while testing.

## Current data behavior (policy draft input)

FitMap stores routines, notes, preferences, weekly schedules, activity timestamps, session checkoffs and completed workout snapshots locally on the device. Notifications are scheduled locally. The app does not request remote push tokens. Backup is initiated by the user and exports a plain JSON file to a destination chosen in the system share sheet. Whoever can access that file can read its workout data and notes. Import replaces workout data after review and confirmation. Notification permission is optional and can be managed in system settings. Imported notification settings start disabled.

No account or app backend is implemented. Development builds connect to Metro and include development tooling; their behavior is not a privacy statement for the standalone release. Android device backup and the user's chosen sharing provider may retain copies independently. Before publication, confirm OS backup configuration, retention/deletion instructions and all third-party network behavior. Add the owner's legal identity, privacy contact, effective date and public policy URL.

Data safety worksheet: identify local-only workout/fitness data and notes; document explicit user-directed file sharing; audit network traffic and SDKs in the signed standalone build; then answer Play's collection/sharing/security/deletion questions. Do not submit answers based solely on these source notes.
