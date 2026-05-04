# WhiteKit Foundation

## Product

WhiteKit is a desktop app for painless dev environment maintenance across tools like git, node, python, codex, and claude.

## Current decisions

- Target platforms: macOS and Windows
- Frontend first: build the product UI before any native backend
- Current stack: Vite, React, TypeScript, Tailwind
- Backend boundary is deferred to a future `src-tauri/` directory
- Avoid Rust/Tauri installation on this machine during the frontend phase
