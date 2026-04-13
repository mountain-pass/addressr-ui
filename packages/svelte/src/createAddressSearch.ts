import { writable, type Readable } from 'svelte/store';
import type { Link } from '@windyroad/link-header';
import {
  createAddressrClient,
  type AddressSearchResult,
  type AddressDetail,
  type SearchPage,
} from '@mountainpass/addressr-core';

export interface AddressSearchOptions {
  /** RapidAPI key. Omit when connecting directly to an addressr instance. */
  apiKey?: string;
  apiUrl?: string;
  apiHost?: string;
  debounceMs?: number;
  minQueryLength?: number;
  /** Custom fetch implementation (useful for testing) */
  fetchImpl?: typeof fetch;
}

export interface AddressSearchState {
  query: string;
  results: AddressSearchResult[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: Error | null;
  selectedAddress: AddressDetail | null;
}

export interface AddressSearchStore extends Readable<AddressSearchState> {
  setQuery: (q: string) => void;
  loadMore: () => Promise<void>;
  selectAddress: (pid: string) => Promise<void>;
  clear: () => void;
  destroy: () => void;
}

export function createAddressSearch(options: AddressSearchOptions): AddressSearchStore {
  const {
    apiKey,
    apiUrl,
    apiHost,
    debounceMs = 300,
    minQueryLength = 3,
    fetchImpl,
  } = options;

  const client = createAddressrClient({ apiKey, apiUrl, apiHost, fetchImpl });

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let abortController: AbortController | undefined;
  let nextLink: Link | null = null;
  let searchPage: SearchPage | null = null;
  // No debouncedQuery tracking needed — the timer handles debounce directly

  const { subscribe, set, update } = writable<AddressSearchState>({
    query: '',
    results: [],
    isLoading: false,
    isLoadingMore: false,
    hasMore: false,
    error: null,
    selectedAddress: null,
  });

  function doSearch(query: string) {
    if (query.length < minQueryLength) {
      update((s) => ({ ...s, results: [], isLoading: false, hasMore: false }));
      nextLink = null;
      searchPage = null;
      return;
    }

    abortController?.abort();
    const controller = new AbortController();
    abortController = controller;

    update((s) => ({ ...s, isLoading: true, error: null }));

    client
      .searchAddresses(query, controller.signal)
      .then((page) => {
        if (!controller.signal.aborted) {
          nextLink = page.nextLink;
          searchPage = page;
          update((s) => ({
            ...s,
            results: page.results,
            isLoading: false,
            hasMore: page.nextLink !== null,
          }));
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted && err.name !== 'AbortError') {
          nextLink = null;
          searchPage = null;
          update((s) => ({
            ...s,
            error: err,
            isLoading: false,
            results: [],
            hasMore: false,
          }));
        }
      });
  }

  function setQuery(q: string) {
    update((s) => ({ ...s, query: q }));
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      doSearch(q);
    }, debounceMs);
  }

  async function loadMore() {
    if (!nextLink) return;

    let currentlyLoading = false;
    update((s) => {
      currentlyLoading = s.isLoadingMore;
      return s;
    });
    if (currentlyLoading) return;

    update((s) => ({ ...s, isLoadingMore: true }));
    try {
      const page = await client.fetchNextPage(nextLink);
      nextLink = page.nextLink;
      searchPage = page;
      update((s) => ({
        ...s,
        results: [...s.results, ...page.results],
        isLoadingMore: false,
        hasMore: page.nextLink !== null,
      }));
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        update((s) => ({ ...s, error: err as Error, isLoadingMore: false }));
      }
    }
  }

  async function selectAddress(pid: string) {
    let currentResults: AddressSearchResult[] = [];
    update((s) => {
      currentResults = s.results;
      return s;
    });

    const index = currentResults.findIndex((r) => r.pid === pid);
    const detail = await client.getAddressDetail(
      pid,
      undefined,
      index !== -1 ? searchPage ?? undefined : undefined,
      index !== -1 ? index : undefined,
    );
    update((s) => ({ ...s, selectedAddress: detail }));
  }

  function clear() {
    clearTimeout(debounceTimer);
    abortController?.abort();
    nextLink = null;
    searchPage = null;
    set({
      query: '',
      results: [],
      isLoading: false,
      isLoadingMore: false,
      hasMore: false,
      error: null,
      selectedAddress: null,
    });
  }

  function destroy() {
    clearTimeout(debounceTimer);
    abortController?.abort();
  }

  return {
    subscribe,
    setQuery,
    loadMore,
    selectAddress,
    clear,
    destroy,
  };
}
