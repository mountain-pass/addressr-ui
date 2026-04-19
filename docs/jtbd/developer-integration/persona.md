---
name: developer-integration
description: Developer integrating Australian address input into a web form
---

# Developer (Integration)

## Who

A web developer building a form or workflow that needs Australian address input. Works in React, Svelte, or Vue. Already has a form library and validation strategy in place. Wants to add a working, accessible address picker without building one from scratch.

## Context Constraints

- Must work with existing form libraries (React Hook Form, Formik, Zod, Vuelidate, Svelte forms, etc.)
- Needs TypeScript types out of the box
- Needs framework-idiomatic API — hook for React/Vue, store for Svelte
- Minimal configuration: API key + onSelect callback
- Must not pull in heavy dependencies
- Accessibility (WCAG AA) is a non-negotiable contract — the component must carry its own ARIA, keyboard, and screen-reader support

## Pain Points

- Building an accessible combobox from scratch takes weeks and is easy to get wrong
- Existing address APIs expose raw REST; no UI layer
- Framework-agnostic libraries feel foreign in any one framework
- Not knowing whether the API contract still holds (drift risk) between releases
