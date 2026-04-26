---
id: PROB-003
status: open
severity: medium
created: 2026-04-16
---

# JTBD hook PWD drift breaks edits after `cd` in bash commands

## Problem

The JTBD enforcement hook (`hooks/jtbd-enforce-edit.sh`) locates the JTBD docs relative to `$PWD` — it checks `docs/jtbd/` and `docs/JOBS_TO_BE_DONE.md` as relative paths. The Bash tool's working directory persists across calls, so any `cd packages/core` (e.g., to run a package-scoped pnpm command) leaves `$PWD` pointing at a subdirectory. Subsequent Edit/Write attempts then hit the hook's "no JTBD documentation exists" branch and are BLOCKED, even though the docs clearly exist at the project root.

The error message instructs the user to run `/wr-jtbd:update-guide` — which creates the migration unnecessarily, because the docs already exist.

## Evidence

- 2026-04-16 session: After running `cd packages/core && pnpm test:integration` in a bash command, subsequent writes to `api.integration.test.ts` were blocked with "no JTBD documentation exists" even though `docs/jtbd/` had just been fully populated. Resolved by `cd /Users/tomhoward/Projects/addressr-react` in a fresh bash command.
- Hook source: `/Users/tomhoward/.claude/plugins/cache/windyroad/wr-jtbd/0.1.0/hooks/jtbd-enforce-edit.sh` lines 88-98 use bare `docs/jtbd` / `docs/JOBS_TO_BE_DONE.md` without anchoring to the project root.

## Impact

Developer confusion: the error message suggests migration when the real cause is PWD drift. Costs 2-5 minutes per occurrence to diagnose and recover. Creates pressure to unnecessarily migrate legacy `JOBS_TO_BE_DONE.md` projects to the directory layout just to silence the hook.

Same pattern likely affects the architect, style-guide, and voice-tone hooks which use similar relative-path lookups.

## Potential Solutions

1. Anchor all policy-file lookups to `$CLAUDE_PROJECT_DIR` (the session's project root) rather than `$PWD`. This is the most robust fix and makes the hooks PWD-independent.
2. Walk upward from `$PWD` looking for `docs/jtbd/`, `docs/decisions/`, etc. until the filesystem root — finds the nearest project.
3. Document the "stay at project root" convention and have agents avoid `cd` in bash commands. Less robust; easy to forget.
4. Update the hook's error message to distinguish "docs genuinely missing" from "PWD mismatch — try `cd <project-root>`".
