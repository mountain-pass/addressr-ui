// Re-export everything from core for convenience
export * from '@mountainpass/addressr-core';

// React-specific exports
export { useAddressSearch } from './hooks/useAddressSearch';
export type { UseAddressSearchOptions, UseAddressSearchReturn } from './hooks/useAddressSearch';
export { AddressAutocomplete } from './components/AddressAutocomplete';
export type { AddressAutocompleteProps } from './components/AddressAutocomplete';
