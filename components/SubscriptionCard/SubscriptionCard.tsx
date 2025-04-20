import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Zap, Database, FileText, Bolt, InfinityIcon } from "lucide-react"
import { Plans } from "@/lib/Plans"

export function SubscriptionCard({
  plan,
  usage
}: {
  plan: keyof typeof Plans
  usage: {
    connections: number
    pages: number
    retrievals: number
  }
}) {
  const currentPlan = Plans[plan]
  const isEnterprise = plan === 'ENTERPRISE'


  const isFree = plan === 'FREE'


  const metrics = [
    {
      icon: <Database className="h-4 w-4" />,
      label: "Connections",
      used: usage.connections,
      total: currentPlan.connections,
    },
    {
      icon: <FileText className="h-4 w-4" />,
      label: "Pages",
      used: usage.pages,
      total: currentPlan.pages,
    },
    {
      icon: <Bolt className="h-4 w-4" />,
      label: "Retrievals",
      used: usage.retrievals,
      total: currentPlan.retrievals,
    },
  ]

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg flex items-center gap-2 capitalize">
              {plan.toLowerCase()} Plan
              <Badge variant={isFree ? 'secondary' : 'default'}>
                {isFree ? 'Current' : 'Active'}
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {!isFree && `$${currentPlan.price}/month`}
              {isFree && 'Free forever'}
            </p>
          </div>
          {!isFree && (
            <div className="flex items-center gap-1 text-sm bg-accent px-3 py-1 rounded-full">
              <InfinityIcon className="h-4 w-4" />
              {isEnterprise ? 'Unlimited' : 'Scalable'}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                {metric.icon}
                <span>{metric.label}</span>
              </div>
              <span className="font-medium text-foreground">
                {metric.used.toLocaleString()}
                <span className="text-muted-foreground font-normal">
                  /{metric.total >= 1_000_000 ? '∞' : metric.total.toLocaleString()}
                </span>
              </span>
            </div>
            <Progress
              value={(metric.used / metric.total) * 100}
              className="h-2"
            // indicatorClassName={
            //   metric.used > metric.total ? 'bg-red-500' : 
            //   isFree ? 'bg-gray-400' : 'bg-primary'
            // }
            />
          </div>
        ))}
      </CardContent>

      <CardFooter className="border-t pt-4">
        <Button className="w-full" size="lg" variant={isFree ? 'default' : 'outline'}>
          {isFree ? (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Upgrade Plan
            </>
          ) : (
            'Manage Subscription'
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
