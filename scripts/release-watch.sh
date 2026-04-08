#!/bin/bash
# Usage: npm run release:watch
# Merges the open changesets release PR, watches the Release workflow,
# and reports publish status.

set -euo pipefail

REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)

# ── 1. Find the open changesets release PR ───────────────────────────────────
PR_JSON=$(gh pr list --base main --state open --search "Version Packages in:title" --limit 1 --json number,url,title 2>/dev/null)
PR_NUMBER=$(echo "$PR_JSON" | jq -r '.[0].number // empty')
PR_URL=$(echo "$PR_JSON" | jq -r '.[0].url // empty')
PR_TITLE=$(echo "$PR_JSON" | jq -r '.[0].title // empty')

if [ -z "$PR_NUMBER" ]; then
  echo "No open release PR found (expected title: 'chore: release', base: main)." >&2
  echo "Has it already been merged, or are there no pending changesets?" >&2
  exit 1
fi

echo "Found release PR #$PR_NUMBER: $PR_TITLE"
echo "  $PR_URL"
echo ""

# ── 2. Check CI status on the PR ────────────────────────────────────────────
echo "Checking CI status..."
BUILD_STATUS=""
for i in $(seq 1 30); do
  BUILD_STATUS=$(gh pr checks "$PR_NUMBER" --json name,state --jq '.[] | select(.name == "build-and-test") | .state' 2>/dev/null || echo "")
  case "$BUILD_STATUS" in
    SUCCESS) echo "Build check passed."; break ;;
    FAILURE|ERROR)
      echo "Build check failed on the release PR. Fix CI first." >&2
      gh pr checks "$PR_NUMBER" 2>/dev/null
      exit 1 ;;
    "")
      if [ "$i" -ge 6 ]; then
        echo "No build check found on PR (expected for changeset PRs). Proceeding."
        BUILD_STATUS="SKIPPED"
        break
      fi
      printf '.'; sleep 10 ;;
    *) printf '.'; sleep 10 ;;
  esac
done
if [ "$BUILD_STATUS" != "SUCCESS" ] && [ "$BUILD_STATUS" != "SKIPPED" ]; then
  echo "Build check did not complete within 5 minutes." >&2
  exit 1
fi
echo ""

# ── 3. Merge the release PR ─────────────────────────────────────────────────
echo "Merging release PR #$PR_NUMBER..."
gh pr merge "$PR_NUMBER" --merge
echo ""

# ── 4. Find the triggered Release workflow run ──────────────────────────────
printf 'Waiting for Release workflow'
RUN_ID=""
for i in $(seq 1 40); do
  RUN_ID=$(gh run list \
    --workflow=release.yml \
    --branch main \
    --limit 5 \
    --json databaseId,status,createdAt \
    --jq '[.[] | select(.status != "completed")] | sort_by(.createdAt) | reverse | .[0].databaseId' 2>/dev/null)
  [ -n "$RUN_ID" ] && [ "$RUN_ID" != "null" ] && break
  printf '.'
  sleep 3
done
echo ""

if [ -z "$RUN_ID" ] || [ "$RUN_ID" = "null" ]; then
  echo "No in-progress Release workflow found." >&2
  exit 1
fi

RUN_URL="https://github.com/$REPO/actions/runs/$RUN_ID"
echo "Release workflow: $RUN_URL"
echo ""

# ── 5. Watch the workflow ────────────────────────────────────────────────────
gh run watch "$RUN_ID" || true

RELEASE_CONCLUSION=$(gh run view "$RUN_ID" --json jobs --jq '.jobs[] | select(.name == "release") | .conclusion' 2>/dev/null)
if [ "$RELEASE_CONCLUSION" = "failure" ]; then
  echo ""
  echo "Release failed — $RUN_URL"
  gh run view "$RUN_ID" --json jobs \
    --jq '.jobs[] | select(.conclusion == "failure") | "  \u2717 \(.name)"' 2>/dev/null || true
  exit 1
fi

# ── 6. Report results ───────────────────────────────────────────────────────
echo ""
echo "Release workflow completed successfully."
echo "  Release job: $RELEASE_CONCLUSION"
echo ""

# Check npm for the published version
LATEST=$(npm view @mountainpass/addressr-mcp version 2>/dev/null || echo "not found")
echo "Latest npm version: $LATEST"
echo ""
echo "CLAUDE: The release workflow completed. Report the results above to the user."
