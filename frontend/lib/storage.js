/**
 * In-memory token store — replaces AsyncStorage for Expo Go compatibility.
 * On a real device build, swap this with expo-secure-store.
 */
let _token = null;
let _businessToken = null;

const storage = {
  getToken: () => _token,
  setToken: (t) => { _token = t; },
  clearToken: () => { _token = null; },

  getBusinessToken: () => _businessToken,
  setBusinessToken: (t) => { _businessToken = t; },
  clearBusinessToken: () => { _businessToken = null; },

  clearAll: () => {
    _token = null;
    _businessToken = null;
  },
};

export default storage;
