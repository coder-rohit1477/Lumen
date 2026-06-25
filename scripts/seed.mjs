import { MongoClient } from 'mongodb'
import { seedDatabase } from '../lib/seed.mjs'
import { validateStartupEnvironment } from '../lib/startup.mjs'

function getEnv(name, fallback = '') {
  const value = process.env[name]
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

async function main() {
  const { warnings } = validateStartupEnvironment()
  for (const warning of warnings) {
    console.warn(`[startup] ${warning}`)
  }

  const mongoUrl = getEnv('MONGO_URL')
  if (!mongoUrl) {
    throw new Error('MONGO_URL is required to seed the database. Set it in .env.local first.')
  }

  const dbName = getEnv('DB_NAME', 'lumen_commerce')
  const admin = {
    name: getEnv('SEED_ADMIN_NAME', 'Admin'),
    email: getEnv('SEED_ADMIN_EMAIL', 'admin@lumen.shop'),
    password: getEnv('SEED_ADMIN_PASSWORD', 'admin123'),
  }
  const force = ['1', 'true', 'yes'].includes(getEnv('SEED_FORCE').toLowerCase())

  const client = new MongoClient(mongoUrl, { serverSelectionTimeoutMS: 5000 })
  try {
    await client.connect()
    const result = await seedDatabase(client.db(dbName), { force, admin })
    console.log(`Seeded ${result.categories} categories and ${result.products} products in ${dbName}.`)
    console.log(`Admin account: ${result.adminEmail}`)
  } finally {
    await client.close().catch(() => {})
  }
}

main().catch((error) => {
  console.error(error?.message || error)
  process.exit(1)
})
