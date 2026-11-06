import { storeToRefs } from "pinia";
import { ref } from "vue";
import { useAdminStore } from "../../../stores/adminStore";

export const useAdmin = () => {
  const adminStore = useAdminStore();
  const { admins } = storeToRefs(adminStore);
  const loading = ref(false);
  const errorMessage = ref("");

  async function run(action) {
    loading.value = true;
    errorMessage.value = "";
    try {
      return await action();
    } catch (error) {
      errorMessage.value = error?.response?.data?.message || error?.message || "Error inesperado";
      throw error;
    } finally {
      loading.value = false;
    }
  }

  return {
    adminStore,
    admins,
    loading,
    errorMessage,
    clearError: () => {
      errorMessage.value = "";
    },
    getAdminById: adminStore.getAdminById,
    getAdminByEmail: adminStore.getAdminByEmail,
    fetchAdmins: () => run(() => adminStore.fetchAdmins()),
    fetchAdminById: (id) => run(() => adminStore.fetchAdminById(id)),
    createAdmin: (payload) => run(() => adminStore.createAdmin(payload)),
    updateAdmin: (id, payload) => run(() => adminStore.updateAdmin(id, payload)),
    deleteAdmin: (id) => run(() => adminStore.deleteAdmin(id)),
    changeAdminRole: (id, payload) => run(() => adminStore.changeAdminRole(id, payload)),
    changeAdminStatus: (id, payload) => run(() => adminStore.changeAdminStatus(id, payload)),
  };
};
