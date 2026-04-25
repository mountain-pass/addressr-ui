# Risk Policy

**Last reviewed**: 2026-04-26
**Aligned with**: ISO 31000 risk management principles

This policy defines the risk criteria used by:

- The `wr-risk-scorer:pipeline` agent (commit / push / release gate scoring)
- The `wr-itil:manage-problem` skill (WSJF severity calculation)
- The `wr-itil:work-problems` orchestrator (release-cadence drain decisions)

The companion `addressr` repository follows the same approach; this file is the single source of truth for the `addressr-react` UI component monorepo.

## Business Context

`addressr-react` is a public, Apache-2.0 licensed monorepo of UI components (React, Svelte, Vue, plus a framework-agnostic core) that consume the Addressr Australian-address API. Published packages on npm:

- `@mountainpass/addressr-core`
- `@mountainpass/addressr-react`
- `@mountainpass/addressr-svelte`
- `@mountainpass/addressr-vue`

**Users**:

- **Library consumers** — developers integrating any of the four published packages into their own apps.
- **End users of consumer apps** — people typing Australian addresses, reached transitively through the consumer's UI.
- **Project maintainers** — the small team operating this repo.

**Compliance and commitments**:

- **License**: Apache-2.0 — outbound license obligations (NOTICE file preservation, attribution).
- **Accessibility**: WCAG AA is a non-negotiable contract (per project CLAUDE.md). All components ship with `downshift` ARIA semantics, `parseHighlight` safe-rendering, focus-indicator contrast >= 3:1, and 44 px touch targets. Regression here breaks every consumer's UX simultaneously.
- **Australian context**: addresses are user-entered location data; while this monorepo does not collect or store address data, consumer apps may. The project does not currently make data-handling commitments beyond the components themselves.
- **No formal SLA** with consumers — the packages are open-source-best-effort. CI greenness is the closest thing to a published guarantee (`release.yml` runs lint, unit tests, integration tests against the live API, browser tests, and build before publishing).

## Confidential Information

This repository is **public**. The following must NEVER appear in any committed file (source, docs, ADRs, problem tickets, briefings, commit messages, CI logs):

- Revenue figures, customer counts, or active-user counts
- Pricing details for any commercial Addressr offering or plan
- Traffic volumes (request rates, geographic breakdowns, peak load)
- API keys, tokens, session secrets, or any credential value
- Internal stakeholder names, team-size breakdowns, or hiring/staffing details

Use generic descriptions ("a consumer app", "production traffic", "the production gateway") instead of metric values. The risk-scorer's L3 commit-time check scans for these patterns; flagged disclosures must be redacted before commit.

## Risk Appetite

- **Commit risk appetite**: 4/25 (Low-band ceiling)
- **Push risk appetite**: 4/25 (Low-band ceiling)
- **Release risk appetite**: 4/25 (Low-band ceiling)

Cumulative residual risk at or below 4 is **within appetite** — the gates pass silently. Risk above 4 (i.e. 5 or higher) is **above appetite**:

- The `wr-risk-scorer:pipeline` agent will not emit "Proceed" or any go-ahead nudge.
- The `wr-itil:work-problems` orchestrator will drain the release queue (`push:watch`, `release:watch`) before continuing.
- Above-appetite work proceeds only via a structured `RISK_BYPASS:` token (`reducing` for ticket-closing remediations; `incident` for outage / security / disclosure response) or a deliberate user decision via `AskUserQuestion`.

This appetite is intentionally aligned with the upper bound of the **Low** band (4) so the agent's `<= 4 within appetite` gate logic and the policy match. A score of 5 is in the **Medium** band — that is above appetite by design.

## Impact Levels (project-specific)

Each level answers: "What happens to consumers, end users, or maintainers if this goes wrong?"

| Level | Label | Project-specific definition |
|-------|-------|------------------------------|
| 1 | Negligible | No user, consumer, or maintainer impact at all. Examples: docs typo in BRIEFING.md; trailing whitespace; comment rewording. |
| 2 | Minor | Internal-only friction; no consumer-visible effect. Examples: review-gate overhead on trivial UI edits (P001); risk-scorer drift on staging order (P002); CI logs spammy. |
| 3 | Moderate | Release pipeline disrupted such that consumers can't get updates, OR confidential business metrics committed to this public repo. Examples: CI silent failure when a required secret is missing (P008 pre-fix); a missing changeset omitting a published version; revenue / user-counts / pricing language committed in any file. |
| 4 | Significant | Published package degraded or broken for library consumers, including any **WCAG AA regression** that ships to consumers. Examples: HATEOAS rel discovery failing because of upstream cache (P004 pre-fix); a search method missing from a published `@mountainpass/addressr-*` version that consumers expected; `parseHighlight` regression that re-introduces XSS via `dangerouslySetInnerHTML`; a `downshift` integration regression breaking WAI-ARIA combobox semantics across the React/Svelte/Vue consumer apps. |
| 5 | Severe | Security or trust breach reaching consumers. Examples: a RapidAPI key or any `ADDRESSR_*` credential committed to git history; a published package shipping with credential-leaking telemetry; a license-non-compliance release (Apache-2.0 NOTICE / attribution stripped); a published version that exposes consumer-app users to PII leakage via accessibility metadata or telemetry. |

## Likelihood Levels (universal)

These are universal — defined by the `wr-risk-scorer:pipeline` agent contract, reproduced here for self-containment:

| Level | Label | Description |
|-------|-------|-------------|
| 1 | Rare | Trivial, isolated, well-understood. |
| 2 | Unlikely | Straightforward, clear scope. |
| 3 | Possible | Moderate complexity, multiple concerns. |
| 4 | Likely | Complex, spans modules, hard to predict. |
| 5 | Almost certain | High-complexity, critical paths, wide dependencies. |

## Risk Matrix

| Impact \ Likelihood | 1 Rare | 2 Unlikely | 3 Possible | 4 Likely | 5 Almost certain |
|---|---|---|---|---|---|
| 1 Negligible | 1 | 2 | 3 | 4 | 5 |
| 2 Minor | 2 | 4 | 6 | 8 | 10 |
| 3 Moderate | 3 | 6 | 9 | 12 | 15 |
| 4 Significant | 4 | 8 | 12 | 16 | 20 |
| 5 Severe | 5 | 10 | 15 | 20 | 25 |

## Label Bands

| Score Range | Label |
|-------------|-------|
| 1-2 | Very Low |
| 3-4 | Low |
| 5-9 | Medium |
| 10-16 | High |
| 17-25 | Very High |

The **Low** band's upper bound (4) is the **risk appetite ceiling** for all pipeline actions. Scores at 5 or higher are above appetite by design.

## References

- `wr-risk-scorer:pipeline` agent — uses these impact levels and the appetite for commit/push/release gate scoring.
- `wr-itil:manage-problem` skill — uses Severity (Impact x Likelihood) for WSJF problem ranking.
- `wr-itil:work-problems` Step 6.5 — uses the appetite to decide release-queue drain timing.

This policy supersedes the prior brief (5/25 appetite, sibling-repo reference, MCP-SDK risk note that did not apply to this UI-component project).
