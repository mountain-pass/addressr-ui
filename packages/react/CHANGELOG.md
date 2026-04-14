# @mountainpass/addressr-react

## 0.4.0

### Minor Changes

- 69246f7: Prefetch API root on mount, CSS custom properties for theming, and accessibility fixes.
  - **Prefetch**: API root discovery now happens eagerly on mount, eliminating the extra round-trip on the first search.
  - **CSS custom properties**: All visual tokens exposed as `--addressr-*` custom properties. Override on any ancestor element to theme the component without forking. Defaults preserve current appearance.
  - **Accessibility**: Added `name` and `required` props, `aria-atomic` on React status region, `aria-invalid` binding from error state, and `tabindex="-1"` on list items in Svelte/Vue.

### Patch Changes

- Updated dependencies [69246f7]
  - @mountainpass/addressr-core@0.4.0
