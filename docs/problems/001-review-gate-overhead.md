---
id: PROB-001
status: open
severity: low
created: 2026-04-14
---

# Review gate overhead on trivial UI file changes

## Problem

Editing any `.tsx`, `.svelte`, or `.vue` file — even for JSDoc comments, HTML comments, or test-only changes — triggers 4 mandatory review agents (architect, JTBD, voice/tone, style guide). Each agent takes 15-40 seconds. For a session with many small edits across 3 frameworks, this adds significant wall-clock time.

## Evidence

- 2026-04-14 session: ~20 review gate invocations across the sprint, most returning "PASS — no styling/copy changes". Estimated 10-15 minutes of gate-clearing for changes that only touched code comments or test logic.

## Impact

Slows development velocity for non-visual changes to component files. Does not cause incorrect results — all gates are safety checks that pass correctly.

## Potential Solutions

1. Review gates could inspect the diff rather than the file extension to skip irrelevant checks (e.g., style guide review for JSDoc-only changes)
2. A "batch review" mode that runs all 4 agents once for a set of planned changes rather than per-edit
3. Test files (`.test.tsx`) could be exempt from style-guide and voice-tone gates
