/** Shape every paged list endpoint returns alongside its items. */
export interface PageInfo {
  total: number;
  limit: number;
  offset: number;
}

/**
 * Offset of the next page, or undefined when the last page has been loaded
 * (the form TanStack Query's getNextPageParam expects).
 */
export function nextOffset(page: PageInfo, itemsOnPage: number): number | undefined {
  const next = page.offset + itemsOnPage;
  if (itemsOnPage === 0 || next >= page.total) return undefined;
  return next;
}

/** Flattens loaded pages into one list, dropping duplicates that shift in when new items are added mid-scroll. */
export function flattenPages<T extends { id: number }>(pages: T[][]): T[] {
  const seen = new Set<number>();
  const out: T[] = [];
  for (const page of pages) {
    for (const item of page) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        out.push(item);
      }
    }
  }
  return out;
}
