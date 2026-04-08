# Agentic Risk Register

Tracks operational risks of autonomous agent-driven development in this repo.

| ID | Risk | Impact | Likelihood | Controls |
|----|------|--------|------------|----------|
| AR-001 | API key committed to repo | High | Rare | secret-leak-gate hook, .gitignore |
| AR-002 | Breaking SDK upgrade merged | Moderate | Unlikely | CI tests, dependency pinning |
| AR-003 | Incorrect API proxy behavior | Moderate | Unlikely | Integration tests against RapidAPI |
