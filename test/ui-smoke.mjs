// Run manually: node scripts/browser-smoke.cjs (Playwright is a verification tool,
// not a project dependency). The smoke exercises actual browser interactions:
// constellation → Diamond inspector → inventory receipt → list → filter → back,
// invalid importer refusal, malicious source labels as text, mobile overflow.
export const acceptance=['selection','reciprocal-navigation','context-restoration','manifest-receipt','import-refusal','mobile-layout'];
