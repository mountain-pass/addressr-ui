---
'@mountainpass/addressr-react': minor
'@mountainpass/addressr-svelte': minor
'@mountainpass/addressr-vue': minor
---

Add `PostcodeAutocomplete`, `LocalityAutocomplete`, and `StateAutocomplete` components plus matching headless hooks/stores/composables (`usePostcodeSearch`/`useLocalitySearch`/`useStateSearch` for React and Vue, `createPostcodeSearch`/`createLocalitySearch`/`createStateSearch` for Svelte) across all three framework packages.

Each component mirrors the existing `AddressAutocomplete` baseline:

- WAI-ARIA combobox (`role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`, `aria-required`, `aria-invalid`, `aria-describedby`)
- `role="status"` `aria-live="polite"` live region with entity-specific announcements
- Full keyboard support (ArrowDown/Up, Enter, Escape; ArrowDown opens menu when closed)
- 44px minimum touch target and 3:1 focus ring inherited from existing `--addressr-*` tokens (no new tokens)
- Same four render zones per ADR 004: `renderItem`/`renderLoading`/`renderNoResults`/`renderError` (props in React, slots in Svelte/Vue: `item`, `loading`, `no-results`, `error`)

`onSelect` (React)/`select` event (Vue)/`onSelect` prop (Svelte) emits the search result directly — postcode, locality, and state results carry every field consumers need, so no follow-up HATEOAS detail fetch is performed (asymmetry with `AddressAutocomplete` is deliberate; see ADR 006).

Internal refactor: `useAddressSearch` (React/Vue) and `createAddressSearch` (Svelte) now delegate to a private generic primitive (`useSearch<T>` / `createSearch<T>`) shared with the new wrappers. Public API and behaviour unchanged — covered by existing test suites as a regression gate.

See ADR 006 (`docs/decisions/006-additional-search-endpoints.accepted.md`) for the architectural rationale.
