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

const searchResponse = () =>
  mockResponse(
    [
      {
        sla: '1 GEORGE ST, SYDNEY NSW 2000',
        pid: 'GANSW123',
        score: 19,
        highlight: { sla: '<em>1</em> <em>GEORGE</em> ST, SYDNEY NSW 2000' },
      },
    ],
    {},
    'https://addressr.p.rapidapi.com/addresses?q=1+george',
  );

const emptySearchResponse = () =>
  mockResponse([], {}, 'https://addressr.p.rapidapi.com/addresses?q=nothing');

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
      .mockResolvedValueOnce(searchResponse());

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
      .mockResolvedValueOnce(searchResponse());

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
      .mockResolvedValueOnce(searchResponse())
      .mockResolvedValueOnce(detailResponse())
      // After selection, downshift resets input which may trigger another search
      .mockResolvedValue(searchResponse());

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
});
