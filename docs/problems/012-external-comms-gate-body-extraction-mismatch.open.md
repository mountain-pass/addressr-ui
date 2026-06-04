---
id: PROB-012
status: open
severity: medium
created: 2026-06-02
upstream: windyroad/agent-plugins (wr-risk-scorer/external-comms-gate)
---

# External-comms gate body extraction is asymmetric vs the agent's `<draft>` contract

## Problem

The external-comms PreToolUse:Bash gate at `packages/risk-scorer/hooks/external-comms-gate.sh` extracts a "draft body" from the incoming command line and uses it to compute a marker key — `sha256(normalize(draft, surface) + '\n' + surface)`. The agent skill at `packages/risk-scorer/skills/assess-external-comms/SKILL.md` instructs callers to wrap **the draft body verbatim** in `<draft>...</draft>` markers and dispatch `wr-risk-scorer:external-comms` / `wr-voice-tone:external-comms`. The PostToolUse:Agent hook then derives a key from the agent's prompt and writes the marker.

Two extraction asymmetries break the marker-key match:

1. **Multi-`-m` git-commit-message surface**: the gate's body regex set matches the FIRST `-m`/`--message` literal only (pattern `(?:-m|--message)[= ]'([^']*)'` then `(?:-m|--message)[= ]"([^"]*)"`, first match wins). A commit composed as `git commit -m "subject" -m "RISK_BYPASS: ..."` therefore yields `DRAFT = "subject"`. The agent, following the SKILL contract, naturally wraps `subject\n\nbody` in `<draft>`, computes a key on the joined text, and emits PASS. Hook computes its key on the SUBJECT alone. Keys diverge → gate stays denied → mandatory re-dispatch of the agent with a stripped-down draft containing only the subject.

2. **`gh issue create --body-file` surface**: the gate's regex set has no `--body-file` pattern. DRAFT falls through to `""`. Key becomes `sha256("\ngh-issue-create")`. The agent (correctly) wrapped the actual body in `<draft>` and emitted a key for that body. Keys diverge → gate denied → required HEREDOC fallback (`gh issue create --body "$(cat <<'EOF' ... EOF)"`) which the gate DOES match via the leading `[<][<]\s*['\"]?EOF['\"]?` pattern.

The agent skill teaches the `<draft>` wrap-the-body shape uniformly; the gate's extraction surface enumerates a subset of how a body actually rides into a command. The two surfaces are documented independently and drift undetected because the gate's deny-message — "draft has not been reviewed by ..." — implies the AGENT failed to verdict, not that the KEY didn't align.

## Evidence

2026-06-02 session, downstream repo `Mountain-Pass/addressr-react`. Single AFK loop produced four discrete gate-marker-mismatch events across the session:

1. **Commit `369c47e`** — `docs(problems): capture P011 capture-problem-lacks-premise-triage` + `RISK_BYPASS: capture-deferred-readme` body. First risk-scorer Agent dispatch wrapped both lines in `<draft>`. PASS emitted; commit still denied. Re-dispatched with subject-only draft → marker landed → commit succeeded. Cost: 1 extra Agent round-trip (~12-14 s + tokens).
2. **Commit `754c3f2`** — `docs(problems): P011 reported upstream — agent-plugins#202` (single-line subject; no body). Risk + voice-tone dispatches succeeded on the first try because the agent's draft happened to equal the gate's extracted DRAFT (no body to strip).
3. **Commit `c167f00`** — `docs(problems): review — close P009, fold P010 + P011 into rankings` (single-line; no body, no trailer). Single try succeeded — same reason as above.
4. **Commit `d9151c1`** — `docs(problems): mark P006 upstream-report-pending` (single-line; no body). Single try succeeded.

The discriminator across these four cases is **whether a `-m`-supplied body or trailer is present**. The `RISK_BYPASS:` trailer pattern itself is the recurring trigger — every capture-problem commit and every Step 6.5 above-appetite drain carries it; every one of them therefore re-pays the round-trip tax until the agent learns to strip the body before dispatching.

