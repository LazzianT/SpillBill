import { randomUUID, createHash } from 'node:crypto'

const contactFields = (value = '') => {
  const [email = '', phone = ''] = value.split('|').map((part) => part.trim())
  return { email, phone }
}
const customerDto = (row) => ({ id: row.id, name: row.name, ...contactFields(row.contact_info), orders: Number(row.orders), billed: Number(row.billed), outstanding: Number(row.outstanding), status: Number(row.orders) ? 'Aktif' : 'Belum ada transaksi' })
const productDto = (row) => ({ id: row.id, name: row.name, price: Number(row.unit_price), active: Boolean(row.active), usedIn: Number(row.used_in) })

const history = (action, type, id, description, actor) => ['INSERT INTO histories (id, actor_user_id, action, entity_type, entity_id, description) VALUES (?, ?, ?, ?, ?, ?)', [randomUUID(), actor, action, type, id, description]]

export const customerRepository = {
  async list(pool) {
    const [rows] = await pool.execute(`SELECT c.id, c.name, c.contact_info, COUNT(DISTINCT so.id) AS orders, COALESCE(SUM(DISTINCT inv.total), 0) AS billed, COALESCE(SUM(DISTINCT inv.remaining), 0) AS outstanding FROM customers c LEFT JOIN sales_orders so ON so.customer_id = c.id AND so.archived_at IS NULL LEFT JOIN invoice_summary inv ON inv.sales_order_id = so.id AND inv.archived_at IS NULL WHERE c.archived_at IS NULL GROUP BY c.id, c.name, c.contact_info ORDER BY c.name`)
    return rows.map(customerDto)
  },
  async save(pool, actor, body, id) {
    if (typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length > 255 || (body.contactInfo != null && (typeof body.contactInfo !== 'string' || body.contactInfo.length > 500))) throw Object.assign(new Error('Invalid customer fields'), { statusCode: 400 })
    const connection = await pool.getConnection()
    const entityId = id ?? randomUUID()
    try {
      await connection.beginTransaction()
      if (id) {
        const [result] = await connection.execute('UPDATE customers SET name = ?, contact_info = ? WHERE id = ? AND archived_at IS NULL', [body.name.trim(), body.contactInfo?.trim() || null, id])
        if (!result.affectedRows) throw Object.assign(new Error('Customer not found'), { statusCode: 404 })
      } else await connection.execute('INSERT INTO customers (id, name, contact_info) VALUES (?, ?, ?)', [entityId, body.name.trim(), body.contactInfo?.trim() || null])
      const [sql, values] = history(id ? 'UPDATE' : 'CREATE', 'Customer', entityId, `${id ? 'Pelanggan diperbarui' : 'Pelanggan ditambahkan'}: ${body.name.trim()}`, actor)
      await connection.execute(sql, values)
      await connection.commit()
      return { id: entityId, name: body.name.trim(), ...contactFields(body.contactInfo) }
    } catch (error) { await connection.rollback(); throw error } finally { connection.release() }
  },
  async archive(pool, actor, id) {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      const [result] = await connection.execute('UPDATE customers SET archived_at = UTC_TIMESTAMP() WHERE id = ? AND archived_at IS NULL', [id])
      if (!result.affectedRows) throw Object.assign(new Error('Customer not found'), { statusCode: 404 })
      const [sql, values] = history('ARCHIVE', 'Customer', id, 'Pelanggan diarsipkan', actor)
      await connection.execute(sql, values)
      await connection.commit()
    } catch (error) { await connection.rollback(); throw error } finally { connection.release() }
  },
}

const validDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value
const validId = (value) => typeof value === 'string' && /^[0-9a-f-]{36}$/i.test(value)

