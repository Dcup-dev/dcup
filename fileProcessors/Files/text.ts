import { PageContent } from "@/fileProcessors";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export const processDirectText = async (content: string): Promise<PageContent[]> => {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 4096 * 2,
    chunkOverlap: Math.floor(4096 * 2 * 0.15),
    keepSeparator: true,
    separators: ["\n\n## ", "\n\n# ", "\n\n", "\n", ". ", "! ", "? ", " "],
  });

  const chunks = await splitter.splitText(content)
  return chunks.map(chunk => ({
    title: "TEXT",
    text: chunk,
    tables: []
  }));
};
