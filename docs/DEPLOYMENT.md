# راهنمای کامل استقرار — پیش‌بینی جام جهانی (pishbini)

راه‌اندازی گام‌به‌گام پروژه **pishbini** روی Ubuntu (تست‌شده روی 24.04 LTS).

| مورد | مقدار |
|------|--------|
| دامنه | `wc.pishrosarmaye.com` |
| پشته | Next.js 16 · Prisma 7 · MySQL 8 · Nginx · PM2 |
| مسیر پیشنهادی روی سرور | `/opt/pishbini` |
| پورت پیش‌فرض اپ | `3000` (اگر اشغال بود → `3001`) |

---

## ⚠️ نکات قبل از شروع

1. **pishbini با pishro فرق دارد.** اگر روی همان سرور پروژه دیگری دارید (مثلاً `/opt/pishro`)، `.env` و دیتابیس جداست — فایل `.env` پروژه دیگر را کپی نکنید.
2. **قبل از `npx prisma` حتماً `npm ci` بزنید.** وگرنه خطای `prisma: not found` می‌گیرید.
3. **جدول حذفی (bracket)** — migration `20260622120000_bracket_tables` در repo است؛ با `migrate deploy` اعمال می‌شود.
4. اگر **swap پر** است (`free -h` → Swap نزدیک ۱۰۰٪)، قبل از `npm run build` swap اضافه کنید (بخش ۳.۳).

---

## خلاصه سریع — ترتیب صحیح دستورات

```bash
cd /opt/pishbini

# 1) env
cp .env.example .env && nano .env && chmod 600 .env

# 2) وابستگی‌ها (الزامی قبل از prisma)
npm ci

# 3) دیتابیس
npx prisma migrate deploy
# اگر سرور قدیمی db push زده: migrate جدید skip می‌شود
npm run db:seed             # فقط deploy اول — flagUrl را به /flags/{code}.svg به‌روز می‌کند

# 3b) پرچم‌ها (SVG از flag-icons — اگر public/flags در git نیست)
npm run flags:download

# 4) build و اجرا
npm run build
pm2 start ecosystem.config.cjs
pm2 save
```

بعد Nginx + SSL (بخش ۱۰ و ۱۱).

---

## فهرست

