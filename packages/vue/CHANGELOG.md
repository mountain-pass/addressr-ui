# @mountainpass/addressr-vue

## 0.6.1

### Patch Changes

- 2f606df: docs: document theming, render customization, form props, retry config, and skeleton loading in READMEs
- Updated dependencies [2f606df]
  - @mountainpass/addressr-core@0.6.1

## 0.6.0

### Minor Changes

- 2856995: Loading skeleton animation and render customization for styled components.
  - **Skeleton loading**: Replaces "Searching..." text with 3 animated shimmer lines. Respects `prefers-reduced-motion: reduce`. Customizable via `--addressr-skeleton-from` and `--addressr-skeleton-to` tokens.
  - **React render props**: `renderLoading`, `renderNoResults`, `renderError`, `renderItem` — override any rendering zone while keeping built-in accessibility.
  - **Svelte named slots**: `loading`, `no-results` — slot-based customization.
  - **Vue scoped slots**: `loading`, `no-results` — scoped slot customization.
  - Default rendering is unchanged when no overrides are provided.

### Patch Changes

- Updated dependencies [2856995]
  - @mountainpass/addressr-core@0.6.0

## 0.5.0

### Minor Changes

- 636c530: Error retry with exponential backoff for all API requests.
  - Transient failures (network errors, 5xx, 429) are retried automatically with exponential backoff and jitter
  - Client errors (4xx) fail immediately — no wasted retries
  - Default: 2 retries, 500ms base delay, 5s max delay
  - Configurable via `retry` option on `createAddressrClient`, or disable with `retry: false`
  - Respects AbortSignal during backoff — cancelled requests stop retrying immediately

### Patch Changes

- Updated dependencies [636c530]
  - @mountainpass/addressr-core@0.5.0

## 0.4.0

### Minor Changes

- 69246f7: Prefetch API root on mount, CSS custom properties for theming, and accessibility fixes.
  - **Prefetch**: API root discovery now happens eagerly on mount, eliminating the extra round-trip on the first search.
  - **CSS custom properties**: All visual tokens exposed as `--addressr-*` custom properties. Override on any ancestor element to theme the component without forking. Defaults preserve current appearance.
  - **Accessibility**: Added `name` and `required` props, `aria-atomic` on React status region, `aria-invalid` binding from error state, and `tabindex="-1"` on list items in Svelte/Vue.

### Patch Changes

- Updated dependencies [69246f7]
  - @mountainpass/addressr-core@0.4.0

## 0.3.0

### Minor Changes

- 50b8be0: Add Svelte and Vue address autocomplete packages. Both provide a headless
  state layer (Svelte store / Vue composable) and a drop-in styled component
  with WAI-ARIA combobox pattern, keyboard navigation, infinite scroll
  pagination, and screen reader announcements. Both depend on
  @mountainpass/addressr-core for the HATEOAS API client.
