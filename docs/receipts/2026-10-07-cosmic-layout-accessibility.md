# Cosmic layout and main landmarks

Scope: public Hub-Tech-Codex Cosmic renderer, based on main `ef3e3090268abe5f1a316164ed8668f562ff2e76`. Verification observed on 7 October 2026 UTC. This continues the immersive shell and addresses its landscape HUD and main-landmark review findings.

## Changes

The renderer measures the scene, navigation controls and body buttons before positioning. One vertical transform keeps bodies, atoms and SVG relationship endpoints below the actual HUD while reserving full button height. Hidden scenes retain finite coordinates until entry; resize recalculates the visible projection.

Scenes shorter than 420 CSS pixels show the focus and its direct children, using the existing one-scale navigation model. Measured columns separate their full-size targets. This avoids the Universe/Domain hubs overlap introduced by compressing the entire hierarchy into a short scene. Descend and Back retain their existing identity and history behavior.

The launcher and world each own a `main` element, with only the current one visible. The source footer is a normal container. The world resets the generic main width/margin/padding so its full-viewport layout survives the landmark correction.

## Observed checks

- `npm test`: 56 passing tests, zero failures or skips. Eight layout cases cover measured HUD height, complete button bounds, shared coordinate mapping, hidden scenes and compact column placement. The new cases were observed failing before implementation.
- `npm run check`: graph, development paths and JavaScript syntax pass.
- `git diff --check` and `node --check scripts/cosmic-shell-smoke.cjs`: pass.
- HTML parsing confirms one launcher main and one initially hidden world main, with no footer main.
- Local server reads return HTTP 200 for the Cosmic page, stylesheet and new layout module with the expected content types.
- Independent whole-change review caught the initial compressed-target overlap. Review of the revised column layout found no remaining critical or important issues within this scope and independently reran the eight layout cases and whitespace check. This was source and numerical review, not browser acceptance.

## Browser verification still required

The optional Cosmic shell smoke checks visible main landmarks, complete body bounds below the HUD, each sphere centre receiving its own clicks, Universe inspection, exit focus and re-entry. Viewports are 844×390, 390×844, 1440×1000 and 1920×1080.

That smoke did not run here: the installed Playwright package has no Chromium executable, the attempted browser download failed, and the cloud browser cannot reach the local development server. Numerical tests and source review do not replace browser rendering or accessibility-tree verification. Run the smoke with an available browser before merge. Extremely small scenes and general constellation density are not certified by these checks.

No new application dependency, live data connection, agent admission or private Atlas source is introduced.
