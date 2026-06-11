import { cn } from "@/lib/cn"

export function Hairline({ className }: { className?: string }) {
  return <hr className={cn("hairline", className)} aria-hidden="true" />
}

export function HairlineSolid({ className }: { className?: string }) {
  return <hr className={cn("hairline-solid", className)} aria-hidden="true" />
}
