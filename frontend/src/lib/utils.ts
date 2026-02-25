import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format number as SGD currency string: "$1,234", "-$1,234", or "$1,234.56" */
export function formatCurrency(value: number, decimals = 0): string {
  const abs = Math.abs(value)
  const formatted = '$' + abs.toLocaleString('en-SG', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  return value < 0 ? '-' + formatted : formatted
}

/** Format number as percentage string: "4.00%" */
export function formatPercent(value: number, decimals = 2): string {
  return (value * 100).toFixed(decimals) + '%'
}

/** Clamp value between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** Round to a specified number of decimal places */
export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}
