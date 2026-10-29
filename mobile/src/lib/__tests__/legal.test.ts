import { legalDocs } from '../legal';

describe('legal docs', () => {
  it.each(Object.entries(legalDocs))('%s has a title, date and non-empty sections', (_key, doc) => {
    expect(doc.title).toBeTruthy();
    expect(doc.updated).toMatch(/\d{4}$/);
    expect(doc.sections.length).toBeGreaterThan(2);
    for (const section of doc.sections) {
      expect(section.heading).toBeTruthy();
      expect(section.paragraphs.length).toBeGreaterThan(0);
    }
  });

  it('privacy notice explains in-app deletion', () => {
    const text = JSON.stringify(legalDocs.privacy);
    expect(text).toMatch(/delete your account/i);
  });
});
