# TypeBrawl — Implementation Plan & Architecture

## 1. Product Vision & Concept

**TypeBrawl** is a fast-paced real-time multiplayer typing battleground and retro training hub.

### Core Pillars
1. **Zero-Login Frictionless Access:**
   - Instant guest access with nickname and hero avatar saved locally in `localStorage`.
   - Practice any lesson, sprint, or drill without accounts or progression locks.
   - Multiplayer room creation and joining via 6-character room codes or 1-click invite links.
2. **Retro Arcade Aesthetic:**
   - High-contrast arcade CRT dark canvas, solid drop shadows, and tactical neo-brutalist controls.
   - Web Audio synthesized mechanical switches (clacks, countdown ticks, chimes, buzzers).
3. **Multiplayer Display Board Arena:**
   - Central arcade board revealing target words with synchronized countdown timers.
   - Enter-to-submit mechanic with instant validation and streak bonuses.
   - Game modes: **Word Blitz** (simultaneous race), **Bomb Pass** (turn-based hot potato with lives), and **Elimination**.
4. **KeyDash Arcade Racer (`/keydash`):**
   - Multi-lane speed typing race against AI rival bots (Blitz Bot, Nova AI, Pico Mecha).
   - Streak-activated Nitro speed boosts and podium celebrations.
5. **Comprehensive Training Grounds (`/practice`):**
   - 10-step curriculum (Home Row through code syntax).
   - Timed Sprints (15s, 30s, 60s, 120s), Word Targets (10, 25, 50, 100), Quotes, Code Drills, Numbers & Symbols, Zen mode, and Custom Text input.
   - Interactive Virtual Keyboard with finger placement guidance.

---

## 2. Tech Stack

- **Monorepo:** pnpm workspaces (`packages/shared`, `apps/web`, `apps/server`)
- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide React, Canvas Confetti
- **Audio Engine:** Web Audio API (Synthesized low-latency mechanical sound effects)
- **Game Server:** Node.js, Express, Socket.IO
- **State & Storage:** LocalStorage + Socket server state
