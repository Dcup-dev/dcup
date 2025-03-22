import { FileContent } from ".."
import { z } from "zod"

const directUploadMetadata = z.object({
  filesUrl: z.array(z.string()).optional(),
  links: z.array(z.string()).optional()
})
// todo:::
export const readDirectUploadFiles = async (connectionId: string, connectionMetadata: unknown,): Promise<FileContent[]> => {
  console.log({ connectionId })
  const { filesUrl, links } = directUploadMetadata.parse(connectionMetadata)
  if (filesUrl && filesUrl.length > 0) {
    console.log({ filesUrl })
  }
  console.log({ links })
  return []
}
