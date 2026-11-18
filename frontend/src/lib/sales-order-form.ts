export const removeOrderItem = <T,>(items: T[], index: number): T[] =>
  items.length <= 1 || index < 0 || index >= items.length
    ? items
    : items.filter((_, itemIndex) => itemIndex !== index)
