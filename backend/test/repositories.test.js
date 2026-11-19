import test from 'node:test'
import assert from 'node:assert/strict'
import { salesOrderRepository, invoiceRepository, paymentRepository, historyRepository, productRepository, customerRepository } from '../src/repositories.js'

test('customer list includes the creation date for dashboard metrics', async () => {
  let query
  const result = await customerRepository.list({ execute: async (sql) => { query = sql; return [[{ id: 'c1', name: 'Live customer', contact_info: '', created_at: '2026-11-05', orders: 0, billed: '0', outstanding: '0' }]] } })
  assert.match(query, /c\.created_at/)
  assert.equal(result[0].createdAt, '2026-11-05')
})

test('changes product active status and records the transition', async () => {
  const calls = []
  const connection = { beginTransaction: async () => {}, commit: async () => {}, rollback: async () => {}, release() {}, execute: async (sql, values) => { calls.push({ sql, values }); return [{ affectedRows: 1 }] } }
  const pool = { getConnection: async () => connection }
  const id = '20000000-0000-0000-0000-000000000001'
  await productRepository.setActive(pool, 'user-1', id, true)
  await productRepository.setActive(pool, 'user-1', id, false)
  assert.ok(calls.some(({ sql, values }) => sql.includes('UPDATE products SET active = ?') && values[0] === true))
  assert.ok(calls.some(({ sql, values }) => sql.includes('UPDATE products SET active = ?') && values[0] === false))
  assert.ok(calls.some(({ sql, values }) => sql.includes('INSERT INTO histories') && values.includes('Produk diaktifkan')))
  assert.ok(calls.some(({ sql, values }) => sql.includes('INSERT INTO histories') && values.includes('Produk dinonaktifkan')))
})

test('lists persisted history rows with actor names and timestamps in descending order', async () => {
  let query
  const rows = [{ id: '1', actor: 'finance', action: 'CREATE', entity_type: 'Invoice', entity_id: 'i1', occurred_at: '2026-11-18 10:00:00', description: 'issued' }]
  const result = await historyRepository.list({ execute: async (sql) => { query = sql; return [rows] } })
  assert.match(query, /FROM histories/)
  assert.match(query, /ORDER BY h\.occurred_at DESC/)
  assert.deepEqual(result, rows)
})

test('archives only uninvoiced draft sales orders and records archive history atomically', async () => {
  const calls = []
  const connection = { beginTransaction: async () => calls.push('begin'), commit: async () => calls.push('commit'), rollback: async () => calls.push('rollback'), release() {}, execute: async (sql, values) => { calls.push({ sql, values }); if (sql.includes('SELECT so.id')) return [[{ id: values[0] }]]; if (sql.includes('UPDATE sales_orders SET archived_at')) return [{ affectedRows: 1 }]; return [{ affectedRows: 1 }] } }
  const pool = { getConnection: async () => connection }
  const id = '10000000-0000-4000-8000-000000000001'
  await salesOrderRepository.archive(pool, 'actor-1', id)
  const archiveQuery = calls.find((call) => typeof call === 'object' && call.sql.includes('UPDATE sales_orders SET archived_at'))
  assert.ok(archiveQuery.sql.includes("status = 'DRAFT'"))
  assert.ok(archiveQuery.sql.includes('NOT EXISTS'))
  assert.ok(calls.some((call) => typeof call === 'object' && call.sql.includes('INSERT INTO histories') && call.values.includes('ARCHIVE')))
  assert.equal(calls.at(-1), 'commit')
})

test('rejects invalid sales order archive IDs before starting a transaction', async () => {
  await assert.rejects(salesOrderRepository.archive({ getConnection: async () => { throw new Error('unexpected connection') } }, 'actor-1', 'invalid'), { statusCode: 400 })
})

