import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[#FF2A2A]/20 focus-visible:ring-2 cursor-pointer",
  {
    variants: {
      variant: {
        default: 'bg-[#FF2A2A] text-white hover:bg-[#FF3B3B]',
        destructive: 'bg-[#FF3B3B] text-white hover:bg-[#FF3B3B]/90',
        outline: 'border border-white/10 bg-transparent text-white hover:bg-white/5 hover:border-white/20',
        secondary: 'bg-white/5 text-white border border-white/5 hover:bg-white/10',
        ghost: 'text-white/60 hover:text-white hover:bg-white/5',
        link: 'text-[#FF2A2A] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-11 px-6',
        icon: 'size-9',
        'icon-sm': 'size-8',
        'icon-lg': 'size-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
