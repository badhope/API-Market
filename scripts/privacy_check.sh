#!/usr/bin/env bash
# Pre-commit privacy guard
# Run: bash scripts/privacy_check.sh
# or hook: ln -s ../../scripts/privacy_check.sh .git/hooks/pre-commit

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

echo "🔒 Privacy Guard: Scanning for secrets before commit..."
echo ""

# 1. Scan staged files for known secret patterns
echo "[1/5] Scanning staged files for known secret patterns..."
SECRET_PATTERNS=(
  'ghp_[A-Za-z0-9]{36}'                      # GitHub PAT
  'gho_[A-Za-z0-9]{36}'                      # GitHub OAuth
  'ghu_[A-Za-z0-9]{36}'                      # GitHub user token
  'ghs_[A-Za-z0-9]{36}'                      # GitHub server token
  'ghr_[A-Za-z0-9]{36}'                      # GitHub refresh token
  'github_pat_[A-Za-z0-9_]{82}'              # GitHub fine-grained
  'xox[baprs]-[0-9A-Za-z-]{10,}'             # Slack
  'sk-[A-Za-z0-9]{32,}'                      # OpenAI
  'AKIA[0-9A-Z]{16}'                         # AWS access key
  'AIzaSy[A-Za-z0-9_-]{33}'                  # Google API key
  '-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----'  # Private keys
)

STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACMR 2>/dev/null || true)
if [ -z "$STAGED_FILES" ]; then
  echo "  No staged files to scan."
else
  for pattern in "${SECRET_PATTERNS[@]}"; do
    HITS=$(echo "$STAGED_FILES" | xargs grep -lE "$pattern" 2>/dev/null || true)
    if [ -n "$HITS" ]; then
      echo -e "${RED}  ✗ Found pattern '$pattern' in:${NC}"
      echo "$HITS" | sed 's/^/    /'
      ERRORS=$((ERRORS + 1))
    fi
  done
fi

if [ $ERRORS -eq 0 ]; then
  echo -e "  ${GREEN}✓${NC} No secret patterns found in staged files."
fi
echo ""

# 2. Check for .env files being committed
echo "[2/5] Checking for .env files (should be gitignored)..."
ENV_FILES=$(echo "$STAGED_FILES" | grep -E '(^|/)\.env(\.|$)' || true)
if [ -n "$ENV_FILES" ]; then
  echo -e "${RED}  ✗ .env files are being committed (security risk):${NC}"
  echo "$ENV_FILES" | sed 's/^/    /'
  echo -e "  ${YELLOW}→ Add these to .gitignore and use .env.example instead${NC}"
  ERRORS=$((ERRORS + 1))
else
  echo -e "  ${GREEN}✓${NC} No .env files in commit."
fi
echo ""

# 3. Check for large data files
echo "[3/5] Checking for large data files..."
LARGE_PATTERNS=(
  '\.db$'
  '\.sqlite$'
  '\.sqlite3$'
  'api-database\.json$'
  'search-index\.json$'
)
for pattern in "${LARGE_PATTERNS[@]}"; do
  HITS=$(echo "$STAGED_FILES" | grep -E "$pattern" || true)
  if [ -n "$HITS" ]; then
    echo -e "${RED}  ✗ Large data file being committed:${NC}"
    echo "$HITS" | sed 's/^/    /'
    echo -e "  ${YELLOW}→ Add to .gitignore; SQLite DB is 8.7MB${NC}"
    ERRORS=$((ERRORS + 1))
  fi
done
if [ $ERRORS -eq 0 ] || [ -z "$ENV_FILES" ]; then
  echo -e "  ${GREEN}✓${NC} No large data files."
fi
echo ""

# 4. Check for hardcoded URLs with credentials
echo "[4/5] Checking for URLs with embedded credentials..."
URL_CREDS=$(echo "$STAGED_FILES" | xargs grep -lE 'https?://[^/:@]+:[^/@]+@' 2>/dev/null || true)
if [ -n "$URL_CREDS" ]; then
  echo -e "${YELLOW}  ⚠ Found URLs with embedded credentials:${NC}"
  echo "$URL_CREDS" | sed 's/^/    /'
  WARNINGS=$((WARNINGS + 1))
else
  echo -e "  ${GREEN}✓${NC} No URLs with embedded credentials."
fi
echo ""

# 5. Verify remote URL doesn't have token
echo "[5/5] Checking git remote URL..."
REMOTE_URL=$(git config --get remote.origin.url 2>/dev/null || true)
if echo "$REMOTE_URL" | grep -qE 'https://[^/@]+:[^/@]+@'; then
  echo -e "${RED}  ✗ Remote URL contains credentials!${NC}"
  echo "    $REMOTE_URL"
  ERRORS=$((ERRORS + 1))
else
  echo -e "  ${GREEN}✓${NC} Remote URL is clean: $REMOTE_URL"
fi
echo ""

# Summary
echo "═══════════════════════════════════════════════"
if [ $ERRORS -gt 0 ]; then
  echo -e "${RED}✗ Privacy check FAILED: $ERRORS error(s), $WARNINGS warning(s)${NC}"
  echo ""
  echo "Fix the issues above before committing."
  exit 1
fi
if [ $WARNINGS -gt 0 ]; then
  echo -e "${YELLOW}⚠ Privacy check passed with $WARNINGS warning(s)${NC}"
  exit 0
fi
echo -e "${GREEN}✓ Privacy check PASSED. Safe to commit.${NC}"
exit 0
