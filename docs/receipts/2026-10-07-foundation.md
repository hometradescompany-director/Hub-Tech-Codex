# Foundation verification receipt — 7 October 2026

## Scope
Hub Tech Codex environment v0: a shared identity graph, reciprocal relationships, three projections, bounded public GitHub observations, and an inert local Diamond inventory proof. Fifteen continuing paths have explicit branch names, dependencies, scope and acceptance criteria. Branches are intended to start from the merged foundation; their names do not claim implementation or connected services.

## Evidence
- `npm test`: 25 offline tests passed, zero failures (Node.js 24.19.0).
- `npm run check`: graph, development paths and JavaScript syntax validated.
- `node scripts/browser-smoke.cjs`: Chromium desktop 1440×1000 and mobile 390×844 checks passed. Selection, fixture proof/refusal, search, lens/back restoration, invalid-source refusal, successful mocked source import, hostile text rendered inertly, reciprocal traversal, no page errors and no mobile horizontal overflow.
- Desktop/mobile screenshots visually inspected. Dense mobile constellation labels can overlap; directory and within-hub lenses provide readable alternatives. Further responsive graph layout belongs to the surface-navigation path.
- Public CLI observation of `hometradescompany-director/Hub-Tech-Codex` succeeded at `2026-10-07T02:19:43.208Z`, revision `d7628803d7151a3412fb188f53614e46599d5797`, licence declared `Apache-2.0`. This is a historical metadata observation, not current source content or permission.
- Independent whole-foundation review identified two important gaps: non-JSON media types were accepted, and a seed node claimed observed standing without timed evidence. Both corrected. Media-type regression failed before the fix and passed afterward; seed standing is declared.

## Limits
Browser source success uses an intercepted public API fixture, not a live browser network request; the CLI provided the live public read. Playwright/Chromium are operator verification tools, not application dependencies. Observations and navigation are session-local. Diamond proof is a local simulation: no packages are installed or executed, no vulnerabilities inferred, and no remote authority granted. No live Atlas, Swarm, Lovable or database transport is activated. Deployment is outside this foundation slice.

## Reproduce
Run `npm test` and `npm run check`. For optional browser verification install Playwright in the operator environment, then run `node scripts/browser-smoke.cjs`. The smoke starts/stops its server; `PLAYWRIGHT_CHROMIUM_EXECUTABLE` can select an installed Chromium executable. Start normal exploration with `npm start`.

Hosted CI and merge outcomes are recorded in the foundation pull request and GitHub Actions, rather than predicted in this pre-publication receipt.