test('rolls back when a sales order cannot be archived', async () => {
  const calls = []
  const connection = { beginTransaction: async () => calls.push('begin'), commit: async () => calls.push('commit'), rollback: async () => calls.push('rollback'), release() {}, execute: async (sql) => sql.includes('SELECT so.id') ? [[]] : [{ affectedRows: 1 }] }
  await assert.rejects(salesOrderRepository.archive({ getConnection: async () => connection }, 'actor-1', '10000000-0000-4000-8000-000000000001'), { statusCode: 409 })
  assert.ok(calls.includes('rollback'))
})

test('hides archived sales orders and includes editable item details in the list', async () => {
  const queries = []
  const result = await salesOrderRepository.list({ execute: async (sql) => { queries.push(sql); return sql.includes('sales_order_summary') ? [[{ id: 'so1', total: '2500' }]] : [[{ sales_order_id: 'so1', product_id: 'p1', quantity: 2 }]] } })
  assert.match(queries[0], /JOIN sales_orders so ON so\.id = s\.id/)
  assert.match(queries[0], /so\.archived_at IS NULL/)
  assert.deepEqual(result[0].items, [{ productId: 'p1', quantity: 2 }])
})

test('creates a draft sales order and items atomically from validated product IDs', async () => {
  const calls = []
  const connection = { beginTransaction: async () => calls.push('begin'), commit: async () => calls.push('commit'), rollback: async () => calls.push('rollback'), release() {}, execute: async (sql, values) => { calls.push({ sql, values }); if (sql.includes('FROM products')) return [[{ id: '30000000-0000-0000-0000-000000000001', name: 'Widget', unit_price: '12.50' }]]; if (sql.includes('FROM customers')) return [[{ id: '20000000-0000-0000-0000-000000000001' }]]; return [{ affectedRows: 1 }] } }
  const order = await salesOrderRepository.save({ getConnection: async () => connection }, '10000000-0000-0000-0000-000000000001', { customerId: '20000000-0000-0000-0000-000000000001', orderDate: '2026-11-18', items: [{ productId: '30000000-0000-0000-0000-000000000001', quantity: 2 }] })
  assert.equal(order.status, 'DRAFT')
  assert.equal(order.number, 'SO-2026-11-0001')
  assert.equal(calls[0], 'begin')
  assert.ok(calls.some((call) => typeof call === 'object' && call.sql.includes('INSERT INTO sales_orders')))
  assert.ok(calls.some((call) => typeof call === 'object' && call.sql.includes('INSERT INTO sales_order_items') && call.values.includes('12.50')))
  assert.equal(calls.at(-1), 'commit')
})

test('numbers sales orders by the highest monthly sequence and resets each month', async () => {
  const saved = new Map([['2026-11', ['SO-2026-11-0007', 'SO-2026-11-0002', 'SO-2026-11-ABCD']], ['2026-12', []]])
  const pool = { getConnection: async () => ({ beginTransaction: async () => {}, commit: async () => {}, rollback: async () => {}, release() {}, execute: async (sql, values) => {
    if (sql.includes('SELECT order_number FROM sales_orders')) { const month = values[0].match(/SO-(\d{4}-\d{2})-/)[1]; return [[...(saved.get(month) ?? []).filter((number) => new RegExp(`^SO-${month}-\\d{4}$`).test(number))].sort().reverse().slice(0, 1).map((order_number) => ({ order_number }))] }
    if (sql.includes('FROM customers')) return [[{ id: '20000000-0000-0000-0000-000000000001' }]]
    if (sql.includes('FROM products')) return [[{ id: '30000000-0000-0000-0000-000000000001', name: 'Widget', unit_price: '12.50' }]]
    if (sql.includes('INSERT INTO sales_orders')) { saved.get(values[1].slice(3, 10)).push(values[1]); return [{ affectedRows: 1 }] }
    return [{ affectedRows: 1 }]
  } }) }
  const base = { customerId: '20000000-0000-0000-0000-000000000001', items: [{ productId: '30000000-0000-0000-0000-000000000001', quantity: 1 }] }
  const november = await salesOrderRepository.save(pool, '10000000-0000-0000-0000-000000000001', { ...base, orderDate: '2026-11-18' })
  const december = await salesOrderRepository.save(pool, '10000000-0000-0000-0000-000000000001', { ...base, orderDate: '2026-12-01' })
  assert.equal(november.number, 'SO-2026-11-0008')
  assert.equal(december.number, 'SO-2026-12-0001')
})

