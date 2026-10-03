# Mini-Schicht: Das Versprechen

## Approved design

Add an opt-in `promise` mode with exactly two encounters involving the same fictional returning guest. The first response routes to one of two authored follow-up cards: a limited, verifiable commitment leads to a manageable return; an unverified guarantee or dismissal leads to an upset return. Reuse the existing shift clock, scoring, feedback, and report. Show the mini-shift's final feedback before its report. Keep Frühschicht and Nachtschicht behavior unchanged.

All content is fictional. No real guest data, employer procedures, backend, runtime AI, dependencies, or generic branching framework.

## Implementation and verification

1. Add focused pure-engine tests for all three initial choices, both branches, exactly two answers/report count, old modes, restart, exhausted clock, and invalid/done guards; add the app lifecycle test.
2. Run focused tests and record the expected RED failure before implementation.
3. Add typed mini-shift content and the smallest explicit choice-to-follow-up mapping in `chooseOption`; add the opt-in title entry, promise-only encounter label, and promise-only final-feedback gate.
4. Run `NODE_OPTIONS=--no-experimental-webstorage npm test`, `npm run lint`, and `npm run build`.
5. Exercise production preview at 390x844, 320x740, and desktop for both promise paths and the existing modes; verify lifecycle overflow, visible button targets, and console/page errors. Set `PROMISE_QA_OUTPUT_DIR` to choose screenshot output; the script defaults to the OS temp directory.
6. Update README narrowly, then review `git diff --check` and the complete diff. No commit, push, deploy, or merge.
