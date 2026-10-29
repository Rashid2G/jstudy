# jstudy

> "Everything has become fast, distracting, and overwhelming, and the only way to focus these days is to turn the noise down. Achive more, do less."

A minimalist, calm study companion designed to keep you immersed in your studies rather than losing focus switching music or tweaking timers.

Live site: [jstudy.rashidk.com](https://jstudy.rashidk.com)

Runs as a **100% static client-side application** with browser-local persistence (`localStorage`), hosted directly on **GitHub Pages**, with an optional local SQLite/Node backend for self-hosting.

---

## Key Features

- **About & Philosophy**:
  *"Everything has become fast, distracting, and overwhelming, and the only way to focus these days is to turn the noise down. Achive more, do less."*

- **Static & Private Local Storage**:
  - All custom radios, study sessions, active streaks, and listening logs are stored directly and safely in your browser via `localStorage`.
  - Zero server required: hosted on **GitHub Pages** with custom domain support.
  - Optional SQLite mode for self-hosting with Node.js.

- **Custom Pomodoro & Continuous Focus Timer**:
  - Customize session duration (`1–240` minutes) and toggle **Breaks On / Off** inline for continuous deep flow.
  - Supports Pomodoro intervals, custom breaks, or no breaks.
  - Procedural Tibetan singing bowl chime via Web Audio API on session completion.
  - Automatically records study sessions, tracks focus minutes, and calculates daily streaks.

- **Modular Apple-Style Control Widgets**:
  - Interactive, expandable control shelf for Timer rhythm, Calm soundtrack, Ambient mix, and Appearance palettes.
  - Collapsible, glanceable, and minimal.

- **YouTube Videos, Live Streams & Lofi Radios (Audio-Only)**:
  - Supports **YouTube videos**, **24/7 YouTube live streams**, **Icecast streams**, and **Web Audio soundscapes**.
  - YouTube streams play purely as distraction-free background audio in the browser via a hidden YouTube IFrame audio controller.
  - Layer synthesized ambient sounds (*Rain*, *Hearth*, *Cafe*, *Waves*, *Wind*) alongside your music.

- **Seamless Blended Canvas & Dark / Light Mode**:
  - Cohesive layout built with **Radix UI** primitives that blends directly into the page canvas without awkward card borders.
  - Full **Dark Mode** and **Light Mode** across five muted palettes: *Sage*, *Warm Sand*, *Slate Mist*, *Soft Dusk*, and *Nordic Stone*.
  - Fullscreen **Zen Sanctuary** mode for zero-distraction study sessions.

---

## Quick Start

```bash
# Install dependencies
npm install

# Run test suite
npm test

# Start local development server (http://localhost:5173)
npm run dev

# Build for GitHub Pages / static hosting (dist/)
npm run build

# Preview static build locally
npm run preview
```

---

## Deployment

The repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically tests, builds, and deploys the static site to GitHub Pages with the custom domain `jstudy.rashidk.com`.