test('retries sales order numbering after a unique-number collision', async () => {
  let latest = null
  let insertions = 0
  const pool = { getConnection: async () => ({ beginTransaction: async () => {}, commit: async () => {}, rollback: async () => {}, release() {}, execute: async (sql, values) => {
    if (sql.includes('SELECT order_number FROM sales_orders')) return [[latest ? { order_number: latest } : []].flat().filter(Boolean)]
    if (sql.includes('FROM customers')) return [[{ id: '20000000-0000-0000-0000-000000000001' }]]
    if (sql.includes('FROM products')) return [[{ id: '30000000-0000-0000-0000-000000000001', name: 'Widget', unit_price: '12.50' }]]
    if (sql.includes('INSERT INTO sales_orders')) { insertions++; if (insertions === 1) { latest = 'SO-2026-11-0001'; throw Object.assign(new Error('duplicate'), { code: 'ER_DUP_ENTRY' }) } return [{ affectedRows: 1 }] }
    return [{ affectedRows: 1 }]
  } }) }
  const order = await salesOrderRepository.save(pool, '10000000-0000-0000-0000-000000000001', { customerId: '20000000-0000-0000-0000-000000000001', orderDate: '2026-11-18', items: [{ productId: '30000000-0000-0000-0000-000000000001', quantity: 1 }] })
  assert.equal(order.number, 'SO-2026-11-0002')
  assert.equal(insertions, 2)
})

test('rejects exhausted monthly sales order sequence', async () => {
  let salesOrderInsertAttempted = false
  const pool = { getConnection: async () => ({ beginTransaction: async () => {}, commit: async () => {}, rollback: async () => {}, release() {}, execute: async (sql) => sql.includes('SELECT order_number FROM sales_orders') ? [[{ order_number: 'SO-2026-11-9999' }]] : sql.includes('INSERT INTO sales_orders') ? (salesOrderInsertAttempted = true, [{ affectedRows: 1 }]) : sql.includes('FROM customers') ? [[{ id: '20000000-0000-0000-0000-000000000001' }]] : sql.includes('FROM products') ? [[{ id: '30000000-0000-0000-0000-000000000001', name: 'Widget', unit_price: '12.50' }]] : [{ affectedRows: 1 }] }) }
  await assert.rejects(salesOrderRepository.save(pool, '10000000-0000-0000-0000-000000000001', { customerId: '20000000-0000-0000-0000-000000000001', orderDate: '2026-11-18', items: [{ productId: '30000000-0000-0000-0000-000000000001', quantity: 1 }] }), /sequence exhausted/)
  assert.equal(salesOrderInsertAttempted, false)
})

test('creates invoice header and item snapshots from an eligible draft order atomically', async () => {
  const calls = []
  const connection = { beginTransaction: async () => calls.push('begin'), commit: async () => calls.push('commit'), rollback: async () => calls.push('rollback'), release() {}, execute: async (sql, values) => { calls.push({ sql, values }); if (sql.includes('FROM sales_orders')) return [[{ id: '20000000-0000-0000-0000-000000000001', status: 'DRAFT' }]]; if (sql.includes('FROM sales_order_items')) return [[{ id: '30000000-0000-0000-0000-000000000001', product_id: '40000000-0000-0000-0000-000000000001', product_name: 'Widget', quantity: '2.00', unit_price: '12.50' }]]; return [{ affectedRows: 1 }] } }
  const result = await invoiceRepository.create({ getConnection: async () => connection }, '10000000-0000-0000-0000-000000000001', { salesOrderId: '20000000-0000-0000-0000-000000000001', invoiceDate: '2026-11-18', dueDate: '2026-11-25' })
  assert.equal(result.status, 'UNPAID')
  assert.ok(calls.some((call) => typeof call === 'object' && call.sql.includes('INSERT INTO invoice_headers')))
  assert.ok(calls.some((call) => typeof call === 'object' && call.sql.includes('INSERT INTO invoice_details') && call.values.includes('12.50')))
  assert.equal(calls.at(-1), 'commit')
})

