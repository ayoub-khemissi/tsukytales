# Tsuky Tales

Full-stack e-commerce platform for illustrated books and literary subscriptions, built with Next.js 15.

## Tech Stack

- **Framework** — [Next.js 15](https://nextjs.org/) (App Router, Turbopack)
- **Language** — [TypeScript](https://www.typescriptlang.org/)
- **UI** — [HeroUI v2](https://heroui.com/), [Tailwind CSS v4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/)
- **Auth** — [NextAuth v5](https://authjs.dev/) (credentials + Google OAuth, role-based)
- **Database** — MySQL 8 via [mysql2](https://github.com/sidorares/node-mysql2)
- **Payments** — [Stripe](https://stripe.com/) (checkout, subscriptions, webhooks)
- **Shipping** — [Boxtal](https://www.boxtal.com/) (relay points, home delivery, tracking)
- **Email** — [Resend](https://resend.com/)
- **i18n** — [next-intl](https://next-intl-docs.vercel.app/) (FR, EN, ES, DE, IT)
- **Validation** — [Zod v4](https://zod.dev/)
- **Logging** — [Winston](https://github.com/winstonjs/winston)

## Project Structure

```
app/
├── api/
│   ├── admin/           # Admin API routes (products, orders, customers, discounts…)
│   ├── auth/            # NextAuth routes + registration
│   ├── store/           # Store API (cart, checkout, shipping, subscriptions, instagram…)
│   └── webhooks/        # Stripe & Boxtal webhooks
└── [locale]/
    ├── (site)/
    │   ├── page.tsx         # Homepage (hero, how-it-works, Instagram feed)
    │   ├── (store)/         # Shop, product, cart, checkout, subscription, contact, about
    │   ├── (auth)/          # Login & register
    │   └── (account)/       # Customer account (protected)
    └── admin/
        ├── login/           # Admin login
        └── (panel)/         # Dashboard, orders, products, customers, discounts, finances…

lib/
├── auth/                # NextAuth config & helpers
├── db/                  # MySQL connection & schema
├── errors/              # AppError class & error handler
├── hooks/               # Custom React hooks
├── middleware/           # Rate limiting & request validation
├── repositories/        # Data access layer (base + domain repositories)
├── services/            # Business logic (cart, order, payment, shipping, mail, instagram…)
├── store/               # React context (cart)
├── utils/               # Env validation, logger, pagination
└── validators/          # Zod schemas (address, contact, customer, discount, order, product)

components/              # Shared UI (navbar, footer, icons, theme switch, locale switcher…)
config/                  # Fonts & site metadata
messages/                # i18n translation files (fr, en, es, de, it)
types/                   # TypeScript definitions (API, DB, NextAuth)
styles/                  # Global CSS
```

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL 8
- pnpm

### Installation

```bash
pnpm install
```

### Environment

Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME` | MySQL connection |
| `NEXTAUTH_URL`, `NEXTAUTH_SECRET` | NextAuth config |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth (optional) |
| `STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe payments |
| `BOXTAL_CLIENT_ID`, `BOXTAL_CLIENT_SECRET`, `BOXTAL_WEBHOOK_SECRET` | Boxtal shipping |
| `BOXTAL_SENDER_*` | Sender address for shipments |
| `RESEND_API_KEY` | Transactional emails |
| `BASE_URL`, `NEXT_PUBLIC_BASE_URL` | App URL |
| `CONTACT_EMAIL` | Contact form recipient |
| `BEHOLD_FEED_URL` | Instagram feed via [Behold.so](https://behold.so/) |

### Database

Import the schema to set up your database:

```bash
mysql -u root tsukytales < lib/db/schema.sql
```

### Development

```bash
pnpm dev
```

Runs on [http://localhost:3000](http://localhost:3000) with Turbopack.

### Production

```bash
pnpm build
pnpm start
```

## Key Features

### Store
- Product catalog with variants, stock management, and image uploads
- Shopping cart with persistent state
- Stripe checkout with discount code support
- Monthly subscription boxes
- Order history and tracking

### Shipping
- Boxtal integration for relay point and home delivery
- Real-time shipping rate calculation
- Parcel tracking via webhook updates

### Admin Panel
- Dashboard with sales statistics
- Order management (status, notes, refunds, shipping)
- Product & variant CRUD with image upload
- Customer management
- Discount code system
- Subscription management
- Financial reports & export
- Application logs viewer
- Integration status monitoring

### Internationalization
- 5 languages: French (default), English, Spanish, German, Italian
- Locale-based routing (`/en/shop`, `/es/tienda`…)
- Locale switcher in the navbar

### Auth
- Customer accounts with Google OAuth or email/password
- Admin role with separate login and protected routes
- Middleware-based route protection

## License

Licensed under the [MIT license](./LICENSE).
