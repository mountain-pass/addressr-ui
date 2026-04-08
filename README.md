# @mountainpass/addressr-react

React address autocomplete component for Australian address search powered by [Addressr](https://addressr.io).

Search, validate, and retrieve detailed Australian address data from the Geocoded National Address File (G-NAF).

## Quick Start

### 1. Get an API Key

Sign up at [RapidAPI](https://rapidapi.com/addressr-addressr-default/api/addressr) to get your API key.

### 2. Install

```bash
npm install @mountainpass/addressr-react
```

### 3. Use the Component

```tsx
import { AddressAutocomplete } from '@mountainpass/addressr-react';
import '@mountainpass/addressr-react/style.css';

function MyForm() {
  return (
    <AddressAutocomplete
      apiKey="your-rapidapi-key"
      onSelect={(address) => {
        console.log(address.sla);           // "1 GEORGE ST, SYDNEY NSW 2000"
        console.log(address.structured);    // { street, locality, state, postcode, ... }
        console.log(address.geocoding);     // { latitude, longitude, ... }
      }}
    />
  );
}
```

### Or Use the Headless Hook

```tsx
import { useAddressSearch } from '@mountainpass/addressr-react';

function MyCustomAutocomplete() {
  const {
    query,
    setQuery,
    results,
    isLoading,
    selectedAddress,
    selectAddress,
    clear,
  } = useAddressSearch({ apiKey: 'your-rapidapi-key' });

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search addresses..."
      />
      {isLoading && <p>Searching...</p>}
      <ul>
        {results.map((result) => (
          <li key={result.pid} onClick={() => selectAddress(result.pid)}>
            {result.sla}
          </li>
        ))}
      </ul>
      {selectedAddress && (
        <pre>{JSON.stringify(selectedAddress, null, 2)}</pre>
      )}
    </div>
  );
}
```

## API

### `<AddressAutocomplete />`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `apiKey` | `string` | required | RapidAPI key |
| `onSelect` | `(address: AddressDetail) => void` | required | Called when an address is selected |
| `label` | `string` | `"Search Australian addresses"` | Accessible label |
| `placeholder` | `string` | `"Start typing an address..."` | Input placeholder |
| `className` | `string` | — | Additional CSS class for the wrapper |
| `debounceMs` | `number` | `300` | Debounce delay in milliseconds |
| `apiUrl` | `string` | `"https://addressr.p.rapidapi.com/"` | API root URL |

### `useAddressSearch(options)`

Returns `{ query, setQuery, results, isLoading, error, selectedAddress, selectAddress, clear }`.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | required | RapidAPI key |
| `apiUrl` | `string` | `"https://addressr.p.rapidapi.com/"` | API root URL |
| `debounceMs` | `number` | `300` | Debounce delay |
| `minQueryLength` | `number` | `3` | Minimum characters before searching |

### `createAddressrClient(options)`

Low-level API client for direct use. Returns `{ searchAddresses, getAddressDetail }`.

## Architecture

- **HATEOAS** — the component discovers API endpoints via RFC 8288 Link headers, not hardcoded paths
- **downshift** — WAI-ARIA APG combobox pattern with full keyboard navigation and screen reader support
- **CSS Modules** — scoped styles, override via `className` prop
- **Safe highlights** — search match highlighting rendered via `<mark>` elements, never `dangerouslySetInnerHTML`

## Accessibility

- WCAG AA compliant
- Full keyboard navigation (arrow keys, Enter, Escape)
- Screen reader announcements for results count and loading state
- Visible focus indicators (3:1 contrast ratio)
- Touch targets >= 44px
- Accessible label always present

## Data Source

Address data from the [Geocoded National Address File (G-NAF)](https://data.gov.au/dataset/ds-dga-19432f89-dc3a-4ef3-b943-5326ef1dbecc), Australia's authoritative address database.

## License

Apache-2.0
