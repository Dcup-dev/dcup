"use client"
import { motion } from "framer-motion"
import { Environments, initializePaddle, Paddle } from "@paddle/paddle-js";
import { ReactNode, createContext, useEffect, useMemo, useState } from "react";
import { SessionProvider } from "next-auth/react";
import { Plans } from "@/lib/Plans";
import { toast } from "@/hooks/use-toast";



type PaymentContextType = {
  paddlePay: (plan: keyof typeof Plans) => void;
};

export const PaymentContext = createContext<PaymentContextType | null>(null);

export const PaymentProvider = ({ children }: { children: ReactNode }) => {
  const [paddle, setPaddle] = useState<Paddle>();

  // Download and initialize Paddle instance from CDN
  useEffect(() => {
    const loadPaddleScript = async () => {
      if (typeof window === "undefined") return;
      return await initializePaddleInstance();
    };

    const initializePaddleInstance = async () => {
      try {
        const paddleInstance = await initializePaddle({
          environment: process.env.NEXT_PUBLIC_PADDLE_ENV as Environments,
          token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
        });
        setPaddle(paddleInstance);
      } catch (error) {
      toast({
          title: "[BUG]: ❌ Paddle initialization failed",
          variant: "destructive",
        });
      }
    };

    loadPaddleScript();
  }, []);

  const openBasicCheckout = () => {
    paddle?.Checkout.open({
      items: [
        {
          priceId: process.env.NEXT_PUBLIC_PADDLE_BASIC_PRICE_ID!,
          quantity: 1,
        },
      ],
      settings: {
        successUrl: process.env.NEXT_PUBLIC_PADDLE_SUCCESSURL!
      }
    });
  };

  const openProCheckout = () => {
    paddle?.Checkout.open({
      items: [
        {
          priceId: process.env.NEXT_PUBLIC_PADDLE_PRO_PRICE_ID!,
          quantity: 1,
        },
      ],
      settings: {
        successUrl: process.env.NEXT_PUBLIC_PADDLE_SUCCESSURL!
      }
    });
  };

  const openBusinessCheckout = () => {
    paddle?.Checkout.open({
      items: [
        {
          priceId: process.env.NEXT_PUBLIC_PADDLE_BUSINESS_PRICE_ID!,
          quantity: 1,
        },
      ],
      settings: {
        successUrl: process.env.NEXT_PUBLIC_PADDLE_SUCCESSURL!
      }
    });
  };

  const openEnterpriceCheckout = () => {
    paddle?.Checkout.open({
      items: [
        {
          priceId: process.env.NEXT_PUBLIC_PADDLE_ENTERPRISE_PRICE_ID!,
          quantity: 1,
        }
      ],
      settings: {
        successUrl: process.env.NEXT_PUBLIC_PADDLE_SUCCESSURL!
      }
    });
  };

  const paddlePay = (plan: keyof typeof Plans) => {
    switch (plan) {
      case 'BASIC':
        return openBasicCheckout()
      case "PRO":
        return openProCheckout()
      case "BUSINESS":
        return openBusinessCheckout()
      case "ENTERPRISE":
        return openEnterpriceCheckout()
      default:
        break;
    }
  }

  const contextValue = useMemo(
    () => ({
      paddlePay
    }),
    [paddle],
  );
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
        <SessionProvider>
          <PaymentContext.Provider value={contextValue}>
            {children}
          </PaymentContext.Provider>
        </SessionProvider>
        <motion.p
          variants={fadeUp}
          className="text-center text-sm text-fd-muted-foreground mt-12"
        >
          Need custom solutions? We offer enterprise-grade scaling and support.
        </motion.p>
      </div>
    </section>);
}
