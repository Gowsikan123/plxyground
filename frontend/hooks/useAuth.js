import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';

/**
 * Convenience hook that surfaces everything auth screens need.
 * Aliases signIn → login and adds a loading state.
 */
export function useAuth() {
  const store = useAuthStore();

  const creatorLogin = async (email, password) => {
    const { data } = await authService.creatorLogin(email, password);
    await store.signIn(data.token, data.user, 'creator');
    return data;
  };

  const businessLogin = async (email, password) => {
    const { data } = await authService.businessLogin(email, password);
    await store.signIn(data.token, data.user, 'business');
    return data;
  };

  const creatorSignup = async (payload) => {
    const { data } = await authService.creatorSignup(payload);
    await store.signIn(data.token, data.user, 'creator');
    return data;
  };

  const businessSignup = async (payload) => {
    const { data } = await authService.businessSignup(payload);
    await store.signIn(data.token, data.user, 'business');
    return data;
  };

  return {
    ...store,
    // alias so screens that call useAuth().login() still work
    login: creatorLogin,
    loading: store.isLoading,
    creatorLogin,
    businessLogin,
    creatorSignup,
    businessSignup,
  };
}
