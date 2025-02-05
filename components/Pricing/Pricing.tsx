import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Basic",
    price: 4.99,
    features: [
      "Up to 50 MB/month",
      "API access",
      "24-hour caching",
    ],
    link: process.env.STRIPE_BASIC_LINK as string,
  },
  {
    name: "Pro",
    price: 14.99,
    features: [
      "Up to 250 MB/month",
      "Increased API call limits",
      "Priority processing",
    ],
    link: process.env.STRIPE_PRO_LINK as string,
  },
  {
    name: "Business",
    price: 29,
    features: [
      "Up to 5 GB/month",
      "High API throughput",
      "Premium support",
    ],
    highlighted: true,
    link: process.env.STRIPE_BUSINESS_LINK as string,

  },
  {
    name: "Enterprise",
    price: 99,
    features: [
      "Custom quotas",
      "Dedicated resources",
      "24/7 support",
    ],
    link: process.env.STRIPE_ENTERPRISE_LINK as string,

  },
];

export function Pricing() {
  return (
    <section className="py-12 px-4 md:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold tracking-tight mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-muted-foreground text-lg">
            Start small, scale as you grow. No hidden fees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`p-6 relative ${plan.highlighted
                ? "border-2 border-primary shadow-xl"
                : "border border-gray-200"
                }`}
            >
              <div className="flex flex-col h-full">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline mb-4">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">{" "}/month</span>
                  </div>
                  <p className="text-muted-foreground text-sm mb-6">
                    {plan.name === "Enterprise"
                      ? "Custom high-volume processing"
                      : `For ${plan.name.toLowerCase()} teams and projects`}
                  </p>
                </div>

                <div className="flex-1 space-y-4">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  asChild
                  size="lg"
                  variant={plan.highlighted ? 'default' : 'outline'}
                  className={`mt-8 w-full`}
                >
                  <Link href={plan.link}>
                    {plan.name === "Enterprise" ? "Contact Sales" : "Get Started"}
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Need custom limits? Contact us for enterprise solutions.
        </p>
      </div>
    </section>
  );
}
