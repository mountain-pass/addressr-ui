import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createAddressrClient } from '../api';
import type { AddressSearchResult, AddressDetail } from '../types';

export interface UseAddressSearchOptions {
  apiKey: string;
  apiUrl?: string;
  apiHost?: string;
  debounceMs?: number;
  minQueryLength?: number;
  /** @internal — for testing only */
  fetchImpl?: typeof fetch;
}

export interface UseAddressSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  results: AddressSearchResult[];
  isLoading: boolean;
  error: Error | null;
  selectedAddress: AddressDetail | null;
  selectAddress: (pid: string) => Promise<void>;
  clear: () => void;
}

export function useAddressSearch(options: UseAddressSearchOptions): UseAddressSearchReturn {
  const {
    apiKey,
    apiUrl,
    apiHost,
    debounceMs = 300,
    minQueryLength = 3,
    fetchImpl,
  } = options;

  const [query, setQueryState] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<AddressSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<AddressDetail | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const abortRef = useRef<AbortController>(undefined);

  const client = useMemo(
    () => createAddressrClient({ apiKey, apiUrl, apiHost, fetchImpl }),
    [apiKey, apiUrl, apiHost, fetchImpl],
  );

  const setQuery = useCallback(
    (q: string) => {
      setQueryState(q);
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setDebouncedQuery(q);
      }, debounceMs);
    },
    [debounceMs],
  );

  // Search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length < minQueryLength) {
      setResults([]);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    client
      .searchAddresses(debouncedQuery, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setResults(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted && err.name !== 'AbortError') {
          setError(err);
          setIsLoading(false);
          setResults([]);
        }
      });

    return () => controller.abort();
  }, [debouncedQuery, minQueryLength, client]);

  const selectAddress = useCallback(
    async (pid: string) => {
      const detail = await client.getAddressDetail(pid);
      setSelectedAddress(detail);
    },
    [client],
  );

  const clear = useCallback(() => {
    setQueryState('');
    setDebouncedQuery('');
    setResults([]);
    setSelectedAddress(null);
    setError(null);
  }, []);

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    selectedAddress,
    selectAddress,
    clear,
  };
}
