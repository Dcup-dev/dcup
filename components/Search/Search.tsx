'use client'

import DefaultSearchDialog from "fumadocs-ui/components/dialog/search-default"
import { Input } from "../ui/input"
import { Search } from "lucide-react"
import { useState } from "react"

export const SearchBox = () => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search..."
          className="w-full pl-8"
          onClick={()=> setOpen(curr=> !curr)}
        />
      </div>
      <DefaultSearchDialog open={open} onOpenChange={() => setOpen(curr => !curr)} />
    </>
  )
}
