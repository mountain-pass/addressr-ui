---
status: proposed
job-id: drop-in-locality-autocomplete
persona: developer-integration
date-created: 2026-04-16
screens:
  - any form requiring suburb/town selection (insurance region, delivery radius)
---

# JTBD-003: Drop-in Australian locality autocomplete

## Job Statement

When I need suburb/town selection in a form (e.g. insurance region, delivery radius), I want to drop in a locality autocomplete, so that users can pick a known Australian suburb or town without typing street-level detail.

## Desired Outcomes

- Locality-only results (suburb, town, locality)
- Typed `LocalitySearchResult` via callback
- Shares a11y and keyboard behaviour with the primary component

## Persona Constraints

- Must work with existing form libraries
- Must expose TypeScript types per endpoint
- Framework-idiomatic (hook/store/composable)

## Current Solutions

- Hardcoded suburb dropdowns that go stale
- Free-text suburb fields with no validation
