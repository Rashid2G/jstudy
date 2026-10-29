# Studinty

A minimalist, calm study companion web application designed to keep you immersed in your studies rather than losing focus switching music or tweaking timers.

Runs as a **100% static client-side application** with browser-local persistence (`localStorage`), hostable directly on **GitHub Pages**, with an optional local SQLite/Node backend.

---

## Key Features

- **Static & Private Local Storage**:
  - All rooms, custom radios, study sessions, active streaks, and listening logs are stored directly and safely in your browser via `localStorage`.
  - Zero server required: hostable on **GitHub Pages**, Vercel, Netlify, or any static file host.
  - Optional SQLite mode for self-hosting with Node.js.

- **Custom Pomodoro & Continuous Focus Timer**:
  - Customize session duration (`1–240` minutes) and toggle **Breaks On / Off** inline for continuous deep flow.
  - Supports Pomodoro intervals, custom breaks, or no breaks.
  - Procedural Tibetan singing bowl chime via Web Audio API on session completion.
  - Automatically records study sessions, tracks focus minutes, and calculates daily streaks.

- **Session Focus Dimming**:
  - Starting a focus session smoothly dims the surrounding interface (navigation, room bar, ambient mixer, and station picker) so only the active timer progress remains prominent. Hovering over dimmed areas brings them back into view.

- **YouTube Videos, Live Streams & Lofi Radios (Audio-Only)**:
  - Supports **YouTube videos**, **24/7 YouTube live streams**, **Icecast streams**, and **Web Audio soundscapes**.
  - YouTube streams play purely as distraction-free background audio in the browser via a hidden YouTube IFrame audio controller.
  - Paste any YouTube link to auto-fetch metadata and add it to your custom station list.
  - Layer synthesized ambient sounds (*Rain*, *Hearth*, *Cafe*, *Waves*, *Wind*) alongside your music.

- **Seamless Blended Canvas & Dark / Light Mode**:
  - Cohesive layout built with **Radix UI** primitives that blends directly into the page canvas without awkward card borders.
  - Full **Dark Mode** and **Light Mode** across five muted palettes: *Sage*, *Warm Sand*, *Slate Mist*, *Soft Dusk*, and *Nordic Stone*.
  - Fullscreen **Zen Sanctuary** mode for zero-distraction study sessions.

- **Custom Study Rooms**:
  - Create custom rooms with preset work/break durations, break toggles, ambient sound, default radio station, and color theme.

---

## Quick Start

```bash
# Install dependencies
npm install

# Run test suite (43 unit & integration tests)
npm test

# Start local development server (http://localhost:5173)
npm run dev

# Build for GitHub Pages / static hosting (dist/)
npm run build

# Preview static build locally
npm run preview
```

---

## Deploying to GitHub Pages

This repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically builds and deploys to GitHub Pages upon pushing to `master` or `main`:

1. In your GitHub repository settings, navigate to **Settings** → **Pages**.
2. Under **Build and deployment** → **Source**, select **GitHub Actions**.
3. Push your commits to `master`:
   ```bash
   git push origin master
   ```
4. GitHub Actions will run tests, build the static bundle with relative asset paths, and publish your site at `https://<username>.github.io/<repository-name>/`.
