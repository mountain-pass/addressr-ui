# @mountainpass/addressr-core

## 0.5.0

### Minor Changes

- 636c530: Error retry with exponential backoff for all API requests.
  - Transient failures (network errors, 5xx, 429) are retried automatically with exponential backoff and jitter
  - Client errors (4xx) fail immediately — no wasted retries
  - Default: 2 retries, 500ms base delay, 5s max delay
  - Configurable via `retry` option on `createAddressrClient`, or disable with `retry: false`
  - Respects AbortSignal during backoff — cancelled requests stop retrying immediately

## 0.4.0

### Minor Changes

- 69246f7: Prefetch API root on mount, CSS custom properties for theming, and accessibility fixes.
  - **Prefetch**: API root discovery now happens eagerly on mount, eliminating the extra round-trip on the first search.
  - **CSS custom properties**: All visual tokens exposed as `--addressr-*` custom properties. Override on any ancestor element to theme the component without forking. Defaults preserve current appearance.
  - **Accessibility**: Added `name` and `required` props, `aria-atomic` on React status region, `aria-invalid` binding from error state, and `tabindex="-1"` on list items in Svelte/Vue.
