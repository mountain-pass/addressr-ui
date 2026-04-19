---
status: proposed
job-id: drop-in-state-autocomplete
persona: developer-integration
date-created: 2026-04-16
screens:
  - any form requiring state/territory selection (tax jurisdiction, regional config)
---

# JTBD-004: Drop-in Australian state autocomplete

## Job Statement

When I need state/territory selection in a form (e.g. tax jurisdiction), I want to drop in a state autocomplete, so that users can pick a state or territory from authoritative data rather than a free-text field.

## Desired Outcomes

- State/territory results from authoritative data
- Typed `StateSearchResult` via callback
- Shares a11y and keyboard behaviour with the primary component

## Persona Constraints

- Must work with existing form libraries
- Must expose TypeScript types per endpoint
- Framework-idiomatic (hook/store/composable)

## Current Solutions

- Hardcoded 8-option dropdowns — fine for Australia but inconsistent API surface across other country scopes
- Free-text state field with regex validation
