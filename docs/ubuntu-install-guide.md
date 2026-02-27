# Installation Guide — Ubuntu 24.04 LTS

> Complete guide to deploy **Tsuky Tales** on an Ubuntu 24.04 LTS server.

---

## Table of Contents

1. [System Requirements](#1-system-requirements)
2. [System Update](#2-system-update)
3. [Node.js Installation](#3-nodejs-installation)
4. [MySQL 8 Installation](#4-mysql-8-installation)
5. [Redis Installation (Optional)](#5-redis-installation-optional)
6. [Nginx Installation](#6-nginx-installation)
7. [Application Deployment](#7-application-deployment)
8. [Database Setup](#8-database-setup)
9. [Environment Configuration](#9-environment-configuration)
10. [Build & Start](#10-build--start)
11. [PM2 Configuration](#11-pm2-configuration)
12. [Nginx Configuration](#12-nginx-configuration)
13. [SSL with Let's Encrypt](#13-ssl-with-lets-encrypt)
14. [Firewall (UFW)](#14-firewall-ufw)
15. [Cron Jobs](#15-cron-jobs)
16. [Post-Installation Verification](#16-post-installation-verification)
17. [Troubleshooting](#17-troubleshooting)

---

## 1. System Requirements

| Component | Minimum Version |
|-----------|-----------------|
| OS | Ubuntu 24.04 LTS |
| Node.js | 18+ (LTS recommended: 20.x) |
| MySQL | 8.0+ |
| pnpm | 9+ |
| Nginx | 1.24+ |
| Redis | 7+ (optional) |

**Required ports:** 22 (SSH), 80 (HTTP), 443 (HTTPS), 3306 (MySQL, local only)

---

## 2. System Update

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential
```

---

## 3. Node.js Installation

Install via **nvm** (recommended for version management):

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc

nvm install 20
nvm use 20
nvm alias default 20

node -v   # v20.x.x
npm -v    # 10.x.x
```

Install **pnpm**:

```bash
npm install -g pnpm
pnpm -v
```

---

## 4. MySQL 8 Installation

```bash
sudo apt install -y mysql-server
```

Secure the installation:

```bash
sudo mysql_secure_installation
```

Answer:
- **VALIDATE PASSWORD component**: Yes, choose desired level
- **Remove anonymous users**: Yes
- **Disallow root login remotely**: Yes
- **Remove test database**: Yes
- **Reload privilege tables**: Yes

Create the database and user:

```bash
sudo mysql
```

```sql
CREATE DATABASE tsukytales CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'tsukytales'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON tsukytales.* TO 'tsukytales'@'localhost';
FLUSH PRIVILEGES;

EXIT;
```

> Replace `STRONG_PASSWORD` with a password generated via `openssl rand -base64 32`.

---

## 5. Redis Installation (Optional)

The application works 100% without Redis. Redis adds a caching layer for better performance in production.

```bash
sudo apt install -y redis-server
```

Verify it is running:

```bash
sudo systemctl enable redis-server
sudo systemctl start redis-server
redis-cli ping   # PONG
```

---

## 6. Nginx Installation

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
```

---

## 7. Application Deployment

### Create a system user (optional but recommended)

```bash
sudo useradd -m -s /bin/bash tsukytales
sudo mkdir -p /var/www/tsukytales
sudo chown tsukytales:tsukytales /var/www/tsukytales
```

### Clone the project

```bash
sudo -u tsukytales git clone <REPO_URL> /var/www/tsukytales
cd /var/www/tsukytales
```

### Install dependencies

```bash
sudo -u tsukytales pnpm install --frozen-lockfile
```

---

## 8. Database Setup

### Import the schema

```bash
mysql -u tsukytales -p tsukytales < /var/www/tsukytales/lib/db/schema.sql
```

This creates all tables and inserts:
- Default admin account (user: `admin`, password: `admin`)
- Default shipping rates
- Subscription dates

### (Optional) Import test data

```bash
mysql -u tsukytales -p --default-character-set=utf8mb4 tsukytales < /var/www/tsukytales/lib/db/seed_test.sql
```

### Apply migrations

```bash
mysql -u tsukytales -p tsukytales < /var/www/tsukytales/lib/db/migrations/001_add_stripe_customer_id_column.sql
```

> **Important:** Change the admin password on first access to the back-office.

---

## 9. Environment Configuration

```bash
cd /var/www/tsukytales
sudo -u tsukytales cp .env.example .env.local
sudo -u tsukytales nano .env.local
```

Fill in the following variables:

### Database

```env
DB_HOST="localhost"
DB_PORT="3306"
DB_USER="tsukytales"
DB_PASS="STRONG_PASSWORD"
DB_NAME="tsukytales"
DB_POOL_LIMIT="75"
DB_QUEUE_LIMIT="200"
```

### NextAuth

```env
NEXTAUTH_URL="https://tsukytales.com"
NEXTAUTH_SECRET=""   # Generate with: openssl rand -base64 32
```

### Stripe

```env
STRIPE_PUBLISHABLE_KEY="pk_live_xxx"
STRIPE_SECRET_KEY="sk_live_xxx"
STRIPE_WEBHOOK_SECRET="whsec_xxx"
STRIPE_ACCOUNT_ID="acct_xxx"
```

### Boxtal (Shipping)

```env
BOXTAL_CLIENT_ID=""
BOXTAL_CLIENT_SECRET=""
BOXTAL_WEBHOOK_SECRET=""
BOXTAL_OFFER_RELAY=""
BOXTAL_OFFER_HOME=""
BOXTAL_PICKUP_CODE=""
BOXTAL_SENDER_FIRST_NAME=""
BOXTAL_SENDER_LAST_NAME=""
BOXTAL_SENDER_EMAIL=""
BOXTAL_SENDER_PHONE=""
BOXTAL_SENDER_STREET=""
BOXTAL_SENDER_POSTAL_CODE=""
BOXTAL_SENDER_CITY=""
BOXTAL_SENDER_COUNTRY="FR"
```

### Mail (SMTP)

```env
MAILER_DSN="smtp://user:pass@host:587"
MAIL_FROM="Tsuky Tales <contact@tsukytales.com>"
```

### Application

```env
BASE_URL="https://tsukytales.com"
NEXT_PUBLIC_BASE_URL="https://tsukytales.com"
CONTACT_EMAIL="contact@tsukytales.com"
```

### Redis (if installed)

```env
REDIS_URL="redis://127.0.0.1:6379"
```

### Google OAuth (optional)

```env
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

---

## 10. Build & Start

### Production build

```bash
cd /var/www/tsukytales
sudo -u tsukytales pnpm build
```

### Quick test (without PM2)

```bash
sudo -u tsukytales pnpm start
# Verify at http://localhost:3000 then Ctrl+C
```

---

## 11. PM2 Configuration

### Installation

```bash
npm install -g pm2
```

### Create ecosystem file

```bash
sudo -u tsukytales nano /var/www/tsukytales/ecosystem.config.js
```

```js
module.exports = {
  apps: [
    {
      name: "tsukytales",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "/var/www/tsukytales",
      instances: "max",         // 1 worker per CPU core
      exec_mode: "cluster",
      max_memory_restart: "2G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      kill_timeout: 5000,
      listen_timeout: 10000,
      error_file: "/var/log/pm2/tsukytales-error.log",
      out_file: "/var/log/pm2/tsukytales-out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
  ],
};
```

### Start the application

```bash
sudo mkdir -p /var/log/pm2
sudo chown tsukytales:tsukytales /var/log/pm2

sudo -u tsukytales pm2 start /var/www/tsukytales/ecosystem.config.js
sudo -u tsukytales pm2 save
```

### Auto-start on boot

```bash
pm2 startup systemd -u tsukytales --hp /home/tsukytales
# Copy-paste the sudo command displayed, then:
sudo -u tsukytales pm2 save
```

### Useful commands

```bash
pm2 status              # Worker status
pm2 monit               # Real-time monitoring
pm2 logs tsukytales     # View logs
pm2 reload tsukytales   # Zero-downtime restart
```

---

## 12. Nginx Configuration

### Create site configuration

```bash
sudo nano /etc/nginx/sites-available/tsukytales.conf
```

```nginx
upstream nextjs {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name tsukytales.com www.tsukytales.com;

    # Will be replaced by HTTPS redirect after Certbot
    location / {
        proxy_pass http://nextjs;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
    }
}
```

### Enable the site

```bash
sudo ln -s /etc/nginx/sites-available/tsukytales.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### Nginx Tuning

Edit `/etc/nginx/nginx.conf`:

```bash
sudo nano /etc/nginx/nginx.conf
```

Replace / add in the main block:

```nginx
worker_processes auto;
worker_rlimit_nofile 65535;

events {
    worker_connections 16384;
    multi_accept on;
    use epoll;
}

http {
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_min_length 1000;
    gzip_types text/plain text/css text/javascript application/javascript application/json application/xml image/svg+xml;
}
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## 13. SSL with Let's Encrypt

### Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Obtain the certificate

```bash
sudo certbot --nginx -d tsukytales.com -d www.tsukytales.com
```

Certbot automatically modifies the Nginx configuration to:
- Redirect HTTP to HTTPS
- Configure SSL certificates
- Add TLS parameters

### Automatic renewal

Certbot installs a systemd timer. Verify:

```bash
sudo systemctl status certbot.timer
```

### Update Nginx config post-SSL

After Certbot, complete the configuration in `/etc/nginx/sites-available/tsukytales.conf` with static asset caching:

```nginx
server {
    listen 443 ssl http2;
    server_name tsukytales.com www.tsukytales.com;

    # (certificates managed by Certbot)

    # Static assets — served directly by Nginx
    location /_next/static/ {
        alias /var/www/tsukytales/.next/static/;
        expires 365d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location /assets/ {
        alias /var/www/tsukytales/public/assets/;
        expires 30d;
        add_header Cache-Control "public";
        access_log off;
    }

    # API routes (stricter rate limit)
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://nextjs;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
    }

    # All other routes (SSR)
    location / {
        limit_req zone=general burst=50 nodelay;
        proxy_pass http://nextjs;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        proxy_buffering on;
        proxy_buffer_size 16k;
        proxy_buffers 8 16k;
    }

    # Block sensitive files
    location ~ /\. { deny all; }
    location ~ ^/(\.env|\.git|node_modules) { deny all; return 404; }

    client_max_body_size 10M;
}

# Rate limiting zones (place outside server block, inside http block)
# limit_req_zone $binary_remote_addr zone=general:10m rate=30r/s;
# limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
```

> The `limit_req_zone` directives must be placed in the `http {}` block of `/etc/nginx/nginx.conf`, not inside the `server` block.

```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## 14. Firewall (UFW)

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

### SSH Hardening (recommended)

```bash
sudo nano /etc/ssh/sshd_config
```

```
PermitRootLogin no
PasswordAuthentication no    # After setting up SSH keys
MaxAuthTries 3
```

```bash
sudo systemctl restart sshd
```

Install Fail2ban:

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## 15. Cron Jobs

### Subscription maintenance

The application includes a Stripe subscription maintenance script:

```bash
sudo -u tsukytales crontab -e
```

Add:

```cron
# Subscription maintenance — daily at 3:00 AM
0 3 * * * cd /var/www/tsukytales && /home/tsukytales/.nvm/versions/node/v20.*/bin/npx tsx scripts/cron/subscription-maintenance.ts >> /var/log/pm2/cron-subscription.log 2>&1
```

### Log rotation

```bash
sudo nano /etc/logrotate.d/tsukytales
```

```
/var/log/pm2/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    copytruncate
}
```

---

## 16. Post-Installation Verification

### Checklist

```bash
# Active services
sudo systemctl status mysql
sudo systemctl status nginx
sudo systemctl status redis-server   # if installed
pm2 status

# Application reachable
curl -I http://localhost:3000
curl -I https://tsukytales.com

# Database
mysql -u tsukytales -p -e "USE tsukytales; SHOW TABLES;"

# SSL
sudo certbot certificates

# Firewall
sudo ufw status verbose

# Logs (no critical errors)
pm2 logs tsukytales --lines 50
```

### Admin test

1. Go to `https://tsukytales.com/fr/admin/login`
2. Log in with `admin` / `admin`
3. **Change the password immediately**

### Webhooks

Configure endpoints in their respective dashboards:

| Service | Webhook URL |
|---------|-------------|
| Stripe | `https://tsukytales.com/api/webhooks/stripe` |
| Boxtal | `https://tsukytales.com/api/webhooks/boxtal` |

---

## 17. Troubleshooting

### Application won't start

```bash
# Check PM2 logs
pm2 logs tsukytales --err --lines 100

# Verify .env.local exists and is complete
ls -la /var/www/tsukytales/.env.local

# Verify MySQL connection
mysql -u tsukytales -p -e "SELECT 1;"

# Check file permissions
ls -la /var/www/tsukytales/
```

### 502 Bad Gateway

```bash
# Is PM2 running?
pm2 status

# Is port 3000 being listened on?
ss -tlnp | grep 3000

# Check Nginx config
sudo nginx -t
sudo tail -50 /var/log/nginx/error.log
```

### MySQL connection error

```bash
# Verify MySQL is running
sudo systemctl status mysql

# Test connection
mysql -u tsukytales -p tsukytales -e "SELECT 1;"

# Check max_connections
mysql -u root -e "SHOW VARIABLES LIKE 'max_connections';"
```

### Slow performance

```bash
# Check CPU/RAM usage
htop

# Check MySQL slow queries
sudo tail -50 /var/log/mysql/slow.log

# Check PM2 worker memory
pm2 monit
```

### Updating the application

```bash
cd /var/www/tsukytales
sudo -u tsukytales git pull
sudo -u tsukytales pnpm install --frozen-lockfile
sudo -u tsukytales pnpm build
pm2 reload tsukytales
```

---

## Quick Reference

| Action | Command |
|--------|---------|
| Start app | `pm2 start ecosystem.config.js` |
| Stop app | `pm2 stop tsukytales` |
| Zero-downtime restart | `pm2 reload tsukytales` |
| View logs | `pm2 logs tsukytales` |
| Monitoring | `pm2 monit` |
| Reload Nginx | `sudo systemctl reload nginx` |
| Renew SSL | `sudo certbot renew` |
| Backup database | `mysqldump -u tsukytales -p tsukytales > backup.sql` |
| Restore database | `mysql -u tsukytales -p tsukytales < backup.sql` |