test('saving the existing invoice due date succeeds without recording a change', async () => {
  const calls = []
  const connection = { beginTransaction: async () => {}, commit: async () => {}, rollback: async () => {}, release() {}, execute: async (sql) => { calls.push(sql); return sql.startsWith('UPDATE invoice_headers') ? [{ affectedRows: 0 }] : [[{ id: '20000000-0000-0000-0000-000000000001' }]] } }
  await invoiceRepository.updateDueDate({ getConnection: async () => connection }, '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', { dueDate: '2026-11-25' })
  assert.ok(calls.some((sql) => sql.startsWith('SELECT id FROM invoice_headers')))
  assert.equal(calls.some((sql) => sql.includes('INSERT INTO histories')), false)
})

test('invoice due-date update compares the proposed date against invoice date', async () => {
  const calls = []
  const connection = { beginTransaction: async () => {}, commit: async () => {}, rollback: async () => {}, release() {}, execute: async (sql, values) => { calls.push({ sql, values }); return [{ affectedRows: 1 }] } }
  await invoiceRepository.updateDueDate({ getConnection: async () => connection }, '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', { dueDate: '2026-11-25' })
  const update = calls.find((call) => call.sql.startsWith('UPDATE invoice_headers'))
  assert.match(update.sql, /\?\s*>=\s*invoice_date/)
  assert.equal(update.values[0], '2026-11-25')
})

test('rejects an invoice due date before its invoice date without database writes', async () => {
  let acquired = false
  await assert.rejects(invoiceRepository.create({ getConnection: async () => { acquired = true } }, '10000000-0000-0000-0000-000000000001', { salesOrderId: '20000000-0000-0000-0000-000000000001', invoiceDate: '2026-11-18', dueDate: '2026-11-17' }), /Invalid invoice/)
  assert.equal(acquired, false)
})

test('payment list normalizes dates for month filters and formats amount', async () => {
  let query = ''
  const rows = await paymentRepository.list({ execute: async (sql) => { query = sql; return [[{ id: 'p1', payment_number: 'PAY-1', payment_date: '2026-11-18 10:00:00', amount: '12.50', method: 'CASH', status: 'SUCCESS', invoice_number: 'INV-1', customer: 'Customer' }]] } })
  assert.match(query, /DATE_FORMAT\(p\.payment_date, '%Y-%m-%d'\) AS payment_date/)
  assert.equal(rows[0].date, '2026-11-18')
  assert.equal(rows[0].amount, 12.5)
})

test('payment retries with the same key and payload return one persisted payment', async () => {
  const calls = []
  const connection = { beginTransaction: async () => calls.push('begin'), commit: async () => calls.push('commit'), rollback: async () => calls.push('rollback'), release() {}, execute: async (sql, values) => { calls.push({ sql, values }); if (sql.includes('FROM invoice_summary')) return [[{ id: '20000000-0000-0000-0000-000000000001', remaining: '25.00', archived_at: null }]]; if (sql.includes('FROM invoice_headers')) return [[{ invoice_date: '2026-11-18' }]]; if (sql.includes('FROM payments p WHERE p.payment_number')) return calls.some((call) => typeof call === 'object' && call.sql.includes('INSERT INTO payments')) ? [[{ id: calls.find((call) => typeof call === 'object' && call.sql.includes('INSERT INTO payments'))?.values[0], payment_number: values[0], invoice_id: '20000000-0000-0000-0000-000000000001', payment_date: '2026-11-18 00:00:00', amount: '10.00', method: 'CASH', reference: 'R1', status: 'SUCCESS' }]] : [[]]; if (sql.includes('INSERT INTO payments')) return [{ affectedRows: 1 }]; return [{ affectedRows: 1 }] } }
  const pool = { getConnection: async () => connection }
  const input = { invoiceId: '20000000-0000-0000-0000-000000000001', paymentDate: '2026-11-18', amount: 10, method: 'CASH', reference: 'R1' }
  const first = await paymentRepository.create(pool, '10000000-0000-0000-0000-000000000001', input, '60000000-0000-4000-8000-000000000001')
  const retry = await paymentRepository.create(pool, '10000000-0000-0000-0000-000000000001', input, '60000000-0000-4000-8000-000000000001')
  assert.equal(first.id, retry.id)
  assert.equal(calls.filter((call) => typeof call === 'object' && call.sql.includes('INSERT INTO payments')).length, 1)
})

