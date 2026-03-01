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
- **Notes**: add internal notes to the order
- **Shipping info**: method, cost, carrier, relay point, tracking, label download

## Audit Trail

Every status change is recorded in `metadata.history`:

```json
[
  { "date": "2026-02-26T10:00:00Z", "status": "pending", "label": "Order created" },
  { "date": "2026-02-26T10:01:00Z", "status": "completed", "label": "Payment confirmed via webhook" },
  { "date": "2026-02-26T10:02:00Z", "status": "shipped", "label": "Commande expédiée via Boxtal" }
]
```
