---
"@mountainpass/addressr-core": minor
"@mountainpass/addressr-react": minor
"@mountainpass/addressr-svelte": minor
"@mountainpass/addressr-vue": minor
---

Loading skeleton animation and render customization for styled components.

- **Skeleton loading**: Replaces "Searching..." text with 3 animated shimmer lines. Respects `prefers-reduced-motion: reduce`. Customizable via `--addressr-skeleton-from` and `--addressr-skeleton-to` tokens.
- **React render props**: `renderLoading`, `renderNoResults`, `renderError`, `renderItem` — override any rendering zone while keeping built-in accessibility.
- **Svelte named slots**: `loading`, `no-results` — slot-based customization.
- **Vue scoped slots**: `loading`, `no-results` — scoped slot customization.
- Default rendering is unchanged when no overrides are provided.
