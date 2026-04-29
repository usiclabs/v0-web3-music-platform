import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-white placeholder:text-white/30 selection:bg-[#FF2A2A] selection:text-white bg-[#0A0A0A]/80 border-white/10 h-10 w-full min-w-0 rounded-xl border px-4 py-2 text-base text-white transition-all duration-300 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-[#FF2A2A] focus-visible:ring-[#FF2A2A]/20 focus-visible:ring-[3px] focus-visible:bg-[#0A0A0A] focus-visible:shadow-[0_0_30px_rgba(255,42,42,0.15)]',
        'hover:border-white/20',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
