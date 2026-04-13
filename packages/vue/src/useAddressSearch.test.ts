import { describe, it, expect, vi } from 'vitest';
import { nextTick } from 'vue';
import { useAddressSearch } from './useAddressSearch';

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

describe('useAddressSearch', () => {
  function createTestComposable(mockFetch: ReturnType<typeof vi.fn>) {
    return useAddressSearch({
      apiKey: 'test-key',
      fetchImpl: mockFetch,
      debounceMs: 10,
      minQueryLength: 3,
    });
  }

  it('starts with empty state', () => {
    const mockFetch = vi.fn();
    const search = createTestComposable(mockFetch);
    expect(search.query.value).toBe('');
    expect(search.results.value).toEqual([]);
    expect(search.isLoading.value).toBe(false);
    expect(search.isLoadingMore.value).toBe(false);
    expect(search.hasMore.value).toBe(false);
    expect(search.error.value).toBeNull();
    expect(search.selectedAddress.value).toBeNull();
  });

  it('does not search when query is too short', async () => {
    const mockFetch = vi.fn();
    const search = createTestComposable(mockFetch);
    search.setQuery('ab');
    await wait(50);
    await nextTick();
    expect(mockFetch).not.toHaveBeenCalled();
    expect(search.results.value).toEqual([]);
  });

  it('searches after debounce', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(MOCK_ROOT_RESPONSE)
      .mockResolvedValueOnce(makeMockSearchResponse());

    const search = createTestComposable(mockFetch);
    search.setQuery('1 george');

    await vi.waitFor(() => {
      expect(search.results.value).toHaveLength(1);
    });
    expect(search.results.value[0].sla).toBe('1 GEORGE ST, SYDNEY NSW 2000');
  });

  it('selects an address and fetches detail', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(MOCK_ROOT_RESPONSE)
      .mockResolvedValueOnce(MOCK_DETAIL_RESPONSE);

    const search = createTestComposable(mockFetch);
    await search.selectAddress('GANSW123');

    expect(search.selectedAddress.value?.pid).toBe('GANSW123');
  });

  it('clears all state', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(MOCK_ROOT_RESPONSE)
      .mockResolvedValueOnce(makeMockSearchResponse());

    const search = createTestComposable(mockFetch);
    search.setQuery('1 george');

    await vi.waitFor(() => {
      expect(search.results.value).toHaveLength(1);
    });

    search.clear();
    await nextTick();
    expect(search.query.value).toBe('');
    expect(search.results.value).toEqual([]);
    expect(search.selectedAddress.value).toBeNull();
    expect(search.hasMore.value).toBe(false);
  });

  it('hasMore is true when next link exists', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(MOCK_ROOT_RESPONSE)
      .mockResolvedValueOnce(makeMockSearchResponse(true));

    const search = createTestComposable(mockFetch);
    search.setQuery('1 george');

    await vi.waitFor(() => {
      expect(search.results.value).toHaveLength(1);
    });
    expect(search.hasMore.value).toBe(true);
  });

  it('hasMore is false on last page', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(MOCK_ROOT_RESPONSE)
      .mockResolvedValueOnce(makeMockSearchResponse(false));

    const search = createTestComposable(mockFetch);
    search.setQuery('1 george');

    await vi.waitFor(() => {
      expect(search.results.value).toHaveLength(1);
    });
    expect(search.hasMore.value).toBe(false);
  });

  it('loadMore appends results from next page', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(MOCK_ROOT_RESPONSE)
      .mockResolvedValueOnce(makeMockSearchResponse(true))
      .mockResolvedValueOnce(makeMockPage2Response());

    const search = createTestComposable(mockFetch);
    search.setQuery('1 george');

    await vi.waitFor(() => {
      expect(search.results.value).toHaveLength(1);
    });

    await search.loadMore();

    expect(search.results.value).toHaveLength(2);
    expect(search.results.value[0].pid).toBe('GANSW123');
    expect(search.results.value[1].pid).toBe('GANSW456');
    expect(search.hasMore.value).toBe(false);
  });

  it('new search replaces accumulated results', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(MOCK_ROOT_RESPONSE)
      .mockResolvedValueOnce(makeMockSearchResponse(true))
      .mockResolvedValueOnce(makeMockPage2Response())
      .mockResolvedValueOnce(makeMockSearchResponse(false));

    const search = createTestComposable(mockFetch);
    search.setQuery('1 george');

    await vi.waitFor(() => {
      expect(search.results.value).toHaveLength(1);
    });

    await search.loadMore();
    expect(search.results.value).toHaveLength(2);

    search.setQuery('2 george');
    await vi.waitFor(() => {
      expect(search.results.value).toHaveLength(1);
    });
  });
});
