import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Conditional class names with later Tailwind utilities winning. */
export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));
