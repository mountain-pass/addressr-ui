export { useAddressSearch } from './hooks/useAddressSearch';
export type { UseAddressSearchOptions, UseAddressSearchReturn } from './hooks/useAddressSearch';
export { AddressAutocomplete } from './components/AddressAutocomplete';
export type { AddressAutocompleteProps } from './components/AddressAutocomplete';
export { createAddressrClient } from './api';
export type { AddressrClientOptions, AddressrClient } from './api';
export { parseHighlight } from './utils/parseHighlight';
export type {
  AddressSearchResult,
  AddressDetail,
  StructuredAddress,
  AddressGeocoding,
  HighlightSegment,
} from './types';
