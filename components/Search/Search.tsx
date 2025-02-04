'use client'

import DefaultSearchDialog from "fumadocs-ui/components/dialog/search-default"
import { Input } from "../ui/input"
import { Search } from "lucide-react"
import { useState } from "react"
import { Button } from "../ui/button"

export const SearchBox = ({btnClass, boxClass}:{btnClass?:string, boxClass?:string}) => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className={`${btnClass}`}>
        <Button variant="outline" size="icon" onClick={() => setOpen(curr => !curr)}>
          <Search className="h-[1.2rem] w-[1.2rem] transition-all" />
        </Button>
      </div>

      {/* Input for large screens */}
      <div className={`${boxClass}`}>
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search..."
          className="w-full pl-8"
          onClick={() => setOpen(curr => !curr)}
        />
      </div>

      <DefaultSearchDialog open={open} onOpenChange={() => setOpen(curr => !curr)} />
    </>
  )
}
