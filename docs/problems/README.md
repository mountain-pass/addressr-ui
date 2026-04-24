# Problem Backlog

> Last reviewed: 2026-04-24
> Run `/wr-itil:manage-problem review` to refresh.

## WSJF Rankings

| WSJF | ID | Title | Severity | Status | Effort |
|------|-----|-------|----------|--------|--------|
| 9.0 | P008 | CI fails opaquely when required GitHub Actions secrets are missing | 9 (Impact 3 × Likelihood 3) | Open | S |
| 4.5 | P003 | JTBD hook PWD drift breaks edits after `cd` in bash commands | 9 (Impact 3 × Likelihood 3) | Open | M |
| 4.5 | P005 | External-comms drafts skip voice-tone review | 9 (Impact 3 × Likelihood 3) | Open | M |
| 2.0 | P001 | Review gate overhead on trivial UI file changes | 8 (Impact 2 × Likelihood 4) | Open | L |
| 1.5 | P007 | wr-retrospective lacks a "friction is intended behaviour" screen | 6 (Impact 2 × Likelihood 3) | Open | L |
| 1.0 | P002 | Risk scorer pipeline state drift on staging after scoring | 2 (Impact 1 × Likelihood 2) | Open | M |
| 0.625 | P006 | Browser does not cache addressr root response despite Cache-Control: public | 5 (Impact 1 × Likelihood 5) | Open | XL |

### Scoring notes

- **P008** — Local fix (`.github/workflows/release.yml`). Preflight secret check is ~10 lines of YAML. Small effort, highest WSJF.
- **P003 / P005** — Tied at 4.5. P003 fix lives upstream in governance plugin hooks; P005's preferred fix (CLAUDE.md rule + optional PreToolUse hook) is local.
- **P001 / P002 / P007** — Upstream fixes in governance plugins (wr-architect/jtbd/style-guide/voice-tone, wr-risk-scorer, wr-retrospective).
- **P006** — Upstream fix with addressr maintainers / RapidAPI gateway; mitigation already in place (`rootPromise` in-memory cache).

## Resolved

| ID | Title | Closed |
|----|-------|--------|
| P004 | RapidAPI gateway serves stale root Link header, hiding new rels | 2026-04-24 |

## Verification Queue

None. No `.verifying.md` tickets (project tracks status via frontmatter rather than filename suffix; none currently in the "Verification Pending" state).

## Parked

None.
