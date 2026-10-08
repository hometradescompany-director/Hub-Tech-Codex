# V1 decision-centred population implementation plan

Goal: stage 1,000 originally named fictional humans with coherent, consequential decision memories in an inspectable offline population database.

Architecture: newly authored versioned scenario templates produce deterministic origins; the population is independent of operational Atlas data. SQLite stores identities, decision memories and generated relationships. Admission, world experience and authority stay with the owning world service.

Tech stack: Node.js 22 standard library and Python 3 sqlite3/gzip standard library; no installed packages.

Spec: ../../worlds/V1-POPULATION-DATABASE.md and the author's approved 7 October request for deeper decisions and at least 1,000 humans, including non-occupational lives.

Constraints: fabricated origins remain explicitly labelled; no copied private records, authority grants, invented source export or live agent activation. Reference date fixed at 2026-10-07. Current professional roster is unverified.

Review focus: repeated names; future/impossible chronology; empty or fabricated-as-experienced memories; random disconnected decisions; permission or source-lineage transfer.

## Task 1 — origin generator and validator

Files: src/v1-population.mjs, src/v1-life-scenarios.mjs, test/v1-population.test.mjs.
Interface: generatePopulation({count, seed}) -> cohort; validatePopulation(cohort) -> true or throws.

- [x] Write failing tests for unique names/IDs, deterministic repeatability, chronological linked decisions, diverse life patterns, isolated authority, and malformed population refusal.
- [x] Run tests and confirm failure before implementation.
- [x] Author constrained life scenarios and deterministic generator; retain alternatives, contemporaneous reasons, consequences, later interpretations and unresolved questions.
- [x] Run targeted tests and full npm test.

## Task 2 — populated database and receipt

Files: scripts/build-v1-population.mjs, scripts/v1-population-db.py, data/v1-population/*, docs/worlds/V1-POPULATION-DATABASE.md.
Interfaces: Node emits validated JSON; Python transactionally creates SQLite from JSON and emits deterministic gzip. SQLite has world-scoped identities and decision/relationship foreign keys.

- [x] Write failing build/import tests for bad cohort, existing-output protection and SQLite counts/foreign keys/provenance.
- [x] Implement offline build and atomic import with no activation path.
- [x] Populate 1,000 records; verify all rows, constraints, integrity and repeatable digests.
- [x] Record sample biographies, cohort coverage and known template limits; run npm test and npm run check.
- [ ] Review whole branch and publish a reviewable PR. Do not claim production connection.
