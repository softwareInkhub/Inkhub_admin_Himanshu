export const calculateCustomValue = (
  card: {
    field: string
    operation: 'sum' | 'avg' | 'count' | 'min' | 'max'
    selectedProducts?: string[]
  },
  data: any[]
): number => {
  // Filter data based on selected products if specified
  const filteredData = card.selectedProducts && card.selectedProducts.length > 0
    ? data.filter(item => card.selectedProducts!.includes(item.id))
    : data

  // Extract values for the specified field
  const values = filteredData
    .map(item => {
      const value = item[card.field]
      return typeof value === 'number' ? value : 0
    })
    .filter(value => !isNaN(value))

  const sum = values.reduce((acc, val) => acc + val, 0)
  const count = values.length
  const min = values.length > 0 ? Math.min(...values) : 0
  const max = values.length > 0 ? Math.max(...values) : 0
  const average = count > 0 ? sum / count : 0

  switch (card.operation) {
    case 'sum':
      return sum
    case 'avg':
      return average
    case 'count':
      return count
    case 'min':
      return min
    case 'max':
      return max
    default:
      return 0
  }
}

export const formatCardValue = (value: number, operation: string, field?: string): string => {
  const isCurrency = field && (field.includes('price') || field.includes('cost') || field.includes('value') || field.includes('total'))
  
  if (isCurrency) {
    return `$${value.toFixed(2)}`
  }
  
  if (operation === 'count') {
    return value.toLocaleString()
  }
  
  // For other operations, format with appropriate decimal places
  if (value % 1 === 0) {
    return value.toLocaleString()
  } else {
    return value.toFixed(2)
  }
}
