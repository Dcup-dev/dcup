"use client"

import { Button } from "../ui/button"
import { RotateCcwIcon, Trash } from "lucide-react"
import { EMPTY_FORM_STATE } from "@/lib/zodErrorHandle"
import { toast } from "@/hooks/use-toast"
import { useFormStatus } from "react-dom"
import { deleteApiKey } from "@/actions/apiKeys"

export const DeleteKey = ({ apikey }: { apikey: string }) => {
  const { pending } = useFormStatus();

  return (<form
    action={async (form) => {
      try {
        form.append("apikey", apikey)
        const current = await deleteApiKey(EMPTY_FORM_STATE, form)
        if (current.status !== 'SUCCESS') {
          throw new Error(current.message)
        }
        toast({
          title: current.message
        });
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description: error.message || "An unexpected error occurred.",
        });
      }
    }}
  >
    <Button size="icon" variant="destructive" disabled={pending}>
      {pending ? <RotateCcwIcon className="animate-spin" /> : <Trash />}
    </Button>
  </form>
  )
}
