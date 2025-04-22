import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { PaymentProvider } from "@/context/PaymentContext"
import { PricingDetails } from "../Pricing/Pricing"
import { Zap } from "lucide-react"


export function SubscriptionDrawer({ isFree }: { isFree: boolean }) {
  return (
    <Drawer>
      <DrawerTrigger asChild>
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
      </DrawerTrigger>
      <DrawerContent className="p-5" >
        <DrawerHeader>
          <DrawerTitle></DrawerTitle>
        </DrawerHeader>
        <PaymentProvider>
          <PricingDetails />
        </PaymentProvider>
      </DrawerContent>
    </Drawer>
  )
}
