---
id: PROB-002
status: open
severity: low
created: 2026-04-14
---

# Risk scorer pipeline state drift on staging after scoring

## Problem

The risk scorer computes a hash at prompt-submit time. If files are staged (`git add`) after the prompt but before the commit, the hash mismatches and the commit is blocked with "pipeline state drift". This requires re-running the risk scorer in a new prompt turn.

## Evidence

- 2026-04-14 session: Happened when staging a changeset file after the risk scorer had already scored the previous set of staged changes. Required an extra agent invocation to re-score.

## Impact

Minor friction — adds one extra agent call (~15-20 seconds) when the staging sequence doesn't match the scorer's snapshot. Does not cause incorrect scores.

## Potential Solutions

1. Score could be computed at commit time rather than prompt-submit time
2. The gate could re-score automatically instead of blocking
3. Document the "stage first, then submit prompt" workflow more prominently
