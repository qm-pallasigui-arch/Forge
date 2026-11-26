
[# FitMap mobile

Native React Native screens, Expo Router navigation, SVG muscle selection, and local routine/notes storage. Android is the first test target; iOS configuration is also included.

## Run on Android

From this directory:

```sh
npm ci
npm start
```

Install the FitMap development APK on Android, then open the development server from its launcher or QR code. Keep the phone and computer on the same Wi-Fi. The development client needs Metro running to load the app. The `web` script is a browser preview for development.

## Local Android development build (Windows)

The project uses npm. Initial setup:

```powershell
npx expo install expo-dev-client --npm
npx expo prebuild --clean --platform android --npm
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-21'
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
npx expo run:android --device
```

Use `--device` when installing on a connected physical phone; omit it for an emulator. If no device is connected, compile a transferable APK directly:

```powershell
cd android
.\gradlew.bat :app:assembleDebug -x lint -x test --build-cache --max-workers=2
cd ..
```

The output is `android/app/build/outputs/apk/debug/app-debug.apk`. Install it on the phone and run `npx expo start` in this directory. This development APK is for testing and loads JavaScript from your computer; use a preview/release build for standalone sharing.

After changing native dependencies or app configuration, regenerate with `npx expo prebuild --clean --platform android --npm` before compiling again. Native folders are generated; keep configuration in `app.json` and config plugins. See [Expo's development build introduction](https://docs.expo.dev/develop/development-builds/introduction/).

Windows build note: this machine uses JDK 21 and has long paths enabled. The SDK's CMake 3.22.1 shipped with Ninja 1.10.2, which failed on long native object paths. Ninja was updated to 1.12.1; the original is retained beside it as `ninja.exe.fitmap-backup`. On another machine, use Ninja 1.12+ and enable Windows long paths; see [Expo's Windows path guidance](https://docs.expo.dev/troubleshooting/windows-long-paths/).

## Build an installable APK

```sh
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile preview
```

The first build associates this project with your Expo account and configures signing. Install the APK from the completed build's download link. The `production` profile creates a Play Store AAB. See [Expo's APK guide](https://docs.expo.dev/build-reference/apk/).

## Validate

```sh
npm run lint
npm run typecheck
npx expo-doctor
npm run export:android
```

The Android export validates the JavaScript/Hermes bundle; it does not produce an APK or prove device behavior. Android hardware testing and a signed APK build remain necessary.

## Source

- `src/app`: Body and Routine screens and tab navigation.
- `src/components`: selectable body map, depth interaction, exercise sheet, controls.
- `src/state/FitMapStore.tsx`: validated local persistence for exercises, notes, themes, and modes.
- `src/shared`: canonical anatomy paths and exercise catalog. The original web app re-exports these files so both applications use the same artwork and exercise data. The mobile project is self-contained for cloud builds.

The depth view rotates a layered relief of the supplied illustration. It preserves the same silhouette and muscle layout; it is not a fully sculpted anatomical mesh. Existing browser storage is separate from native device storage.
