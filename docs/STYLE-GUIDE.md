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

## Component Patterns

- Scoped styles per framework (CSS Modules for React, `<style>` for Svelte, `<style scoped>` for Vue)
- Class names prefixed with `addressr-` in Svelte/Vue to avoid collisions
- Focus indicators: 2px solid outline with 1px offset
- Mark elements for highlights: transparent background, bold weight, inherited color
- sr-only pattern: absolute position, 1px clip rect
