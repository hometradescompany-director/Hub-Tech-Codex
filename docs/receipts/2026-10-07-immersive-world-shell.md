# Immersive world shell — first menu

Origin: Jarrod Cobb, 7 October 2026, Brisbane: replace the embedded cosmic window with Enter Atlas, inhabit a full-screen environment until Exit, and begin a menu switching distinct worlds. The hub should recover the original HTC Hub's organising idea while retaining its own identity.

Implemented public shell: launcher→full-viewport cosmic render, persistent Menu/Fullscreen/Exit controls, environment menu for Cosmic World/V1/Hub, evidence drawer and restored launcher focus/body scroll on exit. Native fullscreen is attempted explicitly with visible refusal/unsupported fallback; CSS viewport mode remains usable. Browser Escape respects menu/evidence interactions. Public V1 and Hub routes point at the existing local pages, not remote sessions. Map geometry reserves HUD space on phone.

Private Atlas counterpart is in PR152: /atlas/map becomes an Enter Atlas launcher. A body portal escapes the normal Atlas app/card dimensions. Cosmos renders flexibly over the available viewport; existing search, breadcrumbs, overlays, body/orbit inspectors and audit owners remain in use. The first menu switches Cosmic World, V1's explicitly unconnected destination view and an Atlas environment hub. V1 private admission is not invented from the public rehearsal. Native fullscreen acquired by the shell is released on exit or route unmount; pre-existing fullscreen is not taken over. Inactive worlds suspend shortcuts, telemetry and substrate animation. Menu and nested dialogs retain distinct keyboard/focus handling.

Public verification:48 tests and graph/fixture/syntax checks pass. Full browser smoke passes launcher, viewport bounds, menu routing/back, native fullscreen success-or-supported fallback, forced denial, evidence, keyboard, exit/body scroll/focus, reentry and390×844 phone layout, alongside original replay/refusal/evidence checks. Screenshots inspected.

Private verification:15 targeted tests pass, including world lifecycle transitions; five TSX modules transpile without diagnostics. Independent review identified and corrected focus restoration, hidden-world shortcuts, overlay ordering, nested Escape and fullscreen ownership cleanup. Full private React build, browser integration and published Atlas rollout remain gated by hosted certification; do not infer them from the public counterpart. PR154 separately repairs existing release blockers.

This changes the interaction/layout shell. It does not convert SVG/canvas into a 3D game engine, implement immersive glasses, create an agent server or admit a world session.