export const salesOrderRepository = {
  async list(pool) {
    const [rows] = await pool.execute(`SELECT s.id, s.order_number AS number, DATE_FORMAT(s.order_date, '%Y-%m-%d') AS date, c.name AS customer, s.status, s.total, COALESCE(inv.remaining, s.total) AS remaining, COALESCE(GROUP_CONCAT(CONCAT(i.product_name, ' × ', i.quantity) ORDER BY i.product_name SEPARATOR ' + '), '') AS item FROM sales_order_summary s JOIN sales_orders so ON so.id = s.id JOIN customers c ON c.id = s.customer_id LEFT JOIN sales_order_items i ON i.sales_order_id = s.id LEFT JOIN invoice_summary inv ON inv.sales_order_id = s.id AND inv.archived_at IS NULL WHERE so.archived_at IS NULL GROUP BY s.id, s.order_number, s.order_date, c.name, s.status, s.total, inv.remaining ORDER BY s.order_date DESC, s.order_number DESC`)
    const [items] = await pool.execute('SELECT sales_order_id, product_id, quantity FROM sales_order_items WHERE sales_order_id IN (SELECT id FROM sales_orders WHERE archived_at IS NULL) ORDER BY sales_order_id, id')
    return rows.map((row) => ({ ...row, total: Number(row.total), remaining: Number(row.remaining), date: row.date, item: row.item || '—', items: items.filter((item) => item.sales_order_id === row.id).map(({ product_id, quantity }) => ({ productId: product_id, quantity: Number(quantity) })) }))
  },
  async save(pool, actor, body, id) {
    if (!validId(body.customerId) || !validDate(body.orderDate) || !Array.isArray(body.items) || !body.items.length || body.items.length > 100 || body.items.some((item) => !validId(item.productId) || !Number.isFinite(item.quantity) || item.quantity <= 0 || item.quantity > 999999999) || new Set(body.items.map((item) => item.productId)).size !== body.items.length) throw Object.assign(new Error('Invalid sales order'), { statusCode: 400 })
    const connection = await pool.getConnection()
    const orderId = id ?? randomUUID()
    let orderNumber
    try {
      await connection.beginTransaction()
      const [customers] = await connection.execute('SELECT id FROM customers WHERE id = ? AND archived_at IS NULL LIMIT 1', [body.customerId])
      if (!customers[0]) throw Object.assign(new Error('Customer not found'), { statusCode: 400 })
      const productIds = body.items.map((item) => item.productId)
      const [products] = await connection.execute(`SELECT id, name, unit_price FROM products WHERE archived_at IS NULL AND active = TRUE AND id IN (${productIds.map(() => '?').join(',')})`, productIds)
      if (products.length !== productIds.length) throw Object.assign(new Error('One or more products are unavailable'), { statusCode: 400 })
      if (id) {
        const [orders] = await connection.execute("SELECT order_number FROM sales_orders WHERE id = ? AND status = 'DRAFT' AND archived_at IS NULL LIMIT 1", [id])
        if (!orders[0]) throw Object.assign(new Error('Draft sales order not found'), { statusCode: 404 })
        orderNumber = orders[0].order_number
        const [result] = await connection.execute("UPDATE sales_orders SET customer_id = ?, order_date = ? WHERE id = ? AND status = 'DRAFT' AND archived_at IS NULL", [body.customerId, body.orderDate, id])
        if (!result.affectedRows) throw Object.assign(new Error('Draft sales order not found'), { statusCode: 404 })
        await connection.execute('DELETE FROM sales_order_items WHERE sales_order_id = ?', [id])
      } else {
        const prefix = `SO-${body.orderDate.slice(0, 7)}-`
        for (let attempt = 0; attempt < 3; attempt++) {
          const [latest] = await connection.execute('SELECT order_number FROM sales_orders WHERE order_number REGEXP ? ORDER BY order_number DESC LIMIT 1', [`^SO-${body.orderDate.slice(0, 7)}-[0-9]{4}$`])
          const sequence = latest[0] ? Number(latest[0].order_number.slice(-4)) + 1 : 1
          if (sequence > 9999) throw Object.assign(new Error('Sales order monthly sequence exhausted'), { statusCode: 409 })
          orderNumber = `${prefix}${String(sequence).padStart(4, '0')}`
          try {
            await connection.execute("INSERT INTO sales_orders (id, order_number, customer_id, created_by_user_id, order_date, status) VALUES (?, ?, ?, ?, ?, 'DRAFT')", [orderId, orderNumber, body.customerId, actor, body.orderDate])
            break
          } catch (error) {
            if (error.code !== 'ER_DUP_ENTRY' || attempt === 2) throw error
            await connection.rollback()
            await connection.beginTransaction()
          }
        }
      }
      for (const item of body.items) {
        const product = products.find((candidate) => candidate.id === item.productId)
        await connection.execute('INSERT INTO sales_order_items (id, sales_order_id, product_id, product_name, quantity, unit_price) VALUES (?, ?, ?, ?, ?, ?)', [randomUUID(), orderId, product.id, product.name, item.quantity, product.unit_price])
      }
      const [sql, values] = history(id ? 'UPDATE' : 'CREATE', 'SalesOrder', orderId, `${id ? 'Sales Order diperbarui' : 'Sales Order dibuat'}: ${orderNumber}`, actor)
      await connection.execute(sql, values)
      await connection.commit()
      return { id: orderId, number: orderNumber, status: 'DRAFT' }
    } catch (error) { await connection.rollback(); throw error } finally { connection.release() }
  },
  async archive(pool, actor, id) {
    if (!validId(id)) throw Object.assign(new Error('Invalid sales order ID'), { statusCode: 400 })
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      const [orders] = await connection.execute("SELECT so.id FROM sales_orders so WHERE so.id = ? AND so.status = 'DRAFT' AND so.archived_at IS NULL AND NOT EXISTS (SELECT 1 FROM invoice_headers ih WHERE ih.sales_order_id = so.id) FOR UPDATE", [id])
      if (!orders[0]) throw Object.assign(new Error('Archivable sales order not found'), { statusCode: 409 })
      const [result] = await connection.execute("UPDATE sales_orders SET archived_at = UTC_TIMESTAMP() WHERE id = ? AND status = 'DRAFT' AND archived_at IS NULL AND NOT EXISTS (SELECT 1 FROM invoice_headers ih WHERE ih.sales_order_id = sales_orders.id)", [id])
      if (!result.affectedRows) throw Object.assign(new Error('Archivable sales order not found'), { statusCode: 409 })
      const [sql, values] = history('ARCHIVE', 'SalesOrder', id, 'Sales Order diarsipkan', actor)
      await connection.execute(sql, values)
      await connection.commit()
    } catch (error) { await connection.rollback(); throw error } finally { connection.release() }
  },
  async cancel(pool, actor, id) {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      const [result] = await connection.execute("UPDATE sales_orders SET status = 'CANCELLED' WHERE id = ? AND status = 'DRAFT' AND archived_at IS NULL", [id])
      if (!result.affectedRows) throw Object.assign(new Error('Draft sales order not found'), { statusCode: 404 })
      const [sql, values] = history('UPDATE', 'SalesOrder', id, 'Sales Order dibatalkan', actor)
      await connection.execute(sql, values)
      await connection.commit()
    } catch (error) { await connection.rollback(); throw error } finally { connection.release() }
  },
}

