import { useAuthStore } from '../store/authStore';
import {
  creatorLogin as svcCreatorLogin,
  businessLogin as svcBusinessLogin,
  creatorSignup as svcCreatorSignup,
  businessSignup as svcBusinessSignup,
} from '../services/authService';

/**
 * Convenience hook that surfaces everything auth screens need.
 * All service calls return { data, error } from apiCall().
 */
export function useAuth() {
  const store = useAuthStore();

  const creatorLogin = async (email, password) => {
    const { data, error } = await svcCreatorLogin(email, password);
    if (error) throw new Error(error);
    await store.signIn(data.data.token, data.data.user, 'creator');
    return data.data;
  };

  const businessLogin = async (email, password) => {
    const { data, error } = await svcBusinessLogin(email, password);
    if (error) throw new Error(error);
    await store.signIn(data.data.token, data.data.user, 'business');
    return data.data;
  };

  const creatorSignup = async (payload) => {
    const { data, error } = await svcCreatorSignup(payload);
    if (error) throw new Error(error);
    await store.signIn(data.data.token, data.data.user, 'creator');
    return data.data;
  };

  const businessSignup = async (payload) => {
    const { data, error } = await svcBusinessSignup(payload);
    if (error) throw new Error(error);
    await store.signIn(data.data.token, data.data.user, 'business');
    return data.data;
  };

  return {
    ...store,
    // alias so any screen calling useAuth().login() still works
    login: creatorLogin,
    loading: store.isLoading,
    creatorLogin,
    businessLogin,
    creatorSignup,
    businessSignup,
  };
}
