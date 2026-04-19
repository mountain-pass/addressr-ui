---
status: proposed
job-id: find-and-select-locality
persona: end-user-address-entry
date-created: 2026-04-16
screens:
  - Empty / Searching / Results / No results / Error / Selected (scoped to locality value)
---

# JTBD-102: Pick an Australian suburb or town

## Job Statement

When a form asks for my suburb or town, I want to type a locality fragment and pick a valid match, so that my location is recorded correctly without spelling ambiguity.

## Desired Outcomes

- Results scoped to localities (suburbs, towns)
- Same a11y and keyboard contract as full address input
- Selection populates the input with the locality name

## Persona Constraints

- May use a screen reader
- May use keyboard only
- May be on a mobile device

## Current Solutions

- Hardcoded suburb dropdowns that are outdated
- Free-text field with typos going undetected
