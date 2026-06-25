# Lumen Commerce

Premium Next.js storefront backed by MongoDB, with seeded catalog data for local development.

## Setup

1. Install dependencies.
2. Create `.env.local` from `.env.local.example`.
3. Start MongoDB locally or use MongoDB Atlas.
4. Run `npm run dev`.

## Environment Variables

Required runtime variables:

- `MONGO_URL`
- `DB_NAME`
- `JWT_SECRET`
- `CORS_ORIGINS`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`

Optional placeholders included for production integrations:

- Cloudinary
- Email / SMTP
- Additional Next.js public configuration

## Local Development Guide

1. Copy `.env.local.example` to `.env.local`.
2. Set `MONGO_URL` to a running MongoDB instance.
3. Run `npm install`.
4. Run `npm run dev`.
5. Open `http://localhost:3000`.

If MongoDB is unavailable, the UI shows a friendly offline banner and falls back to the bundled catalog preview.

## First-Time Setup Guide

1. Install MongoDB locally or create a MongoDB Atlas cluster.
2. Create `.env.local` and set the required variables.
3. Run `npm install`.
4. Run `npm run dev`.
5. When you want live data, run `npm run seed` once to populate categories, products, and the default admin account.

## Seeding

Database seeding is explicit and never runs during server startup.

Use this command after MongoDB is running:

```bash
npm run seed
```

Optional seed environment variables:

- `SEED_ADMIN_NAME`
- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`
- `SEED_FORCE`

## MongoDB Installation Guide

### Windows

1. Install MongoDB Community Server from the official MongoDB download page.
2. Use the MongoDB service or `mongod` to start the database.
3. Confirm it is reachable on `mongodb://127.0.0.1:27017`.

### macOS

1. Install MongoDB using Homebrew or the official installer.
2. Start the service with `brew services start mongodb-community`.
3. Confirm it is reachable on `mongodb://127.0.0.1:27017`.

### Linux

1. Install MongoDB using your distribution package manager or MongoDB packages.
2. Start the service with `sudo systemctl start mongod`.
3. Confirm it is reachable on `mongodb://127.0.0.1:27017`.

### MongoDB Atlas

1. Create a free cluster.
2. Add a database user and IP allowlist entry.
3. Copy the connection string into `MONGO_URL`.

## Verification

Run the following commands before shipping changes:

```bash
npm run build
npm run type-check
```
