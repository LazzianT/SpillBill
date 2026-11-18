export type SelectOption = { value: string; label: string }

export const filterSelectOptions = (options: SelectOption[], query: string): SelectOption[] => {
  const term = query.trim().toLocaleLowerCase()
  return term ? options.filter((option) => option.label.toLocaleLowerCase().includes(term)) : options
}
