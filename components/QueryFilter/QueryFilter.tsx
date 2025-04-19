"use client"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from '@/components/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Filter, ChevronDown } from 'lucide-react'
import { Checkbox } from "@/components/ui/checkbox"
import { useQueryContext } from '@/context/queryContext'
import FilterBuilder from './FilterBuilder'

export const QueryFilter = () => {
  const { setOptions, options } = useQueryContext()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filters
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-full p-4">
        <Tabs defaultValue="basic">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <div className="flex items-center gap-2">
              <Checkbox
                id="rerank"
                checked={options.rerank || false}
                onCheckedChange={(checked) => setOptions((ops) => ({ ...ops, rerank: checked as boolean }))}
              />
              <label htmlFor="rerank" className="text-sm">
                Re-ranking
              </label>
            </div>
            <div className="flex items-center justify-between  gap-2 pt-2">
              <label className="text-sm">Top Results:</label>
              <Input
                type="number"
                value={options.top_chunk}
                onChange={(e) => setOptions((ops) => ({ ...ops, top_chunk: Number(e.target.value) }))}
                className="w-20"
                min="1"
              />
            </div>

            <div className="flex items-center gap-2 justify-between pt-2">
              <label className="text-sm">Minimum Score Threshold: </label>
              <Input
                type="number"
                placeholder='min'
                value={options.min_score_threshold || 0}
                onChange={(e) => setOptions((ops) => ({ ...ops, min_score_threshold: Number(e.target.value) }))}
                className="w-20"
              />
            </div>
          </TabsContent>
          <TabsContent value="advanced">
            <FilterBuilder />
          </TabsContent>
        </Tabs>
      </DropdownMenuContent>
    </DropdownMenu>)
}
