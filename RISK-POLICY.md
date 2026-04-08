# Risk Policy

This project follows the risk management approach documented in the companion [addressr](https://github.com/mountain-pass/addressr) repository. Risk scoring is enforced via Claude Code hooks.

## Risk Appetite

- **Release risk appetite**: 5/25 (Low)
- **Commit risk appetite**: 5/25 (Low)

## Key Risks

1. **API key exposure** — RAPIDAPI_KEY must never be committed. Mitigated by secret-leak-gate hook.
2. **RapidAPI dependency** — service availability depends on RapidAPI uptime. Mitigated by health tool and graceful error handling.
3. **MCP SDK breaking changes** — upstream SDK updates could break the server. Mitigated by pinned dependency ranges and CI tests.
