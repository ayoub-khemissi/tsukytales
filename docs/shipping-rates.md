# Shipping Rates — Tsuky Tales

## Overview

Shipping rates are **configurable from the admin back-office** (Settings page). They are stored in the `settings` MySQL table as JSON key-value pairs. When no custom rates exist in the database, hardcoded defaults are used as a fallback.

```
Admin Settings UI  →  PUT /api/admin/settings/shipping  →  `settings` table
                                                              ↓
Checkout / Store   →  GET /api/store/shipping/rates      →  shipping.service.ts
                                                              ↓
                                                     DB rates || fallback defaults
```

---

## Architecture

### Database — `settings` table

```sql
CREATE TABLE IF NOT EXISTS `settings` (
  `key` VARCHAR(255) PRIMARY KEY,
  `value` JSON NOT NULL,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

Each shipping zone is stored as a separate key:

| Key | Zone | Method |
|-----|------|--------|
| `shipping_rates_relay_fr` | France | Mondial Relay |
| `shipping_rates_relay_eu` | Europe | Mondial Relay |
| `shipping_rates_home_fr` | France | Colissimo |
| `shipping_rates_home_eu1` | BE, LU, NL, DE, AT | Colissimo International |
| `shipping_rates_home_eu2` | ES, PT, IT, GB, IE, CH, PL, CZ, DK, SE, NO, FI, HU, RO, BG, HR, GR, SK, SI, EE, LV, LT | Colissimo International |
| `shipping_rates_home_om` | GP, MQ, GF, RE, YT (Overseas) | Colissimo Outre-Mer |
| `shipping_rates_home_world` | Rest of the world | Colissimo International |

Each value is a JSON array of weight tiers:

```json
[
  { "maxWeight": 0.5, "price": 3.9 },
  { "maxWeight": 1, "price": 4.5 },
  { "maxWeight": 3, "price": 5.5 },
  { "maxWeight": 5, "price": 6.9 },
  { "maxWeight": 10, "price": 8.9 }
]
```

### Key files

| File | Role |
|------|------|
| `lib/repositories/settings.repository.ts` | Generic key-value repository (`get`, `set`, `getMultiple`) |
| `lib/services/shipping.service.ts` | `getShippingRates(weight, country)` — loads from DB with fallback |
| `app/api/admin/settings/shipping/route.ts` | Admin API (GET/PUT), protected by `requireAdmin()` |
| `app/api/store/shipping/rates/route.ts` | Public API used by checkout |
| `app/[locale]/admin/(panel)/settings/page.tsx` | Admin UI with editable grids |

---

## How rate resolution works

`getShippingRates(totalWeight, countryCode)` in `shipping.service.ts`:

1. Fetches all 7 `shipping_rates_*` keys from the `settings` table in a single query
2. Merges DB values over hardcoded defaults (missing keys fall back to defaults)
3. Determines the zone from the country code
4. Finds the matching weight tier (first tier where `weight <= maxWeight`)
5. Returns relay + home prices, carrier names, and relay availability

```
Input:  weight=1.2kg, country=FR
         ↓
Zone:   relay_fr + home_fr
         ↓
Tier:   maxWeight=3 (first tier >= 1.2)
         ↓
Output: { relay: { price: 5.5, carrier: "Mondial Relay" },
          home:  { price: 7.9, carrier: "Colissimo" } }
```

### Fallback behavior

If the `settings` table is empty or the DB query fails, the service uses the hardcoded defaults defined in `SHIPPING_DEFAULT_RATES`. This ensures **zero downtime** — deleting all settings rows simply reverts to the original rates.

---

## Default rates

### Mondial Relay (Point Relais)

Available in: FR, BE, LU, NL, DE, ES, PT, AT, IT, PL

| Weight | France | Europe |
|--------|--------|--------|
| ≤ 0.5 kg | 3.90€ | 6.90€ |
| ≤ 1 kg | 4.50€ | 7.90€ |
| ≤ 3 kg | 5.50€ | 9.90€ |
| ≤ 5 kg | 6.90€ | 12.90€ |
| ≤ 10 kg | 8.90€ | 16.90€ |

### Colissimo (Home delivery)

| Weight | France | EU 1 | EU 2 | Overseas | World |
|--------|--------|------|------|----------|-------|
| ≤ 0.5 kg | 5.90€ | 9.90€ | 12.90€ | 9.90€ | 16.90€ |
| ≤ 1 kg | 6.90€ | 12.90€ | 15.90€ | 14.90€ | 22.90€ |
| ≤ 2 kg | 7.90€ | 15.90€ | 19.90€ | 19.90€ | 29.90€ |
| ≤ 5 kg | 9.90€ | 19.90€ | 25.90€ | 29.90€ | 42.90€ |
| ≤ 10 kg | 13.90€ | 26.90€ | 34.90€ | 44.90€ | 59.90€ |

---

## Admin API

### `GET /api/admin/settings/shipping`

Returns all 7 rate grids (DB values merged with defaults). Requires admin session.

**Response:**
```json
{
  "shipping_rates_relay_fr": [{ "maxWeight": 0.5, "price": 3.9 }, ...],
  "shipping_rates_relay_eu": [...],
  "shipping_rates_home_fr": [...],
  "shipping_rates_home_eu1": [...],
  "shipping_rates_home_eu2": [...],
  "shipping_rates_home_om": [...],
  "shipping_rates_home_world": [...]
}
```

### `PUT /api/admin/settings/shipping`

Updates one or more rate grids. Only provided keys are updated; omitted keys remain unchanged.

**Validation:** Each grid must be a non-empty array of `{ maxWeight: number > 0, price: number >= 0 }`.

**Request body:** Same structure as GET response (partial updates allowed).

---

## Updating rates

### From the admin UI

1. Go to **Admin → Settings**
2. Scroll to **"Shipping Rates"** card
3. Switch between **Relay Point** / **Home Delivery** tabs
4. Edit weight/price values, add or remove tiers
5. Click **Save**

### Directly in MySQL

```sql
-- View current custom rates
SELECT * FROM settings WHERE `key` LIKE 'shipping_rates_%';

-- Update a specific zone
INSERT INTO settings (`key`, `value`) VALUES (
  'shipping_rates_home_fr',
  '[{"maxWeight":0.5,"price":6.5},{"maxWeight":1,"price":7.5},{"maxWeight":2,"price":8.5},{"maxWeight":5,"price":10.5},{"maxWeight":10,"price":14.5}]'
) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);

-- Reset to defaults (delete custom rates)
DELETE FROM settings WHERE `key` LIKE 'shipping_rates_%';
```

---

## When to update rates

Carriers (Colissimo, Mondial Relay) typically revise their rate grids **once or twice a year** (usually January). When you receive an updated rate sheet from your carrier contract:

1. Calculate your selling price (carrier cost + margin if any)
2. Update from Admin → Settings → Shipping Rates
3. Changes take effect immediately on the next checkout