1. [معماری](#1-معماری)
2. [DNS](#2-dns)
3. [آماده‌سازی سرور](#3-آماده‌سازی-سرور)
4. [نصب Node / MySQL / Nginx](#4-نصب-node--mysql--nginx)
5. [MySQL — دیتابیس pishbini](#5-mysql--دیتابیس-pishbini)
6. [دریافت کد](#6-دریافت-کد)
7. [فایل `.env`](#7-فایل-env)
8. [نصب npm و Prisma](#8-نصب-npm-و-prisma)
9. [Migration، db push و Seed](#9-migration-db-push-و-seed)
10. [Build و PM2](#10-build-و-pm2)
11. [Nginx و SSL](#11-nginx-و-ssl)
12. [چند اپ روی یک سرور](#12-چند-اپ-روی-یک-سرور)
13. [راه‌اندازی ادمین](#13-راه‌اندازی-ادمین)
14. [Redeploy](#14-redeploy)
15. [Backup](#15-backup)
16. [عیب‌یابی](#16-عیب‌یابی)
17. [چک‌لیست نهایی](#17-چک‌لیست-نهایی)

---

## 1. معماری

```
کاربر ──HTTPS──► Nginx :443 ──► Next.js (PM2) :3000 یا :3001
                                      │
                                      └── MySQL 127.0.0.1:3306
                                           └── DB: worldcup_prediction
```

MySQL فقط از localhost — پورت 3306 را به اینترنت باز نکنید.

---

## 2. DNS

| نوع | Host | مقدار |
|-----|------|-------|
| A | `wc` | IP سرور (مثلاً `178.239.147.136`) |

```bash
dig +short wc.pishrosarmaye.com
```

---

## 3. آماده‌سازی سرور

### 3.1 SSH و به‌روزرسانی

```bash
ssh root@YOUR_SERVER_IP
apt update && apt upgrade -y
timedatectl set-timezone Asia/Tehran
```

### 3.2 Node.js 20 LTS

```bash
node -v   # اگر نبود:
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs build-essential
node -v && npm -v
```

### 3.3 حافظه و Swap (مهم برای build)

```bash
free -h
```

اگر **Swap usage** بالای ۸۰٪ است:

```bash
fallocate -l 2G /swapfile_pishbini
chmod 600 /swapfile_pishbini
mkswap /swapfile_pishbini
swapon /swapfile_pishbini
echo '/swapfile_pishbini none swap sw 0 0' >> /etc/fstab
```

`npm run build` روی سرور ۱–۲GB RAM می‌خواهد.

### 3.4 PM2

```bash
npm install -g pm2
```

---

## 4. نصب Node / MySQL / Nginx

### MySQL (اگر از قبل نصب نیست)

```bash
apt install -y mysql-server
systemctl enable mysql && systemctl start mysql
```

### Nginx + Certbot

```bash
apt install -y nginx certbot python3-certbot-nginx
systemctl enable nginx
```

---

## 5. MySQL — دیتابیس pishbini

**دیتابیس جدا از پروژه‌های دیگر** (مثلاً `pishro`):

```bash
mysql -u root -p
```

```sql
CREATE DATABASE worldcup_prediction
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- روش الف: کاربر اختصاصی (توصیه‌شده)
CREATE USER 'wcuser'@'localhost' IDENTIFIED BY 'sina';
GRANT ALL PRIVILEGES ON worldcup_prediction.* TO 'wcuser'@'localhost';

-- روش ب: استفاده از root موجود (فقط اگر می‌دانید چه می‌کنید)
-- GRANT ALL ON worldcup_prediction.* TO 'root'@'localhost';

FLUSH PRIVILEGES;
EXIT;
```

تست:

```bash
mysql -u wcuser -p -h 127.0.0.1 worldcup_prediction -e "SELECT 1;"
```

**فرمت `DATABASE_URL`:**

```
mysql://wcuser:PASSWORD@127.0.0.1:3306/worldcup_prediction
```

> همیشه `127.0.0.1` — نه `localhost` (جلوگیری از مشکل IPv6 و pool timeout).

---

## 6. دریافت کد

```bash
mkdir -p /opt
cd /opt
git clone https://github.com/isina-nej/pishbini.git pishbini
cd pishbini
git checkout main
```

اگر repo از قبل هست:

```bash
cd /opt/pishbini
git pull origin main
```

اگر `git pull` خطای **local changes would be overwritten** داد (معمولاً `ecosystem.config.cjs` / `package.json`):

```bash
cd /opt/pishbini
git stash push -m "server-local" -- ecosystem.config.cjs package.json package-lock.json
git pull origin main
# اگر بعد از pull پورت 3001 در ecosystem.config.cjs نیست:
# nano ecosystem.config.cjs  → PORT: 3001
npm ci
```

`git stash` تغییرات محلی را موقتاً کنار می‌گذارد؛ نسخه repo معمولاً همان PORT 3001 را دارد.

**به‌روزرسانی پرچم‌ها:** بعد از pull، پوشه `public/flags/` از git می‌آید؛ `npm run flags:download` فقط اگر فایل‌ها نبودند. برای `flagUrl` در DB روی سرور production **seed کامل نزنید** — کافی است:

```bash
mysql -u wcuser -p worldcup_prediction -e "UPDATE Team SET flagUrl = CONCAT('/flags/', LOWER(code), '.svg');"
```

`npm run db:seed` فقط برای deploy اول یا محیط تست است (براکت را reset می‌کند).

---

## 7. فایل `.env`

```bash
cd /opt/pishbini
cp .env.example .env
nano .env
chmod 600 .env
```

### نمونه Production

```env
DATABASE_URL="mysql://wcuser:YOUR_PASSWORD@127.0.0.1:3306/worldcup_prediction"

NEXT_PUBLIC_APP_URL="https://wc.pishrosarmaye.com"

ADMIN_PASSWORD="رمز-قوی-پنل-ادمین"
ADMIN_SESSION_SECRET="خروجی-openssl-rand-زیر"

SMS_SERVICE="mock"
SMS_PROVIDER="mock"

# ModirPayamak
SMS_USERNAME=""
SMS_PASSWORD=""
SMS_FROM="pishro"
SMS_API_URL="https://sms.modirpayamak.com"

# Melipayamak
MELIPAYAMAK_USERNAME=""
MELIPAYAMAK_API_KEY=""
MELIPAYAMAK_SENDER=""

# IPPanel Pattern (OTP + submit confirmation)
IPPANEL_API_KEY=""
IPPANEL_FROM_NUMBER="+983000505"
IPPANEL_PATTERN_CODE="ppaissmzfp67m2i"
IPPANEL_CONFIRM_PATTERN_CODE=""

RATE_LIMIT_ENABLED="true"
NODE_ENV="production"

# Web Push (npx web-push generate-vapid-keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY="..."
VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
VAPID_SUBJECT="mailto:support@pishrosarmaye.com"
CRON_SECRET="..."
```

تولید secret:

```bash
openssl rand -base64 32
npx web-push generate-vapid-keys
```

### جدول متغیرها

| متغیر | الزامی | توضیح |
|-------|--------|-------|
| `DATABASE_URL` | ✅ | اتصال MySQL — دیتابیس `worldcup_prediction` |
| `NEXT_PUBLIC_APP_URL` | ✅ | `https://wc.pishrosarmaye.com` بدون `/` آخر |
| `ADMIN_PASSWORD` | ✅ | فقط رمز — یوزرنیم ندارد |
| `ADMIN_SESSION_SECRET` | ✅ | حداقل ۳۲ کاراکتر تصادفی |
| `NODE_ENV` | ✅ | `production` — کوکی ادمین با HTTPS کار می‌کند |
| `SMS_SERVICE` | ✅ | `mock` \| `modirpayamak` \| `melipayamak` — پیامک تأیید ثبت‌نام |
| `SMS_PROVIDER` | — | alias قدیمی `SMS_SERVICE` |
| `IPPANEL_*` | — | OTP (`IPPANEL_PATTERN_CODE`, param: `code`) و تأیید ثبت (`IPPANEL_CONFIRM_PATTERN_CODE`, param: `link`) |
| `RATE_LIMIT_ENABLED` | ✅ | `true` |

### ⛔ اشتباه رایج

```env
# ❌ اشتباه — USER و PASSWORD placeholder هستند، نه نام واقعی کاربر:
DATABASE_URL="mysql://USER:sina@localhost:3306/worldcup_prediction"
# خطا: P1000 Authentication failed for `USER`

# ✅ درست:
DATABASE_URL="mysql://wcuser:sina@127.0.0.1:3306/worldcup_prediction"
```

```env
# این‌ها مربوط به pishbini نیستند — استفاده نکنید:
NEXTAUTH_URL=...
NEXTAUTH_SECRET=...
DB_HOST=...          # pishbini فقط DATABASE_URL می‌خواند
NEXT_PUBLIC_BASE_URL=...
```

> `NODE_ENV` را **`production`** بگذارید — با `development` کوکی ادمین روی HTTPS درست کار نمی‌کند.

---

## 8. نصب npm و Prisma

**این مرحله قبل از هر دستور prisma الزامی است.**

```bash
cd /opt/pishbini
npm ci
```

اگر `package-lock.json` نیست:

```bash
npm install
```

بررسی نصب Prisma:

```bash
ls node_modules/.bin/prisma
npx prisma --version
```

`postinstall` خودکار `prisma generate` را اجرا می‌کند.

### خطای `prisma: not found`

یعنی هنوز `npm ci` نزده‌اید یا در مسیر اشتباه هستید:

```bash
cd /opt/pishbini
pwd
ls package.json
npm ci
npx prisma --version
```

---

## 9. Migration، db push و Seed

### 9.1 Migration اصلی

```bash
cd /opt/pishbini
npx prisma migrate deploy
```

### 9.2 جداول Bracket

Migration `20260622120000_bracket_tables` در repo است و با `migrate deploy` اعمال می‌شود.

اگر سرور قبلاً `db push` زده بود، migration جدید بدون مشکل skip یا apply می‌شود.

### 9.3 Seed — فقط بار اول

```bash
npm run db:seed
```

خروجی موفق:

```
Seeding database...
Bracket seeded: 31 matches
Seed completed.
```

> **هشدار:** اجرای مجدد seed ممکن است داده bracket را reset کند. در redeploy معمولی seed نزنید.

### 9.4 بررسی

```bash
mysql -u wcuser -p worldcup_prediction -e "SHOW TABLES;"
npx prisma migrate status
```

---

## 10. Build و PM2

### 10.1 بررسی پورت آزاد

```bash
ss -tlnp | grep -E ':3000|:3001'
pm2 list
```

اگر پورت 3000 اشغال است (مثلاً توسط `/opt/pishro`)، در `ecosystem.config.cjs` پورت را عوض کنید:

```javascript
env: {
  NODE_ENV: "production",
  PORT: 3001,   // ← تغییر دهید
},
```

و در Nginx هم `proxy_pass http://127.0.0.1:3001;` (بخش ۱۱).

### 10.2 Build

```bash
cd /opt/pishbini
npm run build
```

### 10.3 PM2

فایل `ecosystem.config.cjs` در ریشه پروژه آماده است:

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup    # دستور خروجی را اجرا کنید
```

بررسی:

```bash
pm2 status
pm2 logs pishbini --lines 30
curl -I http://127.0.0.1:3001
# اگر پورت 3000 است، همان را تست کنید
```

---

## 11. Nginx و SSL

### 11.0 فایروال — **قبل از Certbot**

اگر UFW فعال است ولی پورت 80/443 باز نیست، Certbot با خطای `Timeout during connect` fail می‌شود.

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'    # 80 + 443
ufw status
```

فقط بعد از باز بودن پورت‌ها:

```bash
dig +short wc.pishrosarmaye.com   # باید IP سرور باشد
curl -I http://wc.pishrosarmaye.com
```

### 11.1 Config اولیه (قبل از SSL)

```bash
nano /etc/nginx/sites-available/pishbini-wc
```

```nginx
server {
    listen 80;
    server_name wc.pishrosarmaye.com;

    location / {
        proxy_pass http://127.0.0.1:3001;   # پورت pishbini در ecosystem.config.cjs
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}
```

```bash
ln -sf /etc/nginx/sites-available/pishbini-wc /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

### 11.2 SSL

```bash
certbot --nginx -d wc.pishrosarmaye.com
```

بعد از موفقیت:

```bash
certbot renew --dry-run
```

اگر خطای timeout دیدید:
1. `ufw status` → 80 و 443 باید ALLOW باشند
2. DNS باید به IP همین سرور اشاره کند
3. `nginx -t && systemctl reload nginx`
4. از بیرون تست: `curl -I http://wc.pishrosarmaye.com`

> گواهی‌های قدیمی `pishrosarmaye.com` جدا از `wc` هستند — برای subdomain جدید فقط `-d wc.pishrosarmaye.com` کافی است.

### 11.3 بعد از SSL — به‌روز `.env`

```bash
nano /opt/pishbini/.env
# NODE_ENV=production
# DATABASE_URL با 127.0.0.1

npm run build
pm2 restart pishbini --update-env
```

---

## 12. چند اپ روی یک سرور

مثال واقعی: سرور `pishro-vps` با دو پروژه:

| مسیر | دامنه | پورت | دیتابیس |
|------|--------|------|---------|
| `/opt/pishro` | `pishrosarmaye.com` | 3000 | `pishro` |
| `/opt/pishbini` | `wc.pishrosarmaye.com` | 3001 | `worldcup_prediction` |

هر کدام:
- `.env` جدا
- `pm2` process جدا (`pishro` و `pishbini`)
- `server_name` جدا در Nginx
- `DATABASE_URL` به دیتابیس خودش

```bash
pm2 list
# pishro  → 3000
# pishbini → 3001
```

---

## 13. راه‌اندازی ادمین

1. `https://wc.pishrosarmaye.com/admin/login`
2. رمز = `ADMIN_PASSWORD` از `.env`
3. بعد از ورود:

| مسیر | کار |
|------|-----|
| `/admin/teams` | بررسی تیم‌ها |
| `/admin/matches` | ساخت بازی با زمان واقعی |
| `/admin/results` | ثبت و ویرایش نتیجه (گل اختیاری، اعلان با تأخیر ۱۰ دقیقه) |
| `/admin/point-rules` | تأیید امتیازها (۳۰ / ۱۰ / ۳) |
| `/admin/bracket` | validate → publish |
| `/admin` | بررسی آمار داشبورد |

---

## 13.5 Cron — اعلان Web Push

بعد از تنظیم `VAPID_*` و `CRON_SECRET` در `.env`، migrationها را deploy کنید و cron سیستم را اضافه کنید:

```bash
crontab -e
```

```cron
*/5 * * * * CRON_SECRET=$(grep '^CRON_SECRET=' /opt/pishbini/.env | sed 's/^CRON_SECRET=//' | tr -d '"' | tr -d "'") && curl -fsS -H "Authorization: Bearer ${CRON_SECRET}" https://wc.pishrosarmaye.com/api/cron/push-jobs >> /var/log/pishbini-push-cron.log 2>&1
```

این job دو کار انجام می‌دهد:

1. **بازی‌های جدید در پنجره ۲۴ساعته** — اعلان «بازی جدید برای پیش‌بینی»
2. **نتیجه بازی‌های تسویه‌شده** — اعلان نتیجه با **تأخیر ۱۰ دقیقه** پس از ثبت/ویرایش در `/admin/results` (هر ویرایش تایمر را ریست می‌کند)

پاسخ نمونه cron:

```json
{"success":true,"newWindows":{"matchesNotified":0,"pushDelivered":0},"settlement":{"matchesProcessed":0,"pushDelivered":0}}
```

> برای دقت بهتر اعلان نتیجه، cron را هر **۵ دقیقه** بزنید (نه ۱۵). از `cut -d=` برای خواندن `CRON_SECRET` استفاده نکنید — مقدار base64 ممکن است `=` داشته باشد.

---

## 14. Redeploy

```bash
cd /opt/pishbini
git pull origin main
npm ci
npx prisma migrate deploy
npx prisma db push          # اگر schema عوض شده
npm run build
pm2 restart pishbini
pm2 logs pishbini --lines 50
```

`npm run db:seed` فقط در صورت نیاز صریح.

---

## 15. Backup

اسکریپت خودکار در repo:

```bash
cd /opt/pishbini
chmod +x scripts/backup.sh scripts/restore-backup.sh
npm run backup
```

خروجی: `/opt/backups/pishbini/pishbini_backup_YYYYMMDD_HHMMSS.tar.gz`

شامل:
- `database.sql` — dump کامل MySQL
- `env.backup` — کپی `.env` (رمزها و VAPID)
- `splash_screen/` — ویدیوهای آپلودشده اسپلش (در صورت وجود)
- `manifest.json` — زمان و commit

تنظیمات اختیاری:

```bash
BACKUP_ROOT=/var/backups KEEP_DAYS=30 npm run backup
```

بازگردانی:

```bash
npm run backup:restore -- /opt/backups/pishbini/pishbini_backup_20260623_120000.tar.gz
npm run backup:restore -- backup.tar.gz --db-only
```

Cron روزانه (مثال ساعت ۳ بامداد):

```cron
0 3 * * * cd /opt/pishbini && /usr/bin/npm run backup >> /var/log/pishbini-backup.log 2>&1
```

### دستی (بدون اسکریپت)

کاربر `wcuser` معمولاً privilege `PROCESS` ندارد — از `--no-tablespaces` استفاده کنید:

```bash
mkdir -p /opt/backups
mysqldump -u wcuser -p \
  --single-transaction \
  --no-tablespaces \
  worldcup_prediction \
  > /opt/backups/wc_$(date +%Y%m%d).sql
```

یا با root:

```bash
mysqldump -u root -p \
  --single-transaction \
  worldcup_prediction \
  > /opt/backups/wc_$(date +%Y%m%d).sql
```

Restore (نام فایل واقعی را بگذارید — نه `YYYYMMDD`):

```bash
mysql -u wcuser -p worldcup_prediction < /opt/backups/wc_20260622.sql
```

---

## 16. عیب‌یابی

### `P1000: Authentication failed` / credentials for `USER`

`.env` هنوز placeholder دارد. `USER` را با `wcuser` عوض کنید:

```bash
grep DATABASE_URL .env
# باید باشد: mysql://wcuser:رمز@127.0.0.1:3306/worldcup_prediction
```

---

### Certbot timeout / TLS error

خطاهای `Timeout during connect` یا `TLS connect error: unexpected eof`:

1. UFW: `ufw allow 'Nginx Full'` قبل از certbot
2. DNS: `dig +short wc.pishrosarmaye.com` → IP سرور
3. Nginx: `nginx -t && systemctl reload nginx`
4. تست HTTP: `curl -I http://wc.pishrosarmaye.com`
5. سپس: `certbot --nginx -d wc.pishrosarmaye.com`

تا SSL نصب نشود، سایت از بیرون با HTTPS باز نمی‌شود.

---

### `mysqldump: PROCESS privilege`

```bash
mysqldump -u wcuser -p --single-transaction --no-tablespaces worldcup_prediction > backup.sql
```

---

### `prisma: not found`

```bash
cd /opt/pishbini && npm ci && npx prisma --version
```

---

### `pool timeout` / Prisma به MySQL وصل نمی‌شود

```bash
systemctl status mysql
mysql -u wcuser -p -h 127.0.0.1 worldcup_prediction -e "SELECT 1;"
grep DATABASE_URL .env
pm2 restart pishbini
```

- MySQL خاموش؟
- `DATABASE_URL` اشتباه؟
- از `127.0.0.1` استفاده کنید نه `localhost`

---

### Nginx 502

```bash
pm2 status
curl -I http://127.0.0.1:3001
pm2 logs pishbini
```

پورت Nginx با `PORT` در ecosystem یکی باشد (شما: **3001**).

---

### ورود ادمین / session نگه نمی‌دارد

- `NODE_ENV=production`
- سایت روی **HTTPS**
- `ADMIN_SESSION_SECRET` تنظیم شده
- بعد از تغییر `.env` → `npm run build` + `pm2 restart`

---

### لینک referral اشتباه

`NEXT_PUBLIC_APP_URL` باید `https://wc.pishrosarmaye.com` باشد → rebuild + restart.

---

### `migrate deploy` خطا / جدول bracket نیست

```bash
npx prisma migrate status
npx prisma db push
npm run db:seed
```

---

### build با Out of memory

swap اضافه کنید (بخش ۳.۳) یا موقتاً:

```bash
NODE_OPTIONS="--max-old-space-size=2048" npm run build
```

---

### SMS ارسال نمی‌شود

- **توسعه:** `SMS_SERVICE=mock` — فقط console + `SmsLog`؛ ثبت‌نام fail نمی‌شود.
- **production:** `SMS_SERVICE=melipayamak` یا `modirpayamak` + credentialهای مربوط در `.env`.
- **OTP (IPPanel Pattern):** `IPPANEL_API_KEY` + `IPPANEL_PATTERN_CODE` — Authorization بدون `Bearer`.
- **تأیید ثبت (IPPanel Pattern):** `IPPANEL_CONFIRM_PATTERN_CODE` — param: `link` (لینک دعوت کامل).
- **fallback متن آزاد:** `SMS_SERVICE=melipayamak` یا `modirpayamak` اگر Pattern تأیید تنظیم نشده باشد.
- خطاها در جدول `SmsLog` و پنل ادمین → کاربران قابل مشاهده‌اند.

---

## 17. چک‌لیست نهایی

### زیرساخت
- [ ] DNS → IP سرور
- [ ] Node 20+ (`node -v`)
- [ ] MySQL روشن
- [ ] دیتابیس `worldcup_prediction` ساخته شده
- [ ] Nginx + SSL
- [ ] swap کافی برای build

### Deploy
- [ ] مسیر `/opt/pishbini`
- [ ] `.env` جدا از pishro — `chmod 600`
- [ ] `npm ci` قبل از prisma
- [ ] `npx prisma migrate deploy`
- [ ] `npx prisma db push`
- [ ] `npm run db:seed` (اولین بار)
- [ ] `npm run build` موفق
- [ ] PM2 `online`
- [ ] پورت conflict حل شده (3000 یا 3001)

### عملکرد
- [ ] `https://wc.pishrosarmaye.com` باز می‌شود
- [ ] `/admin/login` کار می‌کند
- [ ] APIها 200 (نه 500)
- [ ] `/bracket` بعد از publish

### امنیت
- [ ] `ADMIN_PASSWORD` غیر پیش‌فرض
- [ ] `ADMIN_SESSION_SECRET` تصادفی
- [ ] MySQL از بیرون بسته
- [ ] `.env` commit نشده

---

## پیوست — مسیرهای اپ

| مسیر | توضیح |
|------|--------|
| `/` | پیش‌بینی بازی‌ها |
| `/bracket` | جدول حذفی |
| `/leaderboard` | امتیازات |
| `/admin` | پنل مدیریت |

## مستندات مرتبط

- `docs/MANUAL_TESTS.md`
- `docs/BRACKET_MANUAL_TESTS.md`
- `CLAUDE.md`

---

**آخرین به‌روزرسانی:** 2026-06-22
