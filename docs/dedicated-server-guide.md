# Dedicated Server Configuration Guide

> Target: **14,000+ concurrent users** for the Tsuky Tales e-commerce platform.

---

## Table of Contents

1. [Current Stack Overview](#1-current-stack-overview)
2. [Hardware Specifications](#2-hardware-specifications)
3. [RAM Budget Breakdown](#3-ram-budget-breakdown)
4. [MySQL Tuning](#4-mysql-tuning)
5. [Node.js Process Management (PM2)](#5-nodejs-process-management-pm2)
6. [Nginx Reverse Proxy](#6-nginx-reverse-proxy)
7. [Caching Strategy](#7-caching-strategy)
8. [Target Architecture](#8-target-architecture)
9. [Recommended Providers](#9-recommended-providers)
10. [Code Changes Required](#10-code-changes-required)
11. [Scaling Beyond 20k](#11-scaling-beyond-20k)

---

## 1. Current Stack Overview

| Component      | Technology                     |
| -------------- | ------------------------------ |
| Framework      | Next.js 15 (SSR, Turbopack)   |
| Runtime        | Node.js                       |
| Database       | MySQL (mysql2/promise)         |
| Authentication | NextAuth v5 (beta.30)         |
| Payments       | Stripe                        |
| i18n           | next-intl (fr, en, de, es, it)|
| Styling        | Tailwind CSS 4 + HeroUI       |
| Email          | Resend                        |
| Logging        | Winston                       |

### Current Bottlenecks

- **MySQL connection pool** is set to `connectionLimit: 10` in `lib/db/connection.ts`. This is the single most critical bottleneck. Under 14k concurrent users, the pool will be exhausted within seconds and all subsequent requests will queue indefinitely.
- **Single-process Node.js**: Next.js runs on a single thread by default. Only one CPU core is utilized regardless of how many cores the server has.
- **No reverse proxy**: Without Nginx in front, Node.js handles static asset serving, TLS termination, and compression — all tasks it is not optimized for.
- **No application-level cache**: Every request hits MySQL directly. There is no Redis layer, no ISR configuration, and no CDN in place.

---

## 2. Hardware Specifications

### Minimum (handles 14k with proper software tuning)

| Resource    | Specification                          |
| ----------- | -------------------------------------- |
| CPU         | 8 cores / 16 threads (AMD Ryzen 5 5600X or Intel Xeon E-2388G) |
| RAM         | 32 GB DDR4 ECC                         |
| Storage     | 2 x 512 GB NVMe SSD in RAID 1 (mirror)|
| Network     | 1 Gbps unmetered (or 20+ TB/month)    |

### Recommended (comfortable headroom, handles traffic spikes)

| Resource    | Specification                          |
| ----------- | -------------------------------------- |
| CPU         | 12-16 cores / 24-32 threads (AMD Ryzen 9 5900X / 7950X or Intel Xeon W-1390P) |
| RAM         | 64 GB DDR4 ECC                         |
| Storage     | 2 x 1 TB NVMe SSD in RAID 1 (mirror)  |
| Network     | 1 Gbps unmetered (or 30+ TB/month)    |

### Why These Specs

**CPU** — Next.js server-side rendering is CPU-bound. Each SSR request triggers React's `renderToString` on the server. With 14k concurrent users generating thousands of requests per second, multi-core processing is essential. The Ryzen 9 5900X offers 12 cores at an excellent price-to-performance ratio. The 7950X (16 cores) provides additional headroom for traffic spikes and background tasks (image optimization, ISR regeneration).

**RAM** — MySQL's InnoDB buffer pool is the single biggest consumer. A properly sized buffer pool (50-70% of total RAM) keeps the entire working dataset in memory, eliminating disk I/O for reads. The remaining RAM is split between Node.js workers, the OS page cache, and Nginx. See the detailed breakdown in section 3.

**NVMe RAID 1** — NVMe drives provide the I/O throughput required for MySQL write operations and Next.js build artifacts. RAID 1 (mirroring) ensures zero downtime on a single drive failure. Do **not** use RAID 0 on a production server.

**Network** — An e-commerce page with images averages 1-3 MB. At 14k concurrent users with an average page load every 30 seconds, peak bandwidth approaches 500-700 Mbps. A 1 Gbps link is the minimum.

---

## 3. RAM Budget Breakdown

Based on the **recommended 64 GB** configuration:

| Consumer                     | Allocation | Notes |
| ---------------------------- | ---------- | ----- |
| MySQL InnoDB Buffer Pool     | 24-32 GB   | `innodb_buffer_pool_size`. Keeps table/index data in RAM. |
| MySQL other buffers          | 2-4 GB     | Sort buffer, join buffer, tmp tables, connections overhead. |
| Node.js PM2 workers (x8)    | 8-16 GB    | Each Next.js worker uses 1-2 GB under load. |
| Nginx                        | 0.5 GB     | Minimal footprint even with thousands of connections. |
| Redis                        | 2-4 GB     | Session cache + product/category data cache. |
| OS + filesystem page cache   | 4-6 GB     | Linux kernel, systemd, journald, filesystem cache. |
| **Headroom**                 | **4-12 GB**| Safety margin for traffic spikes. |

If using the **minimum 32 GB** configuration, halve the MySQL buffer pool (12-16 GB) and run 4 Node.js workers instead of 8.

---

## 4. MySQL Tuning

### 4.1 Connection Limits

The application currently uses a pool of 10 connections per Node.js process. With 8 PM2 workers, that is 80 total connections. For 14k concurrent users, this must be increased.

**Recommended pool configuration per worker:**

| Setting                     | Current | Recommended |
| --------------------------- | ------- | ----------- |
| `connectionLimit` (per worker) | 10   | 50-100      |
| Total connections (8 workers)  | 80   | 400-800     |

MySQL's `max_connections` must be set higher than the total pool size across all workers, plus overhead for admin connections:

```ini
# /etc/mysql/mysql.conf.d/mysqld.cnf

[mysqld]
max_connections = 1000
```

### 4.2 InnoDB Configuration

```ini
# /etc/mysql/mysql.conf.d/mysqld.cnf

[mysqld]
# Buffer pool — main performance lever
innodb_buffer_pool_size = 28G          # ~45% of 64 GB total RAM
innodb_buffer_pool_instances = 8       # One per CPU core (reduces lock contention)

# Logging
innodb_log_file_size = 1G             # Larger log = fewer checkpoints = better write perf
innodb_log_buffer_size = 64M

# I/O
innodb_io_capacity = 2000             # NVMe can handle much more than default (200)
innodb_io_capacity_max = 4000
innodb_flush_method = O_DIRECT        # Bypass OS cache (InnoDB has its own)
innodb_flush_log_at_trx_commit = 1    # Full ACID compliance (do not change for e-commerce)

# Threads
innodb_read_io_threads = 8
innodb_write_io_threads = 8
innodb_thread_concurrency = 0         # Let InnoDB auto-manage

# Temp tables
tmp_table_size = 256M
max_heap_table_size = 256M

# Query cache (disabled in MySQL 8.0+, use Redis instead)
```

### 4.3 Slow Query Log

Enable this from day one to identify problematic queries before they become bottlenecks:

```ini
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 0.5
log_queries_not_using_indexes = 1
```

---

## 5. Node.js Process Management (PM2)

Next.js runs on a single thread. To utilize all CPU cores, run multiple instances using PM2 in cluster mode.

### 5.1 Installation

```bash
npm install -g pm2
```

### 5.2 Ecosystem File

Create `ecosystem.config.js` at the project root:

```js
module.exports = {
  apps: [
    {
      name: "tsukytales",
      script: "node_modules/.bin/next",
      args: "start",
      instances: 8,              // Match physical core count
      exec_mode: "cluster",
      max_memory_restart: "2G",  // Auto-restart if a worker exceeds 2 GB
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      // Graceful restart
      kill_timeout: 5000,
      listen_timeout: 10000,
      // Logging
      error_file: "/var/log/pm2/tsukytales-error.log",
      out_file: "/var/log/pm2/tsukytales-out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
  ],
};
```

### 5.3 Commands

```bash
# Start
pm2 start ecosystem.config.js

# Monitor
pm2 monit

# Reload without downtime (graceful)
pm2 reload tsukytales

# Save process list for auto-restart on reboot
pm2 save
pm2 startup
```

### 5.4 Important Notes

- **`instances: 8`** should match the number of physical CPU cores (not threads). Hyper-threading does not linearly scale Node.js performance and can increase context switching overhead.
- Each PM2 worker creates its own MySQL connection pool. With `connectionLimit: 100` and 8 workers, the total is 800 potential MySQL connections. Set MySQL's `max_connections` accordingly (see section 4.1).
- PM2 handles port sharing automatically in cluster mode. All workers listen on the same port (3000).

---

## 6. Nginx Reverse Proxy

Nginx sits in front of PM2 and handles tasks that Node.js should not:

- TLS termination (Let's Encrypt / Certbot)
- Static asset serving (/_next/static, /assets, /favicon.ico)
- Gzip and Brotli compression
- Rate limiting
- Connection buffering (absorbs slow clients so Node.js workers are freed faster)

### 6.1 Installation

```bash
sudo apt install nginx
```

### 6.2 Configuration

```nginx
# /etc/nginx/sites-available/tsukytales.conf

upstream nextjs {
    # PM2 cluster workers all listen on port 3000
    server 127.0.0.1:3000;

    # Keep persistent connections to the upstream
    keepalive 64;
}

server {
    listen 80;
    server_name tsukytales.com www.tsukytales.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tsukytales.com www.tsukytales.com;

    # --- TLS (managed by Certbot) ---
    ssl_certificate     /etc/letsencrypt/live/tsukytales.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tsukytales.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache   shared:SSL:10m;
    ssl_session_timeout 10m;

    # --- Gzip ---
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_min_length 1000;
    gzip_types
        text/plain
        text/css
        text/javascript
        application/javascript
        application/json
        application/xml
        image/svg+xml;

    # --- Brotli (requires nginx-brotli module) ---
    # brotli on;
    # brotli_comp_level 6;
    # brotli_types text/plain text/css application/javascript application/json image/svg+xml;

    # --- Security headers (already defined in next.config.js, but belt-and-suspenders) ---
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # --- Rate limiting ---
    limit_req_zone $binary_remote_addr zone=general:10m rate=30r/s;
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    # --- Static assets (served directly by Nginx, bypassing Node.js) ---
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

    location /favicon.ico {
        alias /var/www/tsukytales/public/favicon.ico;
        expires 30d;
        access_log off;
    }

    # --- API routes (stricter rate limit) ---
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

    # --- All other routes (Next.js SSR) ---
    location / {
        limit_req zone=general burst=50 nodelay;

        proxy_pass http://nextjs;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";

        # Buffering — absorb slow clients
        proxy_buffering on;
        proxy_buffer_size 16k;
        proxy_buffers 8 16k;
    }

    # --- Block sensitive paths ---
    location ~ /\. {
        deny all;
    }

    location ~ ^/(\.env|\.git|node_modules) {
        deny all;
        return 404;
    }

    # --- Client body size (for file uploads if any) ---
    client_max_body_size 10M;
}
```

### 6.3 Nginx Worker Tuning

```nginx
# /etc/nginx/nginx.conf

worker_processes auto;          # One per CPU core
worker_rlimit_nofile 65535;

events {
    worker_connections 16384;   # Per worker. Total = workers x 16384
    multi_accept on;
    use epoll;
}

http {
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;          # Hide Nginx version
}
```

### 6.4 System Limits

The OS must allow enough open file descriptors for Nginx to handle 14k+ connections:

```bash
# /etc/security/limits.conf
*    soft    nofile    65535
*    hard    nofile    65535

# /etc/sysctl.conf
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.ip_local_port_range = 1024 65535
net.ipv4.tcp_tw_reuse = 1
net.core.netdev_max_backlog = 65535

# Apply immediately
sudo sysctl -p
```

---

## 7. Caching Strategy

Raw SSR for every request will not scale to 14k concurrent users. A multi-layer caching strategy is essential.

### 7.1 CDN Layer (Cloudflare)

Place Cloudflare in front of the server. Free tier is sufficient.

**What to cache:**
- All static assets (`/_next/static/*`, `/assets/*`) — cache forever (content-hashed filenames)
- Product images — cache 30 days
- Public pages (homepage, about, branding) — cache 5-10 minutes with stale-while-revalidate

**What NOT to cache:**
- `/api/*` routes
- `/cart`, `/checkout`, `/account` — user-specific pages
- Any page with `Set-Cookie` headers

**Cloudflare Page Rules:**
```
*.tsukytales.com/_next/static/*  → Cache Level: Cache Everything, Edge TTL: 1 month
*.tsukytales.com/assets/*        → Cache Level: Cache Everything, Edge TTL: 30 days
*.tsukytales.com/api/*           → Cache Level: Bypass
```

### 7.2 Redis Application Cache

Install Redis on the same server for low-latency caching.

```bash
sudo apt install redis-server
```

**Use Redis for:**

| Data                    | TTL       | Rationale |
| ----------------------- | --------- | --------- |
| Product catalog         | 5 min     | Changes infrequently, read on every shop/product page. |
| Product detail by slug  | 5 min     | High-traffic pages. |
| Category/collection list| 10 min    | Nearly static data. |
| Active discounts        | 2 min     | Must reflect changes relatively quickly. |
| Session data            | 24 hours  | Offload from MySQL. NextAuth can use a Redis adapter. |
| Rate limiting counters  | 1 min     | Per-IP or per-user request counting. |

**Do NOT cache:**
- Cart contents (user-specific, changes frequently)
- Order data (transactional, must always be fresh)
- Payment-related data (security risk)

### 7.3 Next.js ISR (Incremental Static Regeneration)

For pages that are public and change infrequently, use ISR to pre-render at build time and revalidate in the background:

| Page                        | `revalidate` | Notes |
| --------------------------- | ------------ | ----- |
| Homepage (`/`)              | 300 (5 min)  | Hero content, featured products. |
| About (`/about`)            | 3600 (1 hr)  | Rarely changes. |
| Branding (`/branding`)      | 3600 (1 hr)  | Rarely changes. |
| Contact (`/contact`)        | 3600 (1 hr)  | Static form. |
| Shop listing (`/shop`)      | 120 (2 min)  | Product list with pagination. |
| Product detail (`/product/[slug]`) | 300 (5 min) | Individual product pages. |

Pages that must NOT use ISR (require real-time data or are user-specific):
- `/cart`, `/checkout`, `/account`, `/subscription`
- All `/admin/*` routes
- All `/api/*` routes

---

## 8. Target Architecture

```
                    ┌──────────────────┐
                    │   Cloudflare CDN │
                    │  (static cache,  │
                    │   DDoS shield)   │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │      Nginx       │
                    │  (TLS, gzip,     │
                    │   rate limiting, │
                    │   static files)  │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │   PM2 Cluster    │
                    │  (8 x Next.js    │
                    │   workers)       │
                    └───┬─────────┬────┘
                        │         │
                ┌───────▼──┐  ┌───▼───────┐
                │  MySQL   │  │   Redis   │
                │ (primary │  │  (cache,  │
                │   data)  │  │  sessions)│
                └──────────┘  └───────────┘
```

### Request Flow

1. **User request** hits Cloudflare. If the response is cached (static asset, ISR page), Cloudflare serves it directly. The request never reaches the server.
2. **Cache miss** — Cloudflare forwards to Nginx on the dedicated server.
3. **Nginx** terminates TLS, checks rate limits, and serves static assets directly from disk if the path matches `/_next/static` or `/assets`. Otherwise, it proxies to the Node.js upstream.
4. **PM2** distributes the request to one of the 8 Next.js workers (round-robin).
5. **Next.js worker** checks Redis for cached data. On a cache hit, it renders the page without touching MySQL. On a cache miss, it queries MySQL, stores the result in Redis, and renders.
6. **Response** flows back: Node.js → Nginx (compresses, adds headers) → Cloudflare (caches if eligible) → User.

---

## 9. Recommended Providers

All prices are approximate as of early 2026. Providers are ranked by price-to-performance ratio for European hosting.

### Tier 1: Best Value

| Provider | Model | CPU | RAM | Storage | Price/month |
| -------- | ----- | --- | --- | ------- | ----------- |
| **Hetzner** | AX52 | Ryzen 7 7700 (8c/16t) | 64 GB DDR5 | 2 x 1 TB NVMe | ~€70 |
| **Hetzner** | AX102 | Ryzen 9 7950X (16c/32t) | 128 GB DDR5 | 2 x 1 TB NVMe | ~€130 |
| **OVH** | Advance-2 | Ryzen 5 7600 (6c/12t) | 64 GB DDR5 | 2 x 512 GB NVMe | ~€80 |
| **OVH** | Advance-4 | Ryzen 9 7900 (12c/24t) | 64 GB DDR5 | 2 x 1 TB NVMe | ~€120 |

### Tier 2: Alternatives

| Provider | Model | CPU | RAM | Storage | Price/month |
| -------- | ----- | --- | --- | ------- | ----------- |
| **Scaleway** | Dedibox Pro | Xeon E-2388G (8c/16t) | 64 GB ECC | 2 x 1 TB NVMe | ~€110 |
| **So you Start** | Rise-4 | Ryzen 5 5600X (6c/12t) | 64 GB DDR4 | 2 x 512 GB NVMe | ~€55 |

### Recommendation

**Primary choice: Hetzner AX52** (~€70/month). 8 cores, 64 GB DDR5, 2x NVMe. Best value. Datacenter options in Falkenstein (Germany) or Helsinki (Finland). Low latency to France and Western Europe.

**If budget allows: Hetzner AX102** (~€130/month). 16 cores, 128 GB DDR5. Provides significant headroom for growth beyond 14k and allows running MySQL with a very large buffer pool.

**If you need a French datacenter: OVH Advance-4** (~€120/month). Datacenters in Gravelines and Strasbourg. Slightly worse price-to-performance than Hetzner but keeps data in France if that is a requirement.

---

## 10. Code Changes Required

These changes should be made before deploying to the dedicated server.

### 10.1 MySQL Connection Pool

**File:** `lib/db/connection.ts`

Change `connectionLimit` from `10` to a value appropriate for the number of PM2 workers:

```ts
// Before
connectionLimit: 10,

// After — with 8 PM2 workers, total = 8 x 75 = 600 connections
connectionLimit: 75,
```

Also add `queueLimit` to prevent unbounded queuing under extreme load:

```ts
const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASS,
  database: env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 75,
  queueLimit: 200,        // Reject requests if 200 are already waiting
  charset: "utf8mb4",
  timezone: "+00:00",
  decimalNumbers: true,
  // ... rest of config
});
```

### 10.2 ISR on Public Pages

Add `revalidate` exports to static-eligible pages. Example for the homepage:

```ts
// app/[locale]/(site)/page.tsx
export const revalidate = 300; // Re-generate every 5 minutes
```

### 10.3 Trust Proxy Headers

Since Nginx terminates TLS and forwards requests, Next.js must trust proxy headers. No code change needed — Next.js respects `X-Forwarded-For` and `X-Forwarded-Proto` by default. Just ensure Nginx sets them (already included in the config above).

### 10.4 Redis Integration (Future)

When adding Redis, install `ioredis` and create a shared client:

```bash
npm install ioredis
```

Create `lib/cache/redis.ts` with a connection singleton following the same pattern as `lib/db/connection.ts`.

---

## 11. Scaling Beyond 20k

If concurrent users exceed 20,000, the single-server architecture will reach its limits. Here is the migration path:

### Phase 1: Vertical Scaling (up to ~25k)
- Upgrade to the Hetzner AX102 (16 cores, 128 GB) if not already on it.
- Increase PM2 workers to 12-14.
- Increase MySQL buffer pool to 64 GB.

### Phase 2: Database Separation (25k-50k)
- Move MySQL to a dedicated server (Hetzner AX52 or equivalent).
- This frees all 64-128 GB of RAM on the application server for Node.js workers and Redis.
- Add MySQL read replicas if read queries dominate.

### Phase 3: Horizontal Scaling (50k+)
- Add a second application server behind an HAProxy or Nginx load balancer.
- Move Redis to its own server or use a managed Redis service.
- Use MySQL Group Replication or ProxySQL for connection pooling and read/write splitting.
- Consider migrating session storage to Redis cluster mode.

### Phase 4: Managed Services (100k+)
- Move to a cloud provider (AWS, GCP) with managed MySQL (RDS/Cloud SQL), managed Redis (ElastiCache/Memorystore), and auto-scaling application instances behind an ALB/Cloud Load Balancer.
- At this scale, the operational overhead of managing bare metal typically outweighs the cost savings.

---

## Appendix: Deployment Checklist

Before going live with the dedicated server, verify each item:

- [ ] OS installed (Ubuntu 22.04 LTS or 24.04 LTS recommended)
- [ ] SSH hardened (key-only auth, non-standard port, fail2ban installed)
- [ ] Firewall configured (UFW: allow 80, 443, SSH port only)
- [ ] Node.js installed (LTS version via nvm)
- [ ] MySQL 8.0+ installed and tuned per section 4
- [ ] Redis installed and running
- [ ] Nginx installed and configured per section 6
- [ ] TLS certificate provisioned (Certbot + Let's Encrypt)
- [ ] PM2 installed, ecosystem file in place, startup configured
- [ ] `connectionLimit` updated in `lib/db/connection.ts`
- [ ] Application built (`next build`) and started via PM2
- [ ] Cloudflare DNS pointing to server IP (proxied, orange cloud)
- [ ] Cloudflare SSL mode set to "Full (Strict)"
- [ ] Slow query log enabled in MySQL
- [ ] Log rotation configured for PM2, Nginx, and MySQL logs
- [ ] Automated backups configured (MySQL dump + offsite copy, daily)
- [ ] Monitoring set up (Uptime Kuma, Netdata, or similar)
- [ ] Load test performed (k6 or Artillery simulating 14k concurrent users)
