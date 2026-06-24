#!/usr/bin/env bash
# Restore pishbini backup created by scripts/backup.sh
#
# Usage:
#   ./scripts/restore-backup.sh /opt/backups/pishbini/pishbini_backup_20260623_120000.tar.gz
#   ./scripts/restore-backup.sh backup.tar.gz --env-only
#   ./scripts/restore-backup.sh backup.tar.gz --db-only

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ARCHIVE="${1:-}"
MODE="${2:-all}"

log() {
  printf '[%s] %s\n' "$(date '+%H:%M:%S')" "$*"
}

die() {
  log "ERROR: $*"
  exit 1
}

usage() {
  cat <<EOF
Usage:
  $0 <backup.tar.gz> [--all|--db-only|--env-only|--splash-only]

Examples:
  $0 /opt/backups/pishbini/pishbini_backup_20260623_120000.tar.gz
  $0 backup.tar.gz --db-only
EOF
}

[[ -n "$ARCHIVE" ]] || { usage; exit 1; }
[[ -f "$ARCHIVE" ]] || die "فایل بک‌آپ پیدا نشد: $ARCHIVE"

case "$MODE" in
  all | --all) RESTORE_DB=1; RESTORE_ENV=1; RESTORE_SPLASH=1 ;;
  --db-only) RESTORE_DB=1; RESTORE_ENV=0; RESTORE_SPLASH=0 ;;
  --env-only) RESTORE_DB=0; RESTORE_ENV=1; RESTORE_SPLASH=0 ;;
  --splash-only) RESTORE_DB=0; RESTORE_ENV=0; RESTORE_SPLASH=1 ;;
  *) die "حالت نامعتبر: $MODE" ;;
esac

WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT

log "استخراج $ARCHIVE"
tar -xzf "$ARCHIVE" -C "$WORK_DIR"

[[ -f "$WORK_DIR/database.sql" ]] || RESTORE_DB=0
[[ -f "$WORK_DIR/env.backup" ]] || RESTORE_ENV=0
[[ -d "$WORK_DIR/splash_screen" ]] || RESTORE_SPLASH=0

if [[ "$RESTORE_ENV" -eq 1 ]]; then
  log "بازگردانی .env → $ROOT/.env"
  cp "$WORK_DIR/env.backup" "$ROOT/.env"
  chmod 600 "$ROOT/.env"
fi

if [[ "$RESTORE_SPLASH" -eq 1 ]]; then
  log "بازگردانی splash_screen/"
  mkdir -p "$ROOT/public/splash_screen"
  cp -a "$WORK_DIR/splash_screen/." "$ROOT/public/splash_screen/"
fi

if [[ "$RESTORE_DB" -eq 1 ]]; then
  ENV_FILE="${ENV_FILE:-$ROOT/.env}"
  [[ -f "$ENV_FILE" ]] || die ".env برای اتصال DB لازم است"

  MYSQL_CNF="$(mktemp)"
  chmod 600 "$MYSQL_CNF"

  DB_NAME="$(ENV_FILE="$ENV_FILE" MYSQL_CNF="$MYSQL_CNF" node <<'NODE'
const fs = require("fs");
const raw = fs.readFileSync(process.env.ENV_FILE, "utf8");
const line = raw.split("\n").find((l) => /^\s*DATABASE_URL\s*=/.test(l));
const value = line.replace(/^\s*DATABASE_URL\s*=\s*/, "").trim().replace(/^["']|["']$/g, "");
const url = new URL(value);
const escapeCnf = (s) => String(s).replace(/\\/g, "\\\\").replace(/\n/g, "\\n");
fs.writeFileSync(
  process.env.MYSQL_CNF,
  `[client]\nuser=${escapeCnf(decodeURIComponent(url.username || ""))}\npassword=${escapeCnf(decodeURIComponent(url.password || ""))}\nhost=${escapeCnf(url.hostname || "127.0.0.1")}\nport=${escapeCnf(url.port || "3306")}\n`,
  { mode: 0o600 }
);
process.stdout.write((url.pathname || "/").replace(/^\//, ""));
NODE
)"

  log "بازگردانی دیتابیس: $DB_NAME"
  log "هشدار: داده فعلی دیتابیس بازنویسی می‌شود"
  read -r -p "ادامه؟ [y/N] " confirm
  [[ "$confirm" == "y" || "$confirm" == "Y" ]] || die "لغو شد"

  mysql --defaults-extra-file="$MYSQL_CNF" "$DB_NAME" <"$WORK_DIR/database.sql"
  rm -f "$MYSQL_CNF"
fi

log "بازگردانی انجام شد"
