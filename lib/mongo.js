import 'server-only'
import { MongoClient } from 'mongodb'
import { requireEnv, optionalEnv } from '@/lib/env'

const globalForMongo = globalThis
let cached = globalForMongo.__mongo
if (!cached) cached = globalForMongo.__mongo = { client: null, db: null, connectPromise: null }

function normalizeMongoError(error, mongoUrl) {
  if (!error) return new Error('Failed to connect to MongoDB')
  if (error.code === 'ENV_MISSING') return error

  const message = error.message || 'Unknown MongoDB error'
  if (/ECONNREFUSED|server selection timed out|failed to connect|ENOTFOUND/i.test(message)) {
    let host = ''
    try {
      host = new URL(mongoUrl).host
    } catch {
      host = ''
    }
    const friendly = new Error(
      host
        ? `MongoDB is not running or unreachable at ${host}. Start MongoDB and reload the app.`
        : 'MongoDB is not running or unreachable. Start MongoDB and reload the app.'
    )
    friendly.code = 'MONGO_CONNECTION_FAILED'
    friendly.cause = error
    return friendly
  }

  return error
}

export function getMongoUrl() {
  const mongoUrl = requireEnv('MONGO_URL', {
    message:
      'MONGO_URL is missing. Create .env.local from .env.local.example and add a MongoDB connection string.',
  })

  if (!/^mongodb(\+srv)?:\/\//i.test(mongoUrl)) {
    const error = new Error('MONGO_URL must start with mongodb:// or mongodb+srv://')
    error.code = 'MONGO_URL_INVALID'
    throw error
  }

  return mongoUrl
}

export async function getDb() {
  if (cached.db) return cached.db
  if (!cached.connectPromise) {
    const mongoUrl = getMongoUrl()
    const dbName = optionalEnv('DB_NAME', 'lumen_commerce')
    const client = new MongoClient(mongoUrl, {
      serverSelectionTimeoutMS: 5000,
    })

    cached.connectPromise = client
      .connect()
      .then(() => {
        cached.client = client
        cached.db = client.db(dbName)
        return cached.db
      })
      .catch((error) => {
        cached.client = null
        cached.db = null
        cached.connectPromise = null
        throw normalizeMongoError(error, mongoUrl)
      })
  }

  return cached.connectPromise
}

export async function closeMongo() {
  const pending = cached.connectPromise
  if (pending) {
    try {
      await pending
    } catch {
      // Ignore connection errors during shutdown.
    }
  }

  const client = cached.client
  cached.client = null
  cached.db = null
  cached.connectPromise = null

  if (!client) return

  try {
    await client.close(true)
  } catch {
    // Ignore shutdown errors.
  }
}

export function clean(doc) {
  if (!doc) return doc
  if (Array.isArray(doc)) return doc.map(clean)
  const { _id, passwordHash: _passwordHash, ...rest } = doc
  return rest
}
