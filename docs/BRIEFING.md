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

## What Will Surprise You

- **Risk appetite is 5/25**: Release risk scores above 5 block `release:watch`. Render customization scored 6/25 because custom renderers *could* bypass accessibility — needed JSDoc documentation to bring it within appetite.
- **ADRs needed for public API changes**: CSS tokens, retry config, and render props/slots each required an ADR before implementation. The architect agent flags these proactively.
- **ADR 001 reassessment triggered**: Three framework packages now exist, meeting ADR 001's reassessment criteria for considering Nx. Not acted on yet — turborepo is working fine.
