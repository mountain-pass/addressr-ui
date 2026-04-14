---
status: "proposed"
date: 2026-04-14
decision-makers: [Tom Howard, Claude Code]
consulted: [wr-architect:agent, wr-jtbd:agent]
informed: []
---

# Use framework-idiomatic render customization for styled components

## Context and Problem Statement

The AddressAutocomplete styled components have fixed internal rendering — consumers cannot customize how results, loading states, or errors are displayed without forking the component or using the headless hooks/stores. Developers who want the convenience of the styled component but need to adjust specific rendering zones (e.g., custom result formatting, branded loading states) have no middle ground.

## Decision Drivers

- Developers want drop-in convenience with selective customization
- Each framework has its own idiomatic customization pattern
- Headless hooks/stores already serve consumers who want full control
- Default rendering must remain unchanged when no customization is provided
- Skeleton loading improves perceived performance for all users

## Considered Options

1. **Framework-idiomatic render customization** (render props for React, named slots for Svelte/Vue)
2. **Headless-only approach** (remove styled components, consumers compose their own)
3. **Unified cross-framework API** (e.g., configuration object for all rendering)

## Decision Outcome

Chosen option: **1 — Framework-idiomatic render customization**, because it preserves the drop-in experience while giving developers familiar customization patterns for their chosen framework.

### Customization points

| Zone | React (render prop) | Svelte (slot) | Vue (scoped slot) |
|------|-------------------|---------------|-------------------|
| Result item | `renderItem` | `<slot name="item">` | `<slot name="item">` |
| Loading | `renderLoading` | `<slot name="loading">` | `<slot name="loading">` |
| No results | `renderNoResults` | `<slot name="no-results">` | `<slot name="no-results">` |
| Error | `renderError` | `<slot name="error">` | `<slot name="error">` |

### Default rendering

When no customization is provided:
- **Loading**: 3 skeleton shimmer lines (80%, 60%, 70% width) with CSS animation
- **No results**: "No addresses found" (italic, muted)
- **Error**: Error message (red, alert role)
- **Result item**: Highlighted address text with `<mark>` elements

### Skeleton tokens

Two new CSS custom properties extend ADR 002's token system:
- `--addressr-skeleton-from` (default: `#e0e0e0`)
- `--addressr-skeleton-to` (default: `#f0f0f0`)

## Consequences

### Good

- Selective customization without losing built-in accessibility
- Framework-idiomatic — developers use familiar patterns
- Skeleton loading improves perceived performance for all users by default
- Render props/slots receive all necessary data (item, highlighted state, segments)

### Neutral

- Render prop/slot names become a compatibility surface
- Four customization points is a manageable API surface

### Bad

- Custom renderers must maintain their own accessibility (aria attributes, keyboard support)
- Skeleton animation adds CSS complexity (~15 lines per framework)

## Confirmation

- Default rendering is visually identical when no render props/slots are provided
- Custom render functions receive item, highlighted state, and parsed highlight segments
- Skeleton loading uses CSS custom properties with fallback defaults (no hardcoded colors)
- Skeleton animation respects `prefers-reduced-motion: reduce`
- All existing component tests continue to pass

## Pros and Cons of the Options

### Framework-idiomatic render customization

- Good: Familiar patterns for each framework's developers
- Good: Preserves drop-in convenience with selective overrides
- Bad: Slightly different API per framework (render props vs slots)

### Headless-only approach

- Good: Maximum flexibility, minimal API surface
- Bad: Eliminates the drop-in experience entirely
- Bad: Every consumer must build their own accessibility

### Unified cross-framework API

- Good: Single documentation for all frameworks
- Bad: Configuration objects are not idiomatic for any framework
- Bad: Harder to pass complex JSX/template content via config

## Reassessment Criteria

- If more than 6 customization zones are requested, consider a compound component pattern
- If accessibility issues arise from custom renderers, consider providing accessibility wrappers
