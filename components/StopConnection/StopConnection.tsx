"use client"
import { Button } from "../ui/button"
import { Pause } from "lucide-react"
import { useTransition } from "react"
import { toast } from "@/hooks/use-toast"
import { EMPTY_FORM_STATE } from "@/lib/zodErrorHandle"
import { ConnectionQuery } from "@/app/(protected)/connections/page"
import { stopProcessing } from "@/actions/connctions/stop"


export const StopConnection = ({ connection, status }: {
  connection: ConnectionQuery,
  status: "PROCESSING" | "FINISHED" | undefined
}) => {
  const [isPending, startTransition] = useTransition();

  const handleStopConnection = () => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("connectionId", connection.id)
        const res = await stopProcessing(EMPTY_FORM_STATE, formData)
        if (res.status !== 'SUCCESS') {
          throw new Error(res.message)
        }
        toast({
          title: res.message,
        });

      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description: error.message || "An unexpected error occurred.",
        });
      }
    })
  }

  return (
    <Button data-test={`stop-connection`} onClick={handleStopConnection} size='sm' variant={'ghost'} disabled={isPending || status === 'FINISHED' || (!status && !connection.isSyncing)}>
      <Pause/>
      Stop
    </Button>
  )
}
