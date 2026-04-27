---
id: PROB-010
status: open
severity: low
created: 2026-04-27
upstream: windyroad/agent-plugins (wr-itil/manage-problem)
---

# `wr-itil:manage-problem` skill lacks a `## Closed` section template

## Problem

The `wr-itil:manage-problem` skill (`packages/itil/skills/manage-problem/SKILL.md`) defines a clear template for the **`## Fix Released`** section that lands when a Known Error transitions to Verification Pending (Step 7, "Known Error → Verification Pending"). It does NOT define a parallel template for the **`## Closed`** section that should land when a Verification Pending ticket transitions to Closed (Step 7, "Verification Pending → Closed"). Step 7 only says "update the Status field" and "reference the problem ID in the closure commit message" — leaving the body content to ad-hoc invention.

Without a template, every closing session invents its own format. Different sessions or different projects end up with inconsistent shapes (some have CI run links, some have version numbers, some skip the section entirely and rely on the commit message), which makes scanning closed tickets for verification evidence harder than it needs to be.

## Evidence

- 2026-04-27 session, commit `3682b5d` (P008 → closed): no `## Closed` template existed in the skill, so I invented one with a closed-date, CI run links exercising the fix, and a brief acceptance note. The invented format reads cleanly but is not authoritative — the next closing session in this repo or another project would invent something similar but different.
- The asymmetry is internal: `## Fix Released` is templated; `## Closed` (its lifecycle-paired sibling) is not.

## Impact

**Low**. Per RISK-POLICY.md Impact Level 2 (Minor — internal-only friction; no consumer-visible effect):

- Inconsistent closed-ticket shapes across sessions and projects.
- Future automation (e.g., a "list closures with > N days between fix-released and closed" report) would have to scan ad-hoc formats instead of a known structure.
- New users adopting `wr-itil` lose a free template they had for `## Fix Released`.

Likelihood 2 (Unlikely — fires only at the verifying → closed transition, which is rare per ticket). Severity = 1 x 2 = 2 (Very Low band).

## Potential Solutions

1. **Upstream improvement (Recommended)** — Edit `packages/itil/skills/manage-problem/SKILL.md` Step 7's "Verification Pending → Closed" subsection to add a `## Closed` template alongside the existing `## Fix Released` template. Suggested fields:
   - **Closed**: `<YYYY-MM-DD>` — date the user verified the fix.
   - **Verification evidence**: 1-3 bullets citing the artefacts that prove the fix works (e.g. CI run URLs, version numbers, screenshots, support-ticket closures).
   - **Acceptance note**: one short sentence explaining the user's verification reasoning (e.g. "Positive-path observed twice; negative-path is dormant until needed").
2. **Local workaround** — copy the `## Closed` shape used in P008 (`docs/problems/008-ci-secrets-silent-failure.closed.md`) verbatim for future closures in this repo. Ad-hoc but consistent within the project.

Option 1 is the durable answer; Option 2 is what we do until Option 1 ships.

## Routing

Upstream — `windyroad/agent-plugins`, plugin `wr-itil`, file `packages/itil/skills/manage-problem/SKILL.md`. No local code change needed; this ticket exists to make the gap visible and to anchor the workaround until the upstream edit lands.

## Related

- P009 (`docs/problems/009-problem-ticket-convention-mismatch.verifying.md`) — same plugin's filename-suffix convention; that one was project-local-actionable, this one is upstream-only.
- P008 closure (commit `3682b5d`) — first occurrence where the missing template was felt; the invented format used there is the workaround model for now.
- P005 (`docs/problems/005-external-comms-voice-tone-skipped.parked.md`) — also parked-upstream against `windyroad/agent-plugins`; if both eventually go upstream, batch them in one PR.
- **Upstream report pending** — external dependency identified; invoke /wr-itil:report-upstream when ready
