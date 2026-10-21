# Mobile simple/playful implementation plan

Approved by Abel: implement all six recommendations from the Astra audit: simplified start, encounter-first layout, relaxed learning default with optional timed challenge, interactive readable feedback, lighter report/navigation, and restrained playful polish. Alternatives and explicitly deferred features are NOT selected. Audit source is f230e870df38cd59bb09923e663c01d98e6891c2. No backend/auth/runtime AI, XP/streak, voice, dashboards, new packs or dependencies.

## Design

Keep Hotel Ostseeblick fictional and warm Nunito/Baloo visual identity, with dark night surroundings but readable opaque feedback surfaces. Primary entry “Mulai cerita singkat” starts the existing two-encounter promise mode in relaxed pacing. Optional shift picker retains all three packs; challenge pacing is a separate setting. Navigation/help Indonesian, authored dialogue/options German, language attributes explicit. Intro and controls explain simulation, not employer SOP.

Encounter layout: compact header/progress, guest dialogue (20–24px), essential context, three full-text responses >=16px. Shift statistics/log below or in native details, never above the decision. No new illustration library; one small native/CSS guest reaction and existing hotel humor suffices. Context help is not falsely called a literal translation. Preserve safety-critical facts in visible context.

Answer -> visible selected quote + short option-specific Indonesian reason + actual clamped deltas + optional full explanation/best response + Continue. No extra submit, forced gesture, autoplay audio or auto-advancing feedback. Final feedback in ALL modes precedes report. Guard duplicate submissions at the actual phase owner. Stable option display shuffle per run/encounter while retaining OptionId identity and promise routing; remove positional a/b/c references from rationale copy. Feedback/encounter/report heading focused and scrolled into view on transition; no clock announcements every second. Respect reduced motion.

Learning pacing: no wall-clock countdown or action-cost timeout; all cards can finish. Retain action cost data and satisfaction/composure. Learning report emphasizes completed/appropriate choices and a lesson; do not imply its score is comparable to competitive challenge. Challenge retains 180-second live tick + action costs; pauses during feedback/help/menus and hidden tab, with truthful explanation. Timeout without an answer reports reason without fictional feedback.

Report: lesson + small achievement, Main lagi/Coba pilihan lain and Pilih shift; optional complete scores/patch notes with readable wrapping labels, explain Note 1 best. Replay resets branch and phase. Leave/restart unfinished run requires confirmation/cancel retains state. No needless confirmation for ordinary answers or completed report.

## Files and ownership

Worker may change src/App.tsx, src/App.test.tsx, src/index.css, src/engine/shiftEngine.ts and .test.ts, src/content/lobbyScenarios.ts, src/content/nachtScenarios.ts, src/content/promiseScenarios.ts, src/content/lobbyScenarios.test.ts (content validation only), index.html, README.md, CLAUDE.md (current product facts only), scripts/promise-smoke.mjs, scripts/screenshots.mjs and a new scripts/mobile-smoke.mjs, plus this plan. A tiny src/content/feedback.ts and test may be added ONLY if needed for curated option-specific text; prefer integrating optional typed feedback into ResponseOption. No dependency/lockfile, deployment workflow, legacy quest/progression/persistence changes. No generic narrative engine or state framework.

## Execution

1. Trace full active engine/App/content/callers and retained tests. Save baseline test/lint/build receipt, then focused RED tests for pacing, final feedback, duplicate guard, shuffled ID routing and replay reset.
2. Implement pacing minimally in the existing state/engine with backward compatible default for existing engine callers; make UI choose relaxed explicitly. Retain challenge scoring invariants and completion for all old packs.
3. Implement one coherent encounter-first UI and curated non-positional option explanations. Reuse authored content, shorten only when meaning stays intact; report contradictory content rather than invent operational policies.
4. Update affected retained tests for intentional new defaults/labels/final-feedback behavior, preserving their real behavioral assertions. GREEN focused tests, then full NODE_OPTIONS=--no-experimental-webstorage npm test && npm run lint && npm run build. Try plain npm test first if this host no longer needs workaround; no unrelated persistence edits.
5. Production browser acceptance: 320x740,390x844,768px,1280px; all three modes, both promise consequences and A/B/C semantic choices despite shuffled position; report/replay/picker, confirmation cancel/accept; relaxed >=181s clock simulation plus all 12 best answers; challenge tick/action cost/pause/timeout. Assert final feedback, no duplicate answer, accurate clamped deltas, stable shuffled ordering on tick.
6. Geometry: CTA start visible without scroll; first response visible in opening/return mobile without a giant HUD; full response text and >=44px targets. No overlapping report labels, no horizontal overflow relative to requested viewport (not only innerWidth), no content clipped by sticky UI. Check 200% enlarged text/reflow, focus/keyboard, lang attributes, actual night incorrect-feedback contrast >=4.5 normal/3 large, reduced-motion transforms off. Capture viewport screenshots (not only long full-page images) including feedback/report. Browser emulation is not physical device or screen-reader speech proof.
7. Update README/script selectors and narrow product guidance. Self-review diff and keep clean scoped artifacts. Sol independently reviews/reruns affected gates, Astra #7 reviews using current bytes/evidence. Commit/push/release only after acceptance; worker may NOT commit/push/deploy.

## Evidence and stop criteria

Artifacts/reports/screenshots belong /root/.hermes/cache/scratch/hotel-mobile-upgrade/, not repo root. Do not claim a test based only on source reading. Write checkpoint after engine gate and after UI gate, recording actual commands/counts and unfinished criteria. Finish as complete package; if budget ends preserve partial work and enumerate exact residuals. Audit measured problems are references, not current pass receipts.
