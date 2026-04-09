import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAddressrClient } from './api';

const MOCK_ROOT_RESPONSE = {
  ok: true,
  url: 'https://addressr.p.rapidapi.com/',
  headers: new Headers({
    link: '</addresses{?q}>; rel="https://addressr.io/rels/address-search", </health>; rel="https://addressr.io/rels/health"',
  }),
  json: () => Promise.resolve({}),
};

const MOCK_SEARCH_RESPONSE = {
  ok: true,
  url: 'https://addressr.p.rapidapi.com/addresses?q=1+george',
  headers: new Headers({
    link: '</addresses/GANSW123>; rel=canonical; anchor="#/0", </addresses?q=1+george&p=2>; rel=next',
  }),
  json: () =>
    Promise.resolve([
      { sla: '1 GEORGE ST, SYDNEY NSW 2000', pid: 'GANSW123', score: 19, highlight: { sla: '<em>1</em> <em>GEORGE</em> ST' } },
    ]),
};

const MOCK_SEARCH_PAGE2_RESPONSE = {
  ok: true,
  url: 'https://addressr.p.rapidapi.com/addresses?q=1+george&p=2',
  headers: new Headers({
    link: '</addresses/GANSW456>; rel=canonical; anchor="#/0"',
  }),
  json: () =>
    Promise.resolve([
      { sla: '2 GEORGE ST, SYDNEY NSW 2000', pid: 'GANSW456', score: 18, highlight: { sla: '<em>2</em> <em>GEORGE</em> ST' } },
    ]),
};

const MOCK_DETAIL_RESPONSE = {
  ok: true,
  url: 'https://addressr.p.rapidapi.com/addresses/GANSW123',
  headers: new Headers({}),
  json: () =>
    Promise.resolve({
      pid: 'GANSW123',
      sla: '1 GEORGE ST, SYDNEY NSW 2000',
      mla: ['1 GEORGE ST', 'SYDNEY NSW 2000'],
      structured: { locality: { name: 'SYDNEY' }, state: { name: 'NEW SOUTH WALES', abbreviation: 'NSW' }, postcode: '2000', confidence: 2 },
    }),
};

describe('createAddressrClient', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let client: ReturnType<typeof createAddressrClient>;

  beforeEach(() => {
    mockFetch = vi.fn();
    client = createAddressrClient({ apiKey: 'test-key', fetchImpl: mockFetch });
  });

  it('discovers search link from API root and returns SearchPage', async () => {
    mockFetch
      .mockResolvedValueOnce(MOCK_ROOT_RESPONSE)
      .mockResolvedValueOnce(MOCK_SEARCH_RESPONSE);

    const page = await client.searchAddresses('1 george');
    expect(page.results).toHaveLength(1);
    expect(page.results[0].sla).toBe('1 GEORGE ST, SYDNEY NSW 2000');
  });

  it('returns nextLink when API provides next link relation', async () => {
    mockFetch
      .mockResolvedValueOnce(MOCK_ROOT_RESPONSE)
      .mockResolvedValueOnce(MOCK_SEARCH_RESPONSE);

    const page = await client.searchAddresses('1 george');
    expect(page.nextLink).not.toBeNull();
  });

  it('returns null nextLink on last page', async () => {
    mockFetch
      .mockResolvedValueOnce(MOCK_ROOT_RESPONSE)
      .mockResolvedValueOnce(MOCK_SEARCH_PAGE2_RESPONSE);

    const page = await client.searchAddresses('1 george');
    expect(page.nextLink).toBeNull();
  });

  it('fetches next page via fetchNextPage', async () => {
    mockFetch
      .mockResolvedValueOnce(MOCK_ROOT_RESPONSE)
      .mockResolvedValueOnce(MOCK_SEARCH_RESPONSE)
      .mockResolvedValueOnce(MOCK_SEARCH_PAGE2_RESPONSE);

    const page1 = await client.searchAddresses('1 george');
    expect(page1.nextLink).not.toBeNull();

    const page2 = await client.fetchNextPage(page1.nextLink!);
    expect(page2.results).toHaveLength(1);
    expect(page2.results[0].sla).toBe('2 GEORGE ST, SYDNEY NSW 2000');
    expect(page2.nextLink).toBeNull();
  });

  it('sends RapidAPI auth headers', async () => {
    mockFetch
      .mockResolvedValueOnce(MOCK_ROOT_RESPONSE)
      .mockResolvedValueOnce(MOCK_SEARCH_RESPONSE);

    await client.searchAddresses('test');

    // Both root and search calls should have auth headers
    for (const call of mockFetch.mock.calls) {
      const init = call[1] as RequestInit;
      expect(init.headers).toMatchObject({
        'x-rapidapi-key': 'test-key',
        'x-rapidapi-host': 'addressr.p.rapidapi.com',
      });
    }
  });

  it('caches the root discovery', async () => {
    mockFetch
      .mockResolvedValueOnce(MOCK_ROOT_RESPONSE)
      .mockResolvedValueOnce(MOCK_SEARCH_RESPONSE)
      .mockResolvedValueOnce(MOCK_SEARCH_RESPONSE);

    await client.searchAddresses('first');
    await client.searchAddresses('second');

    // Root should only be fetched once
    expect(mockFetch).toHaveBeenCalledTimes(3); // 1 root + 2 searches
  });

  it('follows canonical link for address detail', async () => {
    mockFetch
      .mockResolvedValueOnce(MOCK_ROOT_RESPONSE)
      .mockResolvedValueOnce(MOCK_SEARCH_RESPONSE)
      .mockResolvedValueOnce(MOCK_DETAIL_RESPONSE);

    const page = await client.searchAddresses('1 george');
    const detail = await client.getAddressDetail(page.results[0].pid, undefined, page, 0);
    expect(detail.pid).toBe('GANSW123');
    expect(detail.structured.locality.name).toBe('SYDNEY');
  });

  it('falls back to constructed URL when no search context', async () => {
    mockFetch
      .mockResolvedValueOnce(MOCK_ROOT_RESPONSE)
      .mockResolvedValueOnce(MOCK_DETAIL_RESPONSE);

    const detail = await client.getAddressDetail('GANSW123');
    expect(detail.pid).toBe('GANSW123');
    expect(detail.structured.locality.name).toBe('SYDNEY');
  });

  it('throws on HTTP error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      headers: new Headers({}),
    });

    await expect(client.searchAddresses('test')).rejects.toThrow('403');
  });

  it('works without apiKey (no RapidAPI headers)', async () => {
    const noKeyFetch = vi.fn();
    const noKeyClient = createAddressrClient({
      apiUrl: 'https://api.addressr.io/',
      fetchImpl: noKeyFetch,
    });

    noKeyFetch
      .mockResolvedValueOnce(MOCK_ROOT_RESPONSE)
      .mockResolvedValueOnce(MOCK_SEARCH_RESPONSE);

    const page = await noKeyClient.searchAddresses('1 george');
    expect(page.results).toHaveLength(1);

    // Should NOT include RapidAPI headers
    for (const call of noKeyFetch.mock.calls) {
      const init = call[1] as RequestInit;
      const hdrs = init.headers as Record<string, string>;
      expect(hdrs).not.toHaveProperty('x-rapidapi-key');
      expect(hdrs).not.toHaveProperty('x-rapidapi-host');
    }
  });
});
