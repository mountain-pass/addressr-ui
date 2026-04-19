# Project Briefing

What future sessions need to know to be productive immediately.

## What You Need to Know

- **Push/release scripts**: Use `npm run push:watch` (not `git push`) and `npm run release:watch`. Hooks block direct git commands.
- **Review gates on UI files**: Editing `.tsx`, `.svelte`, `.vue` triggers 4 review agents (architect, JTBD, voice/tone, style guide). Run them in parallel to save time. Even test files with `.tsx` extension trigger gates.
- **TDD enforcement**: Implementation files (`.ts`, `.tsx`) are blocked until a test file is edited. For doc-only changes to `.tsx`, add a trivial test first to enter GREEN state.
- **Risk scoring required**: Every commit, push, and release needs a risk score from `wr-risk-scorer:pipeline`. Stage files before submitting the prompt — staging after causes "pipeline state drift" errors.
- **Retry affects error tests**: Default retry config (2 retries, 500ms) means error tests must mock consistent failures (not single rejections) or use `retry: false`. Framework component tests that trigger errors will time out otherwise.
- **Lint before push**: CI runs `pnpm lint` which catches issues vitest doesn't (unused imports, etc.). Always `pnpm lint` locally first.
- **CSS custom properties**: All visual tokens use `var(--addressr-*, default)` per ADR 002. Static analysis tests in each package enforce this — bare hex values outside `var()` will fail tests.
- **Fake timers + async**: Don't use fake timers for retry abort/exhaustion tests. Use real timers with tiny delays (1-5ms) to avoid unhandled rejections from timer/promise interactions.
- **Changesets are linked**: All 4 packages (core, react, svelte, vue) bump together. One changeset per feature, declare all 4.
- **Hooks read `$PWD`**: The JTBD hook (and likely others) checks for `docs/jtbd/` relative to the current working directory. Any `cd` inside a bash command persists across tool calls and can make hooks think docs are missing. Use absolute paths in bash commands; if you must `cd`, `cd` back to the project root in the same command.
- **JTBD lives in `docs/jtbd/`**: Per-persona directories with per-job `JTBD-NNN-*.proposed.md` files. The legacy `docs/JOBS_TO_BE_DONE.md` is a pointer stub. Edits to the structure trigger JTBD hook reviews; job status graduates `proposed → validated` by renaming.
- **Review markers expire**: Architect/JTBD/style/voice gate markers have a 30-minute TTL, and invalidate immediately when their policy file changes (e.g. adding a new ADR invalidates prior architect markers). Long sessions or cross-cutting edits need re-runs. Re-invoke the agent with a short summary — they can PASS in ~15s when nothing material changed.
- **Integration testing**: `pnpm test:integration` runs `*.integration.test.ts` files per ADR 005. Loud-fails without `ADDRESSR_RAPIDAPI_KEY`. Local: `op inject -i .env.tpl -o .env && set -a && source .env && set +a`. CI: injected from GitHub Actions secret.
- **RapidAPI edge-caches root (accepted)**: The RapidAPI gateway serves a stale `Link` header missing newer rels. Production client does NOT cache-bust — new rels are rare and the cache is desirable. Integration tests DO cache-bust (any query param works; server ignores unknown params) so they can verify the latest contract. Consequence: after a rel is added upstream, consumers won't discover it until the RapidAPI cache refreshes naturally.
- **Verify your own work**: When a fix/change needs verification, run it yourself via Bash rather than ending with "please verify X". The user has `op`, `pnpm`, `gh`, and the `.env`; use them. Only defer to the user for genuinely-interactive steps (browser clicks, their credentials, org-level GitHub actions).
- **External comms run through voice-tone**: Any message drafted for an external audience — maintainer emails, GitHub issue comments, PR descriptions on other repos — must be reviewed by `wr-voice-tone:agent` before sending. The project has `docs/VOICE-AND-TONE.md` for a reason; AI-sounding language (em dashes, hedging, "keep ticket open") is a recurring friction pattern across projects.

## What Will Surprise You

- **Risk appetite is 5/25**: Release risk scores above 5 block `release:watch`. Render customization scored 6/25 because custom renderers *could* bypass accessibility — needed JSDoc documentation to bring it within appetite.
- **ADRs needed for public API changes**: CSS tokens, retry config, and render props/slots each required an ADR before implementation. The architect agent flags these proactively.
- **ADR 001 reassessment triggered**: Three framework packages now exist, meeting ADR 001's reassessment criteria for considering Nx. Not acted on yet — turborepo is working fine.
- **Plan risk appetite is 5/25**: The plan-level risk scorer (not just release-level) enforces 5/25 max. A single minor bump across all 4 packages for cross-cutting work scored 9/25 and forced a **staged release** decomposition (R1 core, R2 frameworks). Decompose releases proactively for large refactor + new-feature combos.
- **HATEOAS discovery can be fragile**: The API's Link header is the source of truth for endpoint URLs, but a gateway cache in front of it broke discovery silently — the server had the new rels, the gateway served a stale response. Integration tests against the live API caught it; mocked tests never would have. ADR 005's every-push integration testing is earning its keep.
