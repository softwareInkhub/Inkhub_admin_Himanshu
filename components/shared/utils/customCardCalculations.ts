export function calculateCustomValue(
  values: number[],
  operation: string,
  customFormula?: string,
  totalItemsCount?: number
): number {
  const nums = values.filter(v => typeof v === 'number' && !isNaN(v))
  const sum = nums.reduce((a, b) => a + b, 0)
  const count = nums.length
  const min = count > 0 ? Math.min(...nums) : 0
  const max = count > 0 ? Math.max(...nums) : 0
  const avg = count > 0 ? sum / count : 0

  const op = String(operation || '').toLowerCase()
  switch (op) {
    case 'sum':
      return sum
    case 'avg':
    case 'average':
    case 'mean':
      return avg
    case 'min':
      return min
    case 'max':
      return max
    case 'count':
      return count
    case 'percentage':
      return totalItemsCount && totalItemsCount > 0 ? (count / totalItemsCount) * 100 : 0
    case 'difference':
      return max - min
    case 'custom': {
      if (!customFormula) return 0
      try {
        const safe = customFormula
          .replace(/sum/g, String(sum))
          .replace(/count/g, String(count))
          .replace(/min/g, String(min))
          .replace(/max/g, String(max))
          .replace(/average|avg|mean/g, String(avg))
        const sanitized = safe.replace(/[^0-9+\-*/().\s]/g, '')
        // eslint-disable-next-line no-eval
        return eval(sanitized) || 0
      } catch {
        return 0
      }
    }
    default:
      return 0
  }
}

export function formatCardValue(value: number, field: string): string {
  const f = String(field || '').toLowerCase()
  const isCurrency = (
    f.includes('total') ||
    f.includes('price') ||
    f.includes('value') ||
    f.includes('amount') ||
    f.includes('cost')
  )

  const rounded = Math.round((value + Number.EPSILON) * 100) / 100

  if (isCurrency) {
    if (rounded >= 1_000_000) return `₹${(rounded / 1_000_000).toFixed(1)}M`
    if (rounded >= 1_000) return `₹${(rounded / 1_000).toFixed(1)}K`
    return `₹${Math.round(rounded).toLocaleString()}`
  }

  if (rounded >= 1_000_000) return `${(rounded / 1_000_000).toFixed(1)}M`
  if (rounded >= 1_000) return `${(rounded / 1_000).toFixed(1)}K`
  return String(Math.round(rounded))
}




