import { computed, ref } from "vue";
import { useAuthStore } from "../../../stores/authStore";
import { userService } from "../../users/services/userService";
import { getErrorMessagge } from "../../../utils/errorHandler";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";

const roles = ["JOYENT", "CRITIC", "ADMIN"];
const statuses = ["ACTIVE", "INACTIVE", "BLOCKED"];
const statusLabels = { ACTIVE: "Activo", INACTIVE: "Inactivo", BLOCKED: "Bloqueado" };

function createProfileForm(profile = {}) {
  return {
    name: profile.displayName || profile.name || "",
    email: profile.email || "",
    tel: profile.tel ?? "",
    avatarUrl: profile.avatarUrl ?? "",
    password: "",
  };
}

function enumName(value, options) {
  if (typeof value === "number") return options[value] ?? "";
  const normalized = String(value ?? "").toUpperCase();
  if (/^\d+$/.test(normalized)) return options[Number(normalized)] ?? "";
  return options.includes(normalized) ? normalized : normalized;
}

export function useHome() {
  const authStore = useAuthStore();
  const router = useRouter();
  const { user } = storeToRefs(authStore);
  const selectedUser = ref(null);
  const detailLoading = ref(false);
  const detailError = ref("");
  const editOpen = ref(false);
  const editLoading = ref(false);
  const editError = ref("");
  const editForm = ref(createProfileForm());
  const deleteOpen = ref(false);
  const deleteLoading = ref(false);
  const deleteError = ref("");
  let requestId = 0;

  const isOwnProfile = computed(() => !selectedUser.value);
  const profile = computed(() => selectedUser.value ?? authStore.user ?? {});
  const name = computed(
    () => profile.value.displayName || profile.value.name || profile.value.email || "Usuario",
  );
  const initials = computed(() =>
    name.value
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase(),
  );

  const role = computed(() => enumName(profile.value.role, roles) || "—");
  const status = computed(() => {
    const value = enumName(profile.value.status, statuses);
    return statusLabels[value] || value || "—";
  });

  const details = computed(() => [
    { label: "Correo", value: profile.value.email },
    { label: "Teléfono", value: profile.value.tel },
    { label: "Rol", value: role.value },
    { label: "Estado", value: status.value },
  ]);

  async function selectUser(user) {
    const current = ++requestId;
    selectedUser.value = user;
    detailError.value = "";
    detailLoading.value = true;
    try {
      const detail = await userService.getById(user.id);
      if (current === requestId) {
        selectedUser.value = { ...user, ...(detail?.user ?? detail ?? {}) };
      }
    } catch (error) {
      if (current === requestId) detailError.value = getErrorMessagge(error);
    } finally {
      if (current === requestId) detailLoading.value = false;
    }
  }

  function showOwnProfile() {
    requestId++;
    selectedUser.value = null;
    detailError.value = "";
    detailLoading.value = false;
  }

  function openEditProfile() {
    editForm.value = createProfileForm(authStore.user);
    editError.value = "";
    editOpen.value = true;
  }

  function closeEditProfile() {
    if (editLoading.value) return;
    editOpen.value = false;
    editForm.value.password = "";
  }

  async function saveProfile() {
    if (editLoading.value) return;

    const id = authStore.user?.id;
    if (id == null || id === "") {
      editError.value = "No se pudo identificar tu cuenta. Vuelve a iniciar sesión e inténtalo de nuevo.";
      return;
    }

    const displayName = editForm.value.name.trim();
    const email = editForm.value.email.trim();
    const password = editForm.value.password;
    if (!displayName || !email) {
      editError.value = "El nombre y el correo electrónico son obligatorios.";
      return;
    }
    if (password && (!password.trim() || password.length < 8)) {
      editError.value =
        "La contraseña debe tener al menos 8 caracteres y no puede contener solo espacios.";
      return;
    }

    editLoading.value = true;
    editError.value = "";
    const payload = {
      displayName,
      email,
      tel: String(editForm.value.tel).trim(),
      avatarUrl: String(editForm.value.avatarUrl).trim(),
      ...(password ? { password } : {}),
    };

    try {
      const response = await userService.updateOwnProfile(id, payload);
      const returnedUser =
        response?.user ??
        response?.data?.user ??
        response?.data ??
        response?.Data?.user ??
        response?.Data ??
        response;
      const safeReturnedUser =
        returnedUser && typeof returnedUser === "object" && !Array.isArray(returnedUser)
          ? Object.fromEntries(
              Object.entries(returnedUser).filter(([key]) =>
                ["id", "displayName", "name", "email", "tel", "avatarUrl", "role", "status"].includes(
                  key,
                ),
              ),
            )
          : {};
      authStore.user = {
        ...authStore.user,
        ...safeReturnedUser,
        displayName,
        email,
        tel: payload.tel,
        avatarUrl: payload.avatarUrl,
        name: displayName,
      };
      editOpen.value = false;
      editForm.value.password = "";
    } catch (error) {
      editError.value = getErrorMessagge(error);
    } finally {
      editLoading.value = false;
    }
  }

  function openDeleteAccount() {
    deleteError.value = "";
    deleteOpen.value = true;
  }

  function closeDeleteAccount() {
    if (!deleteLoading.value) deleteOpen.value = false;
  }

  async function confirmDeleteAccount() {
    if (deleteLoading.value) return;

    const id = authStore.user?.id;
    if (id == null || id === "") {
      deleteError.value = "No se pudo identificar tu cuenta. Vuelve a iniciar sesión e inténtalo de nuevo.";
      return;
    }

    deleteLoading.value = true;
    deleteError.value = "";
    try {
      await userService.deleteOwnAccount(id);
      authStore.$patch({
        user: null,
        isAuthenticated: false,
        initialized: true,
      });
      await router.replace({ name: "login" });
    } catch (error) {
      deleteError.value = getErrorMessagge(error);
    } finally {
      deleteLoading.value = false;
    }
  }

  return {
    user,
    selectedUser,
    detailLoading,
    detailError,
    isOwnProfile,
    profile,
    name,
    initials,
    role,
    status,
    details,
    selectUser,
    showOwnProfile,
    editOpen,
    editLoading,
    editError,
    editForm,
    openEditProfile,
    closeEditProfile,
    saveProfile,
    deleteOpen,
    deleteLoading,
    deleteError,
    openDeleteAccount,
    closeDeleteAccount,
    confirmDeleteAccount,
  };
}