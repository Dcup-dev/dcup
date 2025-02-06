"use client"
import { motion } from "framer-motion"

import { ReactNode } from "react"

export const PricingContainer = ({ children }: { children: ReactNode }) => {

  const fadeUp = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6 } }
  };
  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-900/20 to-transparent">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            visible: { transition: { staggerChildren: 0.1 } },
            hidden: {}
          }}
          className="text-center mb-16"
        >
          <motion.h2 variants={fadeUp} className="text-5xl text-primary font-bold mb-4">
            Simple Pricing for Every Scale
          </motion.h2>
          <motion.p variants={fadeUp} className="text-xl text-fd-muted-foreground max-w-2xl mx-auto">
            Start small, scale effortlessly. Transparent costs with no hidden fees.
          </motion.p>
        </motion.div>
        {children}
        <motion.p
          variants={fadeUp}
          className="text-center text-sm text-fd-muted-foreground mt-12"
        >
          Need custom solutions? We offer enterprise-grade scaling and support.
        </motion.p>
      </div>
    </section>);
}
