import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Database, FileText, Bolt, InfinityIcon } from "lucide-react"
import { Plans } from "@/lib/Plans"
import { SubscriptionDrawer } from "../SubscriptionDrawer/SubscriptionDrawer"

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
  const isOpenSource = plan === 'OS'
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
              {isOpenSource ? "Open Source" : `${plan.toLowerCase()} Plan`}
              <Badge variant={isFree ? 'secondary' : 'default'}>
                {isFree ? 'Current' : 'Active'}
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {isFree || isOpenSource ? 'Free forever' : `$${currentPlan.price}/month`}
            </p>
          </div>
          {!isFree && (
            <div className="flex items-center gap-1 text-sm bg-accent px-3 py-1 rounded-full">
              <InfinityIcon className="h-4 w-4" />
              {isOpenSource ? 'Unlimited' : 'Scalable'}
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
                  /{metric.total === Infinity ? '∞' : metric.total.toLocaleString()}
                </span>
              </span>
            </div>
            <Progress
              value={(metric.used / metric.total) * 100}
              className="h-2"
            />
          </div>
        ))}
      </CardContent>
      {!isOpenSource && <CardFooter className="border-t pt-4">
        <SubscriptionDrawer isFree={isFree} />
      </CardFooter>}
    </Card>
  )
}
