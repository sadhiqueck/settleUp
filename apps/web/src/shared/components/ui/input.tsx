import * as React from "react"

import { cn } from "@/shared/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Cal.com style input: white bg, light gray border, 8px radius, clean focus ring
        "h-10 w-full min-w-0 rounded-md border border-[#e5e7eb] bg-white px-3 py-2.5",
        "text-sm text-[#111827] outline-none transition-all",
        "placeholder:text-[#9ca3af]",
        // Focus: amber ring matching brand primary
        "focus-visible:border-[#f59e0b] focus-visible:ring-2 focus-visible:ring-[#f59e0b]/30",
        // File input
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        // States
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
        // Dark mode
        "dark:bg-[#1e1f22] dark:border-[rgba(255,255,255,0.08)] dark:text-[#dbdee1]",
        "dark:placeholder:text-[#4e5058]",
        "dark:focus-visible:border-[#f59e0b] dark:focus-visible:ring-[#f59e0b]/20",
        "dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/30",
        className
      )}
      {...props}
    />
  )
}

export { Input }
