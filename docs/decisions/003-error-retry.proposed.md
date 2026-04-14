---
status: "proposed"
date: 2026-04-14
decision-makers: [Tom Howard, Claude Code]
consulted: [wr-architect:agent]
informed: []
---

# Retry API requests with exponential backoff

## Context and Problem Statement

The HATEOAS API client (`createAddressrClient`) makes no attempt to retry failed requests. Transient network errors or brief API downtime cause immediate failure propagated to the UI. For a "just works" developer experience, the client should gracefully handle temporary failures without burdening consumers with retry logic.

## Decision Drivers

- "Just works" positioning requires reliability out of the box
- Transient 5xx errors and network blips are common in production
- Consumers should not need to implement their own retry logic
- Must not retry on client errors (4xx) which indicate permanent failures
- Must respect AbortSignal so cancelled requests don't zombie-retry

## Considered Options

1. **Custom retry utility with exponential backoff + jitter**
2. **External library (`p-retry` or `ky`)**
3. **No retry — leave to consumers**

## Decision Outcome

Chosen option: **1 — Custom retry utility**, because it adds zero dependencies (keeping the bundle small), the scope is narrow (only need fetch-level retry), and the implementation is straightforward.

### Configuration

```typescript
interface RetryOptions {
  maxRetries?: number;      // default: 2 (3 total attempts)
  baseDelayMs?: number;     // default: 500
  maxDelayMs?: number;      // default: 5000
}
```

Added to `AddressrClientOptions` as `retry?: RetryOptions | false`. Setting `false` disables retry entirely.

### Retry behavior

- **Retries on**: network errors (TypeError), HTTP 429, 500, 502, 503, 504
- **Does NOT retry on**: HTTP 400, 401, 403, 404 (client errors are permanent)
- **Backoff**: `min(baseDelay * 2^attempt + jitter, maxDelay)` where jitter is random 0-baseDelay
- **AbortSignal**: If aborted during backoff wait, throws immediately
- **Scope**: Wraps all fetch calls in searchAddresses, fetchNextPage, getAddressDetail, and getRoot
- **Loading state**: Hooks reflect the overall retry sequence, not individual attempts

### Interaction with prefetch

`prefetch()` already swallows all errors. Retry will attempt within prefetch, but if all retries fail, the error is still swallowed. This is correct — prefetch is optimistic.

## Consequences

### Good

- Transient failures handled transparently
- Zero new dependencies
- Configurable per-client with sensible defaults
- Can be disabled entirely with `retry: false`

### Neutral

- Adds ~50 lines of code to core bundle
- Failed requests take longer to surface errors (up to ~7.5s with defaults)

### Bad

- Retry on 429 without Retry-After header parsing may not respect rate limits optimally
- Consumers unaware of retry may be confused by longer error latency

## Confirmation

- Retry triggers only on network errors and 5xx/429 status codes
- 4xx client errors are NOT retried (verified by test)
- `retry: false` disables retries entirely (verified by test)
- AbortSignal cancels retry during backoff (verified by test)
- Default behavior (no retry option) uses 2 retries with 500ms base delay

## Pros and Cons of the Options

### Custom retry utility

- Good: Zero dependencies, small bundle impact
- Good: Full control over retry semantics
- Bad: Must maintain the implementation ourselves

### External library (p-retry, ky)

- Good: Battle-tested, feature-rich
- Bad: Adds dependency (bundle size)
- Bad: May include features we don't need

### No retry

- Good: Simplest, no code to maintain
- Bad: Every consumer must implement their own retry
- Bad: Contradicts "just works" positioning

## Reassessment Criteria

- If retry logic grows to include circuit breakers or Retry-After header parsing, consider extracting to a dedicated resilience layer
- If bundle size becomes critical, evaluate whether retry can be tree-shaken or made opt-in
