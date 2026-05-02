import api from './api';

export const creatorService = {
  /**
   * Paginated public creator list.
   * @param {{ page?, limit?, sport?, search? }} params
   */
  async listCreators(params = {}) {
    const res = await api.get('/api/creators', { params });
    return res.data; // { data: Creator[], meta }
  },

  /** Get a creator profile by URL slug. */
  async getBySlug(slug) {
    const res = await api.get(`/api/creators/${slug}`);
    return res.data; // { creator, content }
  },

  /** Get a creator profile by numeric ID. */
  async getById(id) {
    const res = await api.get(`/api/creators/id/${id}`);
    return res.data; // { creator, content }
  },

  /**
   * Update own creator profile.
   * @param {number} id  Must match the authenticated creator.
   * @param {Partial<{ display_name, bio, sport, location, avatar_url, website_url, instagram_handle, tiktok_handle, youtube_handle }>} data
   */
  async updateProfile(id, data) {
    const res = await api.put(`/api/creators/${id}`, data);
    return res.data;
  },
};

export default creatorService;
