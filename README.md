# WhiteKit

WhiteKit is a desktop app concept for keeping local dev environments healthy: git, runtimes, package tooling, and AI CLIs in one place.

This repo contains the frontend foundation and a minimal Tauri backend:

- Vite
- React
- TypeScript
- Tailwind CSS
- Tauri

WhiteKit launches as a normal desktop app on macOS and Windows. The backend exposes a single shell execution command that returns `stdout`, `stderr`, and `exitCode`; tool lifecycle policy stays in the frontend catalog.

The native app icon set under `src-tauri/icons/` is generated from split platform sources in `public/brand/`: macOS keeps the inset desktop tile with transparent outer padding, while Windows uses the same rounded tile without the macOS-only padding. Both compositions wrap `public/brand/whitekit.svg`, and the generated icons must stay committed for Tauri/CI builds.

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run tauri:icon
npm run tauri:dev
npm run tauri:build
```

## CI Builds

Pushing to `zh` runs `.github/workflows/build.yml`, which builds macOS and Windows Tauri artifacts without the npm test step. The `dev` branch keeps its own `dev`-only trigger and test-enabled build.

- macOS: `whitekit-macos-zh.zip` with unsigned `WhiteKit.app`
- Windows: `whitekit-windows-zh.zip` with portable `whitekit.exe`

Regenerate native icons after brand icon changes with:

```bash
npm run tauri:icon
```

## Current shape

- `src/`: frontend app
- `scripts/`: project maintenance scripts like native icon generation
- `docs/`: product and architecture notes
- `src-tauri/`: Tauri shell bridge and native app config
