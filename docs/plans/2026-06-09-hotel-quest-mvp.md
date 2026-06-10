# Hotel Quest: Front Office RPG — MVP Implementation Plan

- **Date:** 2026-06-09
- **File:** `docs/plans/2026-06-09-hotel-quest-mvp.md`
- **Status:** Approved defaults from Abel — app name "Hotel Quest: Front Office RPG", anime RPG + cozy hotel guild style, progressive A2→B1 German, hybrid multiple-choice + typing, default + extra generic scenarios, text-only (no voice).
- **Skills/plugins verified for this work:** RTK (token-optimized CLI proxy; hook auto-rewrites shell commands — use commands normally), caveman mode (active for chat; plan/code/commits written normal per its boundaries), superpowers (brainstorming completed with Abel; this plan follows the writing-plans skill structure; TDD skill governs Phase 1–2), engineering skills (TDD RED/GREEN discipline below), frontend-design (applied in Phase 4 UI tasks).
- **Hard constraint:** Generic hotel content only. No TRIHOTEL branding, names, procedures, or internal conventions anywhere in code, content, or copy.

---

## 1. Goal

Mobile-first static web app where Abel practices German hotel front-office dialogue as an anime-RPG quest game: pick a quest from a guild board, play through a guest dialogue (multiple-choice + typing challenges), earn score/rank/XP, level up to unlock harder (B1) quests. Vite + React + TypeScript + Tailwind + Vitest. No backend; progress in `localStorage`.

## 2. Tech Stack & Decisions

| Decision | Choice | Reason |
|---|---|---|
| Build | Vite + React + TypeScript | Per CLAUDE.md technical direction |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) | Utility-first, `@theme` tokens for RPG palette |
| Tests | Vitest + @testing-library/react + @testing-library/user-event + jsdom | Standard Vite pairing |
| State | `useReducer` + React Context wrapping pure engine functions | 4 screens, linear flow; no router/zustand dependency needed |
| Routing | None (state-based screen switch: `title → board → play → results`) | Simplest thing that works for MVP |
| Fonts | `@fontsource-variable/baloo-2` (display) + `@fontsource-variable/nunito` (body) | Cozy rounded anime-guild feel, full Latin-ext (umlauts) |
| Screenshots | Playwright (devDependency) script | Repeatable verification at 3 viewports |
| Content | Typed TypeScript modules in `src/content/` | Editable, schema-validated by tests (CLAUDE.md: editable content/config) |

## 3. Directory Layout (target)

```
src/
  main.tsx
  App.tsx                      # screen switcher + providers
  index.css                    # tailwind import + @theme tokens + keyframes
  types/content.ts             # Scenario/DialogueStep/Choice/Vocab types
  content/
    scenarios/
      check-in-reservation.ts  # A2
      guest-questions.ts       # A2
      check-in-walk-in.ts      # A2
      check-out-payment.ts     # A2+
      phone-reservation.ts     # A2+
      complaint-room.ts        # B1
      index.ts                 # exports allScenarios: Scenario[]
    vocabulary.ts
    content.test.ts            # schema validation over all real content
  engine/
    answerMatch.ts / .test.ts  # German normalization + fuzzy typing evaluation
    scoring.ts / .test.ts      # points, streak, satisfaction, rank, XP
    questEngine.ts / .test.ts  # pure quest state machine
    progression.ts / .test.ts  # XP→level, difficulty unlocks
  store/
    gameStore.tsx              # reducer + context (thin wrapper over engine)
    persistence.ts / .test.ts  # localStorage save/load, versioned
  components/
    ui/Button.tsx, Panel.tsx, Meter.tsx, HeartMeter.tsx, Badge.tsx
    DialogueBubble.tsx, NamePlate.tsx
    ChoiceList.tsx / .test.tsx
    TypingChallenge.tsx / .test.tsx
    ScoreHud.tsx
    UmlautBar.tsx              # ä ö ü ß insert buttons for mobile keyboards
  screens/
    TitleScreen.tsx
    QuestBoard.tsx / .test.tsx
    QuestPlay.tsx / .test.tsx
    QuestResults.tsx
  test/
    setup.ts                   # jest-dom, localStorage mock helpers
    fixtures.ts                # tiny 2–3 step test scenario
scripts/screenshots.mjs
docs/screenshots/              # output artifacts
```

