import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const toCssLength = (value?: number | string): string | undefined =>
  typeof value === 'number' ? `${value}px` : (value ?? undefined)