const invoiceDto = (row) => ({ id: row.id, number: row.invoice_number, salesOrderId: row.sales_order_id, customer: row.customer, date: row.invoice_date, dueDate: row.due_date, total: Number(row.total), paid: Number(row.paid), remaining: Number(row.remaining), status: row.status })
const paymentDto = (row) => ({ id: row.id, number: row.payment_number, invoiceId: row.invoice_id, date: typeof row.payment_date === 'string' ? row.payment_date.slice(0, 10) : row.payment_date.toISOString().slice(0, 10), invoice: row.invoice_number, customer: row.customer, method: row.method, amount: Number(row.amount), status: row.status, reference: row.reference ?? '' })
const canonicalAmount = (amount) => Number.isFinite(amount) && amount > 0 && amount <= 9999999999999.99 && Number.isInteger(amount * 100) ? amount.toFixed(2) : null

export const historyRepository = {
  async list(pool) {
    const [rows] = await pool.execute(`SELECT h.id, u.username AS actor, h.action, h.entity_type, h.entity_id, DATE_FORMAT(h.occurred_at, '%Y-%m-%d %H:%i:%s') AS occurred_at, h.description FROM histories h LEFT JOIN users u ON u.id = h.actor_user_id ORDER BY h.occurred_at DESC LIMIT 500`)
    return rows
  },
}