## 4. Content & Scenario Architecture

### 4.1 Schema (`src/types/content.ts`)

```ts
export type Difficulty = 'A2' | 'A2+' | 'B1';
export type GuestMood = 'friendly' | 'neutral' | 'stressed' | 'angry';

export interface Scenario {
  id: string;                 // kebab-case, unique
  title: string;              // EN/ID UI title
  titleDe: string;            // German quest title
  difficulty: Difficulty;
  setting: string;            // quest-board flavor text (EN)
  guest: { name: string; emoji: string; mood: GuestMood };
  steps: DialogueStep[];      // 6–8 per scenario
  xpReward: number;           // base XP
}

export type DialogueStep = ChoiceStep | TypingStep;

interface StepBase {
  id: string;                 // unique within scenario
  guestLine: string;          // German NPC line
  guestLineTranslation: string; // EN gloss (toggleable in UI)
  hint?: string;              // optional, one per step
}

export interface ChoiceStep extends StepBase {
  kind: 'choice';
  choices: Choice[];          // 3–4 options, EXACTLY one correct
}

export interface Choice {
  text: string;               // German response
  correct: boolean;
  feedback: string;           // why right/wrong (EN, may mix ID)
}

export interface TypingStep extends StepBase {
  kind: 'typing';
  prompt: string;             // instruction, e.g. "Ask for the guest's reservation name"
  acceptedAnswers: string[];  // ≥1 canonical German answers
  keywords?: string[];        // partial-credit keywords (normalized substring match)
}

export interface VocabEntry {
  de: string; en: string; id?: string;
  category: 'Begrüßung' | 'Check-in' | 'Zahlung' | 'Beschwerde' | 'Auskunft';
  scenarioIds: string[];
}
```

### 4.2 Scenario set (all generic hotel, formal *Sie* register)

| id | Difficulty | Topic | Step mix |
|---|---|---|---|
| `check-in-reservation` | A2 | Greeting, find reservation, Meldeschein/ID, key card, breakfast/WiFi info | 5 choice / 2 typing |
| `guest-questions` | A2 | Breakfast times, directions to station, luggage storage, taxi | 4 choice / 2 typing |
| `check-in-walk-in` | A2 | Availability, room type, price, nights, payment method | 4 choice / 3 typing |
| `check-out-payment` | A2+ | Bill, minibar, card payment, receipt (Rechnung), farewell | 4 choice / 3 typing |
| `phone-reservation` | A2+ | Phone greeting, dates, room type, spelling names, confirmation email | 3 choice / 4 typing |
| `complaint-room` | B1 | Apology, heating broken + noise, offer solutions, room change, compensation | 3 choice / 5 typing |

Difficulty progression: A2 = mostly choice, short typing; B1 = typing-heavy, longer sentences, complaint-handling phrases.

### 4.3 Scoring constants (pinned by tests — single source `src/engine/scoring.ts`)

```ts
CHOICE_POINTS   = { firstTry: 100, secondTry: 50, laterTry: 25 }
TYPING_POINTS   = { perfect: 150, close: 100, partial: 50, wrong: 0 }
TYPING_MAX_ATTEMPTS = 2          // then reveal answer, score 0, advance
HINT_PENALTY    = 25             // per step, floor 0; does not reset streak
STREAK_THRESHOLD = 3             // consecutive first-try successes
STREAK_MULTIPLIER = 1.5          // applied to step points while streak ≥ 3
SATISFACTION    = { start: 100, wrongChoice: -15, wrongTyping: -10, hint: -5, floor: 0 }
RANKS: pct = min(1, score/maxScore)  // maxScore = Σ(choice:100, typing:150)
  S ≥ 0.95, A ≥ 0.85, B ≥ 0.70, C ≥ 0.50, else D
XP_MULT = { S: 1.5, A: 1.25, B: 1.0, C: 0.75, D: 0.5 }  // xpGain = round(xpReward × mult), every run
LEVEL_THRESHOLDS = [0, 150, 350, 600, 900, 1250, 1650, 2100]  // levels 1–8
UNLOCKS = { 'A2': level 1, 'A2+': level 2, 'B1': level 4 }
xpReward: A2 = 100, A2+ = 150, B1 = 200
```

