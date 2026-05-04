# WhiteKit

WhiteKit is a desktop app concept for keeping local dev environments healthy: git, runtimes, package tooling, and AI CLIs in one place.

This repo currently contains only the frontend foundation:

- Vite
- React
- TypeScript
- Tailwind CSS

The native layer is intentionally deferred. No Rust or Tauri tooling is required on this machine yet. When backend work starts, it will live in `src-tauri/`.

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## Current shape

- `src/`: frontend app
- `docs/`: product and architecture notes
- `src-tauri/`: reserved for the later native layer
