export function requireEnv(name, options = {}) {
  const raw = process.env[name]
  const value = typeof raw === 'string' ? raw.trim() : ''

  if (value) return value

  const message =
    options.message ||
    `Missing required environment variable: ${name}. Create .env.local from .env.local.example and set ${name}.`
  const error = new Error(message)
  error.code = 'ENV_MISSING'
  error.envVar = name
  return throwError(error)
}

export function optionalEnv(name, fallback = '') {
  const raw = process.env[name]
  const value = typeof raw === 'string' ? raw.trim() : ''
  return value || fallback
}

function throwError(error) {
  throw error
}
