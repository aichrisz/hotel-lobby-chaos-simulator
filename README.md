# Hotel Lobby Chaos Simulator

A mobile-first portfolio game about surviving fictional German hotel front-desk shifts: Frühschicht, compact Nachtschicht, or the optional two-encounter Mini-Schicht: Das Versprechen.

You play the desk at **Hotel Ostseeblick**: guests arrive with realistic-but-fictional hospitality chaos, you choose German responses, and every answer affects satisfaction, composure, and the 180-second shift clock. The end screen turns the run into a Life-Patch-Notes-style shift report.

## Why this project exists

This is a personal portfolio piece for Abel: Indonesian in Germany, Front Office Ausbildung, German practice, and AI-assisted product/design workflow — not another generic to-do app.

## Links

- Live demo: https://aichrisz.github.io/hotel-lobby-chaos-simulator/
- GitHub repo: https://github.com/aichrisz/hotel-lobby-chaos-simulator
- Written case study: [`docs/case-study.md`](docs/case-study.md)

## MVP features

- 12 hand-written Frühschicht scenarios + exactly 4 compact Nachtschicht scenarios
- optional Mini-Schicht: Das Versprechen, with two encounters for the same guest and two consequence paths
- German response choices with Indonesian explanations
- all modes reuse the 180-second clock and scoring rules
- satisfaction / composure / efficiency scoring
- German school grade report
- achievement unlock flavor
- mobile-first warm hotel-lobby visual direction
- no backend, no login, no runtime AI

## Tech stack

- Vite
- React
- TypeScript
- Tailwind CSS v4
- Vitest + Testing Library
- Playwright screenshots

## Run locally

```bash
npm install
npm run dev
```

## Verification

```bash
npm test
npm run lint
npm run build
npm run screenshots
```

If Node exposes experimental global Web Storage that conflicts with Vitest/jsdom, run tests with `NODE_OPTIONS=--no-experimental-webstorage npm test` to disable that Node global.

For the production browser regression check, after a build start `npm run preview -- --host 127.0.0.1`, then run:

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:4173/ node scripts/promise-smoke.mjs
```

The script checks all three initial choices at 390×844 and 320×740, the existing shifts on desktop, visible 44px buttons, overflow, and browser errors. Screenshots default to the OS temp directory (`hotel-promise-qa`); override it with `PROMISE_QA_OUTPUT_DIR=/path/to/output`. To select a system Chromium executable, optionally set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/path/to/chromium`.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm test` | Run Vitest test suite once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run lint` | Run ESLint |
| `npm run build` | Type-check (`tsc -b`) and build production bundle |
| `npm run preview` | Serve production build locally |
| `npm run screenshots` | Capture mobile/desktop Frühschicht and Nachtschicht screenshots into `docs/screenshots/` |
| `node scripts/promise-smoke.mjs` | Production browser regression for promise branches and existing modes |

## Privacy / domain boundary

All scenarios are fictional and use the made-up hotel name **Hotel Ostseeblick**. No TRIHOTEL branding, internal procedures, real guest data, or employer-sensitive details are included.
