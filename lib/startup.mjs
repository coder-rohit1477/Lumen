function isMissing(value) {
  return typeof value !== 'string' || !value.trim()
}

function isLikelyMongoUrl(value) {
  return /^mongodb(\+srv)?:\/\//i.test((value || '').trim())
}

export function validateStartupEnvironment(env = process.env) {
  const warnings = []

  if (isMissing(env.MONGO_URL)) {
    warnings.push(
      'MONGO_URL is not set. The app will start with the bundled catalog preview, and live API requests will remain offline until you create .env.local.'
    )
  } else if (!isLikelyMongoUrl(env.MONGO_URL)) {
    warnings.push(
      'MONGO_URL is set but invalid. Use a mongodb:// or mongodb+srv:// connection string in .env.local.'
    )
  }

  if (isMissing(env.DB_NAME)) {
    warnings.push('DB_NAME is not set. The default database name lumen_commerce will be used.')
  }

  if (isMissing(env.JWT_SECRET)) {
    warnings.push(
      'JWT_SECRET is not set. Development auth falls back to a local secret, but production sign-in will fail until you set it.'
    )
  }

  return { warnings }
}

export function logStartupEnvironment(env = process.env, logger = console) {
  const { warnings } = validateStartupEnvironment(env)
  for (const warning of warnings) {
    logger.warn(`[startup] ${warning}`)
  }
  return warnings
}

