#!/usr/bin/env bash
# Install or update system crontab entry: pishbini backup every 4 hours.
#
# Usage:
#   sudo bash scripts/install-backup-cron.sh
#   PROJECT_DIR=/opt/pishbini bash scripts/install-backup-cron.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_DIR="${PROJECT_DIR:-$ROOT}"
MARKER="# pishbini-auto-backup"
CRON_LINE="0 */4 * * * cd ${PROJECT_DIR} && /usr/bin/npm run backup >> /var/log/pishbini-backup.log 2>&1 ${MARKER}"

if [[ ! -f "$PROJECT_DIR/package.json" ]]; then
  echo "ERROR: package.json not found in $PROJECT_DIR" >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: npm not found" >&2
  exit 1
fi

touch /var/log/pishbini-backup.log 2>/dev/null || true

CURRENT="$(crontab -l 2>/dev/null || true)"
FILTERED="$(printf '%s\n' "$CURRENT" | grep -v "$MARKER" | sed '/^[[:space:]]*$/d')"
NEW_CRON="$(printf '%s\n%s\n' "$FILTERED" "$CRON_LINE" | sed '/^[[:space:]]*$/d')"

printf '%s\n' "$NEW_CRON" | crontab -

echo "Cron installed: backup every 4 hours"
echo "  $CRON_LINE"
echo "Log: /var/log/pishbini-backup.log"
echo "Verify: crontab -l | grep pishbini"
