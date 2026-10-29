import { flattenPages, nextOffset } from '../paging';

describe('nextOffset', () => {
  it('moves on by the number of items received', () => {
    expect(nextOffset({ total: 50, limit: 20, offset: 0 }, 20)).toBe(20);
    expect(nextOffset({ total: 50, limit: 20, offset: 20 }, 20)).toBe(40);
  });

  it('stops at the end of the list', () => {
    expect(nextOffset({ total: 50, limit: 20, offset: 40 }, 10)).toBeUndefined();
    expect(nextOffset({ total: 20, limit: 20, offset: 0 }, 20)).toBeUndefined();
  });

  it('stops on an empty page so a shrinking list cannot loop forever', () => {
    expect(nextOffset({ total: 99, limit: 20, offset: 60 }, 0)).toBeUndefined();
  });
});

describe('flattenPages', () => {
  it('keeps order and drops repeats across pages', () => {
    const pages = [[{ id: 3 }, { id: 2 }], [{ id: 2 }, { id: 1 }]];
    expect(flattenPages(pages).map((p) => p.id)).toEqual([3, 2, 1]);
  });
});
