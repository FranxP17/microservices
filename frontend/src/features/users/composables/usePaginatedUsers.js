import { ref } from "vue";
import { userService } from "../services/userService";
import { getErrorMessagge } from "../../../utils/errorHandler";

const PAGE_SIZE = 10;

export function usePaginatedUsers() {
  const users = ref([]);
  const loading = ref(false);
  const errorMessage = ref("");
  const hasMore = ref(true);
  let page = 0;

  async function loadUsers() {
    if (loading.value || !hasMore.value) return;

    loading.value = true;
    errorMessage.value = "";
    try {
      const response = await userService.getAll(page + 1, PAGE_SIZE);
      const nextUsers = Array.isArray(response)
        ? response
        : (response?.data ?? response?.Data);

      if (!Array.isArray(nextUsers)) {
        errorMessage.value = "El servidor devolvió una lista de usuarios no válida.";
        return;
      }

      const existingIds = new Set(users.value.map((user) => user.id));
      users.value = [
        ...users.value,
        ...nextUsers.filter((user) => !existingIds.has(user.id)),
      ];
      page++;
      hasMore.value = nextUsers.length === PAGE_SIZE;
    } catch (error) {
      errorMessage.value = getErrorMessagge(error);
    } finally {
      loading.value = false;
    }
  }

  async function reloadUsers() {
    if (loading.value) return;
    users.value = [];
    page = 0;
    hasMore.value = true;
    await loadUsers();
  }

  return { users, loading, errorMessage, hasMore, loadUsers, reloadUsers };
}
