import api from "../../../services/api";
import { ENDPOINTS } from "../../../services/endpoints";

export const adminService = {
  list: async () => {
    const response = await api.get(ENDPOINTS.ADMIN.LIST);
    return response.data?.data ?? response.data;
  },
  getUserCount: async () => {
    const users = await adminService.list();
    return Array.isArray(users) ? users.length : 0;
  },
  detail: async (id) => {
    const response = await api.get(ENDPOINTS.ADMIN.DETAIL(id));
    return response.data;
  },
  create: async (data) => {
    const response = await api.post(ENDPOINTS.ADMIN.CREATE, data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(ENDPOINTS.ADMIN.UPDATE(id), data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(ENDPOINTS.ADMIN.DELETE(id));
    return response.data;
  },
  changeRole: async (id, data) => {
    const response = await api.put(ENDPOINTS.ADMIN.CHANGEROL(id), data);
    return response.data;
  },
  changeStatus: async (id, data) => {
    const response = await api.put(ENDPOINTS.ADMIN.CHANGESTATUS(id), data);
    return response.data;
  }
};