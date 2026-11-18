export const paginate = <T,>(items: T[], page: number, pageSize: number) => {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
  const currentPage = Math.max(1, Math.min(page, pageCount))
  return { items: items.slice((currentPage - 1) * pageSize, currentPage * pageSize), page: currentPage, pageCount }
}

export type Role = 'Marketing' | 'Accounting'

export const pageRoutes = [
  { label: 'Dashboard', path: '/dashboard', title: 'SpillBill | Dashboard' },
  { label: 'Pelanggan', path: '/pelanggan', title: 'SpillBill | Pelanggan' },
  { label: 'Produk', path: '/produk', title: 'SpillBill | Produk' },
  { label: 'Sales Order', path: '/sales-order', title: 'SpillBill | Sales Order' },
  { label: 'Invoice', path: '/invoice', title: 'SpillBill | Invoice' },
  { label: 'Pembayaran', path: '/pembayaran', title: 'SpillBill | Pembayaran' },
  { label: 'Riwayat Aktivitas', path: '/riwayat-aktivitas', title: 'SpillBill | Riwayat Aktivitas' },
] as const

export const isKnownPath = (path: string) => pageRoutes.some((page) => page.path === path)
export const pageForPath = (path: string) => pageRoutes.find((page) => page.path === path) ?? pageRoutes[0]
export const titleForPath = (path: string) => pageForPath(path).title
export const saveConfirmation = (entity: string) => `${entity} berhasil disimpan.`
export const productFormTitle = (editing: boolean) => editing ? 'Edit Produk' : 'Tambah Produk'
export const canCreateInvoice = (role: Role) => role === 'Accounting'
export const salesOrderActionLabel = (action: 'detail' | 'edit') => action === 'detail' ? 'Detail' : 'Edit'
export const invoiceActionLabels = ['Cetak', 'Detail', 'Edit', 'Hapus'] as const
export const invoiceActionDisabled = (action: 'detail' | 'edit' | 'delete', status: InvoiceStatus) => action !== 'detail' && status === 'PAID'
export const paymentActionLabels = ['Cetak', 'Edit', 'Hapus'] as const
export const paymentActionDisabled = (action: 'edit' | 'delete', status: PaymentStatus) => status === 'VOID'

export const currentMonthPayments = <T extends { date: string; status: PaymentStatus; amount: number }>(payments: T[], today = new Date()) => {
  const month = today.toISOString().slice(0, 7)
  const monthPayments = payments.filter(({ date }) => date.slice(0, 7) === month)
  const successful = monthPayments.filter(({ status }) => status === 'SUCCESS')
  const total = successful.reduce((sum, { amount }) => sum + amount, 0)
  return { count: monthPayments.length, total, average: successful.length ? Math.round(total / successful.length) : 0 }
}

export type SalesOrder = {
  number: string
  customer: string
  total: number
  status: 'DRAFT' | 'INVOICED' | 'CANCELLED'
}

export type SalesOrderRecord = Omit<SalesOrder, 'status'> & {
  id?: string
  date: string
  item: string
  remaining: number
  items?: { productId: string; quantity: number }[]
  status: 'DRAFT' | 'INVOICED' | 'CANCELLED'
}

export const salesOrderRecords: SalesOrderRecord[] = [
  { number: 'SO-2026-001', date: '26 Okt 2026', customer: 'CV Sinar Jaya', item: 'Pembuatan Website + Maintenance Bulanan', total: 2000000, remaining: 0, status: 'INVOICED' },
  { number: 'SO-2026-002', date: '26 Okt 2026', customer: 'CV Sinar Jaya', item: 'Pembuatan Website', total: 1500000, remaining: 1500000, status: 'DRAFT' },
  { number: 'SO-2026-003', date: '25 Okt 2026', customer: 'PT Rasa Nusantara', item: 'Maintenance Bulanan + Desain Logo', total: 1500000, remaining: 1500000, status: 'DRAFT' },
  { number: 'SO-2026-004', date: '24 Okt 2026', customer: 'Koperasi Maju Bersama', item: 'Desain Logo', total: 750000, remaining: 0, status: 'CANCELLED' },
  { number: 'SO-2026-005', date: '23 Okt 2026', customer: 'Koperasi Maju Bersama', item: 'Desain Logo', total: 750000, remaining: 750000, status: 'DRAFT' },
  { number: 'SO-2026-006', date: '22 Okt 2026', customer: 'CV Bumi Digital', item: 'Setup Server', total: 2000000, remaining: 0, status: 'INVOICED' },
  { number: 'SO-2026-007', date: '21 Okt 2026', customer: 'PT Rasa Nusantara', item: 'Maintenance Bulanan', total: 250000, remaining: 250000, status: 'DRAFT' },
]

