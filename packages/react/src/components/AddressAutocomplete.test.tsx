import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddressAutocomplete } from './AddressAutocomplete';

function mockResponse(body: unknown, headers: Record<string, string> = {}, url = '') {
  const resp = new Response(JSON.stringify(body), {
    status: 200,
    headers: new Headers(headers),
  });
  // Response.url is readonly, so we define it
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

const page2Response = () =>
  mockResponse(
    [
      {
        sla: '2 GEORGE ST, SYDNEY NSW 2000',
        pid: 'GANSW456',
        score: 18,
        highlight: { sla: '<em>2</em> <em>GEORGE</em> ST, SYDNEY NSW 2000' },
      },
    ],
    { link: '</addresses/GANSW456>; rel=canonical; anchor="#/0"' },
    'https://addressr.p.rapidapi.com/addresses?q=1+george&p=2',
  );

const detailResponse = () =>
  mockResponse(
    {
      pid: 'GANSW123',
      sla: '1 GEORGE ST, SYDNEY NSW 2000',
      mla: ['1 GEORGE ST', 'SYDNEY NSW 2000'],
      structured: {
        locality: { name: 'SYDNEY' },
        state: { name: 'NSW', abbreviation: 'NSW' },
        postcode: '2000',
        confidence: 2,
      },
    },
    {},
    'https://addressr.p.rapidapi.com/addresses/GANSW123',
  );

describe('AddressAutocomplete', () => {
  it('renders with accessible label and combobox role', () => {
    const mockFetch = vi.fn();
    render(
      <AddressAutocomplete apiKey="test" onSelect={() => {}} fetchImpl={mockFetch} />,
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('Search Australian addresses')).toBeInTheDocument();
  });

  it('renders with custom label', () => {
    const mockFetch = vi.fn();
    render(
      <AddressAutocomplete
        apiKey="test"
        onSelect={() => {}}
        label="Find your address"
        fetchImpl={mockFetch}
      />,
    );
    expect(screen.getByText('Find your address')).toBeInTheDocument();
  });

  it('displays results after typing', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(rootResponse())
      .mockImplementation(() => Promise.resolve(searchResponse()));

    render(
      <AddressAutocomplete
        apiKey="test"
        onSelect={() => {}}
        debounceMs={10}
        fetchImpl={mockFetch}
      />,
    );

    await userEvent.type(screen.getByRole('combobox'), '1 george');

    await waitFor(() => {
      expect(screen.getByRole('option')).toBeInTheDocument();
    });
  });

  it('renders highlights with mark elements', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(rootResponse())
      .mockImplementation(() => Promise.resolve(searchResponse()));

    render(
      <AddressAutocomplete
        apiKey="test"
        onSelect={() => {}}
        debounceMs={10}
        fetchImpl={mockFetch}
      />,
    );

    await userEvent.type(screen.getByRole('combobox'), '1 george');

    await waitFor(() => {
      const marks = document.querySelectorAll('mark');
      expect(marks.length).toBeGreaterThan(0);
    });
  });

  it('calls onSelect when address is chosen', async () => {
    const onSelect = vi.fn();
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(rootResponse())
      .mockImplementation((url: string | Request | URL) => {
        const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;
        if (urlStr.includes('/addresses/')) {
          return Promise.resolve(detailResponse());
        }
        return Promise.resolve(searchResponse());
      });

    render(
      <AddressAutocomplete
        apiKey="test"
        onSelect={onSelect}
        debounceMs={10}
        fetchImpl={mockFetch}
      />,
    );

    await userEvent.type(screen.getByRole('combobox'), '1 george');
    await waitFor(() => expect(screen.getByRole('option')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('option'));

    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledWith(
        expect.objectContaining({ pid: 'GANSW123' }),
      );
    });
  });

  it('has screen reader status announcements', () => {
    const mockFetch = vi.fn();
    render(
      <AddressAutocomplete apiKey="test" onSelect={() => {}} fetchImpl={mockFetch} />,
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('loads more results when scrolled near bottom', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(rootResponse())
      .mockImplementation(() => Promise.resolve(searchResponse(true)));

    render(
      <AddressAutocomplete
        apiKey="test"
        onSelect={() => {}}
        debounceMs={10}
        fetchImpl={mockFetch}
      />,
    );

    await userEvent.type(screen.getByRole('combobox'), '1 george');
    await waitFor(() => expect(screen.getByRole('option')).toBeInTheDocument());

    // Now swap the mock to return page 2 for the next call
    mockFetch.mockImplementation(() => Promise.resolve(page2Response()));

    // Simulate scroll near bottom of the menu
    const menu = screen.getByRole('listbox');
    Object.defineProperties(menu, {
      scrollTop: { value: 100, writable: true },
      scrollHeight: { value: 150, writable: true },
      clientHeight: { value: 100, writable: true },
    });
    menu.dispatchEvent(new Event('scroll', { bubbles: true }));

    await waitFor(() => {
      expect(screen.getAllByRole('option')).toHaveLength(2);
    });
  });

  it('shows loading indicator while fetching more results', async () => {
    let resolvePage2: (value: Response) => void;
    const page2Promise = new Promise<Response>((resolve) => { resolvePage2 = resolve; });

    const mockFetch = vi.fn()
      .mockResolvedValueOnce(rootResponse())
      .mockImplementation(() => Promise.resolve(searchResponse(true)));

    render(
      <AddressAutocomplete
        apiKey="test"
        onSelect={() => {}}
        debounceMs={10}
        fetchImpl={mockFetch}
      />,
    );

    await userEvent.type(screen.getByRole('combobox'), '1 george');
    await waitFor(() => expect(screen.getByRole('option')).toBeInTheDocument());

    // Swap mock to return a delayed promise for the next page fetch
    mockFetch.mockReturnValue(page2Promise);

    // Trigger scroll
    const menu = screen.getByRole('listbox');
    Object.defineProperties(menu, {
      scrollTop: { value: 100, writable: true },
      scrollHeight: { value: 150, writable: true },
      clientHeight: { value: 100, writable: true },
    });
    menu.dispatchEvent(new Event('scroll', { bubbles: true }));

    await waitFor(() => {
      expect(screen.getByText('Loading more...')).toBeInTheDocument();
    });

    // Resolve the page 2 fetch
    resolvePage2!(page2Response());

    await waitFor(() => {
      expect(screen.queryByText('Loading more...')).not.toBeInTheDocument();
    });
  });
});
