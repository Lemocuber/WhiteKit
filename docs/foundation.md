# WhiteKit Foundation

## Product

WhiteKit is a desktop app for painless dev environment maintenance across tools like git, node, python, codex, and claude.

## Current decisions

- Target platforms: macOS and Windows
- Frontend first: build the product UI before any native backend
- Current stack: Vite, React, TypeScript, Tailwind
- Backend boundary is deferred to a future `src-tauri/` directory
- Avoid Rust/Tauri installation on this machine during the frontend phase
- Tool logos live in `src/assets/tools`; the WhiteKit mark lives in `public/brand/whitekit.svg` and doubles as the favicon

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
  - Buttons and tool cards should snap between states with no animated easing or transition effects.
  - Any translated hover surface should move inside a stable outer hit area to avoid hover oscillation at the edges.
