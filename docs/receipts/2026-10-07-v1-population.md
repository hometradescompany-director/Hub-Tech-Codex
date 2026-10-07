# V1 population staging receipt — 7 October 2026

Author direction: deepen personal memories around decisions and populate at least 1,000 originally named humans, including lives without a settled job. The prior population design was approved and extended. Native implementation used an isolated local clone; one independent review checked the whole change.

Implemented: 16 newly authored life-pattern templates and 16 choice situations; deterministic generation of 1,000 names and origins; 10,000 detailed decision memories with 9,000 earlier-to-later links; 500 fictional acquaintance relationships; validated transactional SQLite import and deterministic compressed database; complete name index, 16 example lives and hashes/coverage manifest.

Decisions retain alternatives, knowledge/uncertainty at the time, contemporaneous reasons, choice, incurred cost, consequence, emotion, imperfect recall, later interpretation and unresolved questions. Prior choice orientations affect later selection weights. These are authored continuity links, not observed causal evidence. Generated origins and unexperienced alternatives remain explicitly distinct from V1 experience.

Verification: 57 Node tests pass; npm run check passes. SQLite integrity_check is ok and foreign_key_check is empty. Counts: 1,000 identities, 10,000 decisions, 9,000 decision links, 500 relationships. Ages range from 18 to 84. Generation and compressed database reproduction are tested. Malformed origins create no partial database; existing output is protected.

Independent review found missing validation of decision detail/action correspondence and false source-import lineage. Regression reproduced the failures with a freshly recomputed digest; both were fixed. Rehashed mutation tests now verify semantics independently of checksum refusal. Rebuild instructions were clarified.

Standing and limits: staged offline fictional population, no admitted accounts or agents. The private professional registry has not been exported, copied or granted authority here. The population is procedural fiction, not a representative demographic sample or 1,000 independently written complete biographies. Origin/import tables do not replace the owning world event ledger, authentication or admission. SQLite/gzip publication uses two exclusive file operations: interruption can leave one completed artifact, although partially imported rows are never exposed. Production restart/admission/access-control integration remains separate work.

The uncompressed database is reproducible and ignored by git. Its compressed full contents, manifest, index, samples, schema and generators are retained in the repository. Public exports contain generated material only.
