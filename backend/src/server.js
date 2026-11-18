import 'dotenv/config'
import { createApp } from './app.js'
import { loadConfig } from './config.js'
import { checkDatabase, createDatabasePool } from './database.js'

const config = loadConfig()
const pool = createDatabasePool(config.database)
const server = createApp({ corsOrigin: config.corsOrigin, checkDatabase: () => checkDatabase(pool), pool, tokenSecret: config.tokenSecret, tokenLifetimeSeconds: config.tokenLifetimeSeconds })

server.listen(config.port, '0.0.0.0', () => {
  console.log(`SpillBill API listening on port ${config.port}`)
})

const shutdown = async () => {
  await new Promise((resolve) => server.close(resolve))
  await pool.end()
}

process.once('SIGINT', shutdown)
process.once('SIGTERM', shutdown)
