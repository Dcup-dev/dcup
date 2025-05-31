import { PageContent } from "@/fileProcessors";
export const CHARS_PER_PAGE = 2000;

export const processDirectText = (content: string): PageContent[] => {
  const regex = new RegExp(`.{1,${CHARS_PER_PAGE}}`, 'gs');
  const rawPages = content.match(regex) || [];

  return rawPages.map(chunk => ({
    title: "TEXT",
    text: chunk,
    tables: []
  }));
};
