$ErrorActionPreference = 'Stop'
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-21'
$env:ANDROID_HOME = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
$env:NODE_ENV = 'production'
$androidDirectory = Join-Path $PSScriptRoot 'android'
if (!(Test-Path -LiteralPath $androidDirectory)) {
    throw 'Generate Android first: npx expo prebuild --platform android --npm'
}
Push-Location $androidDirectory
try {
    & .\gradlew.bat :app:assembleRelease -x lint -x test --build-cache --max-workers=2 '-PreactNativeArchitectures=arm64-v8a,armeabi-v7a'
    if ($LASTEXITCODE -ne 0) { throw 'Android release build failed.' }
    $apk = Join-Path $androidDirectory 'app\build\outputs\apk\release\app-release.apk'
    $destination = Join-Path (Split-Path $PSScriptRoot -Parent) 'FitMap-standalone.apk'
    Copy-Item -LiteralPath $apk -Destination $destination -Force
    Get-FileHash -LiteralPath $destination -Algorithm SHA256
    Write-Host "Standalone APK: $destination"
    Write-Host 'This uses the local signing configuration. Keep this signing key for future updates.'
} finally {
    Pop-Location
}
