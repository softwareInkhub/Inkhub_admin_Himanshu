'use client'

import { useState, useEffect } from 'react'
import { Calculator, Plus, Minus, X, Divide, Equal, RotateCcw, Zap, TrendingUp, TrendingDown, Hash, Percent, Target } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CalculatorInterfaceProps {
  operation: string
  onOperationChange: (operation: string) => void
  customFormula: string
  onCustomFormulaChange: (formula: string) => void
  previewValue: number
  availableVariables: {
    sum: number
    count: number
    min: number
    max: number
    average: number
  }
}

export default function CalculatorInterface({
  operation,
  onOperationChange,
  customFormula,
  onCustomFormulaChange,
  previewValue,
  availableVariables
}: CalculatorInterfaceProps) {
  const [calculatorMode, setCalculatorMode] = useState<'basic' | 'advanced'>('basic')
  const [calculatorDisplay, setCalculatorDisplay] = useState('')
  const [calculatorHistory, setCalculatorHistory] = useState<string[]>([])
  const [showHistory, setShowHistory] = useState(false)

  const basicOperations = [
    { value: 'sum', label: 'Sum', icon: Plus, description: 'Add all values', color: 'from-green-500 to-green-600' },
    { value: 'average', label: 'Average', icon: Hash, description: 'Calculate mean value', color: 'from-blue-500 to-blue-600' },
    { value: 'min', label: 'Minimum', icon: TrendingDown, description: 'Find lowest value', color: 'from-orange-500 to-orange-600' },
    { value: 'max', label: 'Maximum', icon: TrendingUp, description: 'Find highest value', color: 'from-purple-500 to-purple-600' },
    { value: 'count', label: 'Count', icon: Target, description: 'Count selected items', color: 'from-indigo-500 to-indigo-600' },
    { value: 'percentage', label: 'Percentage', icon: Percent, description: 'Calculate percentage', color: 'from-pink-500 to-pink-600' },
    { value: 'difference', label: 'Difference', icon: Minus, description: 'Calculate difference', color: 'from-red-500 to-red-600' },
    { value: 'custom', label: 'Custom Formula', icon: Zap, description: 'Use custom calculation', color: 'from-yellow-500 to-yellow-600' }
  ]

  const calculatorButtons = [
    ['7', '8', '9', '/'],
    ['4', '5', '6', '*'],
    ['1', '2', '3', '-'],
    ['0', '.', '=', '+'],
    ['(', ')', 'C', '⌫']
  ]

  const variableButtons = [
    { label: 'SUM', value: 'sum', actualValue: availableVariables.sum },
    { label: 'COUNT', value: 'count', actualValue: availableVariables.count },
    { label: 'MIN', value: 'min', actualValue: availableVariables.min },
    { label: 'MAX', value: 'max', actualValue: availableVariables.max },
    { label: 'AVG', value: 'average', actualValue: availableVariables.average }
  ]

  const handleBasicOperationClick = (opValue: string) => {
    onOperationChange(opValue)
    if (opValue === 'custom') {
      setCalculatorMode('advanced')
    }
  }

  const handleCalculatorButtonClick = (button: string) => {
    if (button === 'C') {
      setCalculatorDisplay('')
    } else if (button === '⌫') {
      setCalculatorDisplay(prev => prev.slice(0, -1))
    } else if (button === '=') {
      try {
        const result = eval(calculatorDisplay)
        setCalculatorHistory(prev => [...prev, `${calculatorDisplay} = ${result}`])
        setCalculatorDisplay(result.toString())
        onCustomFormulaChange(calculatorDisplay)
      } catch (error) {
        setCalculatorDisplay('Error')
      }
    } else {
      setCalculatorDisplay(prev => prev + button)
    }
  }

  const handleVariableClick = (variable: string) => {
    setCalculatorDisplay(prev => prev + variable)
  }

  const handleHistoryClick = (historyItem: string) => {
    const formula = historyItem.split(' = ')[0]
    setCalculatorDisplay(formula)
    onCustomFormulaChange(formula)
  }

  useEffect(() => {
    if (operation === 'custom') {
      setCalculatorDisplay(customFormula)
    }
  }, [operation, customFormula])

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          <Calculator className="h-4 w-4 inline mr-2" />
          Calculation Operation
        </label>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCalculatorMode('basic')}
            className={cn(
              "px-3 py-1 text-sm rounded-md transition-colors",
              calculatorMode === 'basic'
                ? "bg-blue-100 text-blue-700 border border-blue-300"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            Basic
          </button>
          <button
            onClick={() => setCalculatorMode('advanced')}
            className={cn(
              "px-3 py-1 text-sm rounded-md transition-colors",
              calculatorMode === 'advanced'
                ? "bg-blue-100 text-blue-700 border border-blue-300"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            Advanced
          </button>
        </div>
      </div>

      {calculatorMode === 'basic' ? (
        /* Basic Operations Grid */
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {basicOperations.map(op => (
            <button
              key={op.value}
              onClick={() => handleBasicOperationClick(op.value)}
              className={cn(
                "p-4 border rounded-lg text-left transition-all duration-200 group hover:shadow-md",
                operation === op.value
                  ? "border-blue-500 bg-gradient-to-r bg-blue-50 text-blue-700 shadow-md"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              )}
            >
              <div className="flex items-center space-x-2 mb-2">
                <div className={cn(
                  "p-2 rounded-lg",
                  operation === op.value
                    ? "bg-blue-100"
                    : "bg-gray-100 group-hover:bg-gray-200"
                )}>
                  <op.icon className="h-4 w-4" />
                </div>
                <div className="font-medium text-sm">{op.label}</div>
              </div>
              <div className="text-xs text-gray-500">{op.description}</div>
            </button>
          ))}
        </div>
      ) : (
        /* Advanced Calculator */
        <div className="space-y-4">
          {/* Calculator Display */}
          <div className="bg-gray-900 text-white p-4 rounded-lg">
            <div className="text-right">
              <div className="text-sm text-gray-400 mb-1">Formula</div>
              <div className="text-lg font-mono break-all">{calculatorDisplay || '0'}</div>
              <div className="text-sm text-gray-400 mt-1">Result: {previewValue.toFixed(2)}</div>
            </div>
          </div>

          {/* Available Variables */}
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Available Variables</div>
            <div className="grid grid-cols-5 gap-2">
              {variableButtons.map(variable => (
                <button
                  key={variable.value}
                  onClick={() => handleVariableClick(variable.value)}
                  className="p-2 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors text-xs"
                >
                  <div className="font-medium">{variable.label}</div>
                  <div className="text-blue-600">{variable.actualValue.toFixed(2)}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Calculator Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {calculatorButtons.map((row, rowIndex) => (
              <div key={rowIndex} className="contents">
                {row.map((button, buttonIndex) => (
                  <button
                    key={buttonIndex}
                    onClick={() => handleCalculatorButtonClick(button)}
                    className={cn(
                      "p-3 text-lg font-mono rounded-lg transition-colors",
                      button === '=' || button === 'C' || button === '⌫'
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : button === '/' || button === '*' || button === '-' || button === '+'
                        ? "bg-orange-500 text-white hover:bg-orange-600"
                        : "bg-gray-100 hover:bg-gray-200"
                    )}
                  >
                    {button === '⌫' ? '←' : button}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* History */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-700">Calculation History</div>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {showHistory ? 'Hide' : 'Show'}
              </button>
            </div>
            {showHistory && calculatorHistory.length > 0 && (
              <div className="max-h-32 overflow-y-auto space-y-1">
                {calculatorHistory.slice(-5).reverse().map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleHistoryClick(item)}
                    className="w-full text-left p-2 text-sm bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Formulas */}
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Quick Formulas</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Sum + 10%', formula: 'sum * 1.1' },
                { label: 'Average per Item', formula: 'sum / count' },
                { label: 'Range', formula: 'max - min' },
                { label: 'Growth Rate', formula: '(max - min) / min * 100' }
              ].map((quick, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCalculatorDisplay(quick.formula)
                    onCustomFormulaChange(quick.formula)
                  }}
                  className="p-2 text-sm bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors"
                >
                  {quick.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Custom Formula Input (for basic mode) */}
      {calculatorMode === 'basic' && operation === 'custom' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Formula
          </label>
          <input
            type="text"
            value={customFormula}
            onChange={(e) => onCustomFormulaChange(e.target.value)}
            placeholder="e.g., sum * 1.1 or sum / count"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Available variables: sum, count, min, max, average
          </p>
        </div>
      )}
    </div>
  )
}

