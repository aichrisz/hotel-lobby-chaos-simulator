# Hotel Lobby Chaos Simulator — Portfolio Case Study

Live demo: https://aichrisz.github.io/hotel-lobby-chaos-simulator/
Repo: https://github.com/aichrisz/hotel-lobby-chaos-simulator

## Summary

Hotel Lobby Chaos Simulator is a mobile-first web game about surviving fictional German hotel front-desk shifts. The player chooses a compact Frühschicht or Nachtschicht, reads a guest situation, chooses a German response, and sees how the choice affects satisfaction, composure, and time.

The project exists because language learning apps often flatten the real problem. At a front desk, the challenge is not only vocabulary. It is timing, tone, pressure, and deciding what to say when the queue is already forming.

## My role

- product concept
- scenario design
- bilingual hospitality copy
- frontend implementation
- pure game/shift logic
- tests and build verification
- GitHub Pages deployment

## Context

I am Indonesian and currently doing hospitality/front-office Ausbildung in Germany. I wanted a portfolio project that did not feel like a tutorial clone. This project turns that real context into a fictional, safe, playable artifact.

All hotel details are fictional. The app uses **Hotel Ostseeblick**, not a real employer or real guest data.

## Problem

Most beginner portfolio apps are technically fine but forgettable. Most language-learning tools are useful but do not capture the feeling of front-office work.

The design question was:

> Can a small web game make German hospitality practice feel closer to an actual desk shift?

## Solution

A 3-minute compressed shift, with two selectable packs:

1. A guest arrives with a German line.
2. The player chooses from three German responses.
3. The app explains the result in Indonesian.
4. Satisfaction, composure, and the shift clock change.
5. The run ends with a patch-note-style Shift Report whose label and count come from the selected pack.

## Design principles

### Reception is triage, not perfection

The game does not ask the player to find a perfect sentence in isolation. Each response has tradeoffs: being polite, being fast, staying calm, and keeping the queue moving.

### Calm UI, chaotic content

The visual design uses warm hotel colors: cream, brass, dark wood, burgundy/coral. The interface stays composed while the guest situations are slightly absurd.

### Fictional but grounded

The scenarios feel like front-office work, but avoid real names, real guests, real hotel procedures, or employer-specific references.

## MVP scope

Included:

- 12 typed fictional Frühschicht scenarios
- exactly 4 typed fictional Nachtschicht scenarios
- 3 German answer choices per scenario
- satisfaction / composure / time effects
- 180-second shift clock
- the same scoring model for both shift modes
- immediate feedback panel
- German school grade style Shift Report
- achievement flavor
- mobile-first layout
- GitHub Pages deployment

Intentionally excluded:

- login
- backend
- runtime AI
- real hotel branding
- real guest data
- complex avatars/sprites

## Tech stack

- React
- TypeScript
- Vite
- Tailwind CSS v4
- Vitest + Testing Library
- Playwright screenshots
- GitHub Pages + GitHub Actions

## Engineering notes

The scenarios live as typed static data in `src/content/lobbyScenarios.ts` and `src/content/nachtScenarios.ts`.

The shift/game logic lives in pure functions in `src/engine/shiftEngine.ts`. It carries the selected pack through the run, so completion, efficiency, and report metadata do not rely on a hard-coded scenario count.

Verification currently covers:

- app render/start/feedback flow
- case study screen link
- Frühschicht and exactly four Nachtschicht data integrity
- scoring and shift completion logic
- build and lint
- screenshot generation

## Verification evidence

```text
npm test      → 9 files passed, 124 tests passed
npm run lint  → ESLint: No issues found
npm run build → passed
npm run screenshots → mobile-title, mobile-desk, mobile-night-desk (390×844), mobile-feedback, desktop-title
Browser smoke → Frühschicht and Nachtschicht at 390×844 and 1280×844; 0 console errors, no horizontal overflow, answer buttons focusable
```

## Outcome

The project is live and usable as a portfolio piece:

https://aichrisz.github.io/hotel-lobby-chaos-simulator/

It is small, specific, and personal. The value is not that it is a huge app. The value is that it connects product thinking, frontend implementation, hospitality context, German learning, testing, and deployment into one memorable artifact.

## Next steps

- add this case study to the main portfolio site
- add a few animated transition details
- polish desktop screenshots for portfolio use
- add a route-based URL for `/case-study` if the app grows
