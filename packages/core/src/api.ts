import { glowUpFetchWithLinks } from '@windyroad/fetch-link';
import type { Link } from '@windyroad/link-header';
import type { AddressSearchResult, AddressDetail } from './types';

const SEARCH_REL = 'https://addressr.io/rels/address-search';

export interface AddressrClientOptions {
  /** RapidAPI key. Omit when connecting directly to an addressr instance. */
  apiKey?: string;
  apiUrl?: string;
  apiHost?: string;
  /** Custom fetch implementation (useful for testing) */
  fetchImpl?: typeof fetch;
}

export interface SearchPage {
  results: AddressSearchResult[];
  nextLink: Link | null;
  /** @internal — used for HATEOAS canonical link following */
  _links: Link[];
}

export interface AddressrClient {
  searchAddresses: (query: string, signal?: AbortSignal) => Promise<SearchPage>;
  fetchNextPage: (nextLink: Link, signal?: AbortSignal) => Promise<SearchPage>;
  getAddressDetail: (pid: string, signal?: AbortSignal, searchPage?: SearchPage, resultIndex?: number) => Promise<AddressDetail>;
}

export function createAddressrClient(options: AddressrClientOptions): AddressrClient {
  const {
    apiKey,
    apiUrl = 'https://addressr.p.rapidapi.com/',
    apiHost = 'addressr.p.rapidapi.com',
    fetchImpl,
  } = options;

  const headers: Record<string, string> = {};
  if (apiKey) {
    headers['x-rapidapi-key'] = apiKey;
    headers['x-rapidapi-host'] = apiHost;
  }

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

  function toSearchPage(response: Awaited<ReturnType<typeof fetchLink>>, results: AddressSearchResult[]): SearchPage {
    const nextLinks = response.links('next');
    const allLinks = response.links();
    return {
      results,
      nextLink: nextLinks.length > 0 ? nextLinks[0] : null,
      _links: allLinks,
    };
  }

  async function searchAddresses(
    query: string,
    signal?: AbortSignal,
  ): Promise<SearchPage> {
    const root = await getRoot();
    const searchLinks = root.links(SEARCH_REL, { q: query.trim() });
    if (!searchLinks.length) {
      throw new Error('Search link relation not found in API root');
    }
    const response = await fetchLink(searchLinks[0], { signal });
    if (!response.ok) {
      throw new Error(`Search error: ${response.status} ${response.statusText}`);
    }
    const results = await response.json() as AddressSearchResult[];
    return toSearchPage(response, results);
  }

  async function fetchNextPage(
    nextLink: Link,
    signal?: AbortSignal,
  ): Promise<SearchPage> {
    const response = await fetchLink(nextLink, { signal });
    if (!response.ok) {
      throw new Error(`Search error: ${response.status} ${response.statusText}`);
    }
    const results = await response.json() as AddressSearchResult[];
    return toSearchPage(response, results);
  }

  async function getAddressDetail(
    pid: string,
    signal?: AbortSignal,
    searchPage?: SearchPage,
    resultIndex?: number,
  ): Promise<AddressDetail> {
    // Prefer HATEOAS: follow canonical link from search results
    if (searchPage && resultIndex !== undefined) {
      const anchor = `#/${resultIndex}`;
      const canonicalLink = searchPage._links.find(
        (link) => link.rel === 'canonical' && link.anchor === anchor,
      );
      if (canonicalLink) {
        const response = await fetchLink(canonicalLink, { signal });
        if (!response.ok) {
          throw new Error(`Detail error: ${response.status} ${response.statusText}`);
        }
        return response.json() as Promise<AddressDetail>;
      }
    }

    // Fallback: construct URL from PID
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

  return { searchAddresses, fetchNextPage, getAddressDetail };
}