export const invoiceRepository = {
  async list(pool) {
    const [rows] = await pool.execute(`SELECT ih.id, ih.invoice_number, ih.sales_order_id, c.name AS customer, DATE_FORMAT(ih.invoice_date, '%Y-%m-%d') AS invoice_date, DATE_FORMAT(ih.due_date, '%Y-%m-%d') AS due_date, s.total, s.paid, s.remaining, s.status FROM invoice_summary s JOIN invoice_headers ih ON ih.id = s.id JOIN sales_orders so ON so.id = ih.sales_order_id JOIN customers c ON c.id = so.customer_id WHERE ih.archived_at IS NULL ORDER BY ih.invoice_date DESC, ih.invoice_number DESC`)
    return rows.map(invoiceDto)
  },
  async create(pool, actor, body) {
    if (!validId(body.salesOrderId) || !validDate(body.invoiceDate) || !validDate(body.dueDate) || body.dueDate < body.invoiceDate) throw Object.assign(new Error('Invalid invoice fields'), { statusCode: 400 })
    const connection = await pool.getConnection()
    const id = randomUUID()
    const number = `INV-${body.invoiceDate.slice(0, 4)}-${id.slice(0, 8).toUpperCase()}`
    try {
      await connection.beginTransaction()
      const [orders] = await connection.execute("SELECT id, status FROM sales_orders WHERE id = ? AND archived_at IS NULL FOR UPDATE", [body.salesOrderId])
      if (!orders[0] || orders[0].status !== 'DRAFT') throw Object.assign(new Error('Eligible draft sales order not found'), { statusCode: 409 })
      const [items] = await connection.execute('SELECT id, product_id, product_name, quantity, unit_price FROM sales_order_items WHERE sales_order_id = ? ORDER BY id', [body.salesOrderId])
      if (!items.length) throw Object.assign(new Error('Sales order has no items'), { statusCode: 400 })
      await connection.execute('INSERT INTO invoice_headers (id, invoice_number, sales_order_id, invoice_date, due_date) VALUES (?, ?, ?, ?, ?)', [id, number, body.salesOrderId, body.invoiceDate, body.dueDate])
      for (const item of items) await connection.execute('INSERT INTO invoice_details (id, invoice_id, sales_order_item_id, product_id, product_name, quantity, unit_price) VALUES (?, ?, ?, ?, ?, ?, ?)', [randomUUID(), id, item.id, item.product_id, item.product_name, item.quantity, item.unit_price])
      const [sql, values] = history('CREATE', 'Invoice', id, `Invoice diterbitkan: ${number}`, actor)
      await connection.execute(sql, values)
      await connection.commit()
      return { id, number, salesOrderId: body.salesOrderId, date: body.invoiceDate, dueDate: body.dueDate, status: 'UNPAID' }
    } catch (error) { await connection.rollback(); throw error } finally { connection.release() }
  },
  async updateDueDate(pool, actor, id, body) {
    if (!validId(id) || !validDate(body.dueDate)) throw Object.assign(new Error('Invalid invoice due date'), { statusCode: 400 })
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      const [result] = await connection.execute('UPDATE invoice_headers SET due_date = ? WHERE id = ? AND archived_at IS NULL AND first_successful_payment_at IS NULL AND ? >= invoice_date', [body.dueDate, id, body.dueDate])
      if (!result.affectedRows) {
        const [rows] = await connection.execute('SELECT id FROM invoice_headers WHERE id = ? AND archived_at IS NULL AND first_successful_payment_at IS NULL AND due_date = ? AND due_date >= invoice_date', [id, body.dueDate])
        if (!rows.length) throw Object.assign(new Error('Editable invoice not found'), { statusCode: 409 })
      } else {
        const [sql, values] = history('UPDATE', 'Invoice', id, 'Tanggal jatuh tempo invoice diperbarui', actor)
        await connection.execute(sql, values)
      }
      await connection.commit()
    } catch (error) { await connection.rollback(); throw error } finally { connection.release() }
  },
  async archive(pool, actor, id) {
    if (!validId(id)) throw Object.assign(new Error('Invalid invoice ID'), { statusCode: 400 })
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      const [result] = await connection.execute("UPDATE invoice_headers SET archived_at = UTC_TIMESTAMP() WHERE id = ? AND archived_at IS NULL AND id IN (SELECT id FROM invoice_summary WHERE status <> 'PAID')", [id])
      if (!result.affectedRows) throw Object.assign(new Error('Archivable invoice not found'), { statusCode: 409 })
      const [sql, values] = history('ARCHIVE', 'Invoice', id, 'Invoice diarsipkan', actor)
      await connection.execute(sql, values)
      await connection.commit()
    } catch (error) { await connection.rollback(); throw error } finally { connection.release() }
  },
}

