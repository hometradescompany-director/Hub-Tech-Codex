# Cosmic Entry Implementation Plan

> For agentic workers: execute inline using superpowers:executing-plans and perform one independent whole-change review.

**Goal:** Turn the cosmic-event concept into a working read lens and codify the single-server activation boundary.
**Architecture:** Pure bounded event replay supplies atom/body/bond projections to semantic HTML. Shared entry validates destinations and separates projection access from server-issued sandbox admission. Atlas's existing HTTP entry gains discovery/readiness only.
**Tech Stack:** Node >=22, ES modules, HTML/CSS/JSON; Atlas TypeScript.
**Spec:** ../specs/2026-10-07-cosmic-entry-design.md

## Global constraints
Zero new Codex package dependencies. No private source copied to public. 5,000 objects/events maximum; 20,000 relationships maximum. Stable identity; no duplicated event truth. No deployment spend, secret distribution or agent activation without a verified target/authority.

## Review focus
Malformed/dangling event references; late arrivals versus occurrence time; cyclic/multiple containment; sandbox admission confused with navigation; runtime health confused with persistent agent readiness.

## Task 1 — event projection
Files: src/cosmic.mjs, data/cosmic-fixture.json, test/cosmic.test.mjs.
Interface: validateCosmic(packet), projectCosmic(packet,{at,knownAt}), eventMolecules(projection), descendants(projection,id).
- [ ] Introduce tests for identity conflicts, bounded references, late arrivals, supersession, explicit bonds and cycles; observe failure.
- [ ] Implement pure replay and a declared synthetic fixture; run entire suite and commit.

## Task 2 — shared entry and lens
Files: src/entry.mjs, test/entry.test.mjs, cosmic.html, cosmic.css, src/cosmic-app.mjs, scripts/serve.mjs, index.html, scripts/browser-smoke.cjs.
Interface: resolveEntry(descriptor) -> allowed/refused destination and authority standing; projection contract from Task 1.
- [ ] Write refusal/destination tests and browser acceptance for entry/replay/list/back/hostile labels; observe missing behavior.
- [ ] Implement a keyboard/touch lens with static twin greeting and source inspector; run tests/check/browser and commit.

## Task 3 — Atlas runtime and private coordination
Files in private Atlas: src/lib/runtime-discovery.ts, src/lib/runtime-discovery.test.ts, src/server.ts, docs/architecture/2026-10-07-single-runtime-cosmic-entry.md.
Files in private Foundry: docs/architecture/2026-10-07-cosmic-runtime-coordination.md.
- [ ] Write tests for non-admitting discovery, conservative readiness and methods; extend existing server after file reconciliation.
- [ ] Test targeted extension; publish private PR for full hosted suite/build and public lens PR for dependency-free checks.
- [ ] Independent review; correct important findings; record evidence, continuing paths and explicit host blockers. Merge only validated authorised changes.

## Ledger
Inspected canonical Causality Gundam v0.2.0 at Foundry becf591; all eight skills loaded. Atlas head752d71a already owns cosmos projection, authenticated orbit-event reads, capability gateway and server SSR entry. World Weaver dd567a6 has server-authoritative Xianxia session/action/replay slices1–5; later sandbox/agent admission remains separate. Atlas server file matches Lovable82d6930 exactly, allowing a narrow branch extension without overwriting newer project history.
Ruling: user authorises concept codification and implementation; preserve reviewable specs and continue inline rather than requesting repetitive stage approvals. Cost if wrong: branchable/reversible work only, no paid hosting or authority activation.

Review: calendar rollover and timezone-free replay were reproduced and corrected with strict UTC/calendar validation. Sandbox navigation remains refused until a server verification path exists; no client receipt is trusted.
