/**
 * Date utility functions for consistent formatting across screens.
 */

export function toDisplayDate(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function toShortDate(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

export function isExpired(deadline) {
  if (!deadline) return false;
  return new Date(deadline).getTime() < Date.now();
}

export function daysUntil(deadline) {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
