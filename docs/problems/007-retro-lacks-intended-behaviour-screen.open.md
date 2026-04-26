---
id: PROB-007
status: open
severity: low
created: 2026-04-19
upstream: windyroad/agent-plugins (wr-retrospective)
---

# wr-retrospective lacks a "friction is intended behaviour" screen in Step 2

## Problem

The `wr-retrospective:run-retro` skill's Step 2 ("Reflect on this session") instructs the agent to surface "what was harder than it should have been" and "what failed" as candidates for problem tickets. The skill provides counter-examples for what does NOT become a codification candidate (one-off learnings, user-habit observations), but does NOT explicitly call out a common failure mode: **friction that is the system working as designed**.

Concretely: the risk scorer is doing exactly what it should when it blocks a new changeset commit because the cumulative release queue has crossed the Medium threshold. That is the control working. "I got blocked" is observed friction, but the fix isn't a ticket — the fix is to unblock the upstream cause (or accept the queue pause). In this session I proposed PROB-007-that-never-happened for that behaviour; the user correctly identified it as the control functioning. Without a Step 2 screen, this kind of noise-ticket is likely to recur across every retro where a control fires.

## Evidence

- **2026-04-19 session (addressr-react)**: During `/wr-retrospective:run-retro`, I proposed creating a problem ticket for "cumulative pipeline risk blocks committing a new changeset when the release queue already has risk-gated work." User responded: "why create a problem. It sounds like its doing the right thing - preventing us from putting too much risk into the release queue." The ticket was not created.
- Retrospective skill `SKILL.md` Step 2 counter-examples enumerate "diagnostic, project-specific" and "short, user-habit" non-candidates but do not name the "control working as designed" category.
- Related design intent exists: ADR-013 Rule 1 (structured interactions) and Step 4b Option 19 ("Skip — not codify-worthy") provide the escape hatch, but only AFTER the agent has already identified the observation as a candidate. The earlier a bad candidate gets filtered, the less retro time is spent on false positives.

## Impact

Minor. A single noise-ticket per retro session is low-cost on its own, but the pattern compounds: retros across many sessions and users accumulate tickets that are immediately closed as "working as designed" or "wontfix." That pollutes the WSJF backlog and dilutes signal for genuine diagnostic tickets.

## Potential Solutions

1. **Add a Step 2 screening question** to `wr-retrospective/skills/run-retro/SKILL.md`: "For each friction observation, is this the system working as designed (e.g. a control firing, a lint rule catching a real issue, a risk gate rejecting risky work)? If yes, do not promote to a codification candidate."
2. **Extend the counter-examples list** in the "What does NOT become a codification candidate" block with an explicit "The commit gate, risk scorer, or review hook did its job" bullet alongside the existing "diagnostic, project-specific" and "user-habit" bullets.
3. **Surface the control-working check during Step 4b** as an additional confirmation ("Is this candidate describing something a control correctly flagged? If yes, pick Skip") before routing to a dedicated skill.

Option 1 is the lightest-weight and most likely to catch the pattern early. Option 2 complements it at lower cost. Option 3 adds friction to Step 4b and is probably over-engineered for a one-line observation check.

## Routing

This ticket is project-authored but the fix lives upstream in the `wr-retrospective` plugin (`windyroad/agent-plugins`). Share with the maintainers.
