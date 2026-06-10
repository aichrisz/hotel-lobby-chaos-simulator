# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Project: Front Office RPG Simulator

## Goal
Build a mobile-first gaming-themed German hotel reception practice web app. It should help Abel practice generic hotel front-office interactions without TRIHOTEL-specific scenarios.

## Repository State
Scaffolded: Vite + React + TypeScript + Tailwind CSS v4 + Vitest at repo root. Implementation plan lives in `docs/plans/2026-06-09-hotel-quest-mvp.md`; Phase 0 (scaffold & tooling) is done, app features come next.

## Commands
- `npm run dev` — Vite dev server
- `npm test` — Vitest, single run
- `npm run test:watch` — Vitest watch mode
- `npm run lint` — ESLint
- `npm run build` — `tsc -b` type-check + production build
- `npm run preview` — serve production build

## Product Direction
- Theme: cozy RPG / quest / battle simulator.
- Core loop: choose a scenario, talk through German reception dialogue, get scoring/feedback.
- Audience: Abel and hospitality/Ausbildung learners.
- Languages: UI can mix English/Indonesian, but practice dialogs focus on German hotel phrases.
- Do not use TRIHOTEL branding, names, procedures, or scenario-specific internal conventions.

## Technical Direction
- Prefer Vite + React + TypeScript for a static frontend MVP.
- Mobile-first first, then tablet and desktop responsive states.
- Editable content/config for scenarios, vocabulary, and scoring.
- Use tests for core logic.
- Verify with npm test/lint/build and screenshots.

## Claude Workflow
- Use Opus/latest available model with max effort when delegated by Abel.
- Plan first before implementation.
- Use caveman mode: concise, no filler, exact changed files and verification output.
- Use Superpowers/engineering/frontend-design skills where relevant.
- Write implementation plans to `docs/plans/`.
