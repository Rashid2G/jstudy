# Studinty

A minimalist, calm study companion web application designed to help you maintain unbroken focus during your study sessions without falling into the distraction trap of switching songs on YouTube Music or tinkering with timer setups.

## Key Features

- **Distraction-Free Focus Timer**:
  - Calm Pomodoro presets (25m/5m, 50m/10m, 90m/15m) or custom durations.
  - Smooth circular visual progress indicator.
  - Set active study focus goals (e.g. *"Calculus Chapter 4"*, *"CS Algorithm Review"*).
  - Soothing acoustic Tibetan singing bowl harmonic chime on interval completion (synthesized using Web Audio API so it never relies on external audio files).
  - Automatically logs every completed study session into SQLite with timestamps, durations, and notes.

- **Focus Lofi Radios & Ambient Soundscapes**:
  - Curated, reliable live ambient and lofi streams (*SomaFM Groove Salad*, *SomaFM Drone Zone*, *Nightwave Plaza*, *SomaFM Lush*, *SomaFM DEF CON*).
  - Add and store custom radio stream links (MP3/Icecast/Live stream URLs) directly into SQLite.
  - Synthesized ambient sound generator layers (*Rain on Window*, *Cozy Hearth Fireplace*, *Cafe Chatter*, *Gentle Ocean Waves*, *White Noise*) running locally via Web Audio API.

- **Custom Study Rooms (Instant Vibe Recall)**:
  - Create and store custom rooms with personalized vibes:
    - Target focus & break durations
    - Default lofi radio stream
    - Ambient sound layer and volume
    - Color palette preference
  - Switch rooms in 1 click—instantly loading your entire study environment without re-configuring anything.

- **Zen Distraction-Free Mode**:
  - Fullscreen overlay with a gentle breathing aura, large typography countdown, and zero clutter. Press `Esc` to return.

- **Calm, Mindful Color Palettes**:
  - Specifically designed with non-flashy, matte, soothing color schemes:
    - **Sage**: Soft herbal eucalyptus & paper
    - **Sand**: Warm oat & tea tones
    - **Slate Mist**: Cool graphite & stone
    - **Dusk**: Muted charcoal violet for midnight sessions
    - **Nordic**: Clean neutral monochrome matte

- **Persistent SQLite Storage**:
  - Stores all:
    - `rooms`: custom room presets
    - `radios`: curated & custom user stream links
    - `sessions`: study history, duration, notes, completion status
    - `play_history`: audio listening history and durations
    - `stats`: day streak calculation, today's focus time, total focus blocks

- **Full-Stack TypeScript & Test Suite**:
  - Full TypeScript implementation across frontend and backend.
  - Built-in `node:sqlite` storage (no native compilation dependencies).
  - Comprehensive unit and integration test suite with Vitest.

## Getting Started

### Prerequisites
- Node.js (v20+ or v22+ recommended; tested on Node v26)
- npm

### Installation
```bash
npm install
```

### Running Tests
```bash
npm test
```

### Development
Start the client and server:
```bash
# Terminal 1: Backend API server (Port 3001)
npm run server

# Terminal 2: Vite development client (Port 5173)
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

Open [http://localhost:3001](http://localhost:3001) to use the app.
