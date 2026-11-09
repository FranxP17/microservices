import api from "../../../services/api";
import { ENDPOINTS } from "../../../services/endpoints";

export const profileService = {
  async getMe() {
    const response = await api.get(ENDPOINTS.PROFILES.ME);
    return response.data;
  },

  async create(profile) {
    const response = await api.post(ENDPOINTS.PROFILES.BASE, profile);
    return response.data;
  },

  async update(profile) {
    const response = await api.put(ENDPOINTS.PROFILES.ME, profile);
    return response.data;
  },

  async getUsers() {
    const response = await api.get(ENDPOINTS.PROFILES.USERS);
    return response.data;
  },

  async getById(userId) {
    const response = await api.get(ENDPOINTS.PROFILES.USER(userId));
    return response.data;
  },

  async getUserAvatar(userId) {
    const response = await api.get(ENDPOINTS.PROFILES.USER_AVATAR(userId));
    return response.data;
  },

  async getAvatars() {
    const response = await api.get(ENDPOINTS.PROFILES.AVATARS);
    return response.data;
  },

  async getPreferences() {
    const response = await api.get(ENDPOINTS.PROFILES.PREFERENCES);
    return response.data;
  },

  async updatePreferences(preferences) {
    const response = await api.put(ENDPOINTS.PROFILES.PREFERENCES, preferences);
    return response.data;
  },

  async deleteMe() {
    const response = await api.delete(ENDPOINTS.PROFILES.ME);
    return response.data;
  },

  async deleteUser(userId) {
    const response = await api.delete(ENDPOINTS.PROFILES.DELETE_USER(userId));
    return response.data;
  },
};
