import { strict as assert } from 'node:assert'
import { filterSelectOptions } from './sales-order-select.ts'

const options = [
  { value: 'a', label: 'PT Nusantara · finance@test.id' },
  { value: 'b', label: 'CV Kopi Selatan · owner@test.id' },
]
assert.deepEqual(filterSelectOptions(options, 'kopi'), [options[1]])
assert.deepEqual(filterSelectOptions(options, ' OWNER@TEST '), [options[1]])
assert.deepEqual(filterSelectOptions(options, ''), options)
assert.deepEqual(filterSelectOptions(options, 'missing'), [])
assert.deepEqual(filterSelectOptions([{ value: 'SO-001', label: 'SO-001 · PT Nusantara · Rp2.450.000' }], 'so-001'), [{ value: 'SO-001', label: 'SO-001 · PT Nusantara · Rp2.450.000' }])
console.log('sales order select checks passed')
