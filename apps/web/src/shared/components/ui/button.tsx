import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/shared/lib/utils"

const buttonVariants = cva(
  // Base: cal.com style — 12px radius, semibold, clean transitions
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-[12px] border text-sm font-semibold whitespace-nowrap transition-all outline-none select-none focus-visible:ring-2 focus-visible:ring-[#f59e0b]/50 focus-visible:border-[#f59e0b] active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // cal.com primary: near-black button with white text, 141414 border, top highlight inset shadow
        default:
          "border-[#141414] bg-[#111827] text-white shadow-[inset_0px_2px_0px_0px_rgba(255,255,255,0.15)] hover:bg-[#1f2937] dark:bg-white dark:text-[#111827] dark:hover:bg-gray-100 dark:border-white",
        // cal.com secondary: amber brand color, black text, darker amber border, white inset
        secondary:
          "border-[#d97706] bg-[#f59e0b] text-black shadow-[inset_0px_2px_0px_0px_rgba(255,255,255,0.3)] hover:bg-[#d97706]",
        // cal.com outline: white background, gray border — like "Continue with Microsoft"
        outline:
          "border-[#e5e7eb] bg-white text-[#111827] shadow-sm hover:bg-[#f9fafb] dark:bg-[#2b2d31] dark:border-[rgba(255,255,255,0.1)] dark:text-[#dbdee1] dark:hover:bg-[#3f4147]",
        // Ghost: no border, subtle hover
        ghost:
          "border-transparent bg-transparent text-[#374151] hover:bg-[#f3f4f6] dark:text-[#dbdee1] dark:hover:bg-[#3f4147]",
        // Destructive: soft red
        destructive:
          "border-transparent bg-red-50 text-red-600 shadow-sm hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50",
        // Link
        link: "border-transparent bg-transparent text-[#f59e0b] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2.5",
        xs:     "h-7 px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm:     "h-9 px-3",
        lg:     "h-11 px-5 text-base",
        xl:     "h-12 px-6 text-base",
        icon:   "size-10",
        "icon-xs": "size-7 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
