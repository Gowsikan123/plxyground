import { apiCall } from './api';

export const getFeed = async ({ offset = 0, limit = 20, sport = '', search = '' } = {}) => {
  const result = await apiCall((api) =>
    api.get('/api/content', {
      params: { offset, limit, ...(sport ? { sport } : {}), ...(search ? { search } : {}) },
    })
  );
  return { data: result.data?.data || null, error: result.error };
};

export const getPost = async (id) => {
  const result = await apiCall((api) => api.get(`/api/content/${id}`));
  return { data: result.data?.data || null, error: result.error };
};

export const getMyPosts = async (status = '') => {
  const result = await apiCall((api) =>
    api.get('/api/content/mine/list', { params: status ? { status } : {} })
  );
  return { data: result.data?.data || null, error: result.error };
};

export const createPost = async (payload) => {
  const result = await apiCall((api) => api.post('/api/content', payload));
  return { data: result.data?.data || null, error: result.error };
};

export const updatePost = async (id, payload) => {
  const result = await apiCall((api) => api.put(`/api/content/${id}`, payload));
  return { data: result.data?.data || null, error: result.error };
};

export const deletePost = async (id) => {
  const result = await apiCall((api) => api.delete(`/api/content/${id}`));
  return { data: result.data || null, error: result.error };
};

export const togglePostLike = async (id, liked) => {
  const result = await apiCall((api) => api.post(`/api/content/${id}/like`, { liked }));
  return { data: result.data?.data || null, error: result.error };
};

export const contentService = {
  getFeed,
  getPost,
  getMyPosts,
  createPost,
  updatePost,
  deletePost,
  togglePostLike,
};
