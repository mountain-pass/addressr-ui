import { ref, watch, onUnmounted, type Ref } from 'vue';
import type { Link } from '@windyroad/link-header';
import {
  createAddressrClient,
  type AddressSearchResult,
  type AddressDetail,
  type SearchPage,
} from '@mountainpass/addressr-core';

export interface UseAddressSearchOptions {
  /** RapidAPI key. Omit when connecting directly to an addressr instance. */
  apiKey?: string;
  apiUrl?: string;
  apiHost?: string;
  debounceMs?: number;
  minQueryLength?: number;
  /** Custom fetch implementation (useful for testing) */
  fetchImpl?: typeof fetch;
}

export interface UseAddressSearchReturn {
  query: Ref<string>;
  results: Ref<AddressSearchResult[]>;
  isLoading: Ref<boolean>;
  isLoadingMore: Ref<boolean>;
  hasMore: Ref<boolean>;
  error: Ref<Error | null>;
  selectedAddress: Ref<AddressDetail | null>;
  setQuery: (q: string) => void;
  loadMore: () => Promise<void>;
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

  const client = createAddressrClient({ apiKey, apiUrl, apiHost, fetchImpl });

  const query = ref('');
  const debouncedQuery = ref('');
  const results = ref<AddressSearchResult[]>([]);
  const isLoading = ref(false);
  const isLoadingMore = ref(false);
  const hasMore = ref(false);
  const error = ref<Error | null>(null);
  const selectedAddress = ref<AddressDetail | null>(null);

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let abortController: AbortController | undefined;
  let nextLink: Link | null = null;
  let searchPage: SearchPage | null = null;

  function setQuery(q: string) {
    query.value = q;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debouncedQuery.value = q;
    }, debounceMs);
  }

  watch(debouncedQuery, (q) => {
    if (q.length < minQueryLength) {
      results.value = [];
      hasMore.value = false;
      nextLink = null;
      searchPage = null;
      return;
    }

    abortController?.abort();
    const controller = new AbortController();
    abortController = controller;

    isLoading.value = true;
    error.value = null;

    client
      .searchAddresses(q, controller.signal)
      .then((page) => {
        if (!controller.signal.aborted) {
          results.value = page.results;
          nextLink = page.nextLink;
          searchPage = page;
          hasMore.value = page.nextLink !== null;
          isLoading.value = false;
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted && err.name !== 'AbortError') {
          error.value = err;
          isLoading.value = false;
          results.value = [];
          hasMore.value = false;
          nextLink = null;
          searchPage = null;
        }
      });
  });

  async function loadMore() {
    if (!nextLink || isLoadingMore.value) return;

    isLoadingMore.value = true;
    try {
      const page = await client.fetchNextPage(nextLink);
      results.value = [...results.value, ...page.results];
      nextLink = page.nextLink;
      searchPage = page;
      hasMore.value = page.nextLink !== null;
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        error.value = err;
      }
    } finally {
      isLoadingMore.value = false;
    }
  }

  async function selectAddress(pid: string) {
    const index = results.value.findIndex((r) => r.pid === pid);
    const detail = await client.getAddressDetail(
      pid,
      undefined,
      index !== -1 ? searchPage ?? undefined : undefined,
      index !== -1 ? index : undefined,
    );
    selectedAddress.value = detail;
  }

  function clear() {
    clearTimeout(debounceTimer);
    abortController?.abort();
    query.value = '';
    debouncedQuery.value = '';
    results.value = [];
    isLoading.value = false;
    isLoadingMore.value = false;
    hasMore.value = false;
    error.value = null;
    selectedAddress.value = null;
    nextLink = null;
    searchPage = null;
  }

  // Cleanup on unmount when used in component context
  try {
    onUnmounted(() => {
      clearTimeout(debounceTimer);
      abortController?.abort();
    });
  } catch {
    // Not in component context — no cleanup needed
  }

  return {
    query,
    results,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    selectedAddress,
    setQuery,
    loadMore,
    selectAddress,
    clear,
  };
}
