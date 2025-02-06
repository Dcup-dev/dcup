'use client';

import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlayCircle, SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const HowItWorks = () => {
  const steps = [
    {
      title: "1. Define Your Schema",
      description: "Create your JSON structure using our visual builder or raw JSON",
      icon: "🛠️"
    },
    {
      title: "2. Upload Documents",
      description: "Drag & drop files or provide URLs - we support 15+ formats",
      icon: "📤"
    },
    {
      title: "3. Get Perfect JSON",
      description: "Instantly receive clean, validated data exactly how you need it",
      icon: "🎯"
    }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            How It Works in 30 Seconds
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Transform documents to structured JSON faster than making coffee
          </p>
        </motion.div>

        {/* Content Grid */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Steps Cards */}
          <div className="space-y-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <Card className="bg-gray-800/50 border-gray-700 hover:border-blue-500 transition-colors">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{step.icon}</span>
                      <div>
                        <CardTitle className="text-white text-xl">
                          {step.title}
                        </CardTitle>
                        <CardDescription className="text-gray-300 mt-2">
                          {step.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Video Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            className="relative group"
          >
            <div className="relative aspect-video bg-gray-800 rounded-xl overflow-hidden border-2 border-gray-700 hover:border-blue-500 transition-all shadow-2xl">
              {/* Video Iframe - Replace with your actual video embed code */}
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/your-video-id"
                title="Dcup Demo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>

              {/* Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
                <PlayCircle className="h-16 w-16 text-white opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-transform" />
              </div>
            </div>

            {/* Animated Border Effect */}
            <div className="absolute inset-0 rounded-xl border-2 border-blue-500/30 pointer-events-none -z-10 group-hover:animate-glow transition-all" />
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mt-16"
        >
          <Button className="text-lg h-14 px-8 rounded-xl gap-2">
            Start Free Trial
            <SparklesIcon className="h-5 w-5" />
          </Button>
          <p className="text-gray-400 mt-4">
            No credit card needed •
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
