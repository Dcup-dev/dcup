"use client"
import { FilterAction, FilterCondition, FilterGroup, filterReducer } from '@/hooks/use-query'
import { toast } from '@/hooks/use-toast'
import { createContext, useContext, ReactNode, useReducer, Dispatch, useState, SetStateAction, useTransition } from 'react'

type Options = {
  top_chunk: number,
  rerank?: boolean,
  min_score_threshold?: number
}
type Result = {
  id: string | number,
  document_name: string,
  page_number: number,
  chunk_number: number,
  title: string,
  summary: string,
  content: string
  type: string,
  metadata: string,
  score: number,
}

type QueryContextType = {
  filterDispatch: Dispatch<FilterAction>,
  setOptions: Dispatch<SetStateAction<Options>>,
  setQuery: Dispatch<SetStateAction<string>>,
  options: Options,
  filter: FilterGroup,
  results: Result[],
  pending: boolean,
  handleSearch: () => void,
}

const QueryContext = createContext<QueryContextType>({
  options: { top_chunk: 5 },
  filter: { clause: 'must', children: [] },
  pending: false,
  results: [],
  filterDispatch: () => { },
  setOptions: () => { },
  handleSearch: () => { },
  setQuery: () => { }
})

export function QueryProvider({ children }: { children: ReactNode }) {
  const [filter, filterDispatch] = useReducer(filterReducer, { clause: "must", children: [] });
  const [options, setOptions] = useState<Options>({ top_chunk: 5 })
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Result[]>([])
  const [pending, startTransition] = useTransition();

  const handleSearch = async () => {
    const cleanFilter = convertFilterToQdrantFormat(filter)

    startTransition(async () => {
      try {
        const response = await fetch('/api/retrievals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer Dcup_Client`
          },
          body: JSON.stringify({
            ...options,
            query: query,
            filter: cleanFilter
          })
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.message)
        setResults(data.scored_chunks)
      } catch (err: any) {
        toast({
          title: err.message,
          variant: "destructive",
        });
      }
    })
  }


  return (
    <QueryContext.Provider
      value={{
        filterDispatch,
        setOptions,
        handleSearch,
        setQuery,
        options,
        filter,
        results,
        pending
      }}
    >
      {children}
    </QueryContext.Provider>
  )
}

function convertFilterToQdrantFormat(filter: FilterGroup): any {
  // Function to convert a single condition
  const convertCondition = (condition: FilterCondition): any => {
    switch (condition.type) {
      case "match":
        // Transform the match field based on its kind
        const matchField = (() => {
          switch (condition.match.type) {
            case "value":
              return { value: condition.match.value };
            case "any":
              return { any: condition.match.values };
            case "except":
              return { except: condition.match.values };
            case "text":
              return { text: condition.match.text };
          }
        })();
        return { key: condition.key, match: matchField };
      case "range":
        return { key: condition.key, range: condition.range };
      case "geo_radius":
        return { key: condition.key, geo_radius: condition.geo_radius };
      default:
        throw new Error(`Unsupported condition type: ${condition}`);
    }
  };

  // Function to convert a group of conditions
  const convertGroup = (group: FilterGroup): any => {
    const result: any = {};
    result[group.clause] = group.children.map((child) => {
      if (child.type === "condition") {
        return convertCondition(child.condition);
      } else {
        return convertGroup(child.group);
      }
    });
    return result;
  };

  // Handle empty filters
  if (filter.children.length === 0) return undefined;

  // Return the converted filter
  return convertGroup(filter);
}

export const useQueryContext = () => useContext(QueryContext)
