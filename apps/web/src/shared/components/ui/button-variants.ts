import { cva } from "class-variance-authority"

export const buttonVariants = cva(
  // Base
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-[12px] text-sm font-[300] tracking-[-0.2px] whitespace-nowrap transition-all outline-none select-none focus-visible:ring-2 focus-visible:ring-[#f59e0b]/50 focus-visible:border-[#f59e0b] active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Primary button
        default:
          "border border-[#141414] bg-gradient-to-b from-[#2a2a2a] to-[#141414] text-white shadow-[inset_0px_2px_0px_0px_rgba(255,255,255,0.15)] hover:brightness-110 dark:bg-gradient-to-b dark:from-[#ffffff] dark:to-[#eaeaec] dark:text-[#141414] dark:border-white dark:shadow-none",
        // Secondary button
        secondary:
          "border border-[#d97706] bg-gradient-to-b from-[#fbbf24] to-[#f59e0b] text-black shadow-[inset_0px_2px_0px_0px_rgba(255,255,255,0.3)] hover:brightness-110",
        // Outline button
        outline:
          "border border-black/10 bg-gradient-to-b from-gray-50 to-gray-200/70 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,1),0_1px_2px_rgba(0,0,0,0.05)] hover:brightness-95 dark:border-white/10 dark:bg-gradient-to-b dark:from-white/10 dark:to-transparent dark:text-white dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] dark:hover:from-white/15",
        // Glassy inverted button (Exactly outline style but inverted)
        glassyInverted:
          "border border-zinc-800 bg-gradient-to-b from-zinc-600 to-zinc-950 text-white shadow-[inset_0px_1px_1px_rgba(255,255,255,0.2),inset_0px_-1px_1px_rgba(0,0,0,0.5),0px_4px_8px_rgba(0,0,0,0.4)] hover:brightness-110 dark:border-white/20 dark:bg-gradient-to-b dark:from-white/90 dark:to-white/70 dark:text-black dark:shadow-[inset_0px_1px_1px_rgba(255,255,255,0.8),0px_4px_8px_rgba(0,0,0,0.1)] dark:backdrop-blur-md dark:hover:brightness-95",
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
