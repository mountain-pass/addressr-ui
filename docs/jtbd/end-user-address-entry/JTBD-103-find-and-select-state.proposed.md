---
status: proposed
job-id: find-and-select-state
persona: end-user-address-entry
date-created: 2026-04-16
screens:
  - Empty / Searching / Results / No results / Error / Selected (scoped to state value)
---

# JTBD-103: Pick an Australian state or territory

## Job Statement

When a form asks for my state or territory, I want to type a fragment and pick a valid match, so that my state is recorded from authoritative data rather than free text.

## Desired Outcomes

- Results scoped to states/territories
- Same a11y and keyboard contract as full address input
- Selection populates the input with the state value

## Persona Constraints

- May use a screen reader
- May use keyboard only
- May be on a mobile device

## Current Solutions

- Hardcoded 8-option dropdowns
- Free-text field with typos
