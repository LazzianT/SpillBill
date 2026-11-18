export const calculateSalesOrderTotals = (items: { productId: string; quantity: number }[], products: { id: string; price: number }[]) => {
  const subtotals = items.map(({ productId, quantity }) => {
    const price = products.find((product) => product.id === productId)?.price
    return price != null && Number.isFinite(quantity) && quantity > 0 ? price * quantity : 0
  })
  return { subtotals, total: subtotals.reduce((sum, subtotal) => sum + subtotal, 0) }
}
