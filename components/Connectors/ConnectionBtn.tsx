"use client"

import { newConnection } from "@/actions/connctions/new"
import { Button } from "../ui/button"
import { useTransition } from "react";
import { EMPTY_FORM_STATE } from "@/lib/zodErrorHandle";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";


export const ConnectionBtn = ({ connection }: { connection: string }) => {
  const [isPending, startTransition] = useTransition();
  const handleConnection = () => {
    startTransition(async () => {
      const formData = new FormData();
      try {
        formData.set("connection", connection)
        const res = await newConnection(EMPTY_FORM_STATE, formData)

        if (res.status !== 'SUCCESS') {
          throw new Error(res.message)
        }
        window.location.href = res.message
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
    <Button data-test={`btn-${connection}`} className="w-full" size='lg' onClick={handleConnection} disabled={isPending} >
      {isPending && <Loader2 className="animate-spin" />}
      Connect
    </Button>
  )
}