const dateOnly = (value) => value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10)
const utcDate = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
const payloadMatches = (row, invoiceId, date, amount, method, reference) => row.invoice_id === invoiceId && (row.payment_date instanceof Date ? row.payment_date.toISOString().slice(0, 10) : String(row.payment_date).slice(0, 10)) === date && Number(row.amount) === Number(amount) && row.method === method && (row.reference ?? '') === reference
const loadIdempotentPayment = async (connection, number) => {
  const [rows] = await connection.execute('SELECT p.id, p.payment_number, p.invoice_id, p.payment_date, p.amount, p.method, p.reference, p.status FROM payments p WHERE p.payment_number = ? LIMIT 1 FOR UPDATE', [number])
  return rows[0]
}

export const paymentRepository = {
  async list(pool) {
    const [rows] = await pool.execute(`SELECT p.id, p.payment_number, DATE_FORMAT(p.payment_date, '%Y-%m-%d') AS payment_date, p.amount, p.method, p.status, p.reference, p.invoice_id, ih.invoice_number, c.name AS customer FROM payments p JOIN invoice_headers ih ON ih.id = p.invoice_id JOIN sales_orders so ON so.id = ih.sales_order_id JOIN customers c ON c.id = so.customer_id ORDER BY p.payment_date DESC, p.payment_number DESC`)
    return rows.map(paymentDto)
  },
  async create(pool, actor, body, key) {
    const amount = canonicalAmount(body.amount)
    const method = ['BANK_TRANSFER', 'EWALLET', 'CASH', 'OTHER'].includes(body.method) ? body.method : null
    const reference = body.reference == null ? '' : body.reference
    if (!validId(body.invoiceId) || !validDate(body.paymentDate) || !amount || !method || typeof reference !== 'string' || reference.length > 255 || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key ?? '')) throw Object.assign(new Error('Invalid payment fields or idempotency key'), { statusCode: 400 })
    const number = `PAY-${createHash('sha256').update(`${actor}:${key}`).digest('hex').slice(0, 40).toUpperCase()}`
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      const existing = await loadIdempotentPayment(connection, number)
      if (existing) {
        if (!payloadMatches(existing, body.invoiceId, body.paymentDate, amount, method, reference)) throw Object.assign(new Error('Idempotency key already used with different payment data'), { statusCode: 409 })
        await connection.commit()
        return { id: existing.id, number: existing.payment_number, invoiceId: existing.invoice_id, amount: Number(existing.amount), method: existing.method, status: existing.status }
      }
      const [invoices] = await connection.execute("SELECT id, remaining, archived_at FROM invoice_summary WHERE id = ? AND archived_at IS NULL FOR UPDATE", [body.invoiceId])
      if (!invoices[0] || Number(invoices[0].remaining) <= 0 || Number(amount) > Number(invoices[0].remaining)) throw Object.assign(new Error('Payment exceeds outstanding invoice amount or invoice is unavailable'), { statusCode: 409 })
      const [invoiceRows] = await connection.execute("SELECT DATE_FORMAT(due_date, '%Y-%m-%d') AS due_date, DATE_FORMAT(invoice_date, '%Y-%m-%d') AS invoice_date FROM invoice_headers WHERE id = ?", [body.invoiceId])
      if (!invoiceRows[0] || body.paymentDate < dateOnly(invoiceRows[0].invoice_date) || body.paymentDate > utcDate()) throw Object.assign(new Error('Invalid payment date'), { statusCode: 400 })
      const id = randomUUID()
      try {
        await connection.execute('INSERT INTO payments (id, payment_number, invoice_id, payment_date, amount, method, reference) VALUES (?, ?, ?, ?, ?, ?, ?)', [id, number, body.invoiceId, `${body.paymentDate} 00:00:00`, amount, method, reference || null])
      } catch (error) {
        if (error.code !== 'ER_DUP_ENTRY') throw error
        const raced = await loadIdempotentPayment(connection, number)
        if (!raced || !payloadMatches(raced, body.invoiceId, body.paymentDate, amount, method, reference)) throw Object.assign(new Error('Idempotency key already used with different payment data'), { statusCode: 409 })
        await connection.commit()
        return { id: raced.id, number: raced.payment_number, invoiceId: raced.invoice_id, amount: Number(raced.amount), method: raced.method, status: raced.status }
      }
      const [sql, values] = history('RECORD_PAYMENT', 'Payment', id, `Pembayaran dicatat: ${number}`, actor)
      await connection.execute(sql, values)
      await connection.commit()
      return { id, number, invoiceId: body.invoiceId, amount: Number(amount), method, status: 'SUCCESS' }
    } catch (error) { await connection.rollback(); throw error } finally { connection.release() }
  },
  async void(pool, actor, id) {
    if (!validId(id)) throw Object.assign(new Error('Invalid payment ID'), { statusCode: 400 })
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      const [result] = await connection.execute("UPDATE payments SET status = 'VOID', voided_at = UTC_TIMESTAMP() WHERE id = ? AND status = 'SUCCESS'", [id])
      if (!result.affectedRows) throw Object.assign(new Error('Successful payment not found'), { statusCode: 409 })
      const [sql, values] = history('VOID_PAYMENT', 'Payment', id, 'Pembayaran dibatalkan', actor)
      await connection.execute(sql, values)
      await connection.commit()
    } catch (error) { await connection.rollback(); throw error } finally { connection.release() }
  },
}

