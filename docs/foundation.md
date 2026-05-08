# WhiteKit Foundation

## Product

WhiteKit is a desktop app for painless dev environment maintenance across tools like git, node, python, codex, and claude.

## Current decisions

- Target platforms: macOS and Windows
- Current stack: Vite, React, TypeScript, Tailwind, Tauri
- The native backend is intentionally minimal: it launches without root/admin requirements and exposes one shell execution command returning `stdout`, `stderr`, and `exitCode`
- Catalog commands may opt into OS-native elevation with a leading `!SUDO ` marker; the backend strips the marker and lets macOS/Windows show their system permission prompt without launching the whole app as root/admin
- Long-running shell commands must run off the Tauri app thread, and the UI must enter its processing view before install/remove execution begins
- The processing view must stay open after a run finishes until the user explicitly acknowledges it; queued items count as settled once they either succeed or fail
- On macOS, shell commands must run through the user's login+interactive shell so PATH-managed tools like `nvm` Node installs and npm-global CLIs are detectable from the app
- Windows release builds must use the GUI subsystem, and backend shell child processes must run hidden so tool detection/install/remove never opens a visible console window
- Tool lifecycle policy lives in the frontend catalog: detect/install/uninstall commands, dependency metadata, and version parsing
- AI CLI config for Codex and Claude Code is frontend-owned in `src/lib/toolConfig.ts`; it reads current on-disk values into the configure form, then merges and writes config files back through the existing shell bridge, including optional model selection and required auth-mode fields, instead of adding native file APIs
- Installed state is only trusted when detect command output matches the catalog version regex
- Install queues expand missing dependencies before selected tools; uninstall never removes dependencies automatically
- Platform package managers are first-class detect/install-only tools: macOS shows Homebrew, Windows shows Winget, and managed package installs depend on the current platform manager when missing
- Platform package manager bootstrap commands use `!SUDO`; normal `brew install` and `winget install` package commands remain non-elevated and rely on their package manager or installer to request any further privileges
- GitHub Actions builds macOS and Windows test artifacts on pushes to `dev`; macOS artifacts ship as a zipped unsigned `WhiteKit.app`, Windows artifacts ship as a zipped portable `whitekit.exe`
- Tool logos live in `src/assets/tools`; the WhiteKit mark lives in `public/brand/whitekit.svg` and doubles as the favicon
- The tools screen filter is owned by the header logo tile instead of separate buttons; it cycles `all -> installed -> available -> all`, using white/black, lime/black, and magenta/white state colors respectively
- Native desktop app icons are generated into `src-tauri/icons/` from split platform sources in `public/brand/`: macOS keeps the inset continuous-rounded white desktop tile with transparent outer padding, while Windows uses the same rounded tile without the macOS-only padding; both use a slightly enlarged `public/brand/whitekit.svg` mark and CI/native builds depend on those generated files being committed
- Tool catalog and selection/filter model live in `src/lib/tools.ts`, with platform command metadata in `src/lib/toolCatalog.ts`
- App shell lives in `src/app/App.tsx`; real process lifecycle and telemetry live in `src/app/hooks`, and the main screen sections live in `src/app/components`
- Sidebar action gating keeps `Terminal` always launchable, while `Config` only enables for a single installed configurable CLI selection
- Default native window size is `980x700`, with matching minimum size
- Root layout must disable window-level overscroll/rubber-banding; internal panels should keep normal scrolling behavior

## Aesthetic & UI Decisions

- **Visual Style**: "Hard Brutalism" with a technical "control surface" feel. High contrast, thick borders (4px), and solid unblurred drop shadows.
- **Palette**: Borrowed from the "Residency" project. 
  - Canvas: Light Gray (`#f0f0f0`)
  - Ink/Borders: Pure Black (`#000000`)
  - Accents: Lime Green (`#ccff00`) and Magenta (`#ff00ff`)
- **Typography**: 
  - UI/Headings: bundled local `Geist Sans` variable font from `src/assets/fonts/Geist-VariableFont_wght.ttf`
  - Technical Data/Telemetry: bundled local `Geist Mono` variable font from `src/assets/fonts/GeistMono-VariableFont_wght.ttf`
- **Layout**: 
  - Fixed 75/25 split (Main Experience / Action Panel) that does NOT collapse on small screens, preserving a dense desktop utility feel.
  - Main area uses a flex grid with cards fixed at `280px` minimum width, allowing flexbox to manage the grid dynamically.
- **Component Design**: 
  - Tool Cards feature nested stacks: a horizontal top bar (Icon + Name vs. Checkbox + Version Status), a solid brutalist horizontal separator, and a description block at the bottom.
  - Action Panel (right) prioritizes high-contrast visual cues for network status, pending operations, and a monospace system log.
  - Internet reachability is driven by a browser fetch to `https://www.google.com/generate_204`; when that probe fails, the speed module is replaced with a same-size red warning block instead of stale telemetry.
  - Network speed telemetry comes from the native Tauri backend via `sysinfo`, emitted once per second as raw combined RX+TX bytes and formatted in the frontend.
  - Buttons and tool cards should snap between states with no animated easing or transition effects.
  - Any translated hover surface should move inside a stable outer hit area to avoid hover oscillation at the edges.
