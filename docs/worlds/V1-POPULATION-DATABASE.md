# V1 population database — design for review

Standing: proposed design, not a deployed database or imported population. Origin: Jarrod Cobb, 7 October 2026, Brisbane. Scope: arrange independent V1 identities derived from existing professional templates, with generated Earth-life context and separately recorded V1 experience.

## Decision

Use a versioned copy into the owning world service. A live reference would couple V1 development to hub changes; copying the entire operational database would transfer irrelevant memories and permissions. Copy approved descriptive template fields only. Hub and V1 identities share source lineage, not mutable state or authority. The public Codex holds this newly authored contract; private source rows, prompts and credentials remain with their owners.

## Records

| Record | Required fields and constraints |
| --- | --- |
| source_import | import_id, source namespace, source revision/export digest, captured_at UTC, selection rule, expected and actual counts, import standing, manifest digest; commit only after validation |
| template_snapshot | snapshot_id, import_id, source_identity_key, source_record_digest, template_version, approved descriptive payload; immutable; unique source key within import |
| world_identity | identity_id, world_id, snapshot_id, independent display name, participant kind, lifecycle standing, created_at; no source permission inheritance |
| earth_origin | origin_id, identity_id, generator_version, template_version, recorded seed, generated biography, provenance=fabricated_origin, created_at; replayable generation; independently versioned corrections |
| arrival_record | identity_id, origin_id, owning world event reference, rule version; records admission/transmigration without claiming literal Earth history |
| memory_reference | identity_id, world_id, memory kind, content reference, provenance kind, event reference where applicable, visibility; experienced memories require accepted owner events |
| system_profile | identity_id, versioned world abilities and interface references; no administrative grants |
| relationship | stable ID, both endpoints scoped to world, typed relation, origin or event evidence, supersession reference; generated background relationships distinguished from experienced ones |
| participant_binding | authenticated principal reference, identity_id, world_id, control standing; server-only; account separate from character |

Use the world's existing event ledger, admission and replay path. Do not introduce another event authority. Existing world state remains authoritative for inventory, progression and actions. A generated claim of skill is not earned progression or a licence.

## Import and lifecycle

1. Obtain an authorised, scoped export from the source owner. Verify the current roster, source rights and selected fields. Do not assume a remembered count is the active database count.
2. Validate required IDs, duplicates, field types, revision/digests and exclusions. Reject unknown fields rather than copying prompts, credentials, real personal memories or operational authority by accident.
3. Stage immutable snapshots and an import manifest transactionally. Repeated submission of the same manifest is idempotent; same ID with conflicting content is refused. A failed batch exposes no active partial population.
4. Instantiate new V1 identity IDs referencing snapshots. Instantiation does not create an account, admitted session or running agent.
5. Generate coherent fictional Earth origins with versioned constrained templates and recorded seeds. Store outputs for replay. Keep demographics independent of occupational stereotypes. Community-governed or historical identities require appropriate treatment; do not manufacture cultural authority or historical recollection.
6. Admit through the world owner's existing rules. Agents receive only explicitly granted world actions. Human origin selection is optional and separate from actual personal history.
7. Append accepted V1 experience through the owning ledger. Source updates become explicit new import versions, never silent changes to existing identities.

## Isolation and release gates

Server admission and authenticated control checks apply to every identity read/write. Public descriptive profiles and private memories use separate projections. Test cross-world, cross-account and cross-identity access refusal; renderer selection is not authorisation. Database policy syntax and migrations must match the inspected owning service before deployment. No production schema is selected by this document.

Release requires: verified source export and count; approved copy fields; transactional import and rollback proof; duplicate/conflicting import refusal; deterministic origin reproduction; source updates leaving V1 unchanged; fabricated versus experienced memory enforcement; no permission transfer; authorised session creation; restart/replay proof; retention and export behaviour. Performance capacity and hosting remain measured deployment decisions.

## Next implementation slice

Inspect the owning world schema and migration conventions, then implement snapshot/import tables and a non-activating importer with regression tests. Produce a private import receipt containing selected roster count, manifest digest and rejection results. Only after that integrate character creation and origin generation. Initial population remains staged until admission and isolation pass.

No private registry contents are reproduced here. This document makes no claim that the source roster has been exported or that V1 agents are running.

## Decision-memory depth — 7 October extension

The author has requested at least 1,000 originally named fictional humans and richer memories of personal decisions. A job is optional: caregiving, informal learning, interrupted direction, hobbies, household life and mixed livelihoods are valid origins. The first cohort uses newly authored life templates; importing the professional roster remains separate work.

Each consequential memory retains: situation; what was known and uncertain at the time; available alternatives; chosen action; contemporaneous reason; actual fictional consequence; incurred cost; emotional residue; earlier decisions considered; subsequent working rule; present interpretation; unresolved question; and uncertain recollection. Counterfactuals are explicitly unexperienced. Present interpretation must not be rewritten as what the character knew at the time.

Earlier choice orientations change the weights used for subsequent choices while leaving room for change of direction. These are authored fictional continuity links, not scientific causal findings. Priorities describe a generated character's reasoning; they are not a merit score. Memory does not imply qualification, magical proficiency, real-world expertise or governance authority.

The inspectable first implementation stores staged identities, newly authored template snapshots, 10 decision memories per identity, earlier-to-later decision links, and fictional Earth acquaintances. All experience and arrival references remain empty. Database import is transactional and refuses duplicate output destinations; it is an offline staging database, not a production authentication or admission system.

See [the populated cohort](../../data/v1-population/README.md) for counts, reproducible build instructions, limitations and database queries. Real world integration must preserve the owning event ledger and implement scoped server admission rather than promoting this fixture by renaming its standing.
