import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Compose className strings with clsx + tailwind-merge so that later
 * utilities win (`cn("p-2", "p-4")` → "p-4").
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
