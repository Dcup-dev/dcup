'use client';
import Link from "next/link";
import { motion } from 'framer-motion';
import { CodeIcon, SparklesIcon, LightbulbIcon } from 'lucide-react';
import { HeroImage } from '../HeroImage/HeroImage';

const HeroHeader = () => {
  const fadeUp = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6 } }
  };

  return (
    <header className="relative min-h-screen flex items-center overflow-hidden">
      {/* Animated background elements */}
      <motion.div
        className="absolute inset-0 opacity-10"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 8, repeat: Infinity }}
      >
        <div className="absolute inset-0 bg-gradient-radial from-blue-500/20 to-transparent" />
      </motion.div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          {/* Animated Logo/Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8 flex items-center justify-center gap-2"
          >
            <motion.span
              animate={{ y: [-5, 5, -5] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
            >
              <SparklesIcon className="h-8 w-8 text-yellow-400" />
            </motion.span>

            <div className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent text-lg font-semibold">
              Dcup
            </div>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.1 } },
              hidden: {}
            }}
            className="text-5xl md:text-7xl font-bold text-primary mb-8"
          >
            {['Transform Documents', 'Into Perfect JSON'].map((text, i) => (
              <motion.span
                key={i}
                variants={fadeUp}
                className="block"
              >
                {text}
              </motion.span>
            ))}
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-fd-muted-foreground mb-12 max-w-3xl mx-auto"
          >
            Instantly convert PDFs, Docs, Sheets, and more to structured JSON with AI-powered precision.
            Define your schema, get perfect results - every time.
          </motion.p>

          {/* CTA and Animated Icons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="relative"
          >
            <div className="flex justify-center space-x-6 items-center">
              <Link href={"/login"} className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:scale-105 transition-transform shadow-xl flex gap-2" >

                Get Started
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                >
                  <LightbulbIcon className="h-8 w-8 text-yellow-500" />
                </motion.div>
              </Link>
              <div className="flex space-x-4">
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ repeat: Infinity, duration: 4 }}
                >
                  <CodeIcon className="h-8 w-8 text-blue-400" />
                </motion.div>


              </div>
            </div>
          </motion.div>

          {/* Animated Code Example */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col md:flex-row p-6 gap-6 flex-1"
          >
            <HeroImage />
          </motion.div>
        </div>
      </div>
    </header>
  );
};

export default HeroHeader;
