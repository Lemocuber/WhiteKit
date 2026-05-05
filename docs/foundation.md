# WhiteKit Foundation

## Product

WhiteKit is a desktop app for painless dev environment maintenance across tools like git, node, python, codex, and claude.

## Current decisions

- Target platforms: macOS and Windows
- Current stack: Vite, React, TypeScript, Tailwind, Tauri
- The native backend is intentionally minimal: it refuses startup unless the process is already elevated, then exposes one shell execution command returning `stdout`, `stderr`, and `exitCode`
- Tool lifecycle policy lives in the frontend catalog: detect/install/uninstall commands, dependency metadata, and version parsing
- Installed state is only trusted when detect command output matches the catalog version regex
- Install queues expand missing dependencies before selected tools; uninstall never removes dependencies automatically
- Tool logos live in `src/assets/tools`; the WhiteKit mark lives in `public/brand/whitekit.svg` and doubles as the favicon
- Tool catalog and selection/filter model live in `src/lib/tools.ts`, with platform command metadata in `src/lib/toolCatalog.ts`
- App shell lives in `src/app/App.tsx`; real process lifecycle and telemetry live in `src/app/hooks`, and the main screen sections live in `src/app/components`

## Aesthetic & UI Decisions

- **Visual Style**: "Hard Brutalism" with a technical "control surface" feel. High contrast, thick borders (4px), and solid unblurred drop shadows.
- **Palette**: Borrowed from the "Residency" project. 
  - Canvas: Light Gray (`#f0f0f0`)
  - Ink/Borders: Pure Black (`#000000`)
  - Accents: Lime Green (`#ccff00`) and Magenta (`#ff00ff`)
- **Typography**: 
  - UI/Headings: `Geist Sans`
  - Technical Data/Telemetry: `Geist Mono`
- **Layout**: 
  - Fixed 75/25 split (Main Experience / Action Panel) that does NOT collapse on small screens, preserving a dense desktop utility feel.
  - Main area uses a flex grid with cards fixed at `280px` minimum width, allowing flexbox to manage the grid dynamically.
- **Component Design**: 
  - Tool Cards feature nested stacks: a horizontal top bar (Icon + Name vs. Checkbox + Version Status), a solid brutalist horizontal separator, and a description block at the bottom.
  - Action Panel (right) prioritizes high-contrast visual cues for network status, pending operations, and a monospace system log.
  - Network status is driven by a browser fetch to `https://www.google.com/generate_204`; when that probe fails, the speed module is replaced with a same-size red warning block instead of stale telemetry.
  - Buttons and tool cards should snap between states with no animated easing or transition effects.
  - Any translated hover surface should move inside a stable outer hit area to avoid hover oscillation at the edges.
