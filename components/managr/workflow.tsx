"use client"

import { motion } from "framer-motion"

const steps = [
  {
    number: 1,
    title: "Create",
    description: "Artist starts with an idea, song, concept, or release goal.",
  },
  {
    number: 2,
    title: "Coordinate",
    description: "MANAGR assigns tasks to specialized music sub-agents.",
  },
  {
    number: 3,
    title: "Execute",
    description: "Agents help prepare creative, release, campaign, analytics, and royalty workflows.",
  },
  {
    number: 4,
    title: "Learn",
    description: "Performance data feeds back into the artist's agent stack.",
  },
  {
    number: 5,
    title: "Scale",
    description: "The system improves with each release, campaign, and fan interaction.",
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export function ManagRWorkflow() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-red-500/20">
      <motion.div
        className="max-w-6xl mx-auto"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
      >
        <div className="mb-16">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display leading-tight text-balance mb-8">
            FROM IDEA TO
            <br />
            <span className="text-red-500">RELEASE SYSTEM.</span>
          </h2>
        </div>

        {/* Desktop timeline - Horizontal */}
        <div className="hidden lg:block">
          <div className="relative">
            {/* Connection line */}
            <motion.div
              className="absolute top-12 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500/20 via-red-500/50 to-red-500/20"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2 }}
            />

            <div className="grid grid-cols-5 gap-4 relative z-10">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  className="text-center"
                  variants={itemVariants}
                  whileHover={{ y: -8 }}
                >
                  {/* Step circle */}
                  <motion.div
                    className="h-24 w-24 mx-auto mb-4 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center text-3xl font-bold font-display text-white border-2 border-red-500 shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all cursor-pointer group"
                    whileHover={{ scale: 1.1 }}
                  >
                    {step.number}
                    <div className="absolute inset-0 rounded-full bg-red-400/0 group-hover:bg-red-400/10 transition-all" />
                  </motion.div>

                  {/* Content */}
                  <h3 className="text-xl font-bold font-display text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-400">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile/Tablet timeline - Vertical */}
        <div className="lg:hidden space-y-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="relative pl-12 sm:pl-16"
              variants={itemVariants}
            >
              {/* Vertical line connector */}
              {index < steps.length - 1 && (
                <motion.div
                  className="absolute left-6 sm:left-8 top-20 w-0.5 h-12 bg-gradient-to-b from-red-500/50 to-red-500/20"
                  initial={{ scaleY: 0 }}
                  whileInView={{ scaleY: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                />
              )}

              {/* Step circle */}
              <motion.div
                className="absolute -left-2 sm:left-0 top-0 h-12 w-12 sm:h-14 sm:w-14 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center text-lg sm:text-xl font-bold font-display text-white border-2 border-red-500 shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all"
                whileHover={{ scale: 1.1 }}
              >
                {step.number}
              </motion.div>

              {/* Content */}
              <div className="glass-card border border-red-500/20 p-6 rounded-lg hover:border-red-500/50 transition-all">
                <h3 className="text-lg sm:text-xl font-bold font-display text-white mb-2">{step.title}</h3>
                <p className="text-sm sm:text-base text-gray-400">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
