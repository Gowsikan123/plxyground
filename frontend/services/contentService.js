import api from './api';

export const contentService = {
  /**
   * Fetch paginated public feed.
   * @param {{ page?, limit?, sport?, search? }} params
   */
  async getFeed(params = {}) {
    const res = await api.get('/api/content', { params });
    return res.data; // { data: Post[], meta }
  },

  /** Fetch a single post by ID. */
  async getPost(id) {
    const res = await api.get(`/api/content/${id}`);
    return res.data;
  },

  /**
   * Create a new post (creator only).
   * @param {{ title, body, media_url?, media_type?, tags? }} data
   */
  async createPost(data) {
    const res = await api.post('/api/content', data);
    return res.data;
  },

  /**
   * Update an existing post (creator, own posts only).
   * @param {number} id
   * @param {Partial<{ title, body, media_url, media_type, tags }>} data
   */
  async updatePost(id, data) {
    const res = await api.put(`/api/content/${id}`, data);
    return res.data;
  },

  /** Soft-delete a post (creator, own posts only). */
  async deletePost(id) {
    const res = await api.delete(`/api/content/${id}`);
    return res.data;
  },
};

export default contentService;
