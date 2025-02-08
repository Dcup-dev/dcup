import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Zap, Rocket, Server, Settings2 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { PricingContainer } from "./Pricing_container";



const plans = [
  {
    name: "Basic",
    price: 4.99,
    features: [
      "Up to 50 MB/month",
      "API access",
      "24-hour caching",
    ],
    icon: Zap,
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
    icon: Rocket,
    popular: true,
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
    icon: Server,
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
    icon: Settings2,
    link: process.env.STRIPE_ENTERPRISE_LINK as string,

  },
];

export function Pricing({isAuth}:{isAuth:boolean}) {

  return (
    <PricingContainer>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <Card key={plan.name} className="h-full border border-gray-800 dark:bg-gray-900/50 bg-primary backdrop-blur-sm relative overflow-hidden">
            {plan.popular && (
              <Badge className="absolute top-4 right-[-4.5rem] rotate-45 w-48 text-start bg-blue-500 hover:bg-blue-500">
                {"Most Popular Most Popular "}
              </Badge>
            )}

            <CardHeader className="pb-0">
              <div className="mb-6 flex items-center gap-3">
                <plan.icon className="w-8 h-8 text-blue-400" />
                <CardTitle className="text-2xl font-bold text-white">
                  {plan.name}
                </CardTitle>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  ${plan.price}
                </span>
                <span className="text-gray-400">/month</span>
              </div>
            </CardHeader>

            <CardContent className="py-6">
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-gray-300"
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="text-left">
                          {feature}
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[250px] bg-gray-900 border-gray-800">
                          <p className="text-sm">{feature}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter>
              <Button
                size="lg"
                className={`w-full ${plan.popular
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                  : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                asChild
              >
                <Link href={isAuth? plan.link : "/login"}>
                  {plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </PricingContainer>
  );
}

