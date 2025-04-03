"use client"

import { createContext, useContext, ReactNode, useState, useCallback } from 'react'

type ConnectionContextType = {
  activeConnections: string[]
  queuedConnections: string[]
  addConnection: (id: string) => boolean
  removeConnection: (id: string) => void
}

const ConnectionContext = createContext<ConnectionContextType>({
  activeConnections: [],
  queuedConnections: [],
  addConnection: () => false,
  removeConnection: () => {}
})

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [activeConnections, setActiveConnections] = useState<string[]>([])
  const [queuedConnections, setQueuedConnections] = useState<string[]>([])

  const addConnection = useCallback((id: string) => {
    let added = false
    setActiveConnections(current => {
      if (current.length < 4 && !current.includes(id)) {
        added = true
        return [...current, id]
      }
      return current
    })
    
    if (!added) {
      setQueuedConnections(current => 
        !current.includes(id) ? [...current, id] : current
      )
    }
    
    return added
  }, [])

  const removeConnection = useCallback((id: string) => {
    setActiveConnections(current => current.filter(cId => cId !== id))
    setQueuedConnections(current => current.filter(cId => cId !== id))
    
    // Automatically activate next queued connection
    setQueuedConnections(current => {
      if (current.length > 0) {
        const [nextId, ...remaining] = current
        setActiveConnections(prev => [...prev, nextId])
        return remaining
      }
      return current
    })
  }, [])

  return (
    <ConnectionContext.Provider 
      value={{ activeConnections, queuedConnections, addConnection, removeConnection }}
    >
      {children}
    </ConnectionContext.Provider>
  )
}

export const useConnectionContext = () => useContext(ConnectionContext)
