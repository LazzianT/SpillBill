import mysql from 'mysql2/promise'

export const createDatabasePoolOptions = (database) => ({
  host: database.host,
  port: database.port,
  database: database.name,
  user: database.user,
  password: database.password,
  waitForConnections: true,
  connectionLimit: database.connectionLimit,
  maxIdle: database.connectionLimit,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  ssl: database.ssl ? {} : undefined,
})

export const createDatabasePool = (database) => mysql.createPool(createDatabasePoolOptions(database))

export const checkDatabase = async (pool) => {
  const [rows] = await pool.execute('SELECT 1 AS ok')
  return rows[0]?.ok === 1
}
