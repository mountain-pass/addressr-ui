---
"@mountainpass/addressr-core": minor
"@mountainpass/addressr-react": minor
"@mountainpass/addressr-svelte": minor
"@mountainpass/addressr-vue": minor
---

Error retry with exponential backoff for all API requests.

- Transient failures (network errors, 5xx, 429) are retried automatically with exponential backoff and jitter
- Client errors (4xx) fail immediately — no wasted retries
- Default: 2 retries, 500ms base delay, 5s max delay
- Configurable via `retry` option on `createAddressrClient`, or disable with `retry: false`
- Respects AbortSignal during backoff — cancelled requests stop retrying immediately
