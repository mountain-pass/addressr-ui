// Re-export everything from core
export * from '@mountainpass/addressr-core';

// Svelte-specific exports
export { createAddressSearch } from './createAddressSearch';
export type { AddressSearchOptions, AddressSearchState, AddressSearchStore } from './createAddressSearch';
export { default as AddressAutocomplete } from './AddressAutocomplete.svelte';
