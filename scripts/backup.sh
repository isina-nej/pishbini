#!/usr/bin/env bash
# Backup important pishbini data: MySQL dump, .env, uploaded splash video(s).
#
# Usage:
#   ./scripts/backup.sh
#   BACKUP_ROOT=/opt/backups/pishbini KEEP_DAYS=30 ./scripts/backup.sh
#   npm run backup
#
# Restore:
#   npm run backup:restore -- /path/to/pishbini_backup_YYYYMMDD_HHMMSS.tar.gz

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT/.env}"
BACKUP_ROOT="${BACKUP_ROOT:-/opt/backups/pishbini}"
KEEP_DAYS="${KEEP_DAYS:-14}"
STAMP="$(date +%Y%m%d_%H%M%S)"
WORK_DIR="$BACKUP_ROOT/.work_$STAMP"
ARCHIVE="$BACKUP_ROOT/pishbini_backup_$STAMP.tar.gz"

log() {
  printf '[%s] %s\n' "$(date '+%H:%M:%S')" "$*"
}

die() {
  log "ERROR: $*"
  exit 1
}

cleanup_work() {
  rm -rf "$WORK_DIR"
}

trap cleanup_work EXIT

if [[ ! -f "$ENV_FILE" ]]; then
  die "فایل .env پیدا نشد: $ENV_FILE"
fi

if ! command -v mysqldump >/dev/null 2>&1; then
  die "mysqldump نصب نیست"
fi

if ! command -v node >/dev/null 2>&1; then
  die "node نصب نیست"
fi

mkdir -p "$BACKUP_ROOT" "$WORK_DIR"

MYSQL_CNF="$(mktemp)"
chmod 600 "$MYSQL_CNF"

log "خواندن DATABASE_URL از $ENV_FILE"
DB_NAME="$(ENV_FILE="$ENV_FILE" MYSQL_CNF="$MYSQL_CNF" node <<'NODE'
const fs = require("fs");

const envPath = process.env.ENV_FILE;
const cnfPath = process.env.MYSQL_CNF;
const raw = fs.readFileSync(envPath, "utf8");
const line = raw.split("\n").find((l) => /^\s*DATABASE_URL\s*=/.test(l));
if (!line) {
  console.error("DATABASE_URL not found");
  process.exit(1);
}
const value = line.replace(/^\s*DATABASE_URL\s*=\s*/, "").trim().replace(/^["']|["']$/g, "");
let url;
try {
  url = new URL(value);
} catch {
  console.error("Invalid DATABASE_URL");
  process.exit(1);
}

const user = decodeURIComponent(url.username || "");
const password = decodeURIComponent(url.password || "");
const host = url.hostname || "127.0.0.1";
const port = url.port || "3306";
const database = (url.pathname || "/").replace(/^\//, "") || "worldcup_prediction";

if (!user || !database) {
  console.error("DATABASE_URL missing user or database");
  process.exit(1);
}

const escapeCnf = (s) => String(s).replace(/\\/g, "\\\\").replace(/\n/g, "\\n");
fs.writeFileSync(
  cnfPath,
  `[client]\nuser=${escapeCnf(user)}\npassword=${escapeCnf(password)}\nhost=${escapeCnf(host)}\nport=${escapeCnf(port)}\n`,
  { mode: 0o600 }
);
process.stdout.write(database);
NODE
)" || die "DATABASE_URL نامعتبر است"

log "dump دیتابیس: $DB_NAME"
if ! mysqldump \
  --defaults-extra-file="$MYSQL_CNF" \
  --single-transaction \
  --no-tablespaces \
  --routines=false \
  --triggers \
  --set-gtid-purged=OFF \
  "$DB_NAME" >"$WORK_DIR/database.sql"; then
  rm -f "$MYSQL_CNF"
  die "mysqldump شکست خورد"
fi
rm -f "$MYSQL_CNF"

log "کپی .env"
cp "$ENV_FILE" "$WORK_DIR/env.backup"
chmod 600 "$WORK_DIR/env.backup"

if [[ -d "$ROOT/public/splash_screen" ]]; then
  log "کپی splash_screen/"
  mkdir -p "$WORK_DIR/splash_screen"
  cp -a "$ROOT/public/splash_screen/." "$WORK_DIR/splash_screen/" 2>/dev/null || true
fi

log "ساخت manifest"
{
  echo "{"
  echo "  \"app\": \"pishbini\","
  echo "  \"createdAt\": \"$(date -Iseconds)\","
  echo "  \"hostname\": \"$(hostname)\","
  echo "  \"database\": \"$DB_NAME\","
  echo "  \"gitCommit\": \"$(git -C "$ROOT" rev-parse HEAD 2>/dev/null || echo unknown)\","
  echo "  \"files\": [\"database.sql\", \"env.backup\", \"splash_screen/\"]"
  echo "}"
} >"$WORK_DIR/manifest.json"

log "فشرده‌سازی: $ARCHIVE"
tar -czf "$ARCHIVE" -C "$WORK_DIR" .

BYTES="$(wc -c <"$ARCHIVE" | tr -d ' ')"
log "تمام — $(du -h "$ARCHIVE" | cut -f1) ($BYTES bytes)"

if [[ "$KEEP_DAYS" =~ ^[0-9]+$ ]] && [[ "$KEEP_DAYS" -gt 0 ]]; then
  log "حذف بک‌آپ‌های قدیمی‌تر از $KEEP_DAYS روز"
  find "$BACKUP_ROOT" -maxdepth 1 -name 'pishbini_backup_*.tar.gz' -mtime +"$KEEP_DAYS" -delete 2>/dev/null || true
fi

log "مسیر: $ARCHIVE"
