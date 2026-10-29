import { timeAgo } from '../time';

const now = new Date('2026-10-29T12:00:00Z');

describe('timeAgo', () => {
  it.each([
    ['2026-10-29T11:59:30Z', 'now'],
    ['2026-10-29T11:55:00Z', '5m'],
    ['2026-10-29T09:00:00Z', '3h'],
    ['2026-10-27T12:00:00Z', '2d'],
  ])('%s → %s', (iso, expected) => {
    expect(timeAgo(iso, now)).toBe(expected);
  });

  it('falls back to a short date after a week', () => {
    expect(timeAgo('2026-10-12T12:00:00Z', now)).toMatch(/12 Oct/);
  });

  it('never shows negative times for clock skew', () => {
    expect(timeAgo('2026-10-29T12:00:30Z', now)).toBe('now');
  });
});
