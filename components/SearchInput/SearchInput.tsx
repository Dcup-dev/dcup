"use client"

import { useQueryContext } from "@/context/queryContext"
import { Input } from "../ui/input"
import { Search } from "lucide-react"

export const SearchInput = () => {
  const { setQuery } = useQueryContext()

  return (<div className="flex-1 relative">
    <Input
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Enter your query..."
      className="pl-10 pr-4 py-2 text-lg"
    />
    <Search className="absolute left-3 top-2 h-5 w-5 text-muted-foreground" />
  </div>
  )
}
