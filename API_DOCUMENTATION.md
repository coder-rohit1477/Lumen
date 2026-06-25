# API Documentation

Backend API reference for **Lumen Commerce**.

Base URL: `/api`

All endpoints are served from a single catch-all route handler. Responses use JSON. Authentication is via Bearer token in the `Authorization` header.

---

## Table of Contents

- [General](#general)
- [Authentication](#authentication)
- [Products](#products)
- [Categories](#categories)
- [Reviews](#reviews)
- [Coupons](#coupons)
- [Orders](#orders)
- [Admin — Dashboard](#admin--dashboard)
- [Admin — Orders](#admin--orders)
- [Admin — Products](#admin--products)
- [Admin — Users](#admin--users)
- [Admin — Analytics](#admin--analytics)
- [Admin — Customers](#admin--customers)
- [Admin — Inventory](#admin--inventory)
- [Admin — Payments](#admin--payments)
- [Error Handling](#error-handling)
- [Authentication Flow](#authentication-flow)
- [Status Codes](#status-codes)

---

## General

### Health Check

| | |
|---|---|
| **Route** | `GET /api/` |
| **Auth** | None |
| **Purpose** | Verify API is running |

**Response 200:**
```json
{ "message": "Lumen Commerce API", "ok": true }
```

### CORS

All responses include CORS headers. `OPTIONS` requests return `200` with allowed methods.

---

## Authentication

### Register

| | |
|---|---|
| **Route** | `POST /api/auth/register` |
| **Auth** | None |
| **Purpose** | Create a new customer account |

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepass123"
}
```

**Validation:**
- All fields required
- Email must not already exist

**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": "a1b2c3d4-...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer",
    "addresses": [],
    "createdAt": "2026-06-25T10:00:00.000Z"
  }
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Missing name, email, or password |
| 400 | Email already registered |

---

### Login

| | |
|---|---|
| **Route** | `POST /api/auth/login` |
| **Auth** | None |
| **Purpose** | Authenticate and receive JWT |

**Request Body:**
```json
{
  "email": "admin@lumen.shop",
  "password": "admin123"
}
```

**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": "b69f10ea-...",
    "name": "Admin",
    "email": "admin@lumen.shop",
    "role": "admin",
    "addresses": [],
    "createdAt": "2026-06-25T15:45:26.247Z"
  }
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 401 | Email not found |
| 401 | Wrong password |

**Notes:** Token is HS256 JWT with 30-day expiry. Payload contains `{uid, role, email}`.

---

### Get Current User

| | |
|---|---|
| **Route** | `GET /api/auth/me` |
| **Auth** | Required |
| **Role** | Any |
| **Purpose** | Get profile of the authenticated user |

**Response 200:**
```json
{
  "user": {
    "id": "a1b2c3d4-...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer",
    "addresses": [],
    "createdAt": "2026-06-25T10:00:00.000Z"
  }
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 401 | No token or invalid token |
| 404 | User not found in database |

---

## Products

### List Products

| | |
|---|---|
| **Route** | `GET /api/products` |
| **Auth** | None |
| **Purpose** | Browse product catalog with filters, sorting, and pagination |

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `category` | string | Filter by category slug (e.g. `men`, `electronics`) |
| `brand` | string | Filter by brand name |
| `featured` | any | If present, filter `featured: true` |
| `bestSeller` | any | If present, filter `bestSeller: true` |
| `newArrival` | any | If present, filter `newArrival: true` |
| `q` | string | Search by product name (case-insensitive regex) |
| `min` | number | Minimum price |
| `max` | number | Maximum price |
| `sort` | string | Sort order: `featured`, `new`, `price-asc`, `price-desc`, `rating` |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 24, max: 60) |

**Response 200:**
```json
{
  "items": [
    {
      "id": "eb5682d8-...",
      "slug": "heritage-leather-watch",
      "name": "Heritage Leather Watch",
      "brand": "Lumen",
      "category": "accessories",
      "price": 8999,
      "comparePrice": 14999,
      "stock": 24,
      "images": ["https://images.unsplash.com/..."],
      "description": "A timeless leather strap watch...",
      "featured": true,
      "bestSeller": true,
      "newArrival": false,
      "rating": 4.8,
      "numReviews": 128,
      "createdAt": "2026-06-25T15:45:26.000Z"
    }
  ],
  "total": 12,
  "page": 1,
  "pages": 1
}
```

---

### Get Product Detail

| | |
|---|---|
| **Route** | `GET /api/products/:slug` |
| **Auth** | None |
| **Path Params** | `slug` — product URL slug |
| **Purpose** | Get single product with related products and reviews |

**Response 200:**
```json
{
  "product": { "id": "...", "slug": "heritage-leather-watch", "name": "...", "..." : "..." },
  "related": [ { "id": "...", "slug": "...", "name": "..." } ],
  "reviews": [
    {
      "id": "...",
      "productId": "...",
      "userId": "...",
      "userName": "John",
      "rating": 5,
      "comment": "Great product!",
      "createdAt": "2026-06-25T18:00:00.000Z"
    }
  ]
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 404 | Product slug not found |

---

## Categories

### List Categories

| | |
|---|---|
| **Route** | `GET /api/categories` |
| **Auth** | None |
| **Purpose** | Get all product categories |

**Response 200:**
```json
[
  { "id": "men", "slug": "men", "name": "Men's Fashion", "image": "https://..." },
  { "id": "women", "slug": "women", "name": "Women's Fashion", "image": "https://..." },
  { "id": "electronics", "slug": "electronics", "name": "Electronics", "image": "https://..." }
]
```

---

## Reviews

### Submit Review

| | |
|---|---|
| **Route** | `POST /api/reviews` |
| **Auth** | Required |
| **Role** | Any authenticated user |
| **Purpose** | Post a product review; recalculates product rating |

**Request Body:**
```json
{
  "productId": "eb5682d8-...",
  "rating": 5,
  "comment": "Excellent quality and fast delivery."
}
```

**Validation:**
- `productId` and `rating` are required
- `comment` is optional (defaults to empty string)

**Response 200:**
```json
{
  "id": "r1234-...",
  "productId": "eb5682d8-...",
  "userId": "a1b2c3d4-...",
  "userName": "John Doe",
  "rating": 5,
  "comment": "Excellent quality and fast delivery.",
  "createdAt": "2026-06-25T18:00:00.000Z"
}
```

**Side Effects:** Product `rating` and `numReviews` are recalculated from all reviews.

**Errors:**
| Status | Condition |
|--------|-----------|
| 401 | Not authenticated |
| 400 | Missing productId or rating |

---

## Coupons

### Validate Coupon

| | |
|---|---|
| **Route** | `POST /api/coupons/validate` |
| **Auth** | None |
| **Purpose** | Check if a coupon code is valid for the given subtotal |

**Request Body:**
```json
{
  "code": "LUMEN10",
  "subtotal": 5000
}
```

**Available Codes:**
| Code | Type | Value | Minimum Order |
|------|------|-------|---------------|
| LUMEN10 | Percentage | 10% | ₹0 |
| WELCOME20 | Percentage | 20% | ₹2,000 |
| FLAT500 | Flat | ₹500 | ₹3,000 |

**Response 200:**
```json
{
  "code": "LUMEN10",
  "discount": 500,
  "type": "pct",
  "value": 10
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Invalid coupon code |
| 400 | Subtotal below minimum |

---

## Orders

### Create Order

| | |
|---|---|
| **Route** | `POST /api/orders` |
| **Auth** | Optional (guest checkout supported) |
| **Purpose** | Create order, initiate payment via Razorpay |

**Request Body:**
```json
{
  "items": [
    { "productId": "eb5682d8-...", "qty": 2 },
    { "productId": "heritage-leather-watch", "qty": 1 }
  ],
  "shippingAddress": {
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "line1": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "country": "India"
  },
  "paymentMethod": "razorpay",
  "couponCode": "LUMEN10",
  "guestEmail": "john@example.com"
}
```

**Validation:**
- `items` must be non-empty array
- `shippingAddress` required
- Each `productId` must resolve to a valid product (looked up by both `id` and `slug`)

**Price Computation (server-side):**
- Prices re-read from database (never trust client prices)
- Shipping: free if subtotal > ₹1,500, else ₹99
- Tax: 5% of (subtotal - discount)
- Coupon discount validated server-side

**Response 200:**
```json
{
  "order": {
    "id": "ord-uuid-...",
    "accessToken": "token-uuid-...",
    "userId": "user-uuid or null",
    "userEmail": "john@example.com",
    "items": [{ "productId": "...", "name": "...", "price": 8999, "qty": 1, "image": "..." }],
    "subtotal": 8999,
    "discount": 900,
    "shipping": 0,
    "tax": 405,
    "total": 8504,
    "status": "pending",
    "paymentStatus": "pending",
    "testMode": false,
    "createdAt": "2026-06-25T20:00:00.000Z"
  },
  "razorpay": { "id": "order_RZP123...", "amount": 850400, "currency": "INR" },
  "keyId": "rzp_live_...",
  "testMode": false
}
```

**Notes:**
- If Razorpay keys are missing/placeholder, `testMode: true` and `razorpay: null`
- `productId` lookup uses `$or: [{id: {$in: ids}}, {slug: {$in: ids}}]`

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Cart is empty |
| 400 | Shipping address missing |
| 500 | Invalid product in cart (product not found in DB) |

---

### Verify Payment

| | |
|---|---|
| **Route** | `POST /api/orders/verify` |
| **Auth** | None |
| **Purpose** | Verify Razorpay payment signature and confirm order |

**Request Body (production):**
```json
{
  "orderId": "ord-uuid-...",
  "razorpay_order_id": "order_RZP123...",
  "razorpay_payment_id": "pay_RZP456...",
  "razorpay_signature": "hmac-sha256-hex-string"
}
```

**Request Body (test mode):**
```json
{
  "orderId": "ord-uuid-...",
  "simulate": true
}
```

**Signature Verification:**
```
expected = HMAC_SHA256(razorpay_order_id + "|" + razorpay_payment_id, RAZORPAY_KEY_SECRET)
verified = (expected === razorpay_signature)
```

**Side Effects on success:**
- Order `paymentStatus` → `paid`
- Order `status` → `confirmed`
- Stock decremented for each item

**Response 200:**
```json
{
  "order": {
    "id": "ord-uuid-...",
    "status": "confirmed",
    "paymentStatus": "paid",
    "razorpayPaymentId": "pay_RZP456..."
  }
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 404 | Order not found |
| 400 | Signature verification failed |

---

### List User Orders

| | |
|---|---|
| **Route** | `GET /api/orders` |
| **Auth** | Required |
| **Role** | Any authenticated user |
| **Purpose** | Get current user's order history |

**Response 200:**
```json
[
  {
    "id": "ord-uuid-...",
    "items": [...],
    "total": 8504,
    "status": "confirmed",
    "paymentStatus": "paid",
    "createdAt": "2026-06-25T20:00:00.000Z"
  }
]
```

---

### Get Order Detail

| | |
|---|---|
| **Route** | `GET /api/orders/:id` |
| **Auth** | Required OR access token |
| **Path Params** | `id` — order UUID |
| **Query Params** | `token` — order access token (for guest access) |
| **Purpose** | Get full order details |

**Authorization:**
- Admin can view any order
- Owner (userId matches) can view their order
- Guest with correct `?token=accessToken` can view their order

**Errors:**
| Status | Condition |
|--------|-----------|
| 404 | Order not found |
| 403 | Not owner, not admin, and no valid access token |

---

## Admin — Dashboard

### Get Stats

| | |
|---|---|
| **Route** | `GET /api/admin/stats` |
| **Auth** | Required |
| **Role** | `admin` |
| **Purpose** | Dashboard overview metrics |

**Response 200:**
```json
{
  "revenue": 85040,
  "orders": 12,
  "paidOrders": 8,
  "products": 12,
  "users": 5,
  "chart": [
    { "date": "2026-06-20", "value": 15000 },
    { "date": "2026-06-21", "value": 22000 }
  ]
}
```

`chart` contains the last 14 days of daily revenue from paid orders.

---

## Admin — Orders

### List All Orders

| | |
|---|---|
| **Route** | `GET /api/admin/orders` |
| **Auth** | Required |
| **Role** | `admin` |
| **Purpose** | Get all orders (most recent first, max 200) |

**Response 200:** Array of full order objects (same shape as user orders).

---

### Update Order Status

| | |
|---|---|
| **Route** | `PUT /api/admin/orders/:id` |
| **Auth** | Required |
| **Role** | `admin` |
| **Path Params** | `id` — order UUID |
| **Purpose** | Change order status and append to status history |

**Request Body:**
```json
{ "status": "shipped" }
```

**Valid Statuses:** `pending`, `confirmed`, `packed`, `shipped`, `out_for_delivery`, `delivered`, `cancelled`, `refunded`

**Response 200:** Updated order object.

**Errors:**
| Status | Condition |
|--------|-----------|
| 403 | Not admin |
| 404 | Order not found |

---

## Admin — Products

### Create Product

| | |
|---|---|
| **Route** | `POST /api/products` |
| **Auth** | Required |
| **Role** | `admin` |
| **Purpose** | Add a new product to the catalog |

**Request Body:**
```json
{
  "name": "New Product",
  "slug": "new-product",
  "brand": "BrandName",
  "category": "electronics",
  "price": 2999,
  "comparePrice": 4999,
  "stock": 50,
  "images": ["https://..."],
  "description": "Product description.",
  "featured": true,
  "bestSeller": false,
  "newArrival": true
}
```

**Response 200:** Created product object (with generated `id` and `createdAt`).

---

### Update Product

| | |
|---|---|
| **Route** | `PUT /api/admin/products/:id` |
| **Auth** | Required |
| **Role** | `admin` |
| **Path Params** | `id` — product UUID |
| **Purpose** | Update product fields |

**Request Body:** Any subset of product fields to update.

**Response 200:** Updated product object.

---

### Delete Product

| | |
|---|---|
| **Route** | `DELETE /api/admin/products/:id` |
| **Auth** | Required |
| **Role** | `admin` |
| **Path Params** | `id` — product UUID |
| **Purpose** | Remove product from catalog |

**Response 200:**
```json
{ "deleted": true }
```

---

## Admin — Users

### List Users

| | |
|---|---|
| **Route** | `GET /api/admin/users` |
| **Auth** | Required |
| **Role** | `admin` |
| **Purpose** | Get all registered users |

**Response 200:**
```json
[
  {
    "id": "...",
    "name": "Admin",
    "email": "admin@lumen.shop",
    "role": "admin",
    "addresses": [],
    "createdAt": "2026-06-25T15:45:26.247Z"
  }
]
```

Note: `passwordHash` is stripped from responses by the `clean()` helper.

---

## Admin — Analytics

### Get Analytics

| | |
|---|---|
| **Route** | `GET /api/admin/analytics` |
| **Auth** | Required |
| **Role** | `admin` |
| **Purpose** | Sales analytics across multiple time ranges |

**Response 200:**
```json
{
  "totalRevenue": 85040,
  "dailySales": [{ "date": "2026-06-20", "total": 15000 }],
  "weeklySales": [{ "week": "2026-06-16", "total": 42000 }],
  "monthlySales": [{ "month": "2026-06", "total": 85040 }],
  "topProducts": [{ "name": "Heritage Leather Watch", "qty": 5 }],
  "categoryPerformance": [{ "category": "accessories", "revenue": 45000 }]
}
```

**Data ranges:**
- `dailySales` — last 30 days
- `weeklySales` — last 12 weeks
- `monthlySales` — last 6 months
- `topProducts` — top 5 by quantity sold (all time)
- `categoryPerformance` — revenue by category from paid orders

---

## Admin — Customers

### Get Customer List

| | |
|---|---|
| **Route** | `GET /api/admin/customers` |
| **Auth** | Required |
| **Role** | `admin` |
| **Purpose** | Users with order counts and spending totals |

**Response 200:**
```json
[
  {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer",
    "createdAt": "2026-06-25T10:00:00.000Z",
    "totalOrders": 3,
    "totalSpending": 25500
  }
]
```

---

## Admin — Inventory

### Get Inventory Status

| | |
|---|---|
| **Route** | `GET /api/admin/inventory` |
| **Auth** | Required |
| **Role** | `admin` |
| **Purpose** | Stock alerts and totals |

**Response 200:**
```json
{
  "totalItems": 652,
  "lowStock": [
    { "id": "...", "name": "Milano Leather Tote", "category": "women", "stock": 8 }
  ],
  "outOfStock": [
    { "id": "...", "name": "Sold Out Item", "category": "men", "stock": 0 }
  ]
}
```

**Thresholds:**
- Low stock: `stock > 0 && stock <= 10`
- Out of stock: `stock <= 0`

---

## Admin — Payments

### Get Payment History

| | |
|---|---|
| **Route** | `GET /api/admin/payments` |
| **Auth** | Required |
| **Role** | `admin` |
| **Purpose** | Payment transaction records |

**Response 200:**
```json
[
  {
    "id": "ord-uuid-...",
    "userEmail": "john@example.com",
    "total": 8504,
    "paymentStatus": "paid",
    "paymentMethod": "razorpay",
    "razorpayPaymentId": "pay_RZP456...",
    "createdAt": "2026-06-25T20:00:00.000Z"
  }
]
```

---

## Error Handling

All errors return JSON:

```json
{ "error": "Human-readable error message" }
```

### Infrastructure Errors

| Code | Meaning | Cause |
|------|---------|-------|
| 500 | Server Error | `ENV_MISSING`, `MONGO_URL_INVALID`, or unhandled exception |
| 503 | Service Unavailable | MongoDB connection failed |

### Application Errors

| Code | Meaning |
|------|---------|
| 400 | Validation failure or invalid request |
| 401 | Authentication required or credentials invalid |
| 403 | Insufficient permissions (non-admin accessing admin route) |
| 404 | Resource not found |

---

## Authentication Flow

```
1. Client sends POST /api/auth/login with {email, password}
2. Server verifies bcrypt hash
3. Server signs JWT: {uid, role, email} with HS256, 30-day expiry
4. Client stores token in localStorage (key: lumen-auth)
5. Subsequent requests include: Authorization: Bearer <token>
6. Server extracts token via getUserFromRequest()
7. Token verified with jose.jwtVerify()
8. Decoded payload available as `user` in handler
```

### Admin Authorization

Every admin endpoint checks:
```javascript
if (!user || user.role !== 'admin') return err('Admin only', 403)
```

There is no middleware — authorization is inline in the route handler.

---

## Status Codes

| Code | Usage |
|------|-------|
| 200 | Successful request (all success responses) |
| 400 | Validation error, bad request |
| 401 | Missing or invalid authentication |
| 403 | Forbidden (non-admin on admin routes) |
| 404 | Resource not found |
| 500 | Server configuration error |
| 503 | Database unavailable |
