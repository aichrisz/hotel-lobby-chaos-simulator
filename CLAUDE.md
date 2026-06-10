# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Project: Front Office RPG Simulator

## Goal
Build a mobile-first gaming-themed German hotel reception practice web app. It should help Abel practice generic hotel front-office interactions without TRIHOTEL-specific scenarios.

## Repository State
Greenfield: no application code or package.json yet — only this file, README.md, and an empty `docs/plans/` directory. The first implementation step is scaffolding the Vite + React + TypeScript app at the repo root. Update the Commands section below with the real scripts once scaffolding lands.

## Commands
None yet (no package.json). After scaffolding, standard Vite scripts are expected: `npm run dev`, `npm run build`, `npm test`, `npm run lint`.

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
