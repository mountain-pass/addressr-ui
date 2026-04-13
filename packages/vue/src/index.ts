// Re-export everything from core
export * from '@mountainpass/addressr-core';

// Vue-specific exports
export { useAddressSearch } from './useAddressSearch';
export type { UseAddressSearchOptions, UseAddressSearchReturn } from './useAddressSearch';
export { default as AddressAutocomplete } from './AddressAutocomplete.vue';
