import { LinkContext } from "@/context/LinksContext";
import { useContext } from "react";

export const useLinks=()=> {
    const context = useContext(LinkContext);

   if (!context) {
    throw new Error(
      "useLinks must be used within a LinksProvider",
    );
  }
  return context
}
