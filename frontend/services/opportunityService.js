import api from './api';

export const opportunityService = {
  /**
   * Paginated public opportunities.
   * @param {{ page?, limit?, sport?, type? }} params
   */
  async listOpportunities(params = {}) {
    const res = await api.get('/api/opportunities', { params });
    return res.data; // { data: Opportunity[], meta }
  },

  /** Single opportunity by ID. */
  async getOpportunity(id) {
    const res = await api.get(`/api/opportunities/${id}`);
    return res.data;
  },

  /**
   * Create a new opportunity (creator or business).
   * @param {{ title, description, sport?, location?, budget?, deadline?, role_type? }} data
   */
  async createOpportunity(data) {
    const res = await api.post('/api/opportunities', data);
    return res.data;
  },

  /**
   * Update an existing opportunity (owner only).
   * @param {number} id
   * @param {Partial<{ title, description, sport, location, budget, deadline, role_type }>} data
   */
  async updateOpportunity(id, data) {
    const res = await api.put(`/api/opportunities/${id}`, data);
    return res.data;
  },

  /** Remove an opportunity (owner only). */
  async deleteOpportunity(id) {
    const res = await api.delete(`/api/opportunities/${id}`);
    return res.data;
  },
};

export default opportunityService;
