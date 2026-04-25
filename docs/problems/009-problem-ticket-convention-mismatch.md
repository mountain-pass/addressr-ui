---
id: PROB-009
status: open
severity: low
created: 2026-04-25
---

# Project's problem-ticket convention diverges from `manage-problem` skill layout

## Problem

This project tracks problem-ticket status in YAML frontmatter (`status: open|verifying|resolved`) on filenames of the form `docs/problems/NNN-kebab-title.md` (single suffix). The `wr-itil:manage-problem` skill assumes a different layout — `NNN-title.<status>.md` filename suffixes with `git mv` transitions between `.open.md`, `.known-error.md`, `.verifying.md`, `.closed.md`. The skill's transition machinery (every `git mv` in Step 7, plus the auto-transition in Step 9b, plus the verification-queue glob in Step 9d) does not apply cleanly here.

A decision is needed:

- **Option A — migrate to the suffix convention**: rename all 8 existing tickets (`001-...md` → `001-....open.md` etc., with `004-rapidapi-gateway-root-cache.md` → `.closed.md`), document the convention in `CLAUDE.md` / `AGENTS.md`, and let the skill's transitions work as designed.
- **Option B — document the deviation**: keep the current `NNN-title.md` + frontmatter layout, and add a project-level note (in `CLAUDE.md` / `AGENTS.md`) telling future sessions to edit the frontmatter `status:` field instead of `git mv`-ing files. Skill steps that fire `git mv` get adapted manually each time.

## Evidence

- 2026-04-25 retrospective after the AFK problem-work loop (commit `d86240c`): during Iteration 2, `manage-problem`'s `.open.md` → `.verifying.md` transition for P008 (CI secrets silent failure) had to be hand-adapted. The skill's `git mv 008-ci-secrets-silent-failure.open.md 008-ci-secrets-silent-failure.verifying.md` would have failed because the source file is `008-ci-secrets-silent-failure.md` (no `.open` suffix). Worked around by editing the frontmatter `status:` field directly.
- Step 9d in the skill globs `docs/problems/*.verifying.md` to surface the Verification Queue. With the project's convention this glob returns nothing, so the queue is empty in `docs/problems/README.md` even when tickets are in fact awaiting verification (P008 today).
- BRIEFING.md note added 2026-04-25 captures the deviation as a "What you need to know" item.

## Impact

Minor friction per ticket transition, but cumulative across iterations. Also weakens the `manage-problem review` cache: the README's Verification Queue section can't be auto-populated from a glob, so verification status drifts between sessions until the next manual review.

Severity assessment: **Low** — Impact 1 (Negligible — workaround is reliable) × Likelihood 3 (Possible — fires every time the skill runs against a project ticket transition).

## Potential Solutions

1. **Option B (Recommended)** — Add a 3-line note to `CLAUDE.md` / `AGENTS.md` documenting the project's convention (`NNN-title.md` + frontmatter `status:`) and instructing future agents to edit the frontmatter instead of `git mv`. Cheapest, preserves existing tickets and git history. Cost: ~5 minutes of doc editing, no rename churn.
2. **Option A** — Migrate all 8 tickets to the skill's suffix layout. Rename `001-...md` → `001-....open.md` (or `.closed.md` for P004, `.verifying.md` for P008), update any references in `docs/problems/README.md`. Aligns with the skill's defaults so future transitions work without adaptation. Cost: 8 file renames, README rewrite, ~15 minutes.
3. **Upstream fix to the skill** — Improve `wr-itil:manage-problem` upstream to detect convention from existing files and adapt transitions accordingly. Best long-term solution but cross-plugin scope (XL effort, requires PR to `windyroad/agent-plugins`). Tracked separately as a candidate improvement; not in scope for this ticket.

## Routing

Local fix — `CLAUDE.md` / `AGENTS.md` edit (Option B) or batch rename + README rewrite (Option A). No upstream dependency for either local resolution path.

## Related

- Surfaced during the 2026-04-25 retrospective (`/wr-retrospective:run-retro`) after the AFK problem-work loop.
- Workaround used for P008 commit `d86240c` (`fix(ci): add preflight secret check (closes P008)`).
- BRIEFING.md "Problem ticket convention" entry references this ticket.
