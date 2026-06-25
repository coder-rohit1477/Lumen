# Lumen Commerce

A full-stack e-commerce storefront and admin panel built with Next.js 15, MongoDB, and Razorpay. Designed for small-to-medium retail brands selling curated product collections.

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black)](https://nextjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.6-green)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-blue)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Table of Contents

- [Live Preview](#live-preview)
- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Screenshots](#screenshots)
- [API Overview](#api-overview)
- [Authentication Flow](#authentication-flow)
- [Payment Flow](#payment-flow)
- [Project Architecture](#project-architecture)
- [Performance](#performance)
- [Future Improvements](#future-improvements)
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)

---

## Live Preview

| | Link |
|---|---|
| Live Demo | _Coming soon_ |
| Repository | _Your GitHub URL_ |

---

## Overview

Lumen Commerce is a production-ready e-commerce application with two user roles:

- **Customers** can browse products, manage a wishlist, add items to cart, apply coupons, and pay via Razorpay (or simulated test mode).
- **Admins** manage products, orders, customers, inventory, and view analytics through a built-in dashboard.

The application gracefully degrades when MongoDB is unavailable — the storefront renders a bundled product catalog as a preview, allowing the UI to remain functional without a database connection.

---

## Features

### Customer Features

- User registration and login (JWT-based)
- Browse products with filtering (category, price range, search)
- Sort products (featured, newest, price, rating)
- Product detail pages with reviews and related items
- Persistent wishlist (localStorage)
- Shopping cart with quantity management
- Coupon code validation (LUMEN10, WELCOME20, FLAT500)
- Checkout with shipping address form
- Razorpay payment integration (live and test mode)
- Order history and order tracking
- Responsive design (mobile-first)
- Animated page transitions (Framer Motion)

### Admin Features

- Role-protected admin dashboard
- Revenue, orders, customers, and products overview cards
- Revenue and order trend charts (14-day)
- Order management with status updates (pending → confirmed → packed → shipped → out for delivery → delivered → cancelled → refunded)
- Product CRUD (create, edit, delete)
- Product flags: Featured, Best Seller, New Arrival
- Stock and pricing management
- Customer list with order count and total spending
- Analytics: daily, weekly, and monthly sales charts
- Category performance breakdown (pie chart)
- Top selling products ranking
- Payment transaction history with status filtering
- Inventory monitoring (low stock and out of stock alerts)
- Store settings panel

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, standalone output) |
| UI | React 18, Tailwind CSS 3.4, shadcn/ui (47 components) |
| Animations | Framer Motion |
| Charts | Recharts |
| Icons | Lucide React |
| State | Zustand (persisted to localStorage) |
| Data Fetching | @tanstack/react-query, custom fetch wrapper |
| Database | MongoDB 6.6 (driver) |
| Auth | JWT (jose) + bcryptjs |
| Payments | Razorpay |
| Validation | Zod |
| Notifications | Sonner |
| Deployment | Standalone build (Docker-ready) |

---

## Folder Structure

```
├── app/
│   ├── layout.js              # Root layout with providers
│   ├── page.js                # Homepage
│   ├── globals.css            # Global styles
│   ├── providers.js           # QueryClient + theme providers
│   ├── admin/page.js          # Admin dashboard (all sections)
│   ├── shop/page.js           # Shop listing with filters
│   ├── products/[slug]/page.js # Product detail
│   ├── cart/page.js           # Shopping cart
│   ├── checkout/page.js       # Checkout + payment
│   ├── login/page.js          # Login form
│   ├── register/page.js       # Registration form
│   ├── account/page.js        # User account + order history
│   ├── order/success/page.js  # Order confirmation
│   └── api/[[...path]]/route.js # Catch-all API handler
├── components/
│   ├── site/                  # Header, footer, product card, skeleton
│   └── ui/                    # 47 shadcn/ui components
├── hooks/
│   ├── use-mobile.jsx         # Responsive breakpoint
│   └── use-toast.js           # Toast notifications
├── lib/
│   ├── auth.js                # JWT + bcrypt utilities
│   ├── mongo.js               # MongoDB client (lazy, server-only)
│   ├── store.js               # Zustand stores (cart, auth, wishlist)
│   ├── fetcher.js             # API fetch wrapper
│   ├── env.js                 # Env var helpers
│   ├── seed-data.js           # Bundled catalog (offline fallback)
│   ├── seed.mjs               # Database seeding logic
│   └── startup.mjs            # Startup validation
├── scripts/
│   ├── seed.mjs               # Seed runner
│   └── run-next.mjs           # Custom Next.js launcher
├── instrumentation.js         # Next.js instrumentation hook
├── next.config.js             # Next.js configuration
├── tailwind.config.js         # Tailwind theme
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local install or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))

### Installation

```bash
git clone <repository-url>
cd Lumen-main
npm install
```

### Environment Setup

```bash
cp .env.example .env.local
```

Edit `.env.local` with your MongoDB connection string and other values (see [Environment Variables](#environment-variables)).

### Seed the Database

```bash
npm run seed
```

This creates 6 categories, 12 products, and a default admin account (`admin@lumen.shop` / `admin123`).

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
npm run start
```

### Type Checking

```bash
npm run type-check
```

---

## Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `MONGO_URL` | MongoDB connection string (`mongodb://127.0.0.1:27017` for local) |
| `DB_NAME` | Database name (default: `lumen_commerce`) |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `CORS_ORIGINS` | Allowed CORS origins |
| `RAZORPAY_KEY_ID` | Razorpay API key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay API key secret |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay key ID (client-side) |

### Optional

| Variable | Description |
|----------|-------------|
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name (image hosting) |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM` | SMTP configuration |
| `SEED_ADMIN_NAME`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | Custom admin credentials for seeding |
| `SEED_FORCE` | Set to `1` to wipe and re-seed |

> If `RAZORPAY_KEY_ID` is missing or contains "placeholder", the checkout runs in test mode with simulated payment verification.

---

## Screenshots

| Page | Preview |
|------|---------|
| Homepage | ![Homepage](screenshots/home.png) |
| Shop | ![Shop](screenshots/shop.png) |
| Product Detail | ![Product](screenshots/product.png) |
| Cart | ![Cart](screenshots/cart.png) |
| Checkout | ![Checkout](screenshots/checkout.png) |
| Admin Dashboard | ![Admin](screenshots/admin.png) |
| Admin Products | ![Products](screenshots/admin-products.png) |

> Add screenshots to a `screenshots/` directory.

---

## API Overview

All endpoints are served from a single catch-all route (`/api/[[...path]]`).

### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/` | Health check |
| GET | `/api/categories` | List categories |
| GET | `/api/products` | List products (supports filtering, sorting, pagination) |
| GET | `/api/products/:slug` | Product detail with reviews and related |

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in → JWT |
| GET | `/api/auth/me` | Current user profile |

### Customer (authenticated)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reviews` | Submit product review |
| POST | `/api/coupons/validate` | Validate coupon code |
| POST | `/api/orders` | Create order |
| POST | `/api/orders/verify` | Verify payment |
| GET | `/api/orders` | User's order history |
| GET | `/api/orders/:id` | Order details |

### Admin (role: admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard statistics |
| GET | `/api/admin/orders` | All orders |
| PUT | `/api/admin/orders/:id` | Update order status |
| GET | `/api/admin/users` | User list |
| GET | `/api/admin/analytics` | Sales analytics |
| GET | `/api/admin/customers` | Customer data with spend totals |
| GET | `/api/admin/inventory` | Stock alerts |
| GET | `/api/admin/payments` | Payment transactions |
| POST | `/api/products` | Create product |
| PUT | `/api/admin/products/:id` | Update product |
| DELETE | `/api/admin/products/:id` | Delete product |

---

## Authentication Flow

1. User submits credentials to `/api/auth/login`
2. Server verifies password hash (bcryptjs) against stored user
3. Server signs a JWT (HS256, 30-day expiry) containing `{uid, role, email}`
4. Client stores token in Zustand persisted store (localStorage key: `lumen-auth`)
5. Subsequent API calls include `Authorization: Bearer <token>` header
6. Server extracts and verifies token on protected routes
7. Admin routes additionally check `user.role === 'admin'` and return 403 if not

The client-side admin page redirects non-admin users to `/account` and unauthenticated users to `/login`.

---

## Payment Flow

1. Customer fills checkout form and submits order
2. Server creates order in database and (if Razorpay keys are configured) creates a Razorpay order via their API
3. Client opens Razorpay checkout modal with the order ID
4. After payment, client calls `/api/orders/verify` with Razorpay signature
5. Server verifies HMAC-SHA256 signature against `razorpay_order_id|razorpay_payment_id`
6. Order status moves from `pending` to `confirmed`, stock is decremented

**Test mode:** If Razorpay keys are missing or contain "placeholder", orders auto-confirm without real payment. The UI displays a test mode indicator.

---

## Project Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌──────────┐
│   Browser   │────▶│  Next.js Server  │────▶│  MongoDB │
│  (React 18) │◀────│  (API Routes)    │◀────│          │
└─────────────┘     └──────────────────┘     └──────────┘
       │                     │
       │ localStorage        │ JWT verification
       │ (Zustand)           │ bcryptjs hashing
       │                     │
       ▼                     ▼
  Cart, Auth,           Razorpay API
  Wishlist              (payment processing)
```

- **Client:** React 18 with client-side rendering. All pages are `'use client'`. State persisted via Zustand + localStorage.
- **API:** Single catch-all route handler. MongoDB lazy-connected on first request. Server-only module boundary enforced.
- **Database:** MongoDB with indexed collections (products, users, orders, reviews, categories). UUID-based IDs.
- **Auth:** Stateless JWT. No server sessions. Token contains role for authorization decisions.

---

## Performance

- **Code splitting** — Next.js automatic per-route bundles (shared chunk ~102KB)
- **Image optimization** — Remote image patterns configured for Unsplash and Pexels
- **Responsive design** — Mobile-first layouts with breakpoints at md (768px) and lg (1024px)
- **Lazy database connection** — MongoDB connects on first API request, not at startup
- **Offline fallback** — Bundled seed data renders when database is unavailable
- **Standalone output** — Optimized production build for container deployment

---

## Future Improvements

- Server-side rendering for product and shop pages (SEO)
- Image upload via Cloudinary integration
- Transactional emails (order confirmation, shipping updates)
- Admin-configurable coupon codes (database-backed)
- Product variants (size, color)
- Inventory webhooks and low-stock notifications
- Pagination for admin tables
- Search with text indexing
- Rate limiting on auth endpoints
- Order export (CSV)

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push to branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## License

MIT

---

## Author

Rohit Kumar Yadav