### 4.4 Typing normalization spec (`answerMatch.ts`)

1. Unicode NFC → lowercase → map `ä→ae, ö→oe, ü→ue, ß→ss` (both user input and accepted answers) → strip punctuation `.,!?;:'"„“”‚‘’()-–—` to spaces → collapse whitespace → trim.
2. Levenshtein distance vs. best of `acceptedAnswers`. Tolerance by normalized answer length: `≤5 → 0`, `6–12 → 1`, `13–24 → 2`, `≥25 → 3`.
3. Verdict order: `perfect` (distance 0) → `close` (≤ tolerance) → `partial` (all `keywords` present as substrings) → `wrong`.

---

## 5. Tasks

Each task: do the steps, run the verify command, then commit with the given message. Never commit with failing tests/lint. RTK hook rewrites shell commands automatically — just run them.

### Phase 0 — Scaffold & Tooling

**Task 0.1 — Scaffold Vite app**
- Repo root is non-empty: scaffold into temp dir, move into root:
  `npm create vite@latest tmp-scaffold -- --template react-ts && cp -r tmp-scaffold/. . && rm -rf tmp-scaffold` (do not overwrite existing `README.md`/`CLAUDE.md` — restore them if clobbered).
- Delete template demo: `src/App.css`, `src/assets/react.svg`, counter code in `App.tsx`; replace with `<h1>Hotel Quest</h1>` placeholder. Set `<title>Hotel Quest: Front Office RPG</title>` and `lang="de"`→keep `en`, `viewport-fit=cover` in `index.html`.
- Verify: `npm install && npm run build` succeeds, `npm run dev` serves placeholder.
- Commit: `chore: scaffold Vite + React + TypeScript app`

**Task 0.2 — Tailwind v4 + theme + fonts**
- `npm install tailwindcss @tailwindcss/vite @fontsource-variable/baloo-2 @fontsource-variable/nunito`
- Add `tailwindcss()` plugin to `vite.config.ts`. Rewrite `src/index.css`: `@import "tailwindcss";` + `@theme` tokens — parchment `#f6edd9`, panel cream `#fffaf0`, ink `#3b2f2f`, guild gold `#d4a017`, night blue `#2c3e66`, heart red `#e25563`, success green `#4caf7d`, danger `#d9534f`; font tokens `--font-display`, `--font-body`; keyframes `shake`, `sparkle-pop`, `level-up` with `@media (prefers-reduced-motion: reduce)` overrides.
- Verify: `npm run dev` shows themed placeholder; `npm run build` passes.
- Commit: `chore: add Tailwind v4 theme tokens and fonts`

**Task 0.3 — Vitest + RTL + lint wiring**
- `npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom`
- `vite.config.ts`: add `test: { environment: 'jsdom', setupFiles: './src/test/setup.ts', globals: true }` (use `defineConfig` from `vitest/config`). Create `src/test/setup.ts` importing `@testing-library/jest-dom/vitest`.
- `package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"` (keep template `lint`, `build`, `dev`, `preview`).
- Smoke test `src/App.test.tsx`: renders heading "Hotel Quest".
- Update `CLAUDE.md` Commands section with real scripts (per its own instruction).
- Verify: `npm test && npm run lint && npm run build` all pass.
- Commit: `chore: add Vitest + Testing Library setup and update CLAUDE.md commands`

