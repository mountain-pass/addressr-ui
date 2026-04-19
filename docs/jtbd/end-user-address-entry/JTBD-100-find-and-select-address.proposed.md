---
status: proposed
job-id: find-and-select-address
persona: end-user-address-entry
date-created: 2026-04-16
screens:
  - Empty — label + input with placeholder
  - Searching — input + loading indicator + sr announcement
  - Results — input + dropdown listbox with highlighted matches
  - No results — input + "No addresses found" message
  - Error — input + error alert
  - Selected — input populated with SLA
---

# JTBD-100: Find and select an Australian address quickly

## Job Statement

When I am filling in a web form that asks for an Australian address, I want to type a fragment of my address and pick the right match from a list, so that I can complete the form correctly without remembering exact formatting.

## Desired Outcomes

- Results appear within a few hundred milliseconds of typing
- Matches are highlighted so I can scan quickly
- I can pick a result with keyboard, mouse, or touch
- Screen reader announces result counts and selection
- I can correct a mistake without retyping everything

## Persona Constraints

- May use a screen reader
- May use keyboard only
- May be on a mobile device or slow connection

## Current Solutions

- Typing the full address and hoping the form accepts it
- Copy-pasting from another tab
