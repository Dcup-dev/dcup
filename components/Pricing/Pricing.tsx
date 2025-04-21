'use client'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Zap, Rocket, Server, Settings2 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useSession } from "next-auth/react"
import { notFound, useRouter } from "next/navigation"
import { Plans } from "@/lib/Plans"
import { usePay } from "@/hooks/use-pay"


type Plan = {
  name: keyof typeof Plans,
  price: number,
  features: string[],
  icon: any
  popular?: boolean,
}

const plans: Plan[] = [
  {
    name: 'BASIC',
    price: Plans['BASIC'].price,
    features: [
      `${Plans.BASIC.connections} Connections`,
      `${Plans.BASIC.pages} Pages`,
      `${Plans.BASIC.retrievals} Retrievals`,
    ],
    icon: Zap,

  },
  {
    name: 'PRO',
    price: Plans['PRO'].price,
    features: [
      'Unlimited Connections',
      `${Plans.PRO.pages} Pages`,
      `${Plans.PRO.retrievals} Retrievals`,

    ],
    icon: Rocket,
    popular: true,
  },
  {
    name: 'BUSINESS',
    price: Plans['BUSINESS'].price,
    features: [
      'Unlimited Connections',
      `${Plans.BUSINESS.pages.toLocaleString()} Pages`,
      `${Plans.BUSINESS.retrievals.toLocaleString()} Retrievals`,
    ],
    icon: Server,

  },
  {
    name: 'ENTERPRISE',
    price: Plans['ENTERPRISE'].price,
    features: [
      'Unlimited Connections',
      `${Plans.ENTERPRISE.pages.toLocaleString()} Pages`,
      'Unlimited Retrievals',
    ],
    icon: Settings2,
  },
];


export const PricingDetails = () => {
  const { paddlePay } = usePay()
  const route = useRouter()
  const { status } = useSession()

  const handlePayment = (plan: keyof typeof Plans) => {
    if (status !== 'authenticated') return route.push("/login")
    if (!process.env.NEXT_PUBLIC_PAYMENT) return notFound()

    return paddlePay(plan)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 py-2">
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
              onClick={() => handlePayment(plan.name)}
            >
              Get Started
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
