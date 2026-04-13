import { describe, it, expect, vi } from 'vitest';
import { get } from 'svelte/store';
import { createAddressSearch } from './createAddressSearch';

const MOCK_ROOT_RESPONSE = {
  ok: true,
  url: 'https://addressr.p.rapidapi.com/',
  headers: new Headers({
    link: '</addresses{?q}>; rel="https://addressr.io/rels/address-search"',
  }),
  json: () => Promise.resolve({}),
};

const makeMockSearchResponse = (hasNext = true) => ({
  ok: true,
  url: 'https://addressr.p.rapidapi.com/addresses?q=1+george',
  headers: new Headers(hasNext ? {
    link: '</addresses/GANSW123>; rel=canonical; anchor="#/0", </addresses?q=1+george&p=2>; rel=next',
  } : {
    link: '</addresses/GANSW123>; rel=canonical; anchor="#/0"',
  }),
  json: () =>
    Promise.resolve([
      {
        sla: '1 GEORGE ST, SYDNEY NSW 2000',
        pid: 'GANSW123',
        score: 19,
        highlight: { sla: '<em>1</em> <em>GEORGE</em> ST' },
      },
    ]),
});

const makeMockPage2Response = () => ({
  ok: true,
  url: 'https://addressr.p.rapidapi.com/addresses?q=1+george&p=2',
  headers: new Headers({
    link: '</addresses/GANSW456>; rel=canonical; anchor="#/0"',
  }),
  json: () =>
    Promise.resolve([
      {
        sla: '2 GEORGE ST, SYDNEY NSW 2000',
        pid: 'GANSW456',
        score: 18,
        highlight: { sla: '<em>2</em> <em>GEORGE</em> ST' },
      },
    ]),
});

const MOCK_DETAIL_RESPONSE = {
  ok: true,
  url: 'https://addressr.p.rapidapi.com/addresses/GANSW123',
  headers: new Headers({}),
  json: () =>
    Promise.resolve({
      pid: 'GANSW123',
      sla: '1 GEORGE ST, SYDNEY NSW 2000',
      mla: ['1 GEORGE ST', 'SYDNEY NSW 2000'],
      structured: {
        locality: { name: 'SYDNEY' },
        state: { name: 'NSW', abbreviation: 'NSW' },
        postcode: '2000',
        confidence: 2,
      },
    }),
};

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

describe('createAddressSearch', () => {
  function createTestStore(mockFetch: ReturnType<typeof vi.fn>) {
    return createAddressSearch({
      apiKey: 'test-key',
      fetchImpl: mockFetch,
      debounceMs: 10,
      minQueryLength: 3,
    });
  }

  it('starts with empty state', () => {
    const mockFetch = vi.fn();
    const store = createTestStore(mockFetch);
    const state = get(store);
    expect(state.query).toBe('');
    expect(state.results).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.isLoadingMore).toBe(false);
    expect(state.hasMore).toBe(false);
    expect(state.error).toBeNull();
    expect(state.selectedAddress).toBeNull();
  });

  it('does not search when query is too short', async () => {
    const mockFetch = vi.fn();
    const store = createTestStore(mockFetch);
    store.setQuery('ab');
    await wait(50);
    expect(mockFetch).not.toHaveBeenCalled();
    expect(get(store).results).toEqual([]);
  });

  it('searches after debounce', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(MOCK_ROOT_RESPONSE)
      .mockResolvedValueOnce(makeMockSearchResponse());

    const store = createTestStore(mockFetch);
    store.setQuery('1 george');

    await vi.waitFor(() => {
      expect(get(store).results).toHaveLength(1);
    });
    expect(get(store).results[0].sla).toBe('1 GEORGE ST, SYDNEY NSW 2000');
  });

  it('selects an address and fetches detail', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(MOCK_ROOT_RESPONSE)
      .mockResolvedValueOnce(MOCK_DETAIL_RESPONSE);

    const store = createTestStore(mockFetch);
    await store.selectAddress('GANSW123');

    expect(get(store).selectedAddress?.pid).toBe('GANSW123');
  });

  it('clears all state', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(MOCK_ROOT_RESPONSE)
      .mockResolvedValueOnce(makeMockSearchResponse());

    const store = createTestStore(mockFetch);
    store.setQuery('1 george');

    await vi.waitFor(() => {
      expect(get(store).results).toHaveLength(1);
    });

    store.clear();
    const state = get(store);
    expect(state.query).toBe('');
    expect(state.results).toEqual([]);
    expect(state.selectedAddress).toBeNull();
    expect(state.hasMore).toBe(false);
  });

  it('hasMore is true when next link exists', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(MOCK_ROOT_RESPONSE)
      .mockResolvedValueOnce(makeMockSearchResponse(true));

    const store = createTestStore(mockFetch);
    store.setQuery('1 george');

    await vi.waitFor(() => {
      expect(get(store).results).toHaveLength(1);
    });
    expect(get(store).hasMore).toBe(true);
  });

  it('hasMore is false on last page', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(MOCK_ROOT_RESPONSE)
      .mockResolvedValueOnce(makeMockSearchResponse(false));

    const store = createTestStore(mockFetch);
    store.setQuery('1 george');

    await vi.waitFor(() => {
      expect(get(store).results).toHaveLength(1);
    });
    expect(get(store).hasMore).toBe(false);
  });

  it('loadMore appends results from next page', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(MOCK_ROOT_RESPONSE)
      .mockResolvedValueOnce(makeMockSearchResponse(true))
      .mockResolvedValueOnce(makeMockPage2Response());

    const store = createTestStore(mockFetch);
    store.setQuery('1 george');

    await vi.waitFor(() => {
      expect(get(store).results).toHaveLength(1);
    });

    await store.loadMore();

    expect(get(store).results).toHaveLength(2);
    expect(get(store).results[0].pid).toBe('GANSW123');
    expect(get(store).results[1].pid).toBe('GANSW456');
    expect(get(store).hasMore).toBe(false);
  });

  it('new search replaces accumulated results', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(MOCK_ROOT_RESPONSE)
      .mockResolvedValueOnce(makeMockSearchResponse(true))
      .mockResolvedValueOnce(makeMockPage2Response())
      .mockResolvedValueOnce(makeMockSearchResponse(false));

    const store = createTestStore(mockFetch);
    store.setQuery('1 george');

    await vi.waitFor(() => {
      expect(get(store).results).toHaveLength(1);
    });

    await store.loadMore();
    expect(get(store).results).toHaveLength(2);

    store.setQuery('2 george');
    await vi.waitFor(() => {
      const state = get(store);
      return expect(state.results).toHaveLength(1) && state.results[0].pid === 'GANSW123';
    });
  });
});
