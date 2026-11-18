import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import dotenv from '../backend/node_modules/dotenv/lib/main.js'
import mysql from '../backend/node_modules/mysql2/promise.js'

dotenv.config({ path: new URL('../backend/.env', import.meta.url) })

const schemaPath = new URL('./schema.sql', import.meta.url)

const splitSql = (source) => {
  const statements = []
  let delimiter = ';'
  let buffer = ''

  for (const line of source.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (trimmed.toUpperCase().startsWith('DELIMITER ')) {
      delimiter = trimmed.slice('DELIMITER '.length).trim()
      continue
    }

    buffer += `${line}\n`
    if (buffer.trimEnd().endsWith(delimiter)) {
      const statement = buffer.trimEnd().slice(0, -delimiter.length).trim()
      if (statement && !statement.startsWith('--')) statements.push(statement)
      buffer = ''
    }
  }

  return statements
}

const expectRejected = async (operation, message) => {
  await assert.rejects(operation, (error) => {
    assert.match(error.message, /./)
    return true
  }, message)
}

const main = async () => {
  const suffix = `${Date.now()}_${process.pid}`
  const database = `spillbill_schema_test_${suffix}`
  const admin = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectTimeout: 5000,
    multipleStatements: false,
  })

  try {
    await admin.query(`CREATE DATABASE \`${database}\``)
    await admin.changeUser({ database })

    const schema = await readFile(schemaPath, 'utf8')
    for (const statement of splitSql(schema)) await admin.query(statement)

    const [tables] = await admin.query(
      `SELECT TABLE_NAME AS table_name, ENGINE AS engine
       FROM information_schema.tables
       WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'
       ORDER BY TABLE_NAME`,
      [database],
    )
    assert.deepEqual(tables.map(({ table_name, engine }) => [table_name, engine]), [
      ['customers', 'InnoDB'],
      ['histories', 'InnoDB'],
      ['invoice_details', 'InnoDB'],
      ['invoice_headers', 'InnoDB'],
      ['payments', 'InnoDB'],
      ['products', 'InnoDB'],
      ['sales_order_items', 'InnoDB'],
      ['sales_orders', 'InnoDB'],
      ['users', 'InnoDB'],
    ])

    const ids = {
      user: '00000000-0000-0000-0000-000000000001',
      customer: '00000000-0000-0000-0000-000000000002',
      product: '00000000-0000-0000-0000-000000000003',
      order: '00000000-0000-0000-0000-000000000004',
      item: '00000000-0000-0000-0000-000000000005',
      invoice: '00000000-0000-0000-0000-000000000006',
      detail: '00000000-0000-0000-0000-000000000007',
      payment: '00000000-0000-0000-0000-000000000008',
      emptyOrder: '00000000-0000-0000-0000-000000000010',
    }

    await admin.query(
      `INSERT INTO users (id, username, password_hash, role)
       VALUES (?, 'schema-test', 'hash', 'ACCOUNTING')`, [ids.user],
    )
    await admin.query(
      `INSERT INTO customers (id, name) VALUES (?, 'Schema Test Customer')`, [ids.customer],
    )
    await admin.query(
      `INSERT INTO products (id, name, unit_price) VALUES (?, 'Schema Test Product', 100.00)`, [ids.product],
    )
    await admin.query(
      `INSERT INTO sales_orders (id, order_number, customer_id, created_by_user_id, order_date)
       VALUES (?, 'SO-TEST-001', ?, ?, '2026-11-15')`, [ids.order, ids.customer, ids.user],
    )
    await admin.query(
      `INSERT INTO sales_order_items
       (id, sales_order_id, product_id, product_name, quantity, unit_price)
       VALUES (?, ?, ?, 'Schema Test Product', 2.00, 100.00)`, [ids.item, ids.order, ids.product],
    )
    await admin.query(
      `INSERT INTO sales_orders (id, order_number, customer_id, created_by_user_id, order_date)
       VALUES (?, 'SO-TEST-EMPTY', ?, ?, '2026-11-15')`, [ids.emptyOrder, ids.customer, ids.user],
    )

    await expectRejected(
      () => admin.query(
        `INSERT INTO invoice_headers
         (id, invoice_number, sales_order_id, invoice_date, due_date)
         VALUES (?, 'INV-TEST-EMPTY', ?, '2026-11-15', '2026-11-30')`,
        ['00000000-0000-0000-0000-000000000011', ids.emptyOrder],
      ),
      'empty invoice must be rejected',
    )

    await admin.query(
      `INSERT INTO invoice_headers
       (id, invoice_number, sales_order_id, invoice_date, due_date)
       VALUES (?, 'INV-TEST-001', ?, '2026-11-15', '2026-11-30')`,
      [ids.invoice, ids.order],
    )
    await admin.query(
      `INSERT INTO invoice_details
       (id, invoice_id, sales_order_item_id, product_id, product_name, quantity, unit_price)
       VALUES (?, ?, ?, ?, 'Schema Test Product', 2.00, 100.00)`,
      [ids.detail, ids.invoice, ids.item, ids.product],
    )

    const [[summary]] = await admin.query(
      `SELECT total, paid, remaining, status FROM invoice_summary WHERE id = ?`, [ids.invoice],
    )
    assert.deepEqual(summary, { total: '200.00', paid: '0.00', remaining: '200.00', status: 'UNPAID' })

    await expectRejected(
      () => admin.query(
        `INSERT INTO payments
         (id, payment_number, invoice_id, payment_date, amount, method)
         VALUES ('00000000-0000-0000-0000-000000000009', 'PAY-TEST-OVER', ?, UTC_TIMESTAMP(), 201.00, 'CASH')`,
        [ids.invoice],
      ),
      'overpayment must be rejected',
    )

    await admin.query(
      `INSERT INTO payments
       (id, payment_number, invoice_id, payment_date, amount, method)
       VALUES (?, 'PAY-TEST-001', ?, UTC_TIMESTAMP(), 100.00, 'CASH')`,
      [ids.payment, ids.invoice],
    )
    const [[partial]] = await admin.query(
      `SELECT total, paid, remaining, status FROM invoice_summary WHERE id = ?`, [ids.invoice],
    )
    assert.deepEqual(partial, { total: '200.00', paid: '100.00', remaining: '100.00', status: 'PARTIALLY_PAID' })

    await expectRejected(
      () => admin.query(`UPDATE invoice_headers SET due_date = '2026-12-01' WHERE id = ?`, [ids.invoice]),
      'invoice must lock after first successful payment',
    )
    await admin.query(`UPDATE payments SET status = 'VOID', voided_at = UTC_TIMESTAMP() WHERE id = ?`, [ids.payment])
    const [[voided]] = await admin.query(
      `SELECT paid, remaining, status FROM invoice_summary WHERE id = ?`, [ids.invoice],
    )
    assert.deepEqual(voided, { paid: '0.00', remaining: '200.00', status: 'UNPAID' })
    await expectRejected(
      () => admin.query(`DELETE FROM payments WHERE id = ?`, [ids.payment]),
      'payments must not be deleted',
    )

    console.log(`schema verification passed: ${database}`)
  } finally {
    await admin.query(`DROP DATABASE IF EXISTS \`${database}\``).catch(() => {})
    await admin.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
