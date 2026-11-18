import { strict as assert } from 'node:assert'
import { canCreateInvoice, filterSalesOrders, filterInvoices, filterPayments, paginate, formatRupiah, invoiceActionDisabled, invoiceActionLabels, isKnownPath, pageForPath, paymentActionLabels, paymentActionDisabled, productFormTitle, salesOrderActionLabel, saveConfirmation, titleForPath } from './dashboard.ts'

assert.deepEqual(invoiceActionLabels, ['Cetak', 'Detail', 'Edit', 'Hapus'])
assert.equal(invoiceActionDisabled('edit', 'PAID'), true)
assert.equal(invoiceActionDisabled('detail', 'PAID'), false)
assert.deepEqual(paymentActionLabels, ['Cetak', 'Edit', 'Hapus'])
assert.equal(paymentActionDisabled('edit', 'SUCCESS'), false)
assert.equal(paymentActionDisabled('delete', 'VOID'), true)
assert.equal(canCreateInvoice('Marketing'), false)
assert.equal(canCreateInvoice('Accounting'), true)
assert.equal(salesOrderActionLabel('detail'), 'Detail')
assert.equal(salesOrderActionLabel('edit'), 'Edit')
assert.equal(productFormTitle(false), 'Tambah Produk')
assert.equal(productFormTitle(true), 'Edit Produk')
assert.equal(saveConfirmation('Pelanggan'), 'Pelanggan berhasil disimpan.')

assert.equal(isKnownPath('/invoice'), true)
assert.equal(isKnownPath('/unknown'), false)
assert.equal(pageForPath('/invoice').label, 'Invoice')
assert.equal(pageForPath('/pembayaran').label, 'Pembayaran')
assert.equal(pageForPath('/unknown').path, '/dashboard')
assert.equal(titleForPath('/invoice'), 'SpillBill | Invoice')

assert.equal(formatRupiah(1500000), 'Rp1.500.000')
assert.equal(filterSalesOrders('sinar').length, 1)
assert.equal(filterSalesOrders('tidak ada').length, 0)
const liveInvoice = { id: 'inv-live', number: 'INV-LIVE', customer: 'Pelanggan live', date: '2026-11-18', dueDate: '2026-11-25', total: 100, paid: 0, remaining: 100, status: 'UNPAID' as const }
const livePayment = { id: 'pay-live', number: 'PAY-LIVE', date: '2026-11-18', invoice: 'INV-LIVE', customer: 'Pelanggan live', method: 'CASH' as const, amount: 25, status: 'SUCCESS' as const, reference: 'ref-live' }
assert.deepEqual(filterInvoices('live', 'ALL', [liveInvoice]), [liveInvoice])
assert.deepEqual(filterPayments('ref-live', 'ALL', [livePayment]), [livePayment])
assert.deepEqual(paginate(['a', 'b', 'c'], 1, 2), { items: ['a', 'b'], page: 1, pageCount: 2 })
assert.deepEqual(paginate(['a', 'b', 'c'], 2, 2), { items: ['c'], page: 2, pageCount: 2 })
assert.deepEqual(paginate([], 9, 2), { items: [], page: 1, pageCount: 1 })
import { currentMonthPayments } from './dashboard.ts'

const monthStats = currentMonthPayments([
  { date: '2026-11-02', amount: 100, status: 'SUCCESS' as const },
  { date: '2026-11-03', amount: 50, status: 'VOID' as const },
  { date: '2026-10-31', amount: 900, status: 'SUCCESS' as const },
], new Date('2026-11-18T00:00:00Z'))
console.assert(monthStats.count === 2 && monthStats.total === 100 && monthStats.average === 100)
console.log('dashboard checks passed')
