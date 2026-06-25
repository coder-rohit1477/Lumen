import { v4 as uuidv4 } from 'uuid'
import { hashPassword } from './auth.js'
import { CATEGORIES, PRODUCTS } from './seed-data.js'

const DEFAULT_ADMIN = {
  name: 'Admin',
  email: 'admin@lumen.shop',
  password: 'admin123',
}

async function ensureIndexes(db) {
  await Promise.all([
    db.collection('products').createIndex({ slug: 1 }, { unique: true }),
    db.collection('products').createIndex({ id: 1 }, { unique: true }),
    db.collection('products').createIndex({ category: 1, featured: -1, rating: -1 }),
    db.collection('products').createIndex({ category: 1, createdAt: -1 }),
    db.collection('categories').createIndex({ slug: 1 }, { unique: true }),
    db.collection('users').createIndex({ email: 1 }, { unique: true }),
    db.collection('orders').createIndex({ id: 1 }, { unique: true }),
    db.collection('orders').createIndex({ userId: 1, createdAt: -1 }),
    db.collection('orders').createIndex({ paymentStatus: 1, createdAt: -1 }),
    db.collection('reviews').createIndex({ productId: 1, createdAt: -1 }),
  ])
}

async function upsertCategory(db, category) {
  await db.collection('categories').updateOne(
    { slug: category.slug },
    {
      $setOnInsert: {
        id: category.id || uuidv4(),
        ...category,
      },
    },
    { upsert: true }
  )
}

async function upsertProduct(db, product, now) {
  await db.collection('products').updateOne(
    { slug: product.slug },
    {
      $setOnInsert: {
        id: uuidv4(),
        ...product,
        createdAt: now,
      },
    },
    { upsert: true }
  )
}

async function upsertAdminUser(db, admin) {
  const password = admin.password || DEFAULT_ADMIN.password
  await db.collection('users').updateOne(
    { email: admin.email || DEFAULT_ADMIN.email },
    {
      $setOnInsert: {
        id: uuidv4(),
        name: admin.name || DEFAULT_ADMIN.name,
        email: admin.email || DEFAULT_ADMIN.email,
        passwordHash: await hashPassword(password),
        role: 'admin',
        addresses: [],
        createdAt: new Date(),
      },
    },
    { upsert: true }
  )
}

export async function seedDatabase(db, options = {}) {
  const admin = options.admin || DEFAULT_ADMIN
  const force = Boolean(options.force)

  await ensureIndexes(db)

  if (force) {
    await Promise.all([
      db.collection('reviews').deleteMany({}),
      db.collection('orders').deleteMany({}),
      db.collection('products').deleteMany({}),
      db.collection('categories').deleteMany({}),
      db.collection('users').deleteMany({}),
    ])
  }

  const now = new Date()

  for (const category of CATEGORIES) {
    await upsertCategory(db, category)
  }

  for (const product of PRODUCTS) {
    await upsertProduct(db, product, now)
  }

  await upsertAdminUser(db, admin)

  return {
    categories: CATEGORIES.length,
    products: PRODUCTS.length,
    adminEmail: admin.email || DEFAULT_ADMIN.email,
  }
}

