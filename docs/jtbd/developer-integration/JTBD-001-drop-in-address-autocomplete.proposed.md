---
status: proposed
job-id: drop-in-address-autocomplete
persona: developer-integration
date-created: 2026-04-16
screens:
  - any form with an Australian address field
---

# JTBD-001: Drop-in Australian address autocomplete

## Job Statement

When I am building a web form that needs Australian address input, I want to drop in a pre-built accessible autocomplete component, so that users can quickly find and select valid Australian addresses without manual entry.

## Desired Outcomes

- Zero custom UI code for the address field
- Addresses are validated against authoritative data (GNAF)
- Full `AddressDetail` returned via callback for downstream use
- Component passes WCAG AA out of the box
- Works with my framework's idiomatic state/form patterns

## Persona Constraints

- Must work with existing form libraries and validation
- Must expose TypeScript types
- Minimal configuration: API key + onSelect

## Current Solutions

- Rolling a custom combobox against a raw REST API (weeks of work, a11y gaps)
- Using Google Places (not Australian-authoritative, expensive, tied to a map SDK)
- Free-text + manual validation (bad data downstream)
