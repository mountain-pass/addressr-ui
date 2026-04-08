#!/bin/bash
# Usage: npm run push:watch
# Pushes to origin, watches the Release workflow, and reports results.

set -euo pipefail

REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
BRANCH=$(git rev-parse --abbrev-ref HEAD)

# ── 1. Push ─────────────────────────────────────────────────────────────────
echo "Pushing to origin ${BRANCH}..."
git push origin HEAD "$@"
echo ""

# ── 2. Wait for Release workflow to start ───────────────────────────────────
printf 'Waiting for Release workflow'
RUN_ID=""
for i in $(seq 1 40); do
  RUN_ID=$(gh run list \
    --workflow=release.yml \
    --branch "$BRANCH" \
    --limit 5 \
    --json databaseId,status,createdAt \
    --jq '[.[] | select(.status != "completed")] | sort_by(.createdAt) | reverse | .[0].databaseId' 2>/dev/null)
  [ -n "$RUN_ID" ] && [ "$RUN_ID" != "null" ] && break
  printf '.'
  sleep 3
done
echo ""

if [ -z "$RUN_ID" ] || [ "$RUN_ID" = "null" ]; then
  echo "No in-progress Release workflow found after push." >&2
  echo "Check GitHub Actions manually." >&2
  exit 1
fi

RUN_URL="https://github.com/$REPO/actions/runs/$RUN_ID"
echo "Release workflow: $RUN_URL"
echo ""

# ── 3. Watch the workflow ───────────────────────────────────────────────────
gh run watch "$RUN_ID" || true

BUILD_CONCLUSION=$(gh run view "$RUN_ID" --json jobs --jq '.jobs[] | select(.name == "build-and-test") | .conclusion' 2>/dev/null)
if [ "$BUILD_CONCLUSION" = "failure" ]; then
  echo ""
  echo "Push pipeline failed — $RUN_URL"
  gh run view "$RUN_ID" --json jobs \
    --jq '.jobs[] | select(.conclusion == "failure") | "  ✗ \(.name)"' 2>/dev/null || true
  exit 1
fi

# ── 4. Report results ──────────────────────────────────────────────────────
RELEASE_JOB=$(gh run view "$RUN_ID" --json jobs \
  --jq '.jobs[] | select(.name == "release") | .conclusion' 2>/dev/null || echo "skipped")

echo ""
echo "Push pipeline completed successfully."
echo "  Build and test: $BUILD_CONCLUSION"
echo "  Release job: ${RELEASE_JOB:-skipped}"
echo ""

# ── 5. Check for release PR ────────────────────────────────────────────────
PR_URL=$(gh pr list --base main --state open --search "Version Packages in:title" --limit 1 --json url --jq '.[0].url // empty' 2>/dev/null)
if [ -n "$PR_URL" ]; then
  echo "Release PR available: $PR_URL"
else
  echo "No release PR found. There may be no pending changesets."
fi
