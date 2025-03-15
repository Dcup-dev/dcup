"use client"

import { TrendingUp } from "lucide-react"
import { Label, Pie, PieChart } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useMemo } from "react"



const chartConfig = {
  calls: {
    label: "API Calls",
  },
  retrievals: {
    label: "Retrievals",
    color: "#32a852",
  },
} satisfies ChartConfig

export function ApiUsageChart({ apiUsage }: { apiUsage: number }) {
  const apiData = useMemo(() => {
    // Ensure we always have at least a minimal value to display
    const safeValue = apiUsage === 0 ? 0.1 : apiUsage;

    return [{
      endpoint: "POST Retrievals",
      calls: safeValue,
      fill: apiUsage === 0 ? "transparent" : "#32a852"
    }];
  }, [apiUsage]);

  const totalCalls = useMemo(() => {
    return apiUsage; // Use original value for display
  }, [apiUsage]);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="items-center pb-0 px-6 pt-6">
        <CardTitle className="text-lg">API Usage Analytics</CardTitle>
        <CardDescription className="text-sm">
          Last 30 Days Performance
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0 px-6">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[200px] lg:max-h-[280px]"
        >
          <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            {apiUsage > 0 && (
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
            )}
            <Pie
              data={apiData}
              dataKey="calls"
              nameKey="endpoint"
              innerRadius={65}
              outerRadius={95}
              strokeWidth={3}
              stroke={apiUsage === 0 ? "transparent" : undefined}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalCalls.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground text-sm"
                        >
                          Total Calls
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        {apiUsage > 0 ? (
          <>
            <div className="flex items-center gap-2 font-medium text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4" />
              Increased by 22% this week
            </div>
            <div className="text-muted-foreground">
              Average latency: 142ms
            </div>
          </>
        ) : (
          <div className="text-center text-muted-foreground">
            No API calls recorded yet
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
