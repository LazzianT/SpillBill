const required = (env, key) => {
  const value = env[key]?.trim()
  if (!value) throw new Error(`${key} is required`)
  return value
}

const integer = (env, key, fallback) => {
  const value = env[key] ?? fallback
  const parsed = Number.parseInt(value, 10)
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error(`${key} must be a positive integer`)
  return parsed
}

export const loadConfig = (env = process.env) => {
  const tokenSecret = required(env, 'AUTH_TOKEN_SECRET')
  if (tokenSecret.length < 32) throw new Error('AUTH_TOKEN_SECRET must be at least 32 characters')
  return {
  port: integer(env, 'PORT', '3000'),
  corsOrigin: (env.CORS_ORIGIN?.trim() || 'http://localhost:5173').split(',').map((origin) => origin.trim()).filter(Boolean),
  tokenSecret,
  tokenLifetimeSeconds: 28800,
  database: {
    host: required(env, 'DB_HOST'),
    port: integer(env, 'DB_PORT', '3306'),
    name: required(env, 'DB_NAME'),
    user: required(env, 'DB_USER'),
    password: required(env, 'DB_PASSWORD'),
    connectionLimit: integer(env, 'DB_CONNECTION_LIMIT', '5'),
    ssl: env.DB_SSL === 'true',
  },
  }
}
