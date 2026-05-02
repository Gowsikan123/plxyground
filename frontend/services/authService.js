import api from './api';

const wrap = async (fn) => {
  try {
    const res = await fn();
    return { data: res.data, error: null };
  } catch (err) {
    return { data: null, error: err.response?.data?.error || err.message || 'Unknown error' };
  }
};

export const creatorLogin = ({ email, password }) =>
  wrap(() => api.post('/api/auth/login', { email, password }));

export const creatorSignup = ({ email, password, username, display_name, sport, location }) =>
  wrap(() => api.post('/api/auth/signup', { email, password, username, display_name, sport, location }));

export const businessLogin = ({ email, password }) =>
  wrap(() => api.post('/api/business/auth/login', { email, password }));

export const businessSignup = ({ email, password, company_name, industry, website, location }) =>
  wrap(() => api.post('/api/business/auth/signup', { email, password, company_name, industry, website, location }));

export const getCreatorMe = () =>
  wrap(() => api.get('/api/auth/me'));

export const getBusinessMe = () =>
  wrap(() => api.get('/api/business/auth/me'));
