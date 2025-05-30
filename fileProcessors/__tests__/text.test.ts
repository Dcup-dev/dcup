import { expect } from "@jest/globals";
import { PageContent } from "..";
import { CHARS_PER_PAGE, processDirectText } from "../Files/text";


describe('processDirectText', () => {
  it('should return an empty array for an empty string', async () => {
    const pages: PageContent[] = await processDirectText("");
    expect(pages).toHaveLength(0);
  });

  it('should return one page when text is shorter than CHARS_PER_PAGE', async () => {
    const sample = 'a'.repeat(CHARS_PER_PAGE - 1);
    const pages: PageContent[] = await processDirectText(sample);
    expect(pages).toHaveLength(1);
    expect(pages[0].text).toBe(sample);
  });

  it('should return one page when text length equals CHARS_PER_PAGE', async () => {
    const sample = 'b'.repeat(CHARS_PER_PAGE);
    const pages: PageContent[] = await processDirectText(sample);
    expect(pages).toHaveLength(1);
    expect(pages[0].text).toBe(sample);
  });

  it('should split into two pages when text length is CHARS_PER_PAGE + 1', async () => {
    const sample = 'c'.repeat(CHARS_PER_PAGE + 1);
    const pages: PageContent[] = await processDirectText(sample)
    expect(pages).toHaveLength(2);
    expect(pages[0].text).toBe('c'.repeat(CHARS_PER_PAGE));
    expect(pages[1].text).toBe('c');
  });

  it('should correctly split large text into multiple pages', async () => {
    const pageCount = 5;
    const sample = 'd'.repeat(CHARS_PER_PAGE * pageCount + Math.floor(CHARS_PER_PAGE / 2));
    const pages: PageContent[] = await processDirectText(sample)
    expect(pages).toHaveLength(pageCount + 1);
    for (let i = 0; i < pageCount; i++) {
      expect(pages[i].text).toBe('d'.repeat(CHARS_PER_PAGE));
    }
    expect(pages[pageCount].text).toBe('d'.repeat(Math.floor(CHARS_PER_PAGE / 2)));
  });

  it('should include newlines in the count and preserve them in chunks', async () => {
    const line = 'line\n';
    const sample = line.repeat(300); // 600 chars
    const pages: PageContent[] = await processDirectText(sample)
    expect(pages).toHaveLength(1);
    expect(pages[0].text).toBe(sample);
  });
});