export const filterSalesOrderRecords = (query: string, status: 'ALL' | SalesOrderRecord['status'] = 'ALL', records = salesOrderRecords) => {
  const normalized = query.trim().toLowerCase()
  return records.filter((order) => (status === 'ALL' || order.status === status) && `${order.number} ${order.customer}`.toLowerCase().includes(normalized))
}

export type ActivityAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'RECORD_PAYMENT' | 'VOID_PAYMENT' | 'ARCHIVE'

export type ActivityRecord = {
  id: string
  time: string
  actor: string
  actorName: string
  action: ActivityAction
  entity: string
  description: string
}

export const activityRecords: ActivityRecord[] = [
  { id: 'ACT-001', time: '26 Okt 2026 · 11:00', actor: 'admin.marketing', actorName: 'AS', action: 'CREATE', entity: 'SalesOrder · SO-2026-003', description: 'Sales Order dibuat untuk PT Rasa Nusantara' },
  { id: 'ACT-002', time: '26 Okt 2026 · 10:42', actor: 'admin.accounting', actorName: 'AF', action: 'CREATE', entity: 'Invoice · INV-2026-001', description: 'Invoice diterbitkan dari SO-2026-001' },
  { id: 'ACT-003', time: '26 Okt 2026 · 10:20', actor: 'admin.accounting', actorName: 'AF', action: 'RECORD_PAYMENT', entity: 'Payment · PAY-002', description: 'Pembayaran dicatat untuk INV-2026-001' },
  { id: 'ACT-004', time: '26 Okt 2026 · 09:50', actor: 'admin.accounting', actorName: 'AF', action: 'VOID_PAYMENT', entity: 'Payment · PAY-001', description: 'Pembayaran dibatalkan untuk INV-2026-001' },
  { id: 'ACT-005', time: '25 Okt 2026 · 16:15', actor: 'admin.marketing', actorName: 'AS', action: 'UPDATE', entity: 'Customer · CUS-001', description: 'Data pelanggan CV Sinar Jaya diperbarui' },
  { id: 'ACT-006', time: '25 Okt 2026 · 14:30', actor: 'admin.marketing', actorName: 'AS', action: 'CREATE', entity: 'Customer · CUS-005', description: 'Pelanggan baru CV Bumi Digital ditambahkan' },
  { id: 'ACT-007', time: '24 Okt 2026 · 13:10', actor: 'admin.marketing', actorName: 'AS', action: 'DELETE', entity: 'Product · PRD-004', description: 'Data produk Setup Server diarsipkan' },
  { id: 'ACT-008', time: '24 Okt 2026 · 09:05', actor: 'admin.accounting', actorName: 'AF', action: 'UPDATE', entity: 'Invoice · INV-2026-003', description: 'Status invoice diperbarui menjadi OVERDUE' },
]

export const filterActivityRecords = (query: string, actor = 'ALL', action: 'ALL' | ActivityAction = 'ALL', records = activityRecords) => {
  const normalized = query.trim().toLowerCase()
  return records.filter((record) => (actor === 'ALL' || record.actor === actor) && (action === 'ALL' || record.action === action) && `${record.actor} ${record.entity} ${record.description}`.toLowerCase().includes(normalized))
}

export type InvoiceStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE'

export type InvoiceRecord = {
  id?: string
  salesOrderId?: string
  number: string
  customer: string
  date: string
  dueDate: string
  total: number
  paid: number
  remaining: number
  status: InvoiceStatus
}

