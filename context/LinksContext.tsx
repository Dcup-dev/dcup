"use client"
import { ReactNode, createContext, useCallback, useMemo, useState } from "react";



type LinkContextType = {
  links: string[];
  addLinks: (links: string[]) => void;
};

export const LinkContext = createContext<LinkContextType | null>(null);

export const LinkProvider = ({ children }: { children: ReactNode }) => {
  const [links, setLinks] = useState<string[]>([]);

  const addLinks = useCallback((ls: string[]) => {
    setLinks(ls)
  }, [])


  const contextValue = useMemo(
    () => ({
      links, addLinks, 
    }),
    [links],
  );

  return <LinkContext.Provider value={contextValue}>
    {children}
  </LinkContext.Provider>
}
