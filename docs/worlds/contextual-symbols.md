# Contextual visual meanings

The cosmic evidence inspector shows candidate interpretations from
`data/contextual-symbols.json`. These are newly authored descriptions of useful
motifs from the visual references supplied on October 8, 2026. Image creators,
source URLs and redistribution rights were not established. No supplied image
asset or third-party passage is included in the repository.

Each record names an ID, revision, motif, context, meaning, preserved invariants,
failure examples and source standing. The loop motif has separate feedback and
replay meanings. It cannot resolve without an explicit context and revision;
multiple matches return `ambiguous` without a selected record. A binding names
an existing fixture subject and an exact record revision and context. Adding a
later revision does not upgrade earlier bindings. Changing a persistent record
ID's motif or context within the catalog is rejected.

All records have candidate standing and `grantsAuthority:false`. Interpretation
is not scientific validation, doctrine, an identity registration or a tool
permission. Source strings are rendered as text and never fetched or executed.
The first contract accepts unknown attribution and image asset rights only;
support for stronger attribution will require its own evidence-bearing contract.

The validator rejects missing or extra fields, duplicate IDs and revisions,
duplicate or dangling bindings, and missing invariants or failure examples.
Limits are 256 records, 512 bindings, 12 items per invariant/example list,
2,048 characters per explanation and 512 characters per source reference.
Validated records are immutable snapshots. This is a public design projection,
not a canonical registry or a cross-session memory store.

Catalog loading is independent of event loading. When the catalog is missing
or rejected, the inspector names that absence and keeps event replay usable.
The renderer remains responsible for geometry; this contract adds no layout,
execution or authority behavior.