export const invoiceRecords: InvoiceRecord[] = [
  { number: 'INV-2026-001', customer: 'CV Sinar Jaya', date: '26 Okt 2026', dueDate: '02 Nov 2026', total: 2000000, paid: 1500000, remaining: 500000, status: 'PARTIALLY_PAID' },
  { number: 'INV-2026-002', customer: 'PT Rasa Nusantara', date: '24 Okt 2026', dueDate: '31 Okt 2026', total: 1500000, paid: 1500000, remaining: 0, status: 'PAID' },
  { number: 'INV-2026-003', customer: 'Koperasi Maju Bersama', date: '21 Okt 2026', dueDate: '24 Okt 2026', total: 750000, paid: 0, remaining: 750000, status: 'OVERDUE' },
  { number: 'INV-2026-004', customer: 'CV Bumi Digital', date: '20 Okt 2026', dueDate: '27 Okt 2026', total: 2000000, paid: 0, remaining: 2000000, status: 'UNPAID' },
  { number: 'INV-2026-005', customer: 'CV Sinar Jaya', date: '18 Okt 2026', dueDate: '25 Okt 2026', total: 250000, paid: 0, remaining: 250000, status: 'OVERDUE' },
  { number: 'INV-2026-006', customer: 'PT Rasa Nusantara', date: '15 Okt 2026', dueDate: '22 Okt 2026', total: 750000, paid: 500000, remaining: 250000, status: 'PARTIALLY_PAID' },
]

export const filterInvoices = (query: string, status: 'ALL' | InvoiceStatus = 'ALL', records = invoiceRecords) => {
  const normalized = query.trim().toLowerCase()
  return records.filter((invoice) => (status === 'ALL' || invoice.status === status) && `${invoice.number} ${invoice.customer}`.toLowerCase().includes(normalized))
}

export type PaymentMethod = 'BANK_TRANSFER' | 'EWALLET' | 'CASH' | 'OTHER'
export type PaymentStatus = 'SUCCESS' | 'VOID'

export type PaymentRecord = {
  id: string
  number?: string
  invoiceId?: string
  date: string
  invoice: string
  customer: string
  method: PaymentMethod
  amount: number
  status: PaymentStatus
  reference: string
}

export const paymentRecords: PaymentRecord[] = [
  { id: 'PAY-001', date: '26 Okt 2026', invoice: 'INV-2026-001', customer: 'CV Sinar Jaya', method: 'BANK_TRANSFER', amount: 1000000, status: 'SUCCESS', reference: 'TRX-BCA-001' },
  { id: 'PAY-002', date: '26 Okt 2026', invoice: 'INV-2026-001', customer: 'CV Sinar Jaya', method: 'BANK_TRANSFER', amount: 500000, status: 'SUCCESS', reference: 'TRX-BCA-002' },
  { id: 'PAY-003', date: '25 Okt 2026', invoice: 'INV-2026-003', customer: 'Koperasi Maju Bersama', method: 'CASH', amount: 750000, status: 'SUCCESS', reference: 'CASH-003' },
  { id: 'PAY-004', date: '24 Okt 2026', invoice: 'INV-2026-004', customer: 'CV Bumi Digital', method: 'EWALLET', amount: 500000, status: 'SUCCESS', reference: 'GOPAY-004' },
  { id: 'PAY-005', date: '22 Okt 2026', invoice: 'INV-2026-006', customer: 'PT Rasa Nusantara', method: 'BANK_TRANSFER', amount: 500000, status: 'VOID', reference: 'TRX-BNI-005' },
]

export const filterPayments = (query: string, method: 'ALL' | PaymentMethod = 'ALL', records = paymentRecords) => {
  const normalized = query.trim().toLowerCase()
  return records.filter((payment) => (method === 'ALL' || payment.method === method) && `${payment.id} ${payment.invoice} ${payment.customer} ${payment.reference}`.toLowerCase().includes(normalized))
}

export type Customer = {
  id: string
  name: string
  email: string
  phone: string
  orders: number
  billed: number
  outstanding: number
  status: 'Aktif' | 'Belum ada transaksi'
}

