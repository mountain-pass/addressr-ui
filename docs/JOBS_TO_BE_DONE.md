# Jobs To Be Done

## Primary Job

**When** a developer is building a web form that needs Australian address input,
**they want to** drop in a pre-built, accessible autocomplete component,
**so that** users can quickly find and select valid Australian addresses without manual entry.

## Job Map

| Step | User Action | Component Responsibility |
|------|------------|------------------------|
| 1. Discover | Developer finds the package for their framework | npm package with clear naming (@mountainpass/addressr-{framework}) |
| 2. Configure | Developer adds the component with API config | Minimal required props (apiUrl or apiKey + onSelect) |
| 3. Type | End user types an address fragment | Debounced search, loading indicator, screen reader announcements |
| 4. Browse | End user scans results | Highlighted matches, keyboard navigation, infinite scroll for more |
| 5. Select | End user picks an address | Full address detail returned via callback, input populated |
| 6. Correct | End user changes their mind | Clear and re-search, no stale state |

## Personas

### Developer (Integration)
- Needs: minimal config, TypeScript types, framework-idiomatic API
- Constraint: must work with existing form libraries and validation

### End User (Address Entry)
- Needs: fast results, easy scanning, keyboard-only operation
- Constraint: may use screen reader, may have slow connection, may be on mobile

## Screen Mapping

| Screen/State | Components |
|-------------|-----------|
| Empty | Label + input with placeholder |
| Searching | Input + "Searching..." indicator + sr announcement |
| Results | Input + dropdown listbox with highlighted options |
| No results | Input + "No addresses found" message |
| Error | Input + error alert |
| Selected | Input populated with SLA, detail returned to parent |
