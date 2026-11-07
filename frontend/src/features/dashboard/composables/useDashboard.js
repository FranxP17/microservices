import { computed, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import { useAuthStore } from "../../../stores/authStore";
import { adminService } from "../../admin/services/adminService";
import { userService } from "../../users/services/userService";
import { getErrorMessagge } from "../../../utils/errorHandler";

const roles = ["JOYENT", "CRITIC", "ADMIN"];
const statuses = ["ACTIVE", "INACTIVE", "BLOCKED"];
const PAGE_SIZE = 10;

function enumName(value, options) {
  if (typeof value === "number") return options[value] ?? "";
  const normalized = String(value ?? "").toUpperCase();
  if (/^\d+$/.test(normalized)) return options[Number(normalized)] ?? "";
  return options.includes(normalized) ? normalized : "";
}

function roleName(value) {
  return enumName(value, roles) || String(value ?? "");
}

function statusName(value) {
  return enumName(value, statuses) || String(value ?? "");
}

function statusLabel(value) {
  const labels = {
    ACTIVE: "Activo",
    INACTIVE: "Inactivo",
    BLOCKED: "Bloqueado",
  };
  return labels[statusName(value)] || statusName(value) || "Sin estado";
}

function getUsersFromResponse(response) {
  const data = response?.data ?? response?.Data ?? response;
  return Array.isArray(data) ? data : [];
}

export function useDashboard() {
  const authStore = useAuthStore();
  const { user, isAuthenticated, isLoading } = storeToRefs(authStore);
  const users = ref([]);
  const totalUser = ref(0);
  const loading = ref(false);
  const errorMessage = ref("");
  const lastUpdated = ref(null);

  const welcomeTitle = computed(() => {
    const name = user.value?.name || user.value?.displayName;
    return name ? `Bienvenido, ${name}` : "Bienvenido";
  });

  const userCounts = computed(() => ({
    total: totalUser.value,
    active: users.value.filter(
      (item) => enumName(item.status, statuses) === "ACTIVE",
    ).length,
    inactive: users.value.filter(
      (item) => enumName(item.status, statuses) === "INACTIVE",
    ).length,
    blocked: users.value.filter(
      (item) => enumName(item.status, statuses) === "BLOCKED",
    ).length,
  }));

  const statistics = computed(() => [
    {
      title: "Usuarios registrados",
      value: totalUser.value,
      detail: "En el sistema",
      variant: "total",
    },
    {
      title: "Usuarios activos",
      value: userCounts.value.active,
      detail: "Con acceso activo",
      variant: "active",
    },
    {
      title: "Usuarios inactivos",
      value: userCounts.value.inactive,
      detail: "Sin acceso activo",
      variant: "inactive",
    },
    {
      title: "Usuarios bloqueados",
      value: userCounts.value.blocked,
      detail: "Acceso restringido",
      variant: "blocked",
    },
  ]);

  const roleBreakdown = computed(() =>
    roles.map((role) => {
      const count = users.value.filter(
        (item) => enumName(item.role, roles) === role,
      ).length;
      return {
        name: role,
        count,
        percentage: userCounts.value.total
          ? Math.round((count / userCounts.value.total) * 100)
          : 0,
      };
    }),
  );

  const formattedLastUpdated = computed(() => {
    if (!lastUpdated.value) return "";
    return new Intl.DateTimeFormat("es", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(lastUpdated.value);
  });

  async function loadDashboard() {
    loading.value = true;
    errorMessage.value = "";

    try {
      totalUser.value = await adminService.getUserCount();
      const pageCount = Math.ceil(totalUser.value / PAGE_SIZE);
      const pages = await Promise.all(
        Array.from({ length: pageCount }, (_, index) =>
          userService.getAll(index + 1, PAGE_SIZE),
        ),
      );
      users.value = pages.flatMap(getUsersFromResponse);
      lastUpdated.value = new Date();
    } catch (error) {
      errorMessage.value = getErrorMessagge(error);
    } finally {
      loading.value = false;
    }
  }

  onMounted(loadDashboard);

  return {
    user,
    isAuthenticated,
    isLoading,
    welcomeTitle,
    users,
    loading,
    errorMessage,
    lastUpdated,
    formattedLastUpdated,
    statistics,
    roleBreakdown,
    roleName,
    statusName,
    statusLabel,
    loadDashboard,
    logout: authStore.logout,
  };
}
