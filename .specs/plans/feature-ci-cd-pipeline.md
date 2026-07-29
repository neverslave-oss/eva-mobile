# Feature: CI/CD Pipeline

## Objective
Set up the GitHub Actions workflow and self-hosted runner configuration to auto-build release APKs on `v*` tag push, with test gates (expo-doctor, tsc, jest).

## Dependencies
- Project Scaffold (for `app.json`, `package.json`, `tsconfig.json`)
- All other features (for jest tests to exist and pass)

## Stack
- GitHub Actions (self-hosted runner, `[self-hosted, linux, x64]`)
- Gradle (via `./gradlew assembleRelease` in `android/`)
- Android SDK (JDK 17, platform android-35, build-tools 35.0.0)

## Expected output
- `.github/workflows/build-release.yml` — exact workflow from ADR CI/CD section
- Self-hosted runner registered on the build machine
- Android SDK installed on runner (prerequisites script documented in ADR)
- Push `v*` tag → test gate → Gradle APK → GitHub Release with APK artifact ✅

## Status
[ ] Not started
