# ⚔️ TypeBrawl

> **Retro-digital multiplayer typing battleground featuring competitive arcade modes and a comprehensive training hub.**

---

## 🎮 TypeBrawl Game Modes

### 🏆 Display Board Arena (`/play` & `/play/[code]`)
- **The Original Word Showdown:** A central retro-arcade display board presents target words with a synchronized countdown timer.
- Type your answer and hit **`Enter`** to submit!
- **Multiplayer Modes:** **Word Blitz** (simultaneous race with friends/randoms), **Bomb Pass** (turn-based hot potato with lives `❤️`), and **Elimination**.
- Host private rooms with customizable timers (3s, 5s, 8s, 10s, 15s), word difficulty packs, and room passwords.

### 🚨 Police Pursuit Escape (`/chase`)
- **High-Speed Outlaw Chase:** You are on the run pursued by police cruisers with flashing sirens!
- Type words to accelerate, maintain combo speed, and widen the escape gap.
- Proximity warning sirens and red flashing screen alert you when cruisers close in!
- Escape the pursuit to win.

### 🚀 Laser Type Shooter (`/shooter`)
- **Arcade Space Defense:** Descending alien invaders, battle cruisers, and boss motherships each carry target words.
- Type matching letters to lock on and fire plasma lasers (`playLaser()`), launching heavy torpedoes that detonate with size-based explosions (`playExplosion()`).
- 3 Defense Shields — prevent enemies from breaching your base perimeter!
- Customizable turret hull colors and difficulty tiers (Cadet, Commander, Ace).

### 🏎️ KeyDash Arcade Racer (`/keydash`)
- **Multi-Lane Speedway:** Race your custom hero avatar across the neon speedway.
- Maintain 4+ word streaks to unleash **Nitro Boost ⚡** speed trails.
- Live WPM speedometer, Novice / Pro / Master racing tiers, and finish line podium celebrations.

---

## ⌨️ Solo Training Grounds (`/practice`)

- **8 Dedicated Modes:** Step-by-step Lessons, Timed Sprints (15s–120s), Word Targets (10–100 words), Developer Code Syntax (JavaScript, Python, HTML/CSS, SQL), Famous Quotes, Numbers & Symbols, Zen Mode, and Custom Text paste.
- **Interactive Virtual Keyboard:** Real-time finger-placement guidance (Pinky, Ring, Middle, Index, Thumb) and error highlighting.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Run Development Server
```bash
pnpm dev
```
- **Web App:** [http://localhost:3000](http://localhost:3000)
- **Game Server:** [http://localhost:4000](http://localhost:4000)

Or run individually:
```bash
pnpm dev:server   # Starts Socket.IO game server (port 4000)
pnpm dev:web      # Starts Next.js frontend (port 3000)
```
