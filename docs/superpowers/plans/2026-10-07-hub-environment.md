# Hub Environment Implementation Plan

> For agentic workers: use superpowers:executing-plans inline; preserve this approved scope and complete one whole-branch review.

**Goal:** Deliver the first traversable GitHub-grounded Hub Tech Codex environment and its continuing branch topology.

**Architecture:** Pure graph/navigation modules drive a dependency-free web explorer. A public metadata adapter adds observations; a local dependency inventory and simulated authority gate demonstrate the Diamond boundary. No foreign registries or execution hosts are created.

**Tech Stack:** Node.js >=22, JavaScript ES modules, semantic HTML, CSS, JSON.

**Spec:** ../specs/2026-10-07-hub-environment-design.md

## Global Constraints
Node.js >=22; zero runtime/package dependencies. Public GitHub only; no credentials in browser. Discovery is not permission. No proprietary source copying. No live Diamond/Atlas transport claim.

## Review Focus
- Cyclic/multiple-parent relationships must remain navigable without recursion overflow.
- Hostile imported text/URLs must not execute or exfiltrate credentials.
- GitHub errors/rate limits must not masquerade as empty repositories or healthy standing.
- Failed authority, expired windows and unsupported operations must prevent inventory work.
- Reload/back/filter changes must preserve identities and make stale fixture standing explicit.

## Task 1: Graph and navigation
Files: src/graph.mjs, src/navigation.mjs, test/graph.test.mjs, data/constellation.json.
Interfaces: validateGraph(graph), related(graph,id), walk(graph,id,{limit}), searchNodes(graph,query,kind), createNavigation(initial), navigate(state,patch), goBack(state).
- [x] Write failing tests for duplicate/dangling IDs, cycles, reciprocal discovery, search and context restoration; node --test must fail before implementation.
- [x] Implement bounded pure functions, valid seed graph and validate; run node --test; commit.

## Task 2: Source observation and Diamond proof
Files: src/github.mjs, src/diamond.mjs, test/github.test.mjs, test/diamond.test.mjs, scripts/discover.mjs.
Interfaces: parseRepository(input), observeRepository(input,{fetchImpl,now}), reviewInventory({target,operation,manifest,now}), deterministic receipt keyed by input.
- [x] Write failing tests for unsafe hosts/private/malformed responses/rate limit, denied/expired scope and inert dependency parsing.
- [x] Implement fixed-host GET and bounded input/response handling, explicit provenance/licence unknowns and local proof; tests pass; commit.

## Task 3: Inhabitable surfaces
Files: index.html, styles.css, src/app.mjs, scripts/serve.mjs, test/ui-smoke.mjs.
Consumes validated graph/navigation/source/proof interfaces; produces three shared-identity views, source inspector, roadmap and receipt inspector.
- [x] Establish smoke cases and run against missing UI before implementing.
- [x] Build accessible desktop/mobile environment; verify browser smoke, run entire Node suite; commit.

## Task 4: Branch topology and release
Files: data/development-paths.json, docs/ROADMAP.md, AGENTS.md, README.md, .github/workflows/ci.yml, docs/receipts/2026-10-07-foundation.md.
- [x] Validate branch dependency DAG and local asset references with tests.
- [x] Review whole change and fix reproduced important findings.
- [ ] Push connector commit, open PR, verify hosted checks, merge authorised foundation and create named continuing branches from final baseline.

## Execution ledger
Starting repository contains README and Apache-2.0 LICENSE only; no baseline application tests existed. Fresh dedicated clone on feat/hub-environment-v0 isolates work. User's instruction to fill the repository and keep branching authorises publishing this baseline and refs; no separate infrastructure publishing/spend implied.

Graph/source/proof/surface/path tests were introduced before their implementations; missing-module/missing-surface failures were observed, then corrected. Final local suite: 25 passed. Browser smoke passed desktop/mobile with hostile mocked import and reciprocal traversal. Review corrections and limits are recorded in docs/receipts/2026-10-07-foundation.md. Publication checklist remains open until hosted evidence exists.
