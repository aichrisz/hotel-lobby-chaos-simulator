# Nachtschicht Mode — Design

**Date:** 2026-08-10  
**Status:** Ready for user review  
**Project:** Hotel Lobby Chaos Simulator

## Goal

Add one compact second shift that makes the shipped game feel alive without changing its architecture, scoring model, persistence, or privacy boundary.

## Content

Create four fully fictional Nachtschicht scenarios:

1. delayed-arrival verification;
2. corridor-noise de-escalation;
3. early-taxi confirmation;
4. 03:00 coffee-machine failure.

Each uses German choices and Indonesian rationale. No real hotel, guest, employer, internal document, or exact procedure appears.

## Architecture and data flow

- Add a typed `nachtScenarios` static pack beside the existing Früh content.
- Introduce a `ShiftMode = "frueh" | "nacht"` selection at game start.
- Pass the selected pack into the existing pure shift engine; derive scenario count, completion, efficiency, and report label from that pack.
- Keep the existing scoring effects and 180-second clock.
- Keep state in the existing app flow. No router, backend, account, runtime AI, or new dependency.

## UI

- Two native start controls: **Start Frühschicht** and **Start Nachtschicht**.
- Nacht HUD/report copy and restrained dark treatment using existing color tokens.
- Maintain 44px targets, keyboard access, mobile layout, and reduced-motion behavior.

## Expected files

- New `src/content/nachtScenarios.ts`
- Content/engine/UI tests
- `src/engine/shiftEngine.ts`
- `src/App.tsx`
- `scripts/screenshots.mjs`
- `README.md`, `docs/case-study.md`
- Generated `docs/screenshots/mobile-night-desk.png`

## Error and safety behavior

Unknown shift modes are impossible through the typed interface. Empty scenario packs must not start a run; guard this in pure logic if the current engine does not already do so.

## Verification

```bash
npm test -- src/content/lobbyScenarios.test.ts src/engine/shiftEngine.test.ts src/App.test.tsx
npm test
npm run lint
npm run build
npm run dev -- --host 127.0.0.1
SCREENSHOT_URL=http://127.0.0.1:5173/ npm run screenshots
```

Verify the Nacht flow at 390×844 and the existing Früh flow for regression. Deployment remains outside this planning phase.

## Explicitly excluded

No extra shifts beyond Nacht, AI scenarios, login, backend, leaderboard, multiplayer, procedural dialogue, new dependency, or broad visual redesign.
