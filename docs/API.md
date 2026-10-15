# AMAL Watches — REST API Specification & Reference

Base URL: `http://localhost:4000/api`  
Session Cookie: `amal_session` (`httpOnly`, `sameSite=lax`, `secure` in production)

---

## Table of Contents
1. [Authentication (`/auth`)](#1-authentication)
2. [Health (`/healthz`)](#2-health)
3. [Products (`/products`, `/admin/products`)](#3-products)
4. [Orders (`/orders`, `/admin/orders`)](#4-orders)
5. [Favorites (`/favorites`)](#5-favorites)
6. [Newsletter (`/newsletter`)](#6-newsletter)
7. [Admin KPIs & Stats (`/admin/stats`)](#7-admin-kpis--stats)

---

## 1. Authentication

### `POST /auth/register`
Creates a customer account in Supabase Auth and records the profile in `amal_users`. Sets session cookie.
Rate limit: 10 requests / 15 min per IP+email.

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "name": "Taha Garrad",
    "email": "taha@example.com",
    "password": "SecurePassword2026!"
  }'
```

**Response (201 Created):**
```json
{
  "user": {
    "id": "e85b9b8b-1111-4444-8888-000000000001",
    "name": "Taha Garrad",
    "email": "taha@example.com",
    "role": "customer"
  }
}
```

---

### `POST /auth/login`
Authenticates with email and password via Supabase Auth. Sets session cookie.

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "taha@example.com",
    "password": "SecurePassword2026!"
  }'
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "e85b9b8b-1111-4444-8888-000000000001",
    "name": "Taha Garrad",
    "email": "taha@example.com",
    "role": "customer"
  }
}
```

---

### `POST /auth/admin/login`
Authenticates admin users. Returns 401 if credentials are invalid or user role is not `'admin'`.

```bash
curl -X POST http://localhost:4000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -c admin_cookies.txt \
  -d '{
    "email": "admin@example.com",
    "password": "AdminSecurePassword2026!"
  }'
```

---

### `GET /auth/me`
Retrieves the profile of the currently logged-in user. Requires valid session cookie.

```bash
curl -X GET http://localhost:4000/api/auth/me \
  -b cookies.txt
```

---

### `POST /auth/logout`
Deletes the active session from `amal_sessions` and clears the `amal_session` cookie.

```bash
curl -X POST http://localhost:4000/api/auth/logout \
  -b cookies.txt
```

---

## 2. Health

### `GET /healthz`
Health check for uptime monitors and load balancers.

```bash
curl -X GET http://localhost:4000/api/healthz
```

**Response (200 OK):**
```json
{
  "status": "ok"
}
```

---

## 3. Products

### `GET /products`
List catalog products with pagination, search, category filter, price range, and sorting.

Query parameters:
- `category` (optional): `"All pieces"`, `"Dress"`, `"Field"`, `"Diver"`, `"Chronograph"`
- `q` (optional): search term matching name, collection, or description
- `minPrice` (optional): minimum price in EUR
- `maxPrice` (optional): maximum price in EUR
- `sort` (optional): `"newest"` (default), `"price_asc"`, `"price_desc"`, `"name_asc"`
- `page` (optional): page number (default: `1`)
- `pageSize` (optional): items per page (default: `12`, max `100`)

```bash
curl -X GET "http://localhost:4000/api/products?category=Dress&sort=price_asc&page=1&pageSize=12"
```

**Response (200 OK):**
```json
{
  "items": [
    {
      "id": 6,
      "slug": "solstice-34",
      "name": "Solstice 34",
      "collection": "No. 06 / Quartz",
      "category": "Dress",
      "priceCents": 59000,
      "price": 590,
      "image": "https://images.pexels.com/photos/280250/pexels-photo-280250.jpeg?auto=compress&cs=tinysrgb&w=1200",
      "tone": "blue",
      "description": "A compact everyday companion with a sun-washed blue dial.",
      "stock": 5,
      "isPublished": true,
      "createdAt": "2026-10-15T00:00:00.000Z",
      "updatedAt": "2026-10-15T00:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 12,
  "totalPages": 1
}
```

---

### `GET /products/:slug`
Retrieve product detail by its unique slug (or numeric ID).

```bash
curl -X GET http://localhost:4000/api/products/the-meridian
```

---

### `POST /admin/products`
Create a new watch product. Requires admin authentication.

```bash
curl -X POST http://localhost:4000/api/admin/products \
  -b admin_cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "zenith-gold-40",
    "name": "Zenith Gold 40",
    "collection": "No. 07 / Heritage",
    "category": "Dress",
    "priceCents": 240000,
    "image": "https://images.pexels.com/photos/277390/pexels-photo-277390.jpeg",
    "tone": "gold",
    "description": "Solid 18k yellow gold with bespoke hand-wound caliber.",
    "stock": 5,
    "isPublished": true
  }'
```

---

### `PATCH /admin/products/:id`
Update an existing product's fields. Requires admin authentication.

```bash
curl -X PATCH http://localhost:4000/api/admin/products/1 \
  -b admin_cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "stock": 15,
    "priceCents": 129000
  }'
```

---

### `DELETE /admin/products/:id`
Delete a product from the catalogue. Requires admin authentication.

```bash
curl -X DELETE http://localhost:4000/api/admin/products/1 \
  -b admin_cookies.txt
```

---

## 4. Orders

### `POST /orders`
Places a new order. Open to guests and logged-in customers.
**Security guarantee:** The client NEVER sends prices or totals. Prices and stock are queried directly from the database inside a row-locking transaction (`SELECT ... FOR UPDATE`), preventing overselling.

```bash
curl -X POST http://localhost:4000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      { "productId": 1, "quantity": 1 },
      { "productId": 3, "quantity": 2 }
    ],
    "customerName": "Elena Martinez",
    "email": "elena.martinez@example.es",
    "phone": "+34 612 345 678",
    "address": "Calle Gran Vía 28, 4º B",
    "city": "Madrid",
    "postalCode": "28013",
    "country": "ES",
    "paymentMethod": "card"
  }'
```

**Response (201 Created):**
```json
{
  "order": {
    "id": "AM-2026-9A1F2C",
    "customerName": "Elena Martinez",
    "email": "elena.martinez@example.es",
    "status": "pending",
    "subtotalCents": 273000,
    "shippingCents": 0,
    "taxCents": 57330,
    "totalCents": 273000,
    "total": 2730,
    "subtotal": 2730,
    "shipping": 0,
    "tax": 573.3,
    "items": [
      {
        "productId": 1,
        "productName": "The Meridian",
        "unitPriceCents": 124000,
        "unitPrice": 1240,
        "quantity": 1
      },
      {
        "productId": 3,
        "productName": "Field Note",
        "unitPriceCents": 74500,
        "unitPrice": 745,
        "quantity": 2
      }
    ]
  }
}
```

**Insufficient Stock (409 Conflict):**
```json
{
  "error": "Stock insuficiente para \"Civic Timer\". Unidades disponibles: 1, solicitadas: 2."
}
```

---

### `GET /orders/me`
Retrieve order history for the logged-in customer. Requires session cookie.

```bash
curl -X GET http://localhost:4000/api/orders/me \
  -b cookies.txt
```

---

### `GET /orders/:id`
Retrieve order status and item breakdown. Accessible by order owner or admin.

```bash
curl -X GET http://localhost:4000/api/orders/AM-2026-9A1F2C \
  -b cookies.txt
```

---

### `GET /admin/orders`
Paginated order listing for back-office fulfillment. Requires admin authentication.

Query parameters:
- `status` (optional): `"pending"`, `"paid"`, `"preparing"`, `"shipped"`, `"delivered"`, `"cancelled"`, `"refunded"`
- `search` (optional): matches order ID, customer name, or email
- `page`: default `1`
- `pageSize`: default `10`

```bash
curl -X GET "http://localhost:4000/api/admin/orders?status=paid&page=1&pageSize=10" \
  -b admin_cookies.txt
```

---

### `PATCH /admin/orders/:id/status`
Update fulfillment status. Requires admin authentication.

```bash
curl -X PATCH http://localhost:4000/api/admin/orders/AM-2026-9A1F2C/status \
  -b admin_cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "status": "shipped"
  }'
```

---

## 5. Favorites

### `GET /favorites`
List all watches favorited by the logged-in user. Requires session cookie.

```bash
curl -X GET http://localhost:4000/api/favorites \
  -b cookies.txt
```

---

### `PUT /favorites/:productId`
Add a watch to user's favorites wishlist.

```bash
curl -X PUT http://localhost:4000/api/favorites/1 \
  -b cookies.txt
```

---

### `DELETE /favorites/:productId`
Remove a watch from user's favorites.

```bash
curl -X DELETE http://localhost:4000/api/favorites/1 \
  -b cookies.txt
```

---

## 6. Newsletter

### `POST /newsletter`
Subscribe to AMAL Journal (initiates double opt-in verification).

```bash
curl -X POST http://localhost:4000/api/newsletter \
  -H "Content-Type: application/json" \
  -d '{
    "email": "reader@example.com"
  }'
```

---

### `GET /newsletter/confirm`
Confirm double opt-in via verification token.

```bash
curl -X GET "http://localhost:4000/api/newsletter/confirm?email=reader@example.com&token=3b92f7..."
```

---

### `GET /newsletter/unsubscribe`
Unsubscribe from newsletter communications.

```bash
curl -X GET "http://localhost:4000/api/newsletter/unsubscribe?email=reader@example.com"
```

---

## 7. Admin KPIs & Stats

### `GET /admin/stats`
Computes store KPIs directly from live database tables:
- `revenue` (total EUR revenue excluding cancelled orders)
- `ordersCount` (total orders received)
- `avgOrderValue` (average order value in EUR)
- `lowStockCount` (number of watches with stock <= 3)
- `customersCount` (total registered customers)
- `recentOrders` (5 most recent orders)

```bash
curl -X GET http://localhost:4000/api/admin/stats \
  -b admin_cookies.txt
```

**Response (200 OK):**
```json
{
  "stats": {
    "revenueCents": 1284000,
    "revenue": 12840,
    "ordersCount": 8,
    "avgOrderValueCents": 160500,
    "avgOrderValue": 1605,
    "lowStockCount": 2,
    "customersCount": 14,
    "recentOrders": [...]
  }
}
```

---

## 8. Checkout & Stripe Webhooks (`/checkout`, `/webhooks`)

### `POST /checkout/session`
Initiates a secured Stripe Checkout session. Server loads product prices from DB, computes subtotal/tax/shipping, locks stock row, creates pending order, and returns Stripe Checkout URL.
Supports optional `Idempotency-Key` header.

```bash
curl -X POST http://localhost:4000/api/checkout/session \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: idemp_123456789" \
  -d '{
    "items": [
      { "productId": 1, "quantity": 1 }
    ],
    "customerName": "Rodrigo de la Serna",
    "customerEmail": "rodrigo@ejemplo.es",
    "customerPhone": "+34 600 000 000",
    "shippingAddress": {
      "street": "Calle de Serrano 45, 3º Dcha",
      "city": "Madrid",
      "postalCode": "28001",
      "country": "ES"
    }
  }'
```

**Response (201 Created):**
```json
{
  "orderId": "AM-2026-F81A02",
  "sessionId": "cs_test_a1b2c3d4...",
  "url": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

---

### `POST /webhooks/stripe` (also `/checkout/webhook`)
Handles incoming Stripe webhook events with HMAC signature verification using `STRIPE_WEBHOOK_SECRET`.
Requires raw `Buffer` payload and `stripe-signature` header.

Supported events:
- `checkout.session.completed`: Marks order status as `paid` and records `stripe_payment_intent_id`. Idempotent.
- `checkout.session.expired`: Cancels the order and returns reserved items to product `stock`. Idempotent.

```bash
curl -X POST http://localhost:4000/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -H "stripe-signature: t=1614000000,v1=abc..." \
  --data-binary '{"type": "checkout.session.completed", ...}'
```

**Response (200 OK):**
```json
{
  "received": true
}
```

