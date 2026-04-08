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
    link: '</addresses/GANSW123>; rel=canonical; anchor="#/0"',
  }),
  json: () =>
    Promise.resolve([
      { sla: '1 GEORGE ST, SYDNEY NSW 2000', pid: 'GANSW123', score: 19, highlight: { sla: '<em>1</em> <em>GEORGE</em> ST' } },
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

  it('discovers search link from API root', async () => {
    mockFetch
      .mockResolvedValueOnce(MOCK_ROOT_RESPONSE)
      .mockResolvedValueOnce(MOCK_SEARCH_RESPONSE);

    const results = await client.searchAddresses('1 george');
    expect(results).toHaveLength(1);
    expect(results[0].sla).toBe('1 GEORGE ST, SYDNEY NSW 2000');
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

  it('fetches address detail', async () => {
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
});