### Phase 1 — Types & Content Schema (TDD)

**Task 1.1 — Content types, fixtures, validation tests**
- Create `src/types/content.ts` (schema from §4.1), `src/test/fixtures.ts` (mini scenario: 1 choice step + 1 typing step + 1 hinted choice step), `src/content/scenarios/index.ts` exporting `allScenarios` (initially just one real scenario stub: `check-in-reservation` with 2 steps).
- **RED** — `src/content/content.test.ts`, tests over `allScenarios` + fixtures:
  - all scenario ids unique; all step ids unique within scenario
  - every scenario has ≥1 step; `xpReward > 0`; difficulty in `['A2','A2+','B1']`
  - every choice step has 3–4 choices with exactly one `correct: true`, all `feedback` non-empty
  - every typing step has ≥1 non-empty `acceptedAnswers`; if `keywords` present, non-empty strings
  - every step has non-empty `guestLine` and `guestLineTranslation`
  - Write one deliberately failing expectation first (e.g. stub scenario missing translation), see it fail.
- **GREEN** — fix stub content until pass.
- Verify: `npm test`
- Commit: `feat: add content schema types and scenario validation tests`

### Phase 2 — Engine (strict TDD: write failing tests, see RED, implement, see GREEN)

**Task 2.1 — `answerMatch.ts`**
- **RED** — `src/engine/answerMatch.test.ts`:
  - `normalizeGerman`: lowercases; trims/collapses spaces; `"Möchten Sie frühstücken?"` → `"moechten sie fruehstuecken"`; `ß→ss`; strips punctuation incl. German quotes; NFC handling (composed vs decomposed `ü` equal)
  - `levenshtein`: identity=0; `("haus","maus")`=1; empty-vs-word=length
  - `evaluateTyping`: exact match → `perfect`; user types `"moechte"` for answer with `"möchte"` → `perfect`; 1 typo in 10-char answer → `close`; 1 typo in 5-char answer → `wrong` (tolerance 0); all keywords present but sentence different → `partial`; garbage → `wrong`; best-of multiple `acceptedAnswers` used
- **GREEN** — implement `normalizeGerman`, `levenshtein` (classic DP), `evaluateTyping(input, step): 'perfect'|'close'|'partial'|'wrong'`.
- Verify: `npm test` — Commit: `feat: add German answer normalization and fuzzy typing evaluation (TDD)`

**Task 2.2 — `scoring.ts`**
- **RED** — `src/engine/scoring.test.ts` pinning §4.3 exactly:
  - `scoreChoice(attempt)`: 1→100, 2→50, 3→25, 7→25
  - `scoreTyping(verdict)`: perfect→150, close→100, partial→50, wrong→0
  - `applyHint(points)`: 100→75; 10→0 (floor)
  - streak: helper `withStreak(points, streak)` — streak 2→×1, streak 3→×1.5 (100→150, rounded)
  - `satisfactionAfter(current, event)`: wrongChoice 100→85, wrongTyping→−10, hint→−5, floors at 0; `heartsFor(satisfaction)`: 100→5, 41→3, 0→0
  - `rankFor(score, maxScore)`: boundaries 0.95/0.85/0.70/0.50; pct capped at 1.0 when streak pushes score over max
  - `xpFor(xpReward, rank)`: (100,'S')→150, (200,'D')→100
- **GREEN** — implement as pure functions + exported constants.
- Verify: `npm test` — Commit: `feat: add scoring engine with streaks, satisfaction, ranks, XP (TDD)`

