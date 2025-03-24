// import { publishProgress } from "@/events"
// import { FileContent } from ".."
// import { z } from "zod"
// import { processPdfLink } from "../Files/pdf"

// export const directUploadMetadata = z.object({
//   filesUrl: z.array(z.object({
//     url: z.string(),
//     name: z.string()
//   })),
//   links: z.array(z.string())
// })

// export const readDirectUploadFiles = async (connectionId: string, connectionMetadata: unknown): Promise<FileContent[]> => {
//   try {
//      // Create promises for processing file URLs
//   const filePromises = files.map(async (file) => {
//     const arrayBuffer = await file.arrayBuffer()
//     const content = await processPdfBuffer(Buffer.from(arrayBuffer));
//     return {
//       name: file.name || "",
//       pages: content,
//       metadata: metadata,
//     } as FileContent;
//   });

//   // Create promises for processing links
//   const linkPromises = links.map(async (link) => {
//     const content = await processPdfLink(link);
//     return {
//       name: link,
//       pages: content,
//       metadata: metadata,
//     } as FileContent;
//   });

//   const filesContent = await Promise.all([...filePromises, ...linkPromises]);  } catch (error: any) {
//     await publishProgress({
//       connectionId: connectionId,
//       fileName: "",
//       processedFile: 0,
//       processedPage: 0,
//       errorMessage: error.data,
//       lastAsync: new Date(),
//       isFinished: true,
//     })
//     return []
//   }
// }