Additionally, the `gh issue create --body-file /tmp/upstream-issue-body-P011.md` call against `windyroad/agent-plugins` (filing issue #202) hit the `--body-file` no-extraction case described above. The agent dispatch matched the file's full body; the gate computed `sha256("\ngh-issue-create")`. Mismatch → deny → fallback to a 100-line literal HEREDOC inline in the bash command. The HEREDOC succeeded because the gate's `[<][<]\s*['\"]?EOF['\"]?` regex picks it up. Cost: 1 extra round-trip and a 100-line inline HEREDOC (versus the cleaner `--body-file` path the surrounding tooling encourages).

## Impact

**Medium**. Per RISK-POLICY.md:

- **Impact 2 (Moderate — internal friction)**: each mismatch fires the deny-and-delegate prompt, the agent is re-dispatched, and the orchestrator burns 10-15 s + ~10K tokens per round-trip. No data corruption, no security exposure; pure overhead.
- **Likelihood 4 (Likely — fires on every `-m body` or `--body-file` commit/post)**: anyone using the standard `RISK_BYPASS:`-trailer pattern hits this on every capture-problem commit, every Step 6.5 above-appetite drain, every cohort-graduation amendment, every problem-ticket transition that carries a Fix Released annotation. The `--body-file` variant fires on every `gh issue create` / `gh pr create` that uses file-backed bodies.

Severity 2 × 4 = 8 (Medium band).

Cost compounds because:

- The deny message frames the failure as "agent didn't verdict", but the agent DID verdict; reading the hook source is the only way to learn the asymmetry. New maintainers re-discover it each time.
- AFK orchestrators that loop through many commits (e.g. `/wr-itil:work-problems` processing N tickets) re-pay the tax N times. The 2026-06-02 session paid 1 tax (the `RISK_BYPASS` trailer commit); a busy AFK session would pay it per iter.
- The HEREDOC workaround for `--body-file` inflates Bash tool calls from a 1-line invocation with a tidy file argument to a 100+-line inline literal that compromises auditability of the actual issue body in the Bash transcript.

## Potential Solutions

1. **Symmetric multi-`-m` concatenation + `--body-file` resolution (recommended)** — Update `external-comms-gate.sh`'s body extractor (lines 185-211) to:
   - Concatenate ALL `-m`/`--message` literal-arg payloads with `\n\n` separators when more than one is present, matching how git itself builds the commit message body (`git commit -m "S" -m "B"` writes `S\n\nB`). This makes the gate's DRAFT match the agent's `<draft>`-wrapped body byte-for-byte.
   - Add a `--body-file <path>` pattern that reads the file contents into DRAFT (same fail-soft contract as the existing patterns — missing file → DRAFT="" → gate falls through to the standard agent-review path).
   - Document the canonical normalisation in `packages/shared/hooks/lib/external-comms-key.sh` so the byte-symmetry contract stays in one place.

   Effort: M (single hook script + tests; canonical-key library already has the symmetric-normalisation entry point per ADR-028 amended 2026-05-25 P198 / #149).

2. **SKILL-side narrowing (cheaper alternative)** — Update `assess-external-comms` SKILL.md to teach the agent that `git-commit-message` surface MUST wrap only the subject line (first `-m` only) and `gh-issue-create` surface MUST wrap only the body that would ride via `--body "..."` or HEREDOC. This sidesteps the gate's extraction limit but pushes the asymmetry into agent prompt discipline — fragile (agents drift; the SKILL would need to enumerate every gated surface's extraction shape).

   Effort: S (SKILL prose edit). But: the `<draft>` shape is documented as "the draft body verbatim" — narrowing it surface-by-surface erodes that contract.

3. **Hybrid (Option 1 + advisory stderr on mismatch)** — Ship Option 1, AND add a one-line stderr advisory when the gate detects a deny-and-retry pattern (same SURFACE + similar prompt within 60 s, different KEY) so future drift surfaces visibly rather than as silent re-roundtrips.

   Effort: M+ (Option 1 + a small `/tmp/external-comms-recent-{key,surface}` ring buffer).

Option 1 is the durable answer; Option 2 is fragile prompt-engineering glue; Option 3 is the engineering-defence-in-depth shape.

## Routing

Upstream — `windyroad/agent-plugins`, plugin `wr-risk-scorer`, files `packages/risk-scorer/hooks/external-comms-gate.sh` (extractor extension) and `packages/shared/hooks/lib/external-comms-key.sh` (normalisation pairing for the multi-`-m` case). Tests at `packages/risk-scorer/hooks/test/external-comms-key.bats` (extend) and a new fixture for the multi-`-m` symmetry. SKILL.md prose updates at `packages/risk-scorer/skills/assess-external-comms/SKILL.md` to document the symmetry contract.

No local code change available; this ticket exists to anchor the friction and feed the upstream report.

## Related

- 2026-06-02 capture session, this ticket's evidence (four commit attempts, one gh issue file). Recurring class-of-behaviour observation from `/wr-retrospective:run-retro` Step 2b pipeline-instability scan; routed via the P342 mechanical-stage carve-out to capture-problem.
- P005 (`docs/problems/005-external-comms-voice-tone-skipped.parked.md`) — sibling upstream ticket on the same gate family; batch into one PR if both go upstream in the same window.
- P011 (`docs/problems/011-capture-problem-lacks-premise-triage.open.md`) — also reported against `windyroad/agent-plugins`. Both this and P011 surface gaps that the `/wr-itil:capture-problem` skill itself revealed during the same session.
- ADR-028 amended 2026-05-25 (P198 / #149) — establishes the canonical-key normalisation at `compute_external_comms_key`; this ticket extends the contract on the gate's INPUT-extraction side so the symmetric normalisation has matched inputs to hash.
- **Upstream report pending** — external dependency identified; invoke /wr-itil:report-upstream when ready.

## Fix Strategy

- **Kind**: improve
- **Shape**: hook (with paired skill-prose addendum)
- **Target files**:
  - `packages/risk-scorer/hooks/external-comms-gate.sh` (lines 185-211 — extend body-extraction regex set).
  - `packages/shared/hooks/lib/external-comms-key.sh` (document the multi-`-m` concatenation normalisation pair).
  - `packages/risk-scorer/skills/assess-external-comms/SKILL.md` (note that the gate now extracts symmetrically; the agent's `<draft>` shape stays "the body verbatim" without surface-specific narrowing).
- **Observed flaw**: extractor matches only the first `-m` arg and has no `--body-file` clause; the agent's documented `<draft>` shape covers the FULL body; the asymmetry costs a round-trip per gated invocation.
- **Edit summary**: concatenate all `-m`/`--message` payloads with `\n\n`; add a `--body-file <path>` extraction pattern with fail-soft missing-file handling; add bats fixtures for both shapes.
- **Evidence**: four commits + one `gh issue create` in the 2026-06-02 session demonstrated the mismatch deterministically; the `RISK_BYPASS:`-trailer pattern triggers it on every body-bearing commit.

## Additional Evidence — 2026-06-03/04 session

The same gate class re-fired on the **`changeset-author` surface**, surfacing a sibling failure mode the prior evidence section did not capture:

- Empty changeset created via `pnpm changeset --empty` (`.changeset/plenty-olives-tap.md`, 2-line `---\n---\n` frontmatter shell). The body needed to document the dev-only Playwright bump (`1.59.1 → 1.60.0`) since the empty changeset produces no version bumps but its summary still lands in CHANGELOG.md on the next release.
- First Write of the body content was risk-reviewed and PASSED via `wr-risk-scorer:external-comms` (sha256 over the body + `\n` + `changeset-author`). Marker landed. Body committed.
- A subsequent Write to expand the body content was then **blocked** by the same gate — a new sha256 because the body bytes had changed. Meanwhile a Bash `git commit` ran in parallel and **proceeded** using the prior marker key (the gate's PreToolUse:Bash extracted whatever was on disk, which still matched the earlier-approved key because the Write's modification was still pending on the cancelled Edit). Net result: the commit landed with the OLD (short) body text, not the body I was editing toward.
- The committed empty-changeset body therefore reads `---\n---\n` with no descriptive summary — CHANGELOG.md will get a blank line on the next release. Cosmetic damage; recoverable by a follow-up edit + amend.

This adds two distinct evidence rows to the body-extraction-asymmetry class:

1. **`changeset-author` surface extraction quirk** — the gate strips frontmatter before hashing (`changeset-author` surface MUST exclude the leading `---\n...\n---\n` block per ADR-028 amended 2026-05-25 / P198). The agent following the SKILL.md verbatim wraps the post-frontmatter body in `<draft>`. The gate's `tool_input.content` extraction reads the WHOLE write content including frontmatter. The `compute_external_comms_key` normalisation IS supposed to strip the frontmatter before hashing (per `external-comms-key.sh`), so this SHOULD work — but if the canonical normalisation isn't byte-identical between gate and agent path, the keys diverge. The 2026-06-03/04 session's empty-body case obscured whether the divergence was a canonical-normalisation drift or a Write/Bash race; the next reproducer should pin one direction.
2. **Cross-tool marker-validity race on writes** — the PreToolUse:Write hook reads CURRENT file state (the about-to-be-written content) and the PreToolUse:Bash hook reads CURRENT command line. A parallel Bash `git commit` that fires while a Write is blocked at the gate will use whatever ON-DISK state matches the prior approved marker, NOT the in-progress Write. This is the structural cause of "committed empty body when I was Editing toward a longer body": the Bash tool's git commit + the Write tool's content-update are racing against the same marker namespace.

The Step 4b Stage 2 Fix Strategy carries forward unchanged — Option 1 symmetric extractor extension at `external-comms-gate.sh` (lines 185-211) covers the multi-`-m` and `--body-file` cases. The cross-tool race (point 2 above) is a related but distinct concern; it's the marker's per-key-per-session lock semantics, not the input-extraction shape. If the upstream PR addresses the input symmetry but not the marker lock, expect this exact "race-committed empty body" pattern to recur on changeset surfaces.
