# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

# Project: Hotel Lobby Chaos Simulator

## Goal

Build and polish a mobile-first portfolio game where Abel practices fictional German hotel front-office chaos as a short shift simulator.

The app should feel like a memorable portfolio artifact: personal, funny, domain-specific, and usable within 30 seconds. It should not look like a generic SaaS demo.

## Repository State

Current app is a Vite + React + TypeScript + Tailwind CSS v4 MVP at repo root.

Implemented MVP:

- title screen for **Hotel Lobby Chaos Simulator**
- fictional **Hotel Ostseeblick** Frühschicht setting
- 12 static hand-written lobby chaos scenarios in `src/content/lobbyScenarios.ts`
- pure shift engine in `src/engine/shiftEngine.ts`
- app flow tests and domain tests
- mobile-first UI with warm hotel lobby palette

Historical plan lives in `docs/plans/2026-06-09-hotel-quest-mvp.md`; it is useful context but no longer the active product direction.

## Commands

- `npm run dev` — Vite dev server
- `npm test` — Vitest, single run
- `npm run test:watch` — Vitest watch mode
- `npm run lint` — ESLint
- `npm run build` — `tsc -b` type-check + production build
- `npm run preview` — serve production build
- `npm run screenshots` — capture mobile/desktop screenshots to `docs/screenshots/`

## Product Direction

- Theme: warm hotel lobby interface, calm UI containing chaotic guest stories.
- Core loop: start Frühschicht → choose German answer → see Indonesian rationale → next guest → Shift Report.
- Audience: Abel, hospitality/Ausbildung learners, portfolio reviewers.
- Languages: German guest/response copy; Indonesian rationale and occasional English portfolio framing.
- Hotel name: fictional **Hotel Ostseeblick** only.

## Hard Boundary

Do not use TRIHOTEL branding, real guest data, real internal procedures, employer-sensitive details, or exact shift documents.

If adding scenarios, fictionalize them fully.

## Technical Direction

- Keep content typed and editable.
- Keep scoring/game rules in pure functions with tests.
- Prefer local-first/static architecture; no backend/auth/runtime AI for this portfolio MVP.
- Maintain mobile-first layout and 44px+ touch targets.
- Verify with `npm test && npm run lint && npm run build` and at least one browser/mobile smoke check before completion claims.

## Claude/Fable Workflow

- Abel prefers Claude Code when requested; verify/test/QA/commit.
- For suitable long Claude coding sessions, pxpipe + Fable 5 can be used as opt-in accelerator.
- Fable 5 must not receive extra custom/system prompts.
- Special custom system prompts are reserved for Opus 4.8 only.
