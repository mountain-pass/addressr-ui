---
id: PROB-011
status: open
severity: medium
created: 2026-06-02
upstream: windyroad/agent-plugins (wr-itil/capture-problem)
---

# `/wr-itil:capture-problem` lacks a premise-triage gate

## Problem

The `/wr-itil:capture-problem` skill (`packages/itil/skills/capture-problem/SKILL.md`) runs a duplicate-check (3-keyword title-only grep) and a hang-off-check (mechanical pre-filter + fresh-context subagent on shared ADR / RFC / SKILL / file signals), then writes the new ticket and commits it. Neither check validates whether the described problem is **real**. If the description is based on a wrong premise — for example, "the UI lacks postcode components" when the components already exist — the skill will dutifully capture the phantom and land it on `main` in a single commit.

The skill's lightweight aside-invocation contract (P155, ADR-032) prioritises capture-time speed and explicitly argues "false-positives are cheaper than false-negatives" for the duplicate-check. That argument was made about title-overlap matches, not about description-truth. The premise-truth gap is downstream of duplicate-check — a genuinely-novel title can still describe something that isn't real.

## Evidence

- 2026-06-02 session, this repo. The user invoked `/wr-itil:capture-problem the current UI only provides components for searching addresses, not searching postcodes, suburbs or states`. The skill cleared its duplicate-check (no matches), resolved type to `user-business`, resolved JTBD-trace to `JTBD-002,003,004,101,102,103`, and was preparing to write `011-<slug>.open.md`. The user interrupted with "hang on. It looks like we do have those components" — and a quick read of `packages/react/src/index.ts` showed `usePostcodeSearch`, `useLocalitySearch`, `useStateSearch`, `PostcodeAutocomplete`, `LocalityAutocomplete`, and `StateAutocomplete` all already exported. Svelte (`createPostcodeSearch`, `createLocalitySearch`, `PostcodeAutocomplete.svelte`, `LocalityAutocomplete.svelte`, `StateAutocomplete.svelte`) and Vue (`usePostcodeSearch`, `useLocalitySearch`, `PostcodeAutocomplete.vue`, `LocalityAutocomplete.vue`, `StateAutocomplete.vue`) mirror the surface. The captured ticket would have been a phantom.
- The hang-off-check's mechanical pre-filter matches on shared ADR / RFC / SKILL / file-path signals only — it intentionally does NOT match against source-code identifiers in `packages/*/src/`. So a "component X is missing" claim cannot be falsified by a grep over the codebase.
- Step 1.5 (type classification) and Step 1.5b (JTBD-trace + persona) both fired correctly and resolved cleanly. The skill performed its declared work correctly. The gap is that "is the premise true?" is not part of its declared work.

## Impact

**Medium**. Per RISK-POLICY.md:

- **Impact 2 (Moderate — backlog hygiene)**: phantom tickets enter the WSJF ranking table at `/wr-itil:review-problems` and consume reviewer attention. They are recoverable at review-time, but the round-trip is wasteful and the misranking can shadow real tickets during the window between capture and next review.
- **Likelihood 3 (Possible — fires whenever a reporter's premise is wrong)**: surfaces any time an agent or human captures a perceived gap without first verifying it. AFK orchestrators (`/wr-itil:work-problems`) are especially exposed because there is no interactive interrupt — a phantom ticket can sit on the queue until the next human review.

Severity = 2 × 3 = 6 (Medium band).

Cost compounds because:

- The skill commits in a single step, so a phantom capture is already on `main` before any second-pair-of-eyes review.
- Reverting requires either deleting the file (re-rolling the ID and rewriting history) or transitioning straight to closed-without-fix (no template exists for this — see P010).
- AFK orchestrators that pick up the phantom may burn cycles "investigating" it before the falsifying check finally happens.

## Potential Solutions

1. **Premise-triage step (Recommended)** — Add a new Step 1.7 (between type classification and duplicate-check) that derives a small set of falsifiers from the description — named exports / components, named files, named flags, named CLI commands — and runs a quick grep against the local tree. If any falsifier resolves to existing code, emit a structured advisory summarising the contradiction and require the user to (a) confirm "capture anyway — the description is more nuanced than the grep suggests", (b) edit the description to clarify, or (c) abort. AFK orchestrators that pass `--no-prompt` or a new `--skip-triage` flag proceed silently per ADR-013 Rule 6, but with an audit-trail stderr advisory naming the falsifier hits. Shape mirrors the existing Step 1.5 derive-first dispatch: silent-proceed when no falsifiers hit; AskUserQuestion only on contradiction.
2. **Verify-before-capture subagent** — Heavier shape: spawn a fresh-context subagent (similar to the hang-off-check at Step 2b) that reads the description and the local tree and emits `PROCEED` / `FALSIFIED: <evidence>` / `AMBIGUOUS`. More expensive than Option 1 but catches premise errors that a simple grep would miss (e.g., "component X doesn't handle case Y" when X does handle Y via a code path the grep would not surface).
3. **Local workaround (this repo)** — until upstream ships a triage gate, the capturing agent must perform a manual sanity check before invoking `/wr-itil:capture-problem`. That is what happened in the 2026-06-02 session, but only because the user interrupted. Not durable.

Option 1 is the lightest shape that covers the common case (named-thing-doesn't-exist claims). Option 2 is the durable answer for harder cases. They are composable — Option 1 ships first and catches the cheap wins; Option 2 is added later if false-negatives prove material.

`/wr-itil:manage-problem`'s new-problem path likely shares the same gap (its own Step 4-equivalent intake does not verify premise), but its richer AskUserQuestion flow gives more interrupt points. Scoping this ticket to capture-problem; cross-link if the upstream fix lands in both surfaces.

## Routing

Upstream — `windyroad/agent-plugins`, plugin `wr-itil`, file `packages/itil/skills/capture-problem/SKILL.md` (and `REFERENCE.md` for rationale + edge-cases). No local code change available; this ticket exists to anchor the gap and feed the upstream report.

## Related

- 2026-06-02 capture session (this ticket's evidence) — the falsifying check would have been `grep -E 'PostcodeAutocomplete|LocalityAutocomplete|StateAutocomplete' packages/*/src/index.ts` against the description's "components for searching postcodes/suburbs/states". One grep, ~30ms, would have prevented the phantom.
- P005 (`docs/problems/005-external-comms-voice-tone-skipped.parked.md`) — also parked-upstream against `windyroad/agent-plugins`; batch into one PR if both go upstream in the same window.
- P010 (`docs/problems/010-manage-problem-lacks-closed-template.open.md`) — another wr-itil skill-gap ticket; both target `packages/itil/skills/*/SKILL.md`.
- ADR-032 (upstream `packages/itil/decisions/032-governance-skill-invocation-patterns.md`) — the foreground-lightweight-capture variant amendment that landed capture-problem. The premise-triage gap is a follow-on amendment opportunity.
- ADR-044 (upstream) — decision-delegation contract; the recommended Step 1.7 fits the derive-first / category-4 silent-framework / category-5 fallback shape already used at Step 1.5.
- **Reported upstream**: https://github.com/windyroad/agent-plugins/issues/202 (2026-06-02)

## Reported Upstream

- **URL**: https://github.com/windyroad/agent-plugins/issues/202
- **Reported**: 2026-06-02
- **Template used**: problem-report.yml
- **Disclosure path**: public issue
- **Cross-reference confirmed**: yes — upstream issue body contains `Reported from https://github.com/Mountain-Pass/addressr-react/blob/main/docs/problems/011-capture-problem-lacks-premise-triage.open.md`