export const productRepository = {
  async list(pool) {
    const [rows] = await pool.execute('SELECT p.id, p.name, p.unit_price, p.active, COUNT(DISTINCT soi.sales_order_id) AS used_in FROM products p LEFT JOIN sales_order_items soi ON soi.product_id = p.id WHERE p.archived_at IS NULL GROUP BY p.id, p.name, p.unit_price, p.active ORDER BY p.name')
    return rows.map(productDto)
  },
  async save(pool, actor, body, id) {
    if (typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length > 255 || !Number.isFinite(body.price) || body.price <= 0 || body.price > 9999999999999.99) throw Object.assign(new Error('Invalid product fields'), { statusCode: 400 })
    const connection = await pool.getConnection()
    const entityId = id ?? randomUUID()
    try {
      await connection.beginTransaction()
      if (id) {
        const [result] = await connection.execute('UPDATE products SET name = ?, unit_price = ? WHERE id = ? AND archived_at IS NULL AND active = TRUE', [body.name.trim(), body.price, id])
        if (!result.affectedRows) throw Object.assign(new Error('Active product not found'), { statusCode: 404 })
      } else await connection.execute('INSERT INTO products (id, name, unit_price) VALUES (?, ?, ?)', [entityId, body.name.trim(), body.price])
      const [sql, values] = history(id ? 'UPDATE' : 'CREATE', 'Product', entityId, `${id ? 'Produk diperbarui' : 'Produk ditambahkan'}: ${body.name.trim()}`, actor)
      await connection.execute(sql, values)
      await connection.commit()
      return { id: entityId, name: body.name.trim(), price: body.price, active: true, usedIn: 0 }
    } catch (error) { await connection.rollback(); throw error } finally { connection.release() }
  },
  async setActive(pool, actor, id, active) {
    if (!validId(id) || typeof active !== 'boolean') throw Object.assign(new Error('Invalid product status'), { statusCode: 400 })
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      const [result] = await connection.execute('UPDATE products SET active = ? WHERE id = ? AND active <> ? AND archived_at IS NULL', [active, id, active])
      if (!result.affectedRows) throw Object.assign(new Error('Product status unchanged or product not found'), { statusCode: 404 })
      const [sql, values] = history('UPDATE', 'Product', id, active ? 'Produk diaktifkan' : 'Produk dinonaktifkan', actor)
      await connection.execute(sql, values)
      await connection.commit()
    } catch (error) { await connection.rollback(); throw error } finally { connection.release() }
  },
  async archive(pool, actor, id) {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      const [result] = await connection.execute('UPDATE products SET archived_at = UTC_TIMESTAMP() WHERE id = ? AND archived_at IS NULL', [id])
      if (!result.affectedRows) throw Object.assign(new Error('Product not found'), { statusCode: 404 })
      const [sql, values] = history('ARCHIVE', 'Product', id, 'Produk diarsipkan', actor)
      await connection.execute(sql, values)
      await connection.commit()
    } catch (error) { await connection.rollback(); throw error } finally { connection.release() }
  },
}
