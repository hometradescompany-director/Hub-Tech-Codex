# Bundled build provenance

The Hub hosts two browser demos from pinned public source verified on
2026-11-26 AEST. Each source project owns its implementation and release
history. The Hub's root [Apache-2.0 licence](../LICENSE) accompanies the copies.

## SEQ Maps

[Source revision](https://github.com/hometradescompany-director/SEQ-Maps/tree/ddce01ff3c0a385b095a343173f9cc74c62465a0).
`variable-speed-proof.mjs` comes from `src/analytics/` and
`m1-variable-speed.synthetic.json` comes from `test/fixtures/`. Both are
unchanged. The Hub supplies the table and local browser adapter. The inputs
are synthetic and the calculation is descriptive.

## The Commons Pub

[Source revision](https://github.com/hometradescompany-director/The-Commons-Pub-at-least-provisionally./tree/c7696aaaa37ccdfdf7de8e68f3ecfaa9a5d84541).
`index.html`, `styles.css`, `app.js` and `renderer-2d.js` come from
`demo/`. `simulator.js` and `fixtures.js` come from `src/`. The Hub changed
the relative paths and the return link in `index.html` and the module paths in
`app.js`. The simulator stays in memory and its route disables network
connections.