**Task 2.3 — `questEngine.ts`**
- **RED** — `src/engine/questEngine.test.ts` using fixture scenario:
  - `startQuest(scenario)`: stepIndex 0, score 0, streak 0, satisfaction 100, status `'active'`, `maxScore` = Σ step maxima
  - `submitChoice` correct first try: +100, streak+1, advances stepIndex, logs `StepResult { stepId, attempts, points, verdict }`
  - `submitChoice` wrong: stays on step, attempts+1, satisfaction −15, streak reset to 0, outcome carries chosen choice's `feedback`; then correct on attempt 2 → +50
  - `useHint`: marks hint used (idempotent), satisfaction −5 once; later correct first-try scores 100−25=75; hint does NOT reset streak
  - `submitTyping`: perfect → +150 & advance; wrong first attempt → stay, attempts 1, satisfaction −10; wrong second attempt → score 0, `revealedAnswer` set, advance
  - streak ≥3 multiplies subsequent step points (build streak over 3 fixture steps, assert 4th-step points ×1.5)
  - last step completion → status `'complete'`, result summary `{ score, maxScore, rank, satisfaction, xpGain, log }`
  - engine is pure: same inputs → same outputs; no Date/random
- **GREEN** — implement `startQuest`, `submitChoice(state, scenario, choiceIndex)`, `submitTyping(state, scenario, text)`, `useHint(state)` returning `{ state, outcome }`.
- Verify: `npm test` — Commit: `feat: add pure quest state machine engine (TDD)`

**Task 2.4 — `progression.ts`**
- **RED** — `src/engine/progression.test.ts`: `levelForXp`: 0→1, 149→1, 150→2, 2100→8, 99999→8 (cap); `unlockedDifficulties(level)`: 1→[A2], 2→[A2,A2+], 4→all; `isScenarioUnlocked(scenario, xp)` boundary cases.
- **GREEN** — implement with `LEVEL_THRESHOLDS`/`UNLOCKS` from §4.3.
- Verify: `npm test` — Commit: `feat: add XP level progression and difficulty unlocks (TDD)`

**Task 2.5 — `persistence.ts`**
- **RED** — `src/store/persistence.test.ts` (mock `localStorage` in setup):
  - `loadProfile()` with empty storage → default `{ version: 1, xp: 0, completions: {}, settings: { showTranslations: true } }`
  - save→load roundtrip preserves data
  - corrupt JSON / wrong version → default profile (no throw)
  - `recordCompletion(profile, scenarioId, { rank, score, xpGain })`: adds xp, increments runs, keeps best rank/score (S beats A; higher score kept)
- **GREEN** — implement with key `hotel-quest-save-v1`, try/catch everywhere.
- Verify: `npm test` — Commit: `feat: add versioned localStorage profile persistence (TDD)`

### Phase 3 — Content Authoring

**Task 3.1 — Three A2 scenarios + vocabulary**
- Write full `check-in-reservation.ts`, `guest-questions.ts`, `check-in-walk-in.ts` (6–8 steps each per §4.2 mix), `vocabulary.ts` (~40 entries across 5 categories). German: formal Sie, natural hotel register, A2-level sentence length. Plausible distractors (wrong register/du-form, wrong word, impolite) with teaching feedback.
- Content validation tests from Task 1.1 must pass unchanged (they run over `allScenarios`).
- Verify: `npm test` — Commit: `feat: add A2 scenarios (check-in, guest questions, walk-in) and vocabulary`

**Task 3.2 — A2+ and B1 scenarios**
- Write `check-out-payment.ts`, `phone-reservation.ts`, `complaint-room.ts`. B1 complaint: Konjunktiv II politeness (`Ich würde Ihnen gerne…`, `Könnten Sie…`), apology + solution structure.
- Verify: `npm test` — Commit: `feat: add A2+ and B1 scenarios (check-out, phone reservation, complaint)`

### Phase 4 — UI (frontend-design skill applies: cozy anime-guild, generous whitespace, chunky borders, layered panels — not generic Bootstrap-look)

**Task 4.1 — UI primitives**
- `components/ui/`: `Button` (variants: primary gold / ghost / danger; min-height 48px), `Panel` (cream card, 2px ink border, rounded-2xl, soft shadow), `Meter` (labeled progress bar), `HeartMeter` (5 hearts from satisfaction), `Badge` (difficulty pill: A2 green / A2+ gold / B1 red), `NamePlate`.
- Light render tests in `src/components/ui/ui.test.tsx` (variant classes, disabled state).
- Verify: `npm test && npm run lint` — Commit: `feat: add RPG UI primitives`

