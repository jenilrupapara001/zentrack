import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind classes safely using clsx and tailwind-merge.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