export const customers: Customer[] = [
  { id: 'CUS-001', name: 'CV Sinar Jaya', email: 'admin@sinarjaya.id', phone: '0812 3456 7890', orders: 3, billed: 6500000, outstanding: 2000000, status: 'Aktif' },
  { id: 'CUS-002', name: 'PT Rasa Nusantara', email: 'finance@rasanusantara.id', phone: '0813 2211 9087', orders: 2, billed: 4000000, outstanding: 1500000, status: 'Aktif' },
  { id: 'CUS-003', name: 'Koperasi Maju Bersama', email: 'koperasi.maju@mail.id', phone: '0821 7788 9900', orders: 1, billed: 750000, outstanding: 750000, status: 'Aktif' },
  { id: 'CUS-004', name: 'Toko Kopi Aroma', email: 'halo@kopiaroma.id', phone: '0857 1122 3344', orders: 0, billed: 0, outstanding: 0, status: 'Belum ada transaksi' },
  { id: 'CUS-005', name: 'CV Bumi Digital', email: 'hello@bumidigital.id', phone: '0819 4455 6677', orders: 0, billed: 0, outstanding: 0, status: 'Belum ada transaksi' },
]

export const filterCustomers = (query: string, list = customers) => {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return list
  return list.filter(({ name, email, phone }) => `${name} ${email} ${phone}`.toLowerCase().includes(normalized))
}

export type Product = {
  id: string
  name: string
  price: number
  active: boolean
  usedIn: number
}

export const products: Product[] = [
  { id: 'PRD-001', name: 'Pembuatan Website', price: 1500000, active: true, usedIn: 6 },
  { id: 'PRD-002', name: 'Maintenance Bulanan', price: 250000, active: true, usedIn: 8 },
  { id: 'PRD-003', name: 'Desain Logo', price: 750000, active: true, usedIn: 3 },
  { id: 'PRD-004', name: 'Setup Server', price: 2000000, active: false, usedIn: 1 },
]

export const filterProducts = (query: string, list = products) => {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return list
  return list.filter(({ name }) => name.toLowerCase().includes(normalized))
}

export const salesOrders: SalesOrder[] = [
  { number: 'SO-2026-002', customer: 'CV Sinar Jaya', total: 2000000, status: 'DRAFT' },
  { number: 'SO-2026-003', customer: 'PT Rasa Nusantara', total: 1500000, status: 'DRAFT' },
  { number: 'SO-2026-005', customer: 'Koperasi Maju Bersama', total: 750000, status: 'DRAFT' },
]

export const formatRupiah = (value: number) =>
  `Rp${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(value)}`

export const filterSalesOrders = (query: string, orders = salesOrders) => {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return orders
  return orders.filter(({ number, customer }) =>
    `${number} ${customer}`.toLowerCase().includes(normalized),
  )
}

if (import.meta.url.endsWith('dashboard.test.ts')) {
  console.assert(formatRupiah(1500000) === 'Rp1.500.000')
  console.assert(filterSalesOrders('sinar').length === 1)
  console.assert(filterSalesOrders('tidak ada').length === 0)
  console.assert(filterCustomers('kopi')[0]?.name === 'Toko Kopi Aroma')
  console.assert(filterProducts('logo')[0]?.price === 750000)
  console.assert(filterSalesOrderRecords('sinar', 'DRAFT')[0]?.number === 'SO-2026-002')
  console.assert(filterSalesOrderRecords('', 'INVOICED').every((order) => order.remaining === 0))
  console.assert(filterActivityRecords('pembayaran').length === 2)
  console.assert(filterActivityRecords('', 'admin.accounting', 'DELETE').length === 0)
  console.assert(filterInvoices('sinar', 'PARTIALLY_PAID')[0]?.remaining === 500000)
  console.assert(filterInvoices('', 'PAID').every((invoice) => invoice.remaining === 0))
  console.assert(filterPayments('sinar', 'BANK_TRANSFER').length === 2)
  console.assert(filterPayments('', 'CASH').every((payment) => payment.method === 'CASH'))
}