**Task 4.2 — Game store + app shell**
- `store/gameStore.tsx`: reducer with screens `'title' | 'board' | 'play' | 'results'`; actions `START`, `SELECT_QUEST`, `SUBMIT_CHOICE`, `SUBMIT_TYPING`, `USE_HINT`, `FINISH_QUEST`, `TOGGLE_TRANSLATIONS`, `BACK_TO_BOARD`. Reducer delegates to engine functions; profile loaded on init, `recordCompletion` + save on quest finish.
- `App.tsx` switches screens inside `min-h-dvh` parchment background with safe-area padding.
- Reducer test `gameStore.test.tsx`: full action sequence title→board→play→results updates profile XP.
- Verify: `npm test` — Commit: `feat: add game store and screen shell`

**Task 4.3 — Title screen**
- Logo type treatment ("Hotel Quest" display font + "Front Office RPG" subtitle), guild-door vibe, `Start` button → board; shows current level + XP if save exists ("Continue, Level 3 Rezeptionist").
- Verify: `npm test && npm run dev` (manual look) — Commit: `feat: add title screen`

**Task 4.4 — Quest Board**
- Guild noticeboard: heading + player HUD strip (level, XP `Meter` to next level), quest poster cards (`Panel`): titleDe + title, difficulty `Badge`, setting text, best rank stamp if completed, lock state with "Erreiche Level 2/4" label.
- `QuestBoard.test.tsx`: locked scenario not clickable; unlocked dispatches `SELECT_QUEST`; rank shown from profile.
- Verify: `npm test` — Commit: `feat: add quest board with locks and best ranks`

**Task 4.5 — Quest Play: choice flow**
- `QuestPlay.tsx` layout (mobile-first): top = `ScoreHud` (hearts, streak flame ×N, step `3/7` progress); middle = guest `NamePlate` + emoji avatar + `DialogueBubble` (German line, translation toggle button 🌐); bottom = answer area (thumb zone).
- `ChoiceList`: stacked full-width buttons; wrong pick → shake animation, button marked red + feedback panel shown, retry remaining options; correct → green + "Treffer! +100" toast, `Weiter` button advances. Hint button (💡) reveals hint, applies penalty.
- `ChoiceList.test.tsx` + `QuestPlay.test.tsx` (choice path): wrong→feedback→retry→correct→advance; hint shows text once.
- Verify: `npm test` — Commit: `feat: add quest play with multiple-choice battle flow`

**Task 4.6 — Quest Play: typing flow**
- `TypingChallenge`: prompt text, `<input>` with `autocapitalize="off" autocorrect="off" spellcheck={false} lang="de" enterkeyhint="send"`, `UmlautBar` (ä ö ü ß buttons insert at cursor, keep focus), submit button + Enter submits. Verdict UI: perfect "Perfekt! +150", close "Fast! +100" showing canonical answer, partial +50 with answer, wrong → 1 retry, then reveal `acceptedAnswers[0]` and advance with 0.
- On input focus, `scrollIntoView({ block: 'center' })` so the on-screen keyboard never covers it.
- `TypingChallenge.test.tsx`: umlaut button inserts char; close-match accepted; two wrongs reveal answer and advance.
- Verify: `npm test` — Commit: `feat: add typing challenge with umlaut bar and fuzzy grading`

**Task 4.7 — Results screen + persistence wiring**
- `QuestResults.tsx`: big anime rank letter (S gold sparkle animation), score/maxScore, hearts left, `+XP` count-up, level-up banner when threshold crossed, mistake review list (each non-first-try step: guest line + correct answer), buttons `Nochmal` (retry) / `Zur Questtafel`.
- Integration test `QuestPlay.test.tsx` (extend): play entire fixture scenario through store → results render rank + XP, profile persisted (mock localStorage assert).
- Verify: `npm test` — Commit: `feat: add results screen with rank, XP gain, and mistake review`

