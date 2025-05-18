import { PageContent } from "@/fileProcessors";

export const processPdfBuffer = async (fileContent: Blob): Promise<PageContent[]> => {
  const form = new FormData();
  form.set("upload", fileContent);
  const res = await fetch(process.env.DCUP_PARSER + "/process/pdf/file", {
    method: 'POST',
    body: form
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.detail)
  return body
};

export const processPdfLink = async (pdfUrl: string): Promise<PageContent[]> => {
  const form = new FormData();
  form.set("url", pdfUrl);
  const res = await fetch(process.env.DCUP_PARSER + "/process/pdf/url", {
    method: 'POST',
    body: form
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.detail)
  return body
};
