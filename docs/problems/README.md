# Problem Backlog

> Last reviewed: 2026-04-27
> Run `/wr-itil:manage-problem review` to refresh.

Tickets follow the `wr-itil:manage-problem` skill convention: `NNN-kebab-title.<status>.md` (status duplicated in YAML frontmatter for greppability). See [CLAUDE.md → Problem Tracking](../../CLAUDE.md#problem-tracking) for transition rules.

## WSJF Rankings

Open and known-error tickets only (verifying / parked / closed are excluded — see dedicated sections below).

| WSJF | ID | Title | Severity | Status | Effort |
|------|-----|-------|----------|--------|--------|
| 4.5 | P003 | JTBD hook PWD drift breaks edits after `cd` in bash commands | 9 (Impact 3 × Likelihood 3) | Open | M |
| 2.0 | P001 | Review gate overhead on trivial UI file changes | 8 (Impact 2 × Likelihood 4) | Open | L |
| 1.5 | P007 | wr-retrospective lacks a "friction is intended behaviour" screen | 6 (Impact 2 × Likelihood 3) | Open | L |
| 1.0 | P002 | Risk scorer pipeline state drift on staging after scoring | 2 (Impact 1 × Likelihood 2) | Open | M |
| 0.625 | P006 | Browser does not cache addressr root response despite Cache-Control: public | 5 (Impact 1 × Likelihood 5) | Open | XL |

All 5 open tickets are upstream-blocked (fix scope lives in the Windy Road plugin suite or the upstream Addressr server / RapidAPI gateway). Local action is limited to documenting workarounds in BRIEFING.md.

## Verification Queue

Fix released, awaiting user verification (driven off `docs/problems/*.verifying.md` via glob). Ranked by release age, oldest first.

| ID | Title | Released | Fix summary | Likely verified? |
|----|-------|----------|-------------|------------------|
| P009 | Project's problem-ticket convention diverges from `manage-problem` skill layout | 2026-04-27 | Option A migration applied — all 9 tickets renamed to suffix layout; CLAUDE.md documents the convention | no (0 days) |

## Parked

| ID | Title | Reason | Parked since |
|----|-------|--------|-------------|
| P005 | External-comms drafts skip voice-tone review | Fix scope is upstream in `windyroad/agent-plugins` (likely `wr-voice-tone`) so every adopting project inherits the enforcement | 2026-04-26 |

## Resolved

| ID | Title | Closed |
|----|-------|--------|
| P004 | RapidAPI gateway serves stale root Link header, hiding new rels | 2026-04-24 |
| P008 | CI fails opaquely when required GitHub Actions secrets are missing | 2026-04-27 |
