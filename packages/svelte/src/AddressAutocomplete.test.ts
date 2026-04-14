import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import AddressAutocomplete from './AddressAutocomplete.svelte';

function mockResponse(body: unknown, headers: Record<string, string> = {}, url = '') {
  const resp = new Response(JSON.stringify(body), {
    status: 200,
    headers: new Headers(headers),
  });
  Object.defineProperty(resp, 'url', { value: url });
  return resp;
}

const rootResponse = () =>
  mockResponse(
    {},
    { link: '</addresses{?q}>; rel="https://addressr.io/rels/address-search"' },
    'https://addressr.p.rapidapi.com/',
  );

const searchResponse = (hasNext = false) =>
  mockResponse(
    [
      {
        sla: '1 GEORGE ST, SYDNEY NSW 2000',
        pid: 'GANSW123',
        score: 19,
        highlight: { sla: '<em>1</em> <em>GEORGE</em> ST, SYDNEY NSW 2000' },
      },
    ],
    hasNext
      ? { link: '</addresses/GANSW123>; rel=canonical; anchor="#/0", </addresses?q=1+george&p=2>; rel=next' }
      : { link: '</addresses/GANSW123>; rel=canonical; anchor="#/0"' },
    'https://addressr.p.rapidapi.com/addresses?q=1+george',
  );

describe('AddressAutocomplete (Svelte)', () => {
  it('renders with accessible label and combobox role', () => {
    const mockFetch = vi.fn();
    render(AddressAutocomplete, {
      props: { fetchImpl: mockFetch },
    });
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('Search Australian addresses')).toBeInTheDocument();
  });

  it('displays results after typing', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(rootResponse())
      .mockImplementation(() => Promise.resolve(searchResponse()));

    render(AddressAutocomplete, {
      props: { debounceMs: 10, fetchImpl: mockFetch },
    });

    await userEvent.type(screen.getByRole('combobox'), '1 george');

    await waitFor(() => {
      expect(screen.getByRole('option')).toBeInTheDocument();
    });
  });

  it('renders highlights with mark elements', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(rootResponse())
      .mockImplementation(() => Promise.resolve(searchResponse()));

    render(AddressAutocomplete, {
      props: { debounceMs: 10, fetchImpl: mockFetch },
    });

    await userEvent.type(screen.getByRole('combobox'), '1 george');

    await waitFor(() => {
      const marks = document.querySelectorAll('mark');
      expect(marks.length).toBeGreaterThan(0);
    });
  });

  it('has screen reader status announcements', () => {
    const mockFetch = vi.fn();
    render(AddressAutocomplete, {
      props: { fetchImpl: mockFetch },
    });
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows skeleton loading instead of text', async () => {
    let resolveSearch: (value: Response) => void;
    const searchPromise = new Promise<Response>((resolve) => { resolveSearch = resolve; });

    const mockFetch = vi.fn()
      .mockResolvedValueOnce(rootResponse())
      .mockReturnValue(searchPromise);

    render(AddressAutocomplete, {
      props: { debounceMs: 10, fetchImpl: mockFetch },
    });

    await userEvent.type(screen.getByRole('combobox'), '1 george');

    await waitFor(() => {
      const skeletons = document.querySelectorAll('[class*="skeleton"]');
      expect(skeletons.length).toBeGreaterThanOrEqual(3);
    });

    expect(screen.queryByText('Searching...')).not.toBeInTheDocument();
    resolveSearch!(searchResponse());
  });

  it('has name attribute on input defaulting to "address"', () => {
    const mockFetch = vi.fn();
    render(AddressAutocomplete, {
      props: { fetchImpl: mockFetch },
    });
    expect(screen.getByRole('combobox')).toHaveAttribute('name', 'address');
  });

  it('accepts custom name attribute', () => {
    const mockFetch = vi.fn();
    render(AddressAutocomplete, {
      props: { fetchImpl: mockFetch, name: 'shipping-address' },
    });
    expect(screen.getByRole('combobox')).toHaveAttribute('name', 'shipping-address');
  });

  it('sets aria-required when required prop is true', () => {
    const mockFetch = vi.fn();
    render(AddressAutocomplete, {
      props: { fetchImpl: mockFetch, required: true },
    });
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-required', 'true');
  });

  it('does not set aria-required by default', () => {
    const mockFetch = vi.fn();
    render(AddressAutocomplete, {
      props: { fetchImpl: mockFetch },
    });
    expect(screen.getByRole('combobox')).not.toHaveAttribute('aria-required');
  });

  it('sets aria-invalid when error occurs', async () => {
    const mockFetch = vi.fn().mockImplementation((url: string | Request | URL) => {
      const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;
      if (urlStr.includes('?q=')) {
        return Promise.reject(new Error('Server error'));
      }
      return Promise.resolve(rootResponse());
    });

    render(AddressAutocomplete, {
      props: { debounceMs: 10, fetchImpl: mockFetch },
    });

    await userEvent.type(screen.getByRole('combobox'), '1 george');

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true');
    }, { timeout: 10000 });
  });

  it('has tabindex="-1" on option items', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(rootResponse())
      .mockImplementation(() => Promise.resolve(searchResponse()));

    render(AddressAutocomplete, {
      props: { debounceMs: 10, fetchImpl: mockFetch },
    });

    await userEvent.type(screen.getByRole('combobox'), '1 george');

    await waitFor(() => {
      const option = screen.getByRole('option');
      expect(option).toHaveAttribute('tabindex', '-1');
    });
  });
});
