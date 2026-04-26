---
id: PROB-005
status: parked
severity: medium
created: 2026-04-18
parked: 2026-04-26
upstream: windyroad/agent-plugins
---

# External-comms drafts skip voice-tone review

## Problem

When Claude drafts messages for external audiences (maintainer notes, cross-repo GitHub issue comments, support messages), the project's `docs/VOICE-AND-TONE.md` guide is not consulted and `wr-voice-tone:agent` is not invoked before presenting the draft to the user. Voice-tone enforcement hooks only fire on edits to in-repo UI files matching specific extensions — external-facing text returned as conversation output bypasses the gate entirely.

This is the same class of issue that produced an "FFS" response in another project when Claude posted AI-sounding GitHub comments with em dashes, hedging, and a "keep ticket open" recommendation on a 2024-era issue.

## Evidence

- 2026-04-18 session: Claude drafted a multi-paragraph message to addressr maintainers explaining the missing HATEOAS rels and asked the user to paste it verbatim. No voice-tone agent was run. The draft used em dashes, hedging phrases ("follow-ups either way", "happy to take option 1"), and structural patterns that read AI-written.
- Pattern flagged in 30-day insights report as a top-three friction category across projects.

## Impact

Reputation risk with external maintainers. Burns user time correcting tone post-draft. Normalises AI-sounding language on public artefacts tied to the project's reputation.

## Potential Solutions

1. **Add a workflow rule**: before returning any text intended for an external audience, Claude must run `wr-voice-tone:agent` and fold in the feedback. Enforce via CLAUDE.md additions.
2. **PreToolUse hook on external-post tools**: intercept `Bash` calls to `gh issue comment`, `gh pr comment`, `gh issue create`, etc., and block until a voice-tone lint passes. Matches the insights-report recommendation.
3. **Draft template rule**: for any draft >2 sentences addressed to someone outside the repo, require explicit voice-tone agent invocation in the same turn.
4. **Inline lint script**: `scripts/voice-tone-lint.sh` that flags em dashes, hedging phrases, and "AI tells" from `docs/VOICE-AND-TONE.md`. Runs before any `gh comment` / `gh create` bash call.

Preferred: (1) + (2). The CLAUDE.md rule trains behaviour; the hook catches slips.

## Parked

- **Reason**: Fix scope is upstream in the Windy Road plugin suite (`windyroad/agent-plugins`), not in this `addressr-react` repo. The CLAUDE.md rule and the PreToolUse hook should ship as part of the relevant plugin (likely `wr-voice-tone`) so every project that adopts that plugin inherits the enforcement, rather than each project carrying duplicate copies.
- **Un-park trigger**: `windyroad/agent-plugins` ships a global voice-tone enforcement rule + hook covering external-audience drafts (e.g. `gh issue comment`, `gh pr comment`, `gh issue create`, plus any non-tool conversation output flagged as external-audience). Re-open this ticket only if the upstream fix proves insufficient for `addressr-react` specifically.
- **Date parked**: 2026-04-26 (during 2026-04-25 retrospective; user explicitly routed the fix upstream).
