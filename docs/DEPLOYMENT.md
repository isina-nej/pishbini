# راهنمای کامل استقرار — پیش‌بینی جام جهانی (pishbini)

این سند گام‌به‌گام راه‌اندازی پروژه **pishbini** روی یک سرور لینوکس (Ubuntu) را توضیح می‌دهد.

**دامنه پیشنهادی:** `wc.pishrosarmaye.com`  
**پشته:** Next.js 16 · MySQL 8 · Nginx · PM2 · Certbot

---

## فهرست

1. [معماری و پیش‌نیازها](#1-معماری-و-پیش‌نیازها)
2. [تنظیم DNS](#2-تنظیم-dns)
3. [آماده‌سازی سرور](#3-آماده‌سازی-سرور)
4. [نصب Node.js، MySQL، Nginx](#4-نصب-nodejsmysqlnginx)
5. [پیکربندی MySQL](#5-پیکربندی-mysql)
6. [دریافت کد و نصب وابستگی‌ها](#6-دریافت-کد-و-نصب-وابستگی‌ها)
7. [متغیرهای محیطی (.env)](#7-متغیرهای-محیطی-env)
8. [Migration و Seed دیتابیس](#8-migration-و-seed-دیتابیس)
9. [Build و اجرای Production](#9-build-و-اجرای-production)
10. [پیکربندی Nginx](#10-پیکربندی-nginx)
11. [SSL با Certbot](#11-ssl-با-certbot)
12. [فایروال](#12-فایروال)
13. [راه‌اندازی اولیه پنل ادمین](#13-راه‌اندازی-اولیه-پنل-ادمین)
14. [به‌روزرسانی (Redeploy)](#14-به‌روزرسانی-redeploy)
15. [پشتیبان‌گیری MySQL](#15-پشتیبان‌گیری-mysql)
16. [عیب‌یابی](#16-عیب‌یابی)
17. [چک‌لیست نهایی](#17-چک‌لیست-نهایی)

---

## 1. معماری و پیش‌نیازها

### معماری Production

```
کاربر ──HTTPS──► Nginx (443) ──HTTP──► Next.js (PM2, پورت 3000)
                                              │
                                              └──► MySQL (localhost:3306)
```

- **Nginx** ترافیک HTTPS را دریافت و به اپ Next.js پروکسی می‌کند.
- **PM2** فرآیند Node.js را مدیریت، ری‌استارت و پایدار نگه می‌دارد.
- **MySQL** فقط روی `localhost` در دسترس است (از اینترنت مستقیم expose نشود).

### حداقل مشخصات سرور

| مورد | حداقل پیشنهادی |
|------|----------------|
| CPU | 1 vCPU |
| RAM | 2 GB |
| دیسک | 20 GB SSD |
| OS | Ubuntu 22.04 LTS یا 24.04 LTS |
| Node.js | 20 LTS یا 22 LTS |
| MySQL | 8.0+ (یا MariaDB 10.6+) |

### دسترسی‌های لازم

- SSH به سرور با کاربر دارای `sudo`
- کنترل DNS دامنه
- دسترسی به مخزن Git پروژه

---

## 2. تنظیم DNS

در پنل DNS دامنه (`pishrosarmaye.com`) یک رکورد **A** بسازید:

| نوع | نام (Host) | مقدار | TTL |
|-----|------------|-------|-----|
| A | `wc` | `IP_PUBLIC_SERVER` | 300 |

نتیجه: `wc.pishrosarmaye.com` → IP سرور

**بررسی (از سیستم خودتان):**

```bash
dig +short wc.pishrosarmaye.com
# باید IP سرور را برگرداند
```

> ⏱ انتشار DNS معمولاً ۵ دقیقه تا ۲۴ ساعت طول می‌کشد. قبل از Certbot مطمئن شوید DNS درست resolve می‌شود.

---

## 3. آماده‌سازی سرور

### 3.1 اتصال SSH

```bash
ssh root@YOUR_SERVER_IP
# یا
ssh ubuntu@YOUR_SERVER_IP
```

### 3.2 به‌روزرسانی سیستم

```bash
sudo apt update && sudo apt upgrade -y
sudo timedatectl set-timezone Asia/Tehran
```

### 3.3 ساخت کاربر deploy (اختیاری ولی توصیه‌شده)

```bash
sudo adduser deploy
sudo usermod -aG sudo deploy
sudo mkdir -p /var/www
sudo chown deploy:deploy /var/www
```

از این به بعد با کاربر `deploy` کار کنید:

```bash
su - deploy
```

---

## 4. نصب Node.js، MySQL، Nginx

### 4.1 Node.js 20 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs build-essential
node -v    # باید v20.x باشد
npm -v
```

### 4.2 MySQL Server

```bash
sudo apt install -y mysql-server
sudo systemctl enable mysql
sudo systemctl start mysql
sudo systemctl status mysql
```

امنیت اولیه MySQL (رمز root و حذف کاربران/test):

```bash
sudo mysql_secure_installation
```

### 4.3 Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 4.4 Certbot (برای SSL)

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 4.5 PM2 (مدیریت فرآیند Node)

```bash
sudo npm install -g pm2
```

---

## 5. پیکربندی MySQL

### 5.1 ساخت دیتابیس و کاربر

```bash
sudo mysql -u root -p
```

در MySQL shell:

```sql
CREATE DATABASE worldcup_prediction
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER 'wcuser'@'localhost' IDENTIFIED BY 'یک-رمز-بسیار-قوی-اینجا';
GRANT ALL PRIVILEGES ON worldcup_prediction.* TO 'wcuser'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 5.2 تست اتصال

```bash
mysql -u wcuser -p -h 127.0.0.1 worldcup_prediction -e "SELECT 1;"
```

اگر `1` برگشت، اتصال درست است.

### 5.3 نکات مهم MySQL

- charset باید **utf8mb4** باشد (پشتیبانی فارسی و emoji).
- کاربر فقط از `localhost` — نه `%`.
- رمز را در `.env` ذخیره کنید، نه در تاریخچه shell.

**فرمت DATABASE_URL:**

```
mysql://wcuser:PASSWORD@127.0.0.1:3306/worldcup_prediction
```

> در production از `127.0.0.1` به‌جای `localhost` استفاده کنید تا از مشکلات IPv6 جلوگیری شود.

---

## 6. دریافت کد و نصب وابستگی‌ها

### 6.1 Clone پروژه

```bash
cd /var/www
git clone <URL_REPO> pishbini
cd pishbini
```

مثال:

```bash
git clone git@github.com:your-org/pishbini.git pishbini
```

### 6.2 Checkout branch مناسب

```bash
git checkout main
git pull origin main
```

### 6.3 نصب پکیج‌ها

```bash
npm ci
# یا اگر package-lock نیست:
npm install
```

`postinstall` به‌صورت خودکار `prisma generate` را اجرا می‌کند.

---

## 7. متغیرهای محیطی (.env)

```bash
cp .env.example .env
nano .env
```

### 7.1 فایل `.env` Production (نمونه)

```env
# ─── Database ───
DATABASE_URL="mysql://wcuser:YOUR_DB_PASSWORD@127.0.0.1:3306/worldcup_prediction"

# ─── App URL (باید دقیقاً با دامنه HTTPS یکی باشد) ───
NEXT_PUBLIC_APP_URL="https://wc.pishrosarmaye.com"

# ─── Admin Auth ───
ADMIN_PASSWORD="یک-رمز-قوی-برای-پنل-ادمین"
ADMIN_SESSION_SECRET="حداقل-۳۲-کاراکتر-تصادفی-برای-امضای-کوکی"

# ─── SMS ───
SMS_PROVIDER="mock"
SMS_API_KEY=""
SMS_SENDER=""

# ─── Runtime ───
RATE_LIMIT_ENABLED="true"
NODE_ENV="production"
```

### 7.2 توضیح هر متغیر

| متغیر | الزامی | توضیح |
|-------|--------|-------|
| `DATABASE_URL` | ✅ | اتصال MySQL. فرمت: `mysql://user:pass@host:port/db` |
| `NEXT_PUBLIC_APP_URL` | ✅ | URL عمومی سایت. برای لینک دعوت (referral) استفاده می‌شود. **حتماً `https://` باشد.** |
| `ADMIN_PASSWORD` | ✅ | رمز ورود پنل ادمین (`/admin/login`). یوزرنیم ندارد. |
| `ADMIN_SESSION_SECRET` | ✅ | کلید HMAC برای کوکی session ادمین. حداقل ۳۲ کاراکتر تصادفی. |
| `SMS_PROVIDER` | ✅ | `mock` برای تست؛ برای SMS واقعی باید provider پیاده‌سازی شود. |
| `SMS_API_KEY` | ❌ | کلید API سرویس SMS (در حالت mock خالی) |
| `SMS_SENDER` | ❌ | شماره/خط فرستنده SMS |
| `RATE_LIMIT_ENABLED` | ✅ | `true` در production |
| `NODE_ENV` | ✅ | **حتماً `production`** — کوکی ادمین فقط با HTTPS (`secure: true`) کار می‌کند. |

### 7.3 تولید secret امن

```bash
openssl rand -base64 32
# خروجی را در ADMIN_SESSION_SECRET بگذارید
```

### 7.4 محافظت از `.env`

```bash
chmod 600 .env
```

هرگز `.env` را commit نکنید.

---

## 8. Migration و Seed دیتابیس

### 8.1 اعمال Migrationها (روش استاندارد Production)

```bash
cd /var/www/pishbini
npx prisma migrate deploy
```

این دستور فقط migrationهای موجود در `prisma/migrations/` را اجرا می‌کند.

### 8.2 جدول حذفی (Bracket)

اگر migration جدول حذفی (`BracketMatch`, `BracketPick`, ...) هنوز در repo نیست، بعد از `migrate deploy` یک‌بار:

```bash
npx prisma db push
```

> **توصیه برای تیم توسعه:** قبل از deploy نهایی، migration براکت را در dev بسازید (`npx prisma migrate dev`) و commit کنید تا در production فقط `migrate deploy` کافی باشد.

### 8.3 Seed (داده اولیه)

```bash
npm run db:seed
```

Seed شامل:
- قوانین امتیاز (رفرال ۳۰، درست ۱۰، غلط ۳، ...)
- ۳۲ تیم نمونه
- چند بازی نمونه
- درخت ۳۱ مسابقه‌ای جدول حذفی
- فعال‌سازی و انتشار پیش‌فرض bracket

**خروجی موفق:**

```
Seeding database...
Bracket seeded: 31 matches
Seed completed.
```

اگر `Skipping bracket seed: need 32 active teams` دیدید، seed را دوباره اجرا کنید (تیم‌ها باید ۳۲ تا active باشند).

### 8.4 بررسی جداول

```bash
mysql -u wcuser -p worldcup_prediction -e "SHOW TABLES;"
```

---

## 9. Build و اجرای Production

### 9.1 Build

```bash
cd /var/www/pishbini
npm run build
```

باید بدون خطا تمام شود. در صورت خطای TypeScript یا Prisma، قبل از ادامه رفع کنید.

### 9.2 اجرای تست محلی (اختیاری)

```bash
npm start
# در ترمینال دیگر:
curl -I http://127.0.0.1:3000
# Ctrl+C برای توقف
```

### 9.3 PM2 — اجرای دائمی

**روش ساده:**

```bash
pm2 start npm --name pishbini -- start
pm2 save
```

**روش پیشنهادی — فایل ecosystem:**

فایل `ecosystem.config.cjs` در ریشه پروژه:

```javascript
module.exports = {
  apps: [
    {
      name: "pishbini",
      cwd: "/var/www/pishbini",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      watch: false,
      max_memory_restart: "512M",
    },
  ],
};
```

```bash
pm2 start ecosystem.config.cjs
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u deploy --hp /home/deploy
```

### 9.4 دستورات مفید PM2

```bash
pm2 status
pm2 logs pishbini
pm2 logs pishbini --lines 100
pm2 restart pishbini
pm2 stop pishbini
```

---

## 10. پیکربندی Nginx

### 10.1 ساخت فایل سایت

```bash
sudo nano /etc/nginx/sites-available/pishbini
```

محتوا:

```nginx
# Redirect HTTP → HTTPS (بعد از نصب SSL فعال می‌شود)
server {
    listen 80;
    listen [::]:80;
    server_name wc.pishrosarmaye.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name wc.pishrosarmaye.com;

    # Certbot این خطوط را اضافه می‌کند — قبل از SSL می‌توانید بلوک 443 را موقتاً حذف کنید
    # ssl_certificate /etc/letsencrypt/live/wc.pishrosarmaye.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/wc.pishrosarmaye.com/privkey.pem;

    # امنیت پایه
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # حداکثر آپلود (در صورت نیاز)
    client_max_body_size 2M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }
}
```

### 10.2 فعال‌سازی سایت

```bash
sudo ln -sf /etc/nginx/sites-available/pishbini /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### 10.3 قبل از SSL — config موقت HTTP

اگر هنوز SSL ندارید، موقتاً فقط بلوک port 80 بدون redirect بسازید:

```nginx
server {
    listen 80;
    server_name wc.pishrosarmaye.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

بعد از Certbot، config نهایی با HTTPS جایگزین می‌شود.

---

## 11. SSL با Certbot

```bash
sudo mkdir -p /var/www/certbot
sudo certbot --nginx -d wc.pishrosarmaye.com
```

- ایمیل معتبر وارد کنید.
- Terms را بپذیرید.
- گزینه redirect HTTP→HTTPS را **Yes** بزنید.

**تمدید خودکار:**

```bash
sudo certbot renew --dry-run
```

Certbot معمولاً cron/systemd timer نصب می‌کند.

**بررسی:**

```bash
curl -I https://wc.pishrosarmaye.com
# HTTP/2 200
```

---

## 12. فایروال

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

فقط پورت‌های **22** (SSH)، **80** و **443** (Nginx) باز باشند.  
MySQL (3306) از بیرون باز **نشود**.

---

## 13. راه‌اندازی اولیه پنل ادمین

### 13.1 ورود

1. مرورگر: `https://wc.pishrosarmaye.com/admin/login`
2. رمز: مقدار `ADMIN_PASSWORD` در `.env`
3. یوزرنیم **ندارد** — فقط رمز.

### 13.2 کارهای ضروری بعد از deploy

| مرحله | مسیر | کار |
|-------|------|-----|
| 1 | `/admin/teams` | تیم‌های واقعی جام جهانی را بررسی/ویرایش کنید |
| 2 | `/admin/matches` | بازی‌ها را با زمان شروع واقعی بسازید |
| 3 | `/admin/point-rules` | امتیازها را تأیید کنید (۳۰/۱۰/۳) |
| 4 | `/admin/bracket` | validate → publish (اگر seed شده باشد published است) |
| 5 | `/admin` | داشبورد — آمار باید لود شود |

### 13.3 تنظیمات bracket

در `/admin/bracket`:
- **فعال** — feature روشن
- **منتشر شده** — کاربران `/bracket` را می‌بینند
- **ثبت باز** — امکان submit bracket

دکمه **اعتبارسنجی** → **انتشار جدول**

### 13.4 تست سریع جریان کاربر

1. صفحه اصلی `/` — بازی‌های ۲۴ ساعت آینده
2. پیش‌بینی → `/submit` → `/success`
3. `/leaderboard` — موبایل mask شده
4. `/ref/CODE` — ذخیره referral در localStorage
5. `/bracket` — جدول حذفی

---

## 14. به‌روزرسانی (Redeploy)

```bash
cd /var/www/pishbini

# 1. دریافت آخرین کد
git pull origin main

# 2. وابستگی‌ها
npm ci

# 3. migration (اگر schema تغییر کرده)
npx prisma migrate deploy
# در صورت نیاز:
# npx prisma db push

# 4. build
npm run build

# 5. restart
pm2 restart pishbini

# 6. بررسی لاگ
pm2 logs pishbini --lines 50
```

> **نکته:** `npm run db:seed` را در production فقط در deploy اول یا با احتیاط اجرا کنید — ممکن است داده bracket را reset کند.

---

## 15. پشتیبان‌گیری MySQL

### 15.1 Backup دستی

```bash
mysqldump -u wcuser -p \
  --single-transaction \
  --routines \
  worldcup_prediction \
  > ~/backup/worldcup_$(date +%Y%m%d_%H%M).sql
```

### 15.2 Restore

```bash
mysql -u wcuser -p worldcup_prediction < ~/backup/worldcup_YYYYMMDD.sql
```

### 15.3 Cron روزانه (اختیاری)

```bash
crontab -e
```

```
0 3 * * * mysqldump -u wcuser -p'PASSWORD' worldcup_prediction | gzip > /home/deploy/backups/wc_$(date +\%Y\%m\%d).sql.gz
```

---

## 16. عیب‌یابی

### ❌ `pool timeout` / اتصال Prisma به MySQL

```
prisma:error pool timeout: failed to retrieve a connection from pool
```

**علت‌های رایج:**
- MySQL خاموش است → `sudo systemctl start mysql`
- `DATABASE_URL` اشتباه → user/pass/host/db را چک کنید
- از `127.0.0.1` به‌جای `localhost` استفاده کنید

```bash
sudo systemctl status mysql
mysql -u wcuser -p -h 127.0.0.1 worldcup_prediction -e "SELECT 1;"
pm2 restart pishbini
```

---

### ❌ Nginx 502 Bad Gateway

**علت:** Next.js روی پورت 3000 بالا نیست.

```bash
pm2 status
pm2 logs pishbini
curl http://127.0.0.1:3000
```

---

### ❌ ورود ادمین کار نمی‌کند / session نگه نمی‌دارد

- `NODE_ENV=production` باشد
- سایت باید **HTTPS** باشد (کوکی `secure: true`)
- `ADMIN_SESSION_SECRET` تنظیم شده باشد
- رمز دقیقاً همان `ADMIN_PASSWORD` باشد

---

### ❌ لینک دعوت (referral) اشتباه

`NEXT_PUBLIC_APP_URL` باید دقیقاً `https://wc.pishrosarmaye.com` باشد — بدون slash آخر.

بعد از تغییر:

```bash
npm run build
pm2 restart pishbini
```

---

### ❌ `prisma migrate deploy` خطا می‌دهد

```bash
npx prisma migrate status
```

اگر migration pending است، deploy را دوباره اجرا کنید.  
اگر schema جدید (مثل bracket) migration ندارد:

```bash
npx prisma db push
```

---

### ❌ صفحه ادمین باریک / مثل موبایل

مطمین شوید build جدید deploy شده — layout ادمین با کلاس `admin-root` تمام‌عرض است.

---

### ❌ SMS ارسال نمی‌شود

در MVP، `SMS_PROVIDER=mock` فقط در لاگ/DB ثبت می‌کند.  
خطای SMS **نباید** ثبت‌نام را fail کند — در `SmsLog` بررسی کنید.

---

## 17. چک‌لیست نهایی

### زیرساخت
- [ ] DNS به IP سرور resolve می‌شود
- [ ] MySQL روشن و دیتابیس ساخته شده
- [ ] Node.js 20+ نصب است
- [ ] Nginx فعال و config تست شده (`nginx -t`)
- [ ] SSL فعال (HTTPS بدون warning)
- [ ] UFW فقط 22/80/443 باز است
- [ ] PM2 بعد از reboot خودکار start می‌شود (`pm2 startup`)

### اپلیکیشن
- [ ] `.env` production کامل و `chmod 600`
- [ ] `npm run build` موفق
- [ ] `prisma migrate deploy` (و در صورت نیاز `db push`)
- [ ] `npm run db:seed` (deploy اول)
- [ ] PM2 process `online`

### عملکرد
- [ ] `https://wc.pishrosarmaye.com` باز می‌شود
- [ ] `/admin/login` — ورود با رمز
- [ ] داشبورد ادمین آمار نشان می‌دهد
- [ ] CRUD تیم و بازی کار می‌کند
- [ ] submit پیش‌بینی کار می‌کند
- [ ] leaderboard موبایل mask شده
- [ ] `/bracket` بعد از publish کار می‌کند
- [ ] rate limit روی submit فعال است
- [ ] CSV export شرکت‌کنندگان دانلود می‌شود

### امنیت
- [ ] `ADMIN_PASSWORD` قوی و غیر از پیش‌فرض
- [ ] `ADMIN_SESSION_SECRET` تصادفی ۳۲+ کاراکتر
- [ ] MySQL از بیرون در دسترس نیست
- [ ] `.env` در Git commit نشده

---

## پیوست — ساختار مسیرهای مهم

| مسیر | توضیح |
|------|-------|
| `/` | صفحه پیش‌بینی بازی‌های زنده |
| `/submit` | ثبت هویت + پیش‌بینی |
| `/leaderboard` | جدول امتیازات عمومی |
| `/bracket` | جدول حذفی |
| `/admin` | داشبورد مدیریت |
| `/admin/login` | ورود مدیر |

## پیوست — مستندات مرتبط

- `docs/MANUAL_TESTS.md` — تست دستی اپ اصلی
- `docs/BRACKET_MANUAL_TESTS.md` — تست دستی bracket
- `CLAUDE.md` — قوانین business و معماری

---

**آخرین به‌روزرسانی:** 2026-06-22  
**نسخه اپ:** Next.js 16 · Prisma 7 · MySQL 8
