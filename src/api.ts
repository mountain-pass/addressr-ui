import { glowUpFetchWithLinks } from '@windyroad/fetch-link';
import type { AddressSearchResult, AddressDetail } from './types';

const SEARCH_REL = 'https://addressr.io/rels/address-search';

export interface AddressrClientOptions {
  apiKey: string;
  apiUrl?: string;
  apiHost?: string;
  /** @internal — for testing only */
  fetchImpl?: typeof fetch;
}

export interface AddressrClient {
  searchAddresses: (query: string, signal?: AbortSignal) => Promise<AddressSearchResult[]>;
  getAddressDetail: (pid: string, signal?: AbortSignal) => Promise<AddressDetail>;
}

export function createAddressrClient(options: AddressrClientOptions): AddressrClient {
  const {
    apiKey,
    apiUrl = 'https://addressr.p.rapidapi.com/',
    apiHost = 'addressr.p.rapidapi.com',
    fetchImpl,
  } = options;

  const headers: Record<string, string> = {
    'x-rapidapi-key': apiKey,
    'x-rapidapi-host': apiHost,
  };

  const fetchLink = glowUpFetchWithLinks(
    ((url: RequestInfo | URL, init?: RequestInit) =>
      (fetchImpl || fetch)(url, {
        ...init,
        headers: { ...headers, ...init?.headers },
      })) as typeof fetch,
  );

  // Cache the root discovery
  let rootPromise: ReturnType<typeof fetchLink> | undefined;

  function getRoot() {
    if (!rootPromise) {
      rootPromise = fetchLink(apiUrl).then((response) => {
        if (!response.ok) {
          rootPromise = undefined;
          throw new Error(`API root error: ${response.status} ${response.statusText}`);
        }
        return response;
      }).catch((err) => {
        rootPromise = undefined;
        throw err;
      });
    }
    return rootPromise;
  }

  async function searchAddresses(
    query: string,
    signal?: AbortSignal,
  ): Promise<AddressSearchResult[]> {
    const root = await getRoot();
    const searchLinks = root.links(SEARCH_REL, { q: query.trim() });
    if (!searchLinks.length) {
      throw new Error('Search link relation not found in API root');
    }
    const response = await fetchLink(searchLinks[0], { signal });
    if (!response.ok) {
      throw new Error(`Search error: ${response.status} ${response.statusText}`);
    }
    return response.json() as Promise<AddressSearchResult[]>;
  }

  async function getAddressDetail(
    pid: string,
    signal?: AbortSignal,
  ): Promise<AddressDetail> {
    const root = await getRoot();
    const baseUrl = new URL(root.url);
    const addressUrl = new URL(
      `/addresses/${encodeURIComponent(pid)}`,
      baseUrl,
    );
    const response = await fetchLink(addressUrl.toString(), { signal });
    if (!response.ok) {
      throw new Error(`Detail error: ${response.status} ${response.statusText}`);
    }
    return response.json() as Promise<AddressDetail>;
  }

  return { searchAddresses, getAddressDetail };
}
