import api from './api';

export const businessService = {
  /**
   * Business me — own profile.
   */
  async getMe() {
    const res = await api.get('/api/business/auth/me');
    return res.data;
  },

  /**
   * Update business account details.
   * @param {Partial<{ company_name, industry, location, bio, website_url, logo_url }>} data
   */
  async updateAccount(data) {
    const res = await api.patch('/api/business/auth/me', data);
    return res.data;
  },

  /**
   * Fetch own business content.
   * @param {{ page?, limit? }} params
   */
  async getMyContent(params = {}) {
    const res = await api.get('/api/business/content', { params });
    return res.data;
  },

  /**
   * Create business content post.
   * @param {{ title, body, media_url?, media_type? }} data
   */
  async createContent(data) {
    const res = await api.post('/api/business/content', data);
    return res.data;
  },

  /**
   * Delete business content.
   * @param {number} id
   */
  async deleteContent(id) {
    const res = await api.delete(`/api/business/content/${id}`);
    return res.data;
  },

  /**
   * Fetch own business opportunities.
   * @param {{ page?, limit? }} params
   */
  async getMyOpportunities(params = {}) {
    const res = await api.get('/api/opportunities', { params: { ...params, type: 'business' } });
    return res.data;
  },
};

export default businessService;
