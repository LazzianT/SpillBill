import { strict as assert } from 'node:assert'
import { calculateSalesOrderTotals } from './sales-order-totals.ts'

const products = [{ id: 'p1', price: 1250 }, { id: 'p2', price: 3000 }]
assert.deepEqual(calculateSalesOrderTotals([{ productId: 'p1', quantity: 2 }, { productId: 'p2', quantity: 3 }], products), { subtotals: [2500, 9000], total: 11500 })
assert.deepEqual(calculateSalesOrderTotals([{ productId: '', quantity: 1 }, { productId: 'missing', quantity: 3 }, { productId: 'p1', quantity: Number.NaN }], products), { subtotals: [0, 0, 0], total: 0 })
