import { FileContext } from "@/context/FilesContext";
import { useContext } from "react";



export const useFiles=()=> {
    const context = useContext(FileContext);
   if (!context) {
    throw new Error(
      "useFiles must be used within a FileProvider",
    );
  }
  return context
}
