# Hotel Lobby Chaos Simulator

A mobile-first portfolio game about surviving a fictional German hotel front-desk Frühschicht.

You play the desk at **Hotel Ostseeblick**: guests arrive with realistic-but-fictional hospitality chaos, you choose German responses, and every answer affects satisfaction, composure, and the shift clock. The end screen turns the run into a Life-Patch-Notes-style shift report.

## Why this project exists

This is a personal portfolio piece for Abel: Indonesian in Germany, Front Office Ausbildung, German practice, and AI-assisted product/design workflow — not another generic to-do app.

## MVP features

- 12 hand-written fictional hotel scenarios
- German response choices with Indonesian explanations
- 180-second shift clock
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

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm test` | Run Vitest test suite once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run lint` | Run ESLint |
| `npm run build` | Type-check (`tsc -b`) and build production bundle |
| `npm run preview` | Serve production build locally |
| `npm run screenshots` | Capture mobile/desktop screenshots into `docs/screenshots/` |

## Privacy / domain boundary

All scenarios are fictional and use the made-up hotel name **Hotel Ostseeblick**. No TRIHOTEL branding, internal procedures, real guest data, or employer-sensitive details are included.
