# ⚔️ TypeBrawl

> **Retro-digital multiplayer typing battleground featuring 4 arcade games and a comprehensive training hub.**

---

## 🎮 The 4 Games of TypeBrawl

### 1. 🏆 Display Board Arena (`/play` & `/play/[code]`)
- **The Original Word Showdown:** A central retro-arcade display board presents target words with a synchronized countdown timer.
- Type your answer and hit **`Enter`** to submit!
- **Multiplayer Modes:** **Word Blitz** (simultaneous race with friends/randoms), **Bomb Pass** (turn-based hot potato with lives `❤️`), and **Elimination**.
- Host private rooms with customizable timers (3s, 5s, 8s, 10s, 15s), word difficulty packs, and room passwords.

### 2. 🚨 Police Pursuit Escape (`/chase`)
- **High-Speed Outlaw Chase:** You are in a getaway sports car pursued by police cruisers with flashing sirens!
- Type words to accelerate, ignite Nitro flames, and widen the escape gap.
- If the cruisers close the gap to 0m, you get **Busted!**
- Evade the pursuit and reach the safehouse (1,200m) to win.
- Custom vehicle colors (Neon Crimson, Cyber Gold, Midnight Slate, Electric Cyan, Toxic Lime, Ultra Violet) and pursuit tiers (City Patrol, Highway, Interceptor).

### 3. 🚀 Laser Type Shooter (`/shooter`)
- **Arcade Space Defense:** Descending alien invaders, battle cruisers, and boss motherships each carry target words.
- Type matching letters to lock on and fire plasma lasers (`playLaser()`), destroying invaders with particle explosions (`playExplosion()`).
- 3 Defense Shields — prevent enemies from breaching your base perimeter!
- Customizable turret hull colors and difficulty tiers (Cadet, Commander, Ace).

### 4. 🏎️ KeyDash Arcade Racer (`/keydash`)
- **Multi-Lane Speedway:** Race your custom hero avatar against live AI rival racers (**Blitz Bot**, **Nova AI**, **Pico Mecha**).
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
