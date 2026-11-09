import { computed, onMounted, ref } from "vue";
import { useAuthStore } from "../../../stores/authStore";
import { profileService } from "../services/profileService";
import { getErrorMessagge } from "../../../utils/errorHandler";
import { storeToRefs } from "pinia";
import { useRoute, useRouter } from "vue-router";

const roles = ["JOYENT", "CRITIC", "ADMIN"];
const statuses = ["ACTIVE", "INACTIVE", "BLOCKED"];
const statusLabels = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  BLOCKED: "Bloqueado",
};

function createProfileForm(profile = {}) {
  return {
    name: profile.name || profile.displayName || "",
    username: profile.username || "",
    bio: profile.bio || "",
    avatarId: profile.avatar_id || profile.avatarId || "",
  };
}

function normalizeProfile(profile = {}) {
  const name = profile.name ?? profile.Name ?? profile.displayName ?? "";
  const username = profile.username ?? profile.Username ?? "";
  const bio = profile.bio ?? profile.Bio ?? "";
  const avatarId = profile.avatar_id ?? profile.Avatar_id ?? profile.avatarId ?? "";

  return {
    ...profile,
    id: profile.id ?? profile.Id,
    userId: profile.user_id ?? profile.User_id ?? profile.userId,
    name,
    displayName: name,
    username,
    bio,
    avatarId,
    avatar_id: avatarId,
  };
}

function normalizeAvatar(avatar = {}) {
  return {
    id: avatar.id ?? avatar.Id ?? avatar.avatar_id ?? avatar.Avatar_id ?? "",
    name: avatar.name ?? avatar.Name ?? "Avatar",
    imageUrl:
      avatar.image_url ?? avatar.Image_url ?? avatar.imageUrl ?? avatar.ImageUrl ?? "",
  };
}

function getArray(data) {
  const result = data?.data ?? data?.Data ?? data?.avatars ?? data;
  return Array.isArray(result) ? result : [];
}

function enumName(value, options) {
  if (typeof value === "number") return options[value] ?? "";
  const normalized = String(value ?? "").toUpperCase();
  if (/^\d+$/.test(normalized)) return options[Number(normalized)] ?? "";
  return options.includes(normalized) ? normalized : normalized;
}

export function useHome() {
  const authStore = useAuthStore();
  const route = useRoute();
  const router = useRouter();
  const { user } = storeToRefs(authStore);
  const selectedUser = ref(null);
  const ownProfile = ref(null);
  const ownAvatar = ref(null);
  const avatars = ref([]);
  const avatarsLoading = ref(false);
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
  const profile = computed(() => {
    if (selectedUser.value) return selectedUser.value;
    const account = authStore.user ?? {};
    return {
      ...account,
      ...(ownProfile.value ?? {}),
      email: account.email,
      role: account.role,
      status: account.status,
      avatarUrl: ownAvatar.value?.imageUrl || account.avatarUrl || "",
    };
  });
  const name = computed(
    () => profile.value?.displayName || profile.value?.name || profile.value?.email || "Usuario",
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
    { label: "Usuario", value: profile.value.username },
    { label: "Biografía", value: profile.value.bio },
    { label: "Rol", value: role.value },
    { label: "Estado", value: status.value },
  ]);

  async function loadOwnProfile() {
    detailLoading.value = true;
    detailError.value = "";
    try {
      ownProfile.value = normalizeProfile(await profileService.getMe());
      const userId = authStore.user?.id ?? ownProfile.value.userId;
      if (userId) {
        try {
          ownAvatar.value = normalizeAvatar(
            await profileService.getUserAvatar(userId),
          );
        } catch {
          ownAvatar.value = null;
        }
      }
    } catch (error) {
      if (error.response?.status === 404) {
        ownProfile.value = null;
        ownAvatar.value = null;
      } else {
        detailError.value = getErrorMessagge(error);
      }
    } finally {
      detailLoading.value = false;
    }
  }

  async function loadAvatars() {
    if (avatars.value.length || avatarsLoading.value) return;
    avatarsLoading.value = true;
    try {
      avatars.value = getArray(await profileService.getAvatars()).map(normalizeAvatar);
      if (!editForm.value.avatarId && avatars.value.length) {
        editForm.value.avatarId = avatars.value[0].id;
      }
    } catch (error) {
      editError.value = getErrorMessagge(error);
    } finally {
      avatarsLoading.value = false;
    }
  }

  async function selectUser(user) {
    const current = ++requestId;
    selectedUser.value = user;
    detailError.value = "";
    detailLoading.value = true;
    try {
      const detail = normalizeProfile(await profileService.getById(user.id));
      let avatarUrl = user.avatarUrl || "";
      try {
        const avatar = normalizeAvatar(await profileService.getUserAvatar(user.id));
        avatarUrl = avatar.imageUrl || avatarUrl;
      } catch {
        // The public profile may not have an avatar assigned.
      }
      if (current === requestId) {
        selectedUser.value = { ...user, ...detail, avatarUrl };
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
    if (route.params.userId) router.replace({ name: "profile" });
    loadOwnProfile();
  }

  async function openEditProfile() {
    editForm.value = createProfileForm(profile.value);
    editError.value = "";
    editOpen.value = true;
    await loadAvatars();
  }

  function closeEditProfile() {
    if (editLoading.value) return;
    editOpen.value = false;
  }

  async function saveProfile() {
    if (editLoading.value) return;

    const displayName = editForm.value.name.trim();
    const username = editForm.value.username.trim();
    const bio = editForm.value.bio.trim();
    const avatarId = editForm.value.avatarId;
    if (!displayName || !username || !avatarId) {
      editError.value = "El nombre, nombre de usuario y avatar son obligatorios.";
      return;
    }
    if (displayName.length > 100 || username.length > 50 || bio.length > 500) {
      editError.value = "Revisa los límites: nombre 100, usuario 50 y biografía 500 caracteres.";
      return;
    }

    editLoading.value = true;
    editError.value = "";
    const payload = {
      name: displayName,
      username,
      bio,
      avatar_id: avatarId,
    };

    try {
      const response = ownProfile.value
        ? await profileService.update(payload)
        : await profileService.create(payload);
      ownProfile.value = normalizeProfile(response);
      ownAvatar.value = avatars.value.find((avatar) => avatar.id === avatarId) ?? null;
      authStore.user = {
        ...authStore.user,
        name: displayName,
        displayName,
      };
      editOpen.value = false;
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

    deleteLoading.value = true;
    deleteError.value = "";
    try {
      await profileService.deleteMe();
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

  onMounted(() => {
    if (route.params.userId) selectUser({ id: String(route.params.userId) });
    else loadOwnProfile();
  });

  return {
    user,
    selectedUser,
    isOwnProfile,
    profile,
    profileExists: computed(() => Boolean(selectedUser.value || ownProfile.value)),
    detailLoading,
    detailError,
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
    avatars,
    avatarsLoading,
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
