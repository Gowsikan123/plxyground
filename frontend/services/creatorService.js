import { api, safeCall } from './api';

export const creatorService = {
  listCreators: ({ search = '', sport = '', limit = 20, offset = 0 } = {}) => {
    const params = {};
    if (search) params.search = search;
    if (sport)  params.sport  = sport;
    params.limit  = limit;
    params.offset = offset;
    return safeCall(api.get('/api/creators', { params }));
  },

  getCreatorBySlug: (slug) =>
    safeCall(api.get(`/api/creators/slug/${slug}`)),

  getCreatorById: (id) =>
    safeCall(api.get(`/api/creators/id/${id}`)),

  updateCreator: (id, payload) =>
    safeCall(api.put(`/api/creators/${id}`, payload)),
};
