# Deployment Guide — wc.pishrosarmaye.com

## Prerequisites

- Ubuntu VPS
- Domain DNS A record pointing to server IP
- MySQL 8+
- Node.js LTS (20+)

## 1. DNS

Create an A record:

```
wc.pishrosarmaye.com → YOUR_SERVER_IP
```

## 2. Install Dependencies

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs mysql-server nginx certbot python3-certbot-nginx
```

## 3. MySQL Setup

```bash
sudo mysql -e "CREATE DATABASE worldcup_prediction CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER 'wcuser'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD';"
sudo mysql -e "GRANT ALL PRIVILEGES ON worldcup_prediction.* TO 'wcuser'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"
```

## 4. Deploy Application

```bash
git clone <repo> /var/www/pishbini
cd /var/www/pishbini
cp .env.example .env
# Edit .env with production values
npm install
npx prisma migrate deploy
npm run db:seed
npm run build
```

## 5. PM2

```bash
sudo npm install -g pm2
pm2 start npm --name pishbini -- start
pm2 save
pm2 startup
```

## 6. Nginx Config

`/etc/nginx/sites-available/pishbini`:

```nginx
server {
    listen 80;
    server_name wc.pishrosarmaye.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/pishbini /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## 7. SSL

```bash
sudo certbot --nginx -d wc.pishrosarmaye.com
```

## 8. Post-Deploy Verification

1. HTTPS loads without warnings
2. Public page shows matches or empty state
3. Admin login at `/admin/login` works
4. Dashboard metrics load
5. Create team and match in admin
6. Submit prediction flow works
7. Leaderboard displays masked phones
8. Settlement awards points correctly
9. SMS logs created (mock mode)
10. Referral link stores cookie
11. Rate limiting active on submit
12. Campaign freeze blocks submissions
13. CSV exports download
14. PM2 process running after reboot

## Manual Test Checklist

See `docs/MANUAL_TESTS.md`.
