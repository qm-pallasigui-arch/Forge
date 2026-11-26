# FitMap standalone Android APK

The standalone APK embeds the JavaScript bundle and assets. Once installed, it opens FitMap directly: no Metro server, Expo Go, QR code, or computer connection is needed.

## Install

1. Export a backup from FitMap Settings if you have workouts you want to keep.
2. Transfer `FitMap-standalone.apk` from the project folder to your Android phone.
3. Open the file on the phone and allow installation from that file manager/browser if Android asks.
4. Choose Update when replacing the existing local FitMap build. Do not uninstall first; uninstalling removes local app data.
5. Launch FitMap from its app icon. To check standalone operation, close Metro and reopen FitMap in airplane mode.

This is a release variant for direct installation, signed with this project's existing local debug certificate for compatibility with the local development APK. It is not a Play Store release. An installation made with a different signing certificate may not accept this as an update; keep a JSON backup before changing installations.

## Build again on this machine

From PowerShell:

```powershell
cd C:\Users\redlo\Downloads\FitMap_updated\mobile
.\Build-Standalone.ps1
```

The script uses Java 21, the installed Android SDK, and Gradle `:app:assembleRelease`. It builds ARM64 and ARMv7 phone support, then copies the result to `C:\Users\redlo\Downloads\FitMap_updated\FitMap-standalone.apk`. No native configuration or dependency changed for this release, so the existing generated Android project was reused.

Code changes require a newly built APK and an in-place update. This project does not currently configure over-the-air updates.

## Cloud build / Play Store

The existing `eas.json` has a `preview` APK profile and a `production` AAB profile. For a hosted, installable build using Expo-managed signing:

```powershell
npx eas-cli@latest build --platform android --profile preview
```

For a Play Store AAB, use `--profile production` after completing production signing and store release preparation. A cloud build using another certificate cannot replace the locally signed APK directly.

Expo reference: [installable APK profiles](https://docs.expo.dev/build-reference/apk/).

## Verified build — November 26, 2026

- Local `assembleRelease`: passed. Typecheck and ESLint: passed.
- APK: `FitMap-standalone.apk`, 49,499,638 bytes (47.2 MiB).
- SHA-256: `2209CF79C1CF469B9C79ED84FFF64AA8EBFDE06F0273629343BBFE3C5CDE9CCC`.
- APK Signature Scheme v2 verification passed; certificate matches the existing `FitMap-development.apk`.
- Package `com.fitmap.app`, version 1.0.0 (1), Android 7.0/API 24 minimum, ARM64 and ARMv7.
- Embedded `assets/index.android.bundle` verified (2,449,704 bytes).
- Packaged manifest has no debuggable flag, DevLauncher activity, or exact-alarm permission.
- Not yet launched on a physical phone. Install, close Metro, and reopen in airplane mode to complete the device smoke test.
