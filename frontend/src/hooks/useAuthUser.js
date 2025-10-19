import useAuthStore from "../stores/authStore";

export default function useAuthUser() {
  // Usar solo el estado del store
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);
  const error = useAuthStore((state) => state.error);

  // Funciones del store
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const clearError = useAuthStore((state) => state.clearError);

  return {
    authUser: user,
    authUserId: user?.id || null,
    loading: isLoading || isCheckingAuth,
    isAuthenticated,
    error,
    checkAuth,
    clearError,
    refreshAuth: checkAuth
  };
}
