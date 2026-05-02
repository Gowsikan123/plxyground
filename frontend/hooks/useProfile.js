import { useState, useCallback } from 'react';
import { creatorService } from '../services/creatorService';

/**
 * useProfile — fetch a creator profile by slug or id,
 * with optimistic follow/unfollow support.
 */
export function useProfile(slugOrId) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);

  const fetchProfile = useCallback(async () => {
    if (!slugOrId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await creatorService.getBySlug(slugOrId);
      if (err) throw new Error(err);
      setProfile(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [slugOrId]);

  const toggleFollow = useCallback(async (isFollowing) => {
    if (!profile) return;
    // Optimistic update
    setProfile((prev) => ({
      ...prev,
      is_following: !isFollowing,
      followers: isFollowing ? prev.followers - 1 : prev.followers + 1,
    }));
    try {
      if (isFollowing) {
        await creatorService.unfollow(profile.id);
      } else {
        await creatorService.follow(profile.id);
      }
    } catch (e) {
      // Rollback on error
      setProfile((prev) => ({
        ...prev,
        is_following: isFollowing,
        followers: isFollowing ? prev.followers + 1 : prev.followers - 1,
      }));
      setError(e.message);
    }
  }, [profile]);

  return { profile, loading, error, fetchProfile, toggleFollow };
}
