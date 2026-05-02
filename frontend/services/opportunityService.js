import { api, safeCall } from './api';

export const opportunityService = {
  listOpportunities: ({ search = '', sport = '', type = '', limit = 20, offset = 0 } = {}) => {
    const params = {};
    if (search) params.search = search;
    if (sport)  params.sport  = sport;
    if (type)   params.type   = type;
    params.limit  = limit;
    params.offset = offset;
    return safeCall(api.get('/api/opportunities', { params }));
  },

  getOpportunity: (id) =>
    safeCall(api.get(`/api/opportunities/${id}`)),

  createOpportunity: (payload) =>
    safeCall(api.post('/api/opportunities', payload)),

  updateOpportunity: (id, payload) =>
    safeCall(api.put(`/api/opportunities/${id}`, payload)),

  deleteOpportunity: (id) =>
    safeCall(api.delete(`/api/opportunities/${id}`)),
};
