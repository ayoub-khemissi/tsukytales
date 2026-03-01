# Order Workflow — Back-office

## Order Statuses

### `status` (order lifecycle)

| Value | Description |
|---|---|
| `pending` | Created, awaiting payment |
| `completed` | Payment confirmed |
| `canceled` | Cancelled (payment failure, expiration, refund) |
| `archived` | Manually archived |
| `requires_action` | 3DS or other action required |

### `payment_status`

| Value | Description |
|---|---|
| `awaiting` | Awaiting payment |
| `captured` | Payment captured by Stripe |
| `canceled` | Payment cancelled |
| `refunded` | Fully refunded |
| `partially_refunded` | Partially refunded |

### `fulfillment_status`

| Value | Description |
|---|---|
| `not_fulfilled` | Not yet shipped |
| `shipped` | Shipped (label created, tracking active) |
| `delivered` | Delivered |
| `canceled` | Fulfillment cancelled |

## Lifecycle Flow

```
1. Customer places order
   → status=pending, payment_status=awaiting, fulfillment_status=not_fulfilled

2. Stripe webhook: payment_intent.succeeded
   → status=completed, payment_status=captured
   → Auto-shipment triggered (fire-and-forget)

3. Auto-shipment succeeds (Boxtal API)
   → fulfillment_status=shipped
   → tracking_number + label_url stored in metadata

4. Delivery confirmed
   → fulfillment_status=delivered

--- Failure paths ---

5a. Payment fails / PI expires
    → status=canceled, payment_status=canceled
    → Stock restored

5b. Auto-shipment fails (Boxtal error)
    → fulfillment_status stays not_fulfilled
    → metadata.shipping_failed=true, metadata.shipping_error=<message>
    → Admin can retry from order detail page

5c. Admin refund
    → status=canceled, payment_status=refunded
    → Stock restored
```

## Shipping Eligibility

An order is eligible for shipping when **all 3 conditions** are met:

| Field | Required value |
|---|---|
| `status` | `completed` |
| `fulfillment_status` | `not_fulfilled` |
| `payment_status` | `captured` |

This rule is enforced in:

- **Orders list** — checkbox only shown for eligible orders
- **Order detail** — "Ship" button only shown for eligible orders (or `shipping_failed` for retry)
- **Bulk ship API** (`POST /api/admin/orders/bulk-ship`) — rejects ineligible orders
- **Single ship API** (`POST /api/admin/orders/process-shipping`) — rejects ineligible orders (unless `force=true` for re-ship)

### Re-ship / Retry

| Scenario | Button | API param |
|---|---|---|
| First shipment | "Expédier" | `force=false` |
| Retry after failure (`shipping_failed`) | "Réessayer" | `force=false` |
| Re-ship (already shipped/delivered) | "Ré-expédier" | `force=true` — bypasses eligibility check, cancels previous shipment |

## Back-office Actions

### Orders List (`/admin/orders`)

- **Filters**: status, fulfillment, payment, search (email/name/ID)
- **Sort**: by ID, total, date
- **Bulk ship**: select eligible orders via checkbox → confirm modal → calls `bulk-ship` API
- **Export CSV**: exports filtered orders

### Order Detail (`/admin/orders/[id]`)

- **Ship**: creates Boxtal shipment (label + tracking)
- **Re-ship**: cancels previous shipment, creates new one
- **Retry**: retries after shipping failure
- **Refund**: Stripe refund + stock restoration + status update
- **Edit items**: modify order items (name, price, quantity), add or remove items
- **Notes**: add internal notes to the order
- **Shipping info**: method, cost, carrier, relay point, tracking, label download

### Editing Order Items

The admin can modify the items of any order from the order detail page:

1. Click **"Modifier les articles"** in the Items card header
2. Edit name, unit price, and quantity for each item
3. Add new items with the **"+ Ajouter un article"** button
4. Remove items with the **✕** button
5. The total is recalculated client-side as a preview
6. Click **"Enregistrer"** to save → `PATCH /api/admin/orders/{id}`

**API:** `PATCH /api/admin/orders/{id}`

- **Auth:** requires admin session
- **Body:** `{ items: [{ name, price, quantity }, ...] }`
- **Validation:** items must be a non-empty array, each item must have name, price, and quantity
- **Effect:** updates the `items` JSON column in the orders table (does not recalculate the order total)

## Audit Trail

Every status change is recorded in `metadata.history`:

```json
[
  { "date": "2026-02-26T10:00:00Z", "status": "pending", "label": "Order created" },
  { "date": "2026-02-26T10:01:00Z", "status": "completed", "label": "Payment confirmed via webhook" },
  { "date": "2026-02-26T10:02:00Z", "status": "shipped", "label": "Commande expédiée via Boxtal" }
]
```
