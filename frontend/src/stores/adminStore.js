import { defineStore } from "pinia";
import { adminService } from "../features/admin/services/adminService";

export const useAdminStore = defineStore("admin", {
  state: () => ({
    admins: [],
  }),
  actions: {
    async fetchAdmins() {
      this.admins = await adminService.list();
    },
    async fetchAdminById(id) {
      const admin = await adminService.detail(id);
      const index = this.admins.findIndex((a) => a.id === id);
      if (index !== -1) {
        this.admins[index] = admin;
      } else {
        this.admins.push(admin);
      }
    },
    async createAdmin(data) {
      const admin = await adminService.create(data);
      this.admins.push(admin);
    },
    async updateAdmin(id, data) {
      const admin = await adminService.update(id, data);
      const index = this.admins.findIndex((a) => a.id === id);
      if (index !== -1) {
        this.admins[index] = admin;
      }
    },
    async deleteAdmin(id) {
      await adminService.delete(id);
      this.admins = this.admins.filter((a) => a.id !== id);
    },
    async changeAdminRole(id, data) {
      const admin = await adminService.changeRole(id, data);
      const index = this.admins.findIndex((a) => a.id === id);
      if (index !== -1) {
        this.admins[index] = admin;
      }
    },
    async changeAdminStatus(id, data) {
      const admin = await adminService.changeStatus(id, data);
      const index = this.admins.findIndex((a) => a.id === id);
      if (index !== -1) {
        this.admins[index] = admin;
      }
    },
  },
  getters: {
    getAdminById: (state) => (id) => {
      return state.admins.find((admin) => admin.id === id);
    },
    getAdminByEmail: (state) => (email) => {
      return state.admins.find((admin) => admin.email === email);
    },
  },
});
