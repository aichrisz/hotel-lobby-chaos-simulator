# Nachtschicht Mode Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Add a compact four-scenario Nachtschicht mode while preserving the existing Früh flow, scoring, privacy boundary, and architecture.

**Architecture:** Add a typed static Nacht pack and pass a selected `frueh | nacht` mode/pack through the existing pure engine and app state. Derive counts and report labels from the selected pack; no new dependency or persistence.

**Tech Stack:** React, TypeScript, Vite, existing Tailwind tokens, Vitest, screenshot script.

---

### Task 1: Add the typed Nacht content pack

**Files:**
- Create: `src/content/nachtScenarios.ts`
- Modify/Test: `src/content/lobbyScenarios.test.ts`

1. Add RED integrity cases for exactly four Nacht scenarios, three German choices each, Indonesian rationale, unique ids, and no real hotel/employer data.
2. Add the minimum typed scenarios: delayed arrival verification, corridor noise, early taxi confirmation, and 03:00 coffee-machine failure.
3. Confirm focused GREEN.

### Task 2: Make the pure engine pack-aware

**Files:** `src/engine/shiftEngine.ts`, `src/engine/shiftEngine.test.ts`

1. Add RED tests for selected mode/pack, derived completion count, report label, and unchanged 180-second clock/scoring.
2. Add `ShiftMode = 'frueh' | 'nacht'` and pass the selected pack through existing engine functions. Reject/avoid empty packs using the smallest guard compatible with current APIs.
3. Confirm focused and full engine GREEN.

### Task 3: Add mode selection and Nacht presentation

**Files:** `src/App.tsx`, `src/App.test.tsx`

1. Add RED UI flow: start Nacht → first Nacht scenario → Nacht HUD/report label. Keep an explicit Früh regression.
2. Add two start controls. Reuse existing tokens and apply a restrained Nacht class/treatment; preserve mobile targets, keyboard flow, and reduced motion.
3. Confirm focused GREEN.

### Task 4: Docs, screenshots, and release gate

**Files:** `scripts/screenshots.mjs`, `README.md`, `docs/case-study.md`, generated `docs/screenshots/mobile-night-desk.png`

1. Capture one 390×844 Nacht screenshot and retain existing Früh screenshot behavior.
2. Update docs truthfully: four Nacht scenarios, same engine/scoring/clock, fully fictional.
3. Run:

```bash
npm test
npm run lint
npm run build
npm run dev -- --host 127.0.0.1
SCREENSHOT_URL=http://127.0.0.1:5173/ npm run screenshots
```

4. Smoke both modes at 390×844 and desktop; check console, overflow, and focus.
5. Commit: `feat: add compact Nachtschicht mode`.

## Excluded

No extra shifts, AI generation, backend, login, persistence, leaderboard, dependency, or broad redesign.
