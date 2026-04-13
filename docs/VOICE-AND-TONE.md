# Voice and Tone Guide

## Voice Principles

This is a developer-facing UI component library. The "voice" is the text that appears in the component UI and documentation.

### Component UI Text

| Context | Tone | Example |
|---------|------|---------|
| Label (default) | Clear, descriptive | "Search Australian addresses" |
| Placeholder | Instructional, brief | "Start typing an address..." |
| Loading | Informative | "Searching..." / "Loading more..." |
| No results | Helpful, not blaming | "No addresses found" |
| Error | Factual, not alarming | Display the error message as-is |
| Screen reader count | Precise | "{n} addresses found" |

### Rules

1. **Plain language** — no jargon, no abbreviations in user-facing text
2. **Present tense** — "Searching..." not "Search in progress"
3. **No exclamation marks** in status text
4. **Sentence case** for labels and messages
5. **No period** at the end of status messages

### Banned Patterns

- "Please wait..." (unnecessary politeness in UI micro-copy)
- "Oops" or "Uh oh" in error messages
- "Click here" or "tap here"
- ALL CAPS for emphasis

### Word List

| Use | Instead of |
|-----|-----------|
| addresses | results, items, entries |
| found | returned, available, loaded |
| searching | loading, fetching, querying |
