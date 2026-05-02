import api from './api';

export const authService = {
  /**
   * Creator signup.
   * @param {{ username, email, password, sport?, location?, bio? }} data
   */
  async creatorSignup(data) {
    const res = await api.post('/api/auth/signup', data);
    return res.data; // { token, user }
  },

  /**
   * Creator login.
   * @param {{ email, password }} credentials
   */
  async creatorLogin(credentials) {
    const res = await api.post('/api/auth/login', credentials);
    return res.data; // { token, user }
  },

  /** Creator — get own profile */
  async creatorMe() {
    const res = await api.get('/api/auth/me');
    return res.data;
  },

  /** Creator — update own account (email, password, etc.) */
  async creatorUpdateAccount(data) {
    const res = await api.patch('/api/auth/me', data);
    return res.data;
  },

  /** Forgot password — triggers email */
  async forgotPassword(email) {
    const res = await api.post('/api/auth/forgot-password', { email });
    return res.data;
  },

  /** Reset password with token */
  async resetPassword(token, newPassword) {
    const res = await api.post('/api/auth/reset-password', { token, newPassword });
    return res.data;
  },

  // —— Business ——

  async businessSignup(data) {
    const res = await api.post('/api/business/auth/signup', data);
    return res.data;
  },

  async businessLogin(credentials) {
    const res = await api.post('/api/business/auth/login', credentials);
    return res.data;
  },

  async businessMe() {
    const res = await api.get('/api/business/auth/me');
    return res.data;
  },

  async businessUpdateAccount(data) {
    const res = await api.patch('/api/business/auth/me', data);
    return res.data;
  },
};

export default authService;