test('rejects reuse of a payment idempotency key with a changed payload', async () => {
  const connection = { beginTransaction: async () => {}, commit: async () => {}, rollback: async () => {}, release() {}, execute: async (sql, values) => sql.includes('FROM payments p WHERE p.payment_number') ? [[{ id: '50000000-0000-0000-0000-000000000001', payment_number: values[0], invoice_id: '20000000-0000-0000-0000-000000000001', payment_date: '2026-11-18 00:00:00', amount: '10.00', method: 'CASH', reference: 'other', status: 'SUCCESS' }]] : sql.includes('FROM invoice_summary') ? [[{ remaining: '25.00', archived_at: null }]] : sql.includes('FROM invoice_headers') ? [[{ invoice_date: '2026-11-18' }]] : [{ affectedRows: 1 }] }
  await assert.rejects(paymentRepository.create({ getConnection: async () => connection }, '10000000-0000-0000-0000-000000000001', { invoiceId: '20000000-0000-0000-0000-000000000001', paymentDate: '2026-11-18', amount: 10, method: 'CASH', reference: 'R1' }, '60000000-0000-4000-8000-000000000001'), (error) => error.statusCode === 409)
})

test('accepts payment date on the current UTC day when database invoice dates are Date values', async () => {
  const today = new Date().toISOString().slice(0, 10)
  const connection = { beginTransaction: async () => {}, commit: async () => {}, rollback: async () => {}, release() {}, execute: async (sql) => sql.includes('FROM payments p WHERE p.payment_number') ? [[]] : sql.includes('FROM invoice_summary') ? [[{ remaining: '100.00', archived_at: null }]] : sql.includes('FROM invoice_headers') ? [[{ invoice_date: new Date(`${today}T00:00:00.000Z`), due_date: new Date(`${today}T00:00:00.000Z`) }]] : [{ affectedRows: 1 }] }
  const result = await paymentRepository.create({ getConnection: async () => connection }, '10000000-0000-0000-0000-000000000001', { invoiceId: '20000000-0000-0000-0000-000000000001', paymentDate: today, amount: 10, method: 'CASH', reference: 'R1' }, '60000000-0000-4000-8000-000000000001')
  assert.equal(result.status, 'SUCCESS')
})

test('rejects invalid payment methods and malformed idempotency keys', async () => {
  let acquired = false
  await assert.rejects(paymentRepository.create({ getConnection: async () => { acquired = true } }, '10000000-0000-0000-0000-000000000001', { invoiceId: '20000000-0000-0000-0000-000000000001', paymentDate: '2026-11-18', amount: 10, method: 'BITCOIN' }, 'bad-key'), /Invalid payment/)
  assert.equal(acquired, false)
})

test('rejects invalid order dates and duplicate products before acquiring a connection', async () => {
  let acquired = false
  const pool = { getConnection: async () => { acquired = true; throw Error('must not acquire') } }
  await assert.rejects(salesOrderRepository.save(pool, 'u1', { customerId: 'c1', orderDate: '2026-02-30', items: [{ productId: 'p1', quantity: 1 }] }), /Invalid sales order/)
  await assert.rejects(salesOrderRepository.save(pool, 'u1', { customerId: 'c1', orderDate: '2026-11-18', items: [{ productId: 'p1', quantity: 1 }, { productId: 'p1', quantity: 2 }] }), /Invalid sales order/)
  assert.equal(acquired, false)
})
