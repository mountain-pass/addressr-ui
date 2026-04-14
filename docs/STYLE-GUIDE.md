# Style Guide

## Design Tokens

### Colors
| Token | Value | Usage |
|-------|-------|-------|
| Border | `#767676` | Input and menu borders (4.5:1 contrast on white) |
| Focus ring | `#005fcc` | Focus-visible outline (3:1 contrast on white) |
| Highlight bg | `#e8f0fe` | Hovered/active option background |
| Error | `#d32f2f` | Error text |
| Muted text | `#555` | Loading, no-results text |
| Background | `#fff` | Menu background |

### Typography
| Token | Value | Usage |
|-------|-------|-------|
| Font family | `system-ui, -apple-system, sans-serif` | All text |
| Label size | `0.875rem` | Label text |
| Input size | `1rem` | Input text |
| Item size | `0.9375rem` | Option text |
| Line height | `1.4`–`1.5` | All text |

### Spacing
| Token | Value | Usage |
|-------|-------|-------|
| Input padding | `0.625rem 0.75rem` | Input and option padding |
| Label margin | `0.25rem` bottom | Gap between label and input |
| Border radius | `0.25rem` | Input and menu corners |

### Sizing
| Token | Value | Usage |
|-------|-------|-------|
| Min touch target | `2.75rem` (44px) | Option min-height |
| Menu max-height | `20rem` | Dropdown scroll area |
| Menu z-index | `1000` | Dropdown stacking |

## CSS Custom Properties (Theming)

All visual tokens are exposed as CSS custom properties with the `--addressr-` prefix. Consumers override them on any ancestor element. Defaults match the hardcoded values below — no visual change when no properties are set.

### Usage

```css
/* Override on a wrapper element */
.my-form {
  --addressr-border-color: #000;
  --addressr-focus-color: #0066cc;
  --addressr-highlight-bg: #fff3cd;
}
```

### Token Reference

| Property | Default | Usage |
|----------|---------|-------|
| `--addressr-font-family` | `system-ui, -apple-system, sans-serif` | All text |
| `--addressr-border-color` | `#767676` | Input/menu borders |
| `--addressr-border-radius` | `0.25rem` | Corners |
| `--addressr-focus-color` | `#005fcc` | Focus ring |
| `--addressr-highlight-bg` | `#e8f0fe` | Hovered option bg |
| `--addressr-bg` | `#fff` | Menu bg |
| `--addressr-text-color` | `inherit` | Primary text |
| `--addressr-muted-color` | `#555` | Loading/no-results |
| `--addressr-error-color` | `#d32f2f` | Error text |
| `--addressr-mark-color` | `inherit` | Highlight mark text |
| `--addressr-mark-weight` | `700` | Highlight mark weight |
| `--addressr-padding-x` | `0.75rem` | Horizontal padding |
| `--addressr-padding-y` | `0.625rem` | Vertical padding |
| `--addressr-shadow` | `0 4px 6px rgba(0,0,0,0.1)` | Menu shadow |
| `--addressr-z-index` | `1000` | Menu stacking |

### Skeleton Loading Tokens

| Property | Default | Usage |
|----------|---------|-------|
| `--addressr-skeleton-from` | `#e0e0e0` | Skeleton gradient start/end |
| `--addressr-skeleton-to` | `#f0f0f0` | Skeleton gradient midpoint |

### Animation

- Skeleton shimmer: `addressr-shimmer` keyframe, 1.5s infinite, linear
- Respects `prefers-reduced-motion: reduce` — disables animation

### Contrast Requirements

When overriding `--addressr-highlight-bg`, ensure the mark text color (`--addressr-mark-color`) maintains at least 4.5:1 contrast ratio against the new background. When overriding `--addressr-bg`, ensure all text colors maintain WCAG AA contrast.

## Component Patterns

- Scoped styles per framework (CSS Modules for React, `<style>` for Svelte, `<style scoped>` for Vue)
- Class names prefixed with `addressr-` in Svelte/Vue to avoid collisions
- Focus indicators: 2px solid outline with 1px offset
- Mark elements for highlights: transparent background, bold weight, inherited color
- sr-only pattern: absolute position, 1px clip rect
