---
status: proposed
job-id: drop-in-postcode-autocomplete
persona: developer-integration
date-created: 2026-04-16
screens:
  - any form where only a postcode is needed (shipping estimate, service-area check)
---

# JTBD-002: Drop-in Australian postcode autocomplete

## Job Statement

When I am building a form where only the postcode is needed (e.g. shipping estimate, service-area check), I want to drop in a postcode autocomplete that reuses the accessibility, debouncing, and keyboard navigation of the primary component, so that users can complete postcode-only forms without entering a full address.

## Desired Outcomes

- Narrower input domain than full address — postcode results only
- Shares debounce, abort, and ARIA behaviour with the primary component
- Returns a typed `PostcodeSearchResult` via callback
- No additional configuration beyond what the address component needs

## Persona Constraints

- Must work with existing form libraries
- Must expose TypeScript types per endpoint
- Framework-idiomatic (hook/store/composable)

## Current Solutions

- Free-text postcode field with client-side regex validation
- Reusing the full address autocomplete and parsing the postcode out of the result
