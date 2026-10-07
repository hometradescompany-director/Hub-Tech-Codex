# V1 — first 1,000 Earth origins

**Standing: staged fictional population.** No accounts, sessions or running agents are created. All names and histories are invented; coincidental resemblance to real people does not establish identity or provenance. The existing professional registry has not been exported or copied into this cohort.

The database contains 1,000 unique names, 10,000 decision memories, 9,000 earlier-to-later memory links and 500 fictional acquaintance relationships. Sixteen life patterns include unpaid care, informal learning, unemployment/between-directions, mixed livelihoods, community activity, regular paid work and leisure. These are coverage categories, not a representative demographic sample.

Each memory stores alternatives, known and unknown context, choice and reason, consequences and costs, fallible interpretation, emotional residue and unresolved questions. The next choice weights concerns made salient by earlier choices. History is generated at year/sequence precision; several decisions can occur within one year. No precise birthday or fabricated observation timestamp is implied.

These lives are procedural combinations of 16 authored situations. Unique names and sequences do not establish 1,000 independently authored novels, comprehensive life histories or autonomous persons. Further depth should add individually reviewed memories, concrete recurring relationships, life-stage-specific events and contextual opportunity constraints. None of those should manufacture real experience.

## Inspect and rebuild

- [Index](index.json): all 1,000 names, ages, life patterns and summaries.
- [Samples](samples.json): one full origin from each life pattern, including decision history.
- [Manifest](manifest.json): cohort digest, database/export hashes and coverage counts.
- [Compressed SQLite database](origins.sqlite.gz): full population; decompress before opening.
- [Schema](schema.sql): table constraints, foreign keys and chronological-link trigger.

From the repository root, with Node.js 22+ and Python 3:

```sh
node scripts/build-v1-population.mjs /tmp/v1-population-review v1-earth-2026
# Refuses existing outputs. Choose another empty directory to rebuild.
# The builder creates both SQLite and its compressed copy.
# For a downloaded compressed copy in a separate directory:
gzip -dk origins.sqlite.gz
```

Database queries (any SQLite client):

```sql
SELECT name,age,template_id FROM identities ORDER BY name;
SELECT sequence,age,json_extract(body_json,'$.chosen_action') AS choice,
       json_extract(body_json,'$.reason_at_the_time') AS reason,
       json_extract(body_json,'$.consequence') AS consequence
FROM decisions WHERE identity_id='v1-origin-00001' ORDER BY sequence;
SELECT * FROM decision_links WHERE identity_id='v1-origin-00001';
PRAGMA integrity_check;
PRAGMA foreign_key_check;
```

Publicly committed content is invented origin material only. Real participant memories require a separate private projection. The offline importer does not implement production isolation, access control, admission, world actions or transfer out of V1.
