import api from "../../../services/api";
import { ENDPOINTS } from "../../../services/endpoints";

export const userService = {
  async getAll() {
    const response = await api.get(ENDPOINTS.USERS.BASE);
    return response.data;
  },

  async getCurrentUser() {
    const response = await api.get(ENDPOINTS.USERS.ME);
    return response.data;
  },

  async getById(id) {
    const response = await api.get(ENDPOINTS.USERS.DETAIL(id));
    return response.data;
  },

  async update(id, user) {
    const response = await api.put(ENDPOINTS.ADMIN.UPDATE_USER(id), user);
    return response.data;
  },

  async create(user) {
    const response = await api.post(ENDPOINTS.ADMIN.CREATE_USER, user);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(ENDPOINTS.ADMIN.UPDATE_USER(id));
    return response.data;
  },
};
