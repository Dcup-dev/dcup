'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'

import {
  Search,
  FileText,
  Folder,
  Sheet,
  Box,
} from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { useQueryContext } from "@/context/queryContext"
import { Skeleton } from '../ui/skeleton'

export const QueryResults = () => {
  const { results, pending } = useQueryContext()

  if (pending) {
    return (
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="mb-4 animate-pulse">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <Skeleton className="h-6 w-[300px]" />
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-[150px]" />
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-4 w-[120px]" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-[100px]" />
                  <Skeleton className="h-2 w-32" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-[200px]" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[90%]" />
                <Skeleton className="h-4 w-[80%]" />
              </div>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-6 w-24" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 text-center">
        <div className="bg-muted/50 p-6 rounded-full">
          <Search className="h-16 w-16 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-semibold tracking-tight">
            {results.length === 0 && !pending ?
              "No results found" :
              "Start your search"}
          </h3>
          <p className="text-muted-foreground">
            {results.length === 0 && !pending ?
              "Try different keywords or adjust your filters" :
              "Enter a query above to search through your documents"}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {results.map((result) => (
        <Card key={result.id} className="mb-4 group hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span>
                    {result.title || "Untitled Document"}
                  </span>
                  <Badge variant="secondary" className="text-sm">
                    {result.type}
                  </Badge>
                </CardTitle>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Folder className="h-4 w-4" />
                    <span className="font-medium">{result.document_name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Sheet className="h-4 w-4" />
                    <span>Page {result.page_number}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Box className="h-4 w-4" />
                    <span>Chunk {result.chunk_number ?? 0}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="secondary" className="h-8 px-4">
                      {(result.score * 100).toFixed(1)}%
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Relevance score</p>
                  </TooltipContent>
                </Tooltip>
                <Progress value={result.score * 100} className="w-32 h-2" />
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {result.summary && (
              <div className="bg-muted/50 rounded-lg p-4 not-italic">
                <Label className="text-sm font-medium block mb-2">Summary</Label>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {result.summary}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {result.type === "text" ?(
                <p className="text-muted-foreground">
                  {result.content}
                </p>): (<TableResults content={result.content}  />)}
              </div>
            </div>

            {result.metadata && Object.keys(result.metadata).length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Metadata</Label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(result.metadata).map(([key, value]) => (
                    <Tooltip key={key}>
                      <TooltipTrigger>
                        <Badge
                          variant="outline"
                          className="px-3 py-1 text-xs font-mono max-w-[200px] truncate"
                        >
                          <span className="text-primary">{key}:</span>
                          <span className="ml-1 text-muted-foreground truncate">
                            {typeof value === 'object' ?
                              JSON.stringify(value) :
                              value.toString()}
                          </span>
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-[400px]">
                        <pre className="whitespace-pre-wrap break-words text-xs">
                          {JSON.stringify(value, null, 2)}
                        </pre>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

interface ParsedTable {
  number: number
  headers: string[]
  rows: (string | null)[][]
}

export const TableResults = ({ content }: { content: string }) => {

  // Split by delimiter before each _Table_n:
  const parts = content.split(/ (?=_Table_\d+:)/g)
  const tables: ParsedTable[] = []

  parts.forEach(part => {
    // Match "_Table_{number}: [ ... ]"
    const match = part.match(/^_Table_(\d+):\s*(\[.*\])$/s)
    if (!match) return

    const [, numStr, dataStr] = match
    try {
      // Parse the JSON array-of-arrays data
      const data: (string | null)[][] = JSON.parse(dataStr)
      const headers = data[0] as string[]
      const rows = data.slice(1)
      tables.push({ number: parseInt(numStr, 10), headers, rows })
    } catch (error) {
      console.error(`Failed to parse table #${numStr}:`, error)
    }
  })


  return (
    <div className="space-y-6">
      {tables.map((table, index) => !table  ? <p key={index}>{content}</p>:(
        <Card key={index} className="overflow-hidden">
          <CardHeader className="bg-muted/50 px-6 py-3">
            <CardTitle className="text-sm font-medium">
              Table {table.number}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-0">
            <Table className="border-collapse w-full">
              <TableHeader className="bg-muted/50">
                <TableRow>
                  {table.headers.map((header, colIndex) => (
                    <TableHead 
                      key={colIndex}
                      className="border-r px-4 py-2 text-left font-medium last:border-r-0"
                    >
                      {header || ' '}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              
              <TableBody>
                {table.rows.map((row, rowIndex) => (
                  <TableRow 
                    key={rowIndex}
                    className={rowIndex % 2 === 0 ? 'bg-background' : 'bg-muted/10'}
                  >
                    {row.map((cell, cellIndex) => (
                      <TableCell
                        key={cellIndex}
                        className="border-r px-4 py-2 last:border-r-0"
                      >
                        {cell ?? '—'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
