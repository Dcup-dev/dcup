"use client"
import { useQueryContext } from "@/context/queryContext"
import { Button } from "../ui/button"
import { Loader2, Search } from "lucide-react"

export const QueryBtn = () => {
  const { handleSearch, pending } = useQueryContext()

  return (
    <Button onClick={handleSearch} disabled={pending}>
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Search className="mr-2 h-4 w-4" />
      )}
      Search
    </Button>
  )
}
