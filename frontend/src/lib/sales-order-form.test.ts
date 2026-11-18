import { strict as assert } from 'node:assert'
import { removeOrderItem } from './sales-order-form.ts'

const first = { productId: 'p1', quantity: 2 }
const second = { productId: 'p2', quantity: 4 }
assert.deepEqual(removeOrderItem([first, second], 0), [second])
assert.deepEqual(removeOrderItem([first], 0), [first])
assert.deepEqual(removeOrderItem([first, second], 8), [first, second])
console.log('sales order form checks passed')
