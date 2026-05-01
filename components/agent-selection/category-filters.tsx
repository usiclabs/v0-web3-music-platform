"use client"

import { motion } from "framer-motion"

interface CategoryFiltersProps {
  categories: { id: string; label: string }[]
  selectedCategory: string
  onSelectCategory: (id: string) => void
}

export function CategoryFilters({ categories, selectedCategory, onSelectCategory }: CategoryFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2 md:gap-3 justify-center md:justify-start mb-8 md:mb-12">
      {categories.map((category) => (
        <motion.button
          key={category.id}
          onClick={() => onSelectCategory(category.id)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`relative px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-bold uppercase tracking-widest transition-all duration-300 rounded-lg border-2 ${
            selectedCategory === category.id
              ? "border-red-500 bg-red-500/20 text-white shadow-[0_0_15px_rgba(255,30,30,0.4)]"
              : "border-red-500/40 text-red-400 hover:border-red-500/60 hover:bg-red-500/10"
          }`}
        >
          {category.label}
          {selectedCategory === category.id && (
            <motion.div
              layoutId="underline"
              className="absolute inset-0 border-2 border-red-500 rounded-lg pointer-events-none"
              animate={{
                boxShadow: ["0 0 20px rgba(255,30,30,0.4)", "0 0 10px rgba(255,30,30,0.2)", "0 0 20px rgba(255,30,30,0.4)"],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            />
          )}
        </motion.button>
      ))}
    </div>
  )
}
