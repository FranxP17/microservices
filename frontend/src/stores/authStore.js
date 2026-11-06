import { defineStore } from "pinia";
import { authService } from "../features/auth/services/authService";
import { userService } from "../features/users/services/userService";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    initialized: false,
  }),

  getters: {
    userRole: (state) => state.user?.role ?? null,
    userName: (state) => state.user?.name ?? "",
  },

  actions: {
    async login(credentials) {
      this.isLoading = true;
      try {
        const data = await authService.login(credentials);
        this.user = data?.user ?? {
          id: data?.userId,
          name: data?.name ?? "",
          email: data?.email ?? credentials.email,
          role: data?.role ?? null,
        };
        this.isAuthenticated = true;
        this.initialized = true;
        return data;
      } finally {
        this.isLoading = false;
      }
    },

    async register(user) {
      this.isLoading = true;
      try {
        return await authService.register(user);
      } finally {
        this.isLoading = false;
      }
    },

    async initializeAuth() {
      if (this.initialized) return;

      this.isLoading = true;
      try {
        const data = await userService.getCurrentUser();
        this.user = data?.user ?? data ?? null;
        this.isAuthenticated = Boolean(this.user);
      } catch {
        this.user = null;
        this.isAuthenticated = false;
      } finally {
        this.isLoading = false;
        this.initialized = true;
      }
    },

    async logout() {
      try {
        await authService.logout();
      } finally {
        this.user = null;
        this.isAuthenticated = false;
      }
    },
  },
});