### Phase 5 — Responsive Polish & Verification

**Task 5.1 — Responsive pass (acceptance criteria §6)**
- Apply `sm:`/`md:`/`lg:` refinements: board grid 1→2→3 columns; play screen `max-w-xl` centered on md+, decorative guild-pattern background visible on lg; hover/focus-visible states.
- Verify manually in dev tools at 390×844, 768×1024, 1440×900 against §6 checklist.
- Commit: `feat: responsive tablet and desktop layouts`

**Task 5.2 — Screenshot script + final verification**
- `npm install -D playwright` and `npx playwright install chromium`.
- `scripts/screenshots.mjs`: launch chromium against `vite preview` (port 4173); for each viewport `{390×844, 768×1024, 1440×900}` capture `title`, `board`, `play-choice`, `play-typing` (drive via clicks), `results` → `docs/screenshots/<screen>-<width>.png`.
- Run full gate (§7). Fix anything failing. Update `README.md` (what it is, how to run) and confirm `CLAUDE.md` Commands accurate.
- Commit: `chore: add screenshot script, final verification artifacts, docs`

---

## 6. Responsive Acceptance Criteria

**Mobile 390×844 (primary — must all pass):**
- No horizontal scroll on any screen; content respects safe-area insets (`viewport-fit=cover` + `env(safe-area-inset-*)` padding).
- Answer area (choices/typing input) in bottom half — thumb-reachable; all tap targets ≥ 44×44px; dialogue/body text ≥ 16px (prevents iOS zoom on input focus).
- HUD fits one compact row; quest board single column; typing input never hidden behind on-screen keyboard.

**Tablet 768×1024:**
- Quest board 2-column grid; play screen centered `max-w-xl` panel, larger avatar/dialogue; title screen art scales without stretching.

**Desktop 1440×900:**
- Quest board 3-column grid with page gutter; play screen centered with decorative guild background visible at sides; hover states on all buttons; keyboard play fully works (Tab/Enter, focus-visible rings).

**All sizes:** `min-h-dvh` layout (no `100vh` mobile bugs); `prefers-reduced-motion` disables shake/sparkle/level-up animations; WCAG AA contrast for ink-on-parchment and button text; every input/button has accessible name.

## 7. Verification Commands (run after each phase; full gate before final commit)

```bash
npm test                     # vitest run — all green
npm run lint                 # eslint — zero errors
npm run build                # tsc -b && vite build — production build passes
npm run preview &            # serve dist on :4173
node scripts/screenshots.mjs # writes docs/screenshots/*.png at 390/768/1440
```

Inspect screenshots against §6 before declaring done.

## 8. Commit Instructions

- Work directly on `master` (greenfield repo, solo). Conventional Commits as given per task.
- One commit per task; run `npm test && npm run lint` before every commit; never commit RED state (tests-first commits land together with their GREEN implementation in the task commit).
- Commit messages/code in normal English (caveman mode excludes code/commits).
- Final commit includes `docs/screenshots/` artifacts and this plan file.

## 9. Out of Scope (MVP)

Voice/audio (confirmed not MVP), backend/accounts/sync, spaced-repetition system, PWA/offline manifest, i18n framework (strings inline), react-router/deep links, leaderboards, any TRIHOTEL-specific content.

## 10. Risks & Mitigations

- **German content quality:** keep sentences short A2-canonical; complaint scenario reviewed against standard B1 phrasebook patterns; content is data-only → easy to edit without code changes.
- **Fuzzy matching too strict/lenient:** tolerances pinned in tests; tune constants in one place (`answerMatch.ts`) with tests updated deliberately.
- **Mobile keyboard overlap:** mitigated by bottom-anchored input + `scrollIntoView` + manual 390px verification (§6).
- **Scope creep in UI polish:** primitives first (Task 4.1), animations limited to three keyframes; Vocab Codex screen deferred unless MVP lands early.
