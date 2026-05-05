# WhiteKit

WhiteKit is a desktop app concept for keeping local dev environments healthy: git, runtimes, package tooling, and AI CLIs in one place.

This repo contains the frontend foundation and a minimal Tauri backend:

- Vite
- React
- TypeScript
- Tailwind CSS
- Tauri

WhiteKit launches as a normal desktop app on macOS and Windows. The backend exposes a single shell execution command that returns `stdout`, `stderr`, and `exitCode`; tool lifecycle policy stays in the frontend catalog.

The native app icon set under `src-tauri/icons/` is generated from `public/brand/whitekit-native-icon.svg`, which wraps the existing `public/brand/whitekit.svg` mark on a white background for desktop icon use, and must stay committed for Tauri/CI builds.

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run test
npm run tauri:dev
npm run tauri:build
```

## CI Builds

Pushing to `dev` runs `.github/workflows/build.yml`, which builds macOS and Windows Tauri artifacts and keeps them on the workflow run for 14 days.

- macOS: zipped `WhiteKit.app` for unsigned internal testing
- Windows: zipped portable `whitekit.exe`

Regenerate native icons after brand icon changes with:

```bash
npm run tauri:icon
```

## Current shape

- `src/`: frontend app
- `docs/`: product and architecture notes
- `src-tauri/`: Tauri shell bridge and native app config
