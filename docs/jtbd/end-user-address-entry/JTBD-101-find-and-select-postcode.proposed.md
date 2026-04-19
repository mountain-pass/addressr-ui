---
status: proposed
job-id: find-and-select-postcode
persona: end-user-address-entry
date-created: 2026-04-16
screens:
  - Empty / Searching / Results / No results / Error / Selected (scoped to postcode value)
---

# JTBD-101: Pick an Australian postcode

## Job Statement

When a form asks for a postcode only, I want to type a postcode fragment and pick a valid match, so that I can complete a scoped form (e.g. shipping estimate) without entering a full address.

## Desired Outcomes

- Results scoped to postcodes only
- Same a11y and keyboard contract as full address input
- Selection populates the input with the postcode value

## Persona Constraints

- May use a screen reader
- May use keyboard only
- May be on a mobile device

## Current Solutions

- Free-text postcode field with regex validation (no suggestions, no authority check)
