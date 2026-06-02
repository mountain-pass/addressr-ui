# Problem Backlog

> Last reviewed: 2026-06-02 — P010 + P011 folded into WSJF rankings; P009 closed after five weeks of clean operation under the suffix convention; P011 newly reported upstream (`agent-plugins#202`).
> Run `/wr-itil:review-problems` to refresh.

Tickets follow the `wr-itil:manage-problem` skill convention: `NNN-kebab-title.<status>.md` (status duplicated in YAML frontmatter for greppability). See [CLAUDE.md → Problem Tracking](../../CLAUDE.md#problem-tracking) for transition rules.

## WSJF Rankings

Open and known-error tickets only (verifying / parked / closed are excluded — see dedicated sections below). Rows render by `(WSJF desc, Known-Error-first, Effort-divisor asc, Reported-date asc, ID asc)`.

| WSJF | ID | Title | Severity | Status | Effort | Reported | Origin |
|------|-----|-------|----------|--------|--------|----------|--------|
| 4.5 | P003 | JTBD hook PWD drift breaks edits after `cd` in bash commands | 9 (Impact 3 × Likelihood 3) | Open | M | 2026-04-26 | internal |
| 3.0 | P011 | `/wr-itil:capture-problem` lacks a premise-triage gate | 6 (Impact 2 × Likelihood 3) | Open | M | 2026-06-02 | internal |
| 2.0 | P010 | `wr-itil:manage-problem` skill lacks a `## Closed` section template | 2 (Impact 1 × Likelihood 2) | Open | S | 2026-04-27 | internal |
| 2.0 | P001 | Review gate overhead on trivial UI file changes | 8 (Impact 2 × Likelihood 4) | Open | L | 2026-04-19 | internal |
| 1.5 | P007 | wr-retrospective lacks a "friction is intended behaviour" screen | 6 (Impact 2 × Likelihood 3) | Open | L | 2026-04-26 | internal |
| 1.0 | P002 | Risk scorer pipeline state drift on staging after scoring | 2 (Impact 1 × Likelihood 2) | Open | M | 2026-04-22 | internal |
| 0.625 | P006 | Browser does not cache addressr root response despite `Cache-Control: public` | 5 (Impact 1 × Likelihood 5) | Open | XL | 2026-04-18 | internal |

All 7 open tickets are upstream-blocked (fix scope lives in the Windy Road plugin suite, the upstream Addressr server, or the RapidAPI gateway). Local action is limited to documenting workarounds in BRIEFING.md. P010 and P011 are both reported upstream (P011 via `windyroad/agent-plugins#202`); P010 awaits its `/wr-itil:report-upstream` invocation.

## Verification Queue

Fix released, awaiting user verification (driven off `docs/problems/*.verifying.md` via glob). Sorted by `Released date ASC`. `Likely verified?` carries the evidence-first cell shape per P186.

_No tickets awaiting verification._

## Parked

| ID | Title | Reason | Parked since |
|----|-------|--------|-------------|
| P005 | External-comms drafts skip voice-tone review | Fix scope is upstream in `windyroad/agent-plugins` (likely `wr-voice-tone`) so every adopting project inherits the enforcement | 2026-04-26 |

## Resolved

| ID | Title | Closed |
|----|-------|--------|
| P004 | RapidAPI gateway serves stale root Link header, hiding new rels | 2026-04-24 |
| P008 | CI fails opaquely when required GitHub Actions secrets are missing | 2026-04-27 |
| P009 | Project's problem-ticket convention diverges from `manage-problem` skill layout | 2026-06-02 |
