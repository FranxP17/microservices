import { defineStore } from "pinia";
import { authService } from "../features/auth/services/authService";
import { profileService } from "../features/home/services/profileService";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    initialized: false,
    onboardingChecked: false,
    onboardingComplete: false,
  }),

  getters: {
    userRole: (state) => state.user?.role ?? null,
    userName: (state) => state.user?.name ?? "",
  },

  actions: {
    async login(credentials) {
      this.isLoading = true;
      try {
        await authService.login(credentials);
        const user = await authService.getCurrentUser();
        this.user = user?.user ?? user;
        this.isAuthenticated = Boolean(this.user);
        this.initialized = true;
        this.onboardingChecked = false;
        return this.user;
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
        const data = await authService.getCurrentUser();
        this.user = data?.user ?? data ?? null;
        this.isAuthenticated = Boolean(this.user);
        this.onboardingChecked = false;
      } catch {
        this.user = null;
        this.isAuthenticated = false;
        this.onboardingChecked = false;
        this.onboardingComplete = false;
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
        this.onboardingChecked = false;
        this.onboardingComplete = false;
      }
    },

    async checkOnboarding() {
      if (!this.isAuthenticated) return false;
      if (this.onboardingChecked) return !this.onboardingComplete;

      try {
        await profileService.getMe();
      } catch (error) {
        if (error.response?.status === 404) {
          this.onboardingComplete = false;
          this.onboardingChecked = true;
          return true;
        }
        return false;
      }

      try {
        const preferences = await profileService.getPreferences();
        this.onboardingComplete = Boolean(
          preferences?.isConfigured ?? preferences?.IsConfigured,
        );
      } catch {
        return false;
      }

      this.onboardingChecked = true;
      return !this.onboardingComplete;
    },

    completeOnboarding() {
      this.onboardingComplete = true;
      this.onboardingChecked = true;
    },
  },
});
