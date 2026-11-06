import { computed, onMounted, ref } from "vue";
import { userService } from "../services/userService";
import { usePaginatedUsers } from "./usePaginatedUsers";
import { getErrorMessagge } from "../../../utils/errorHandler";

const roles = ["JOYENT", "CRITIC", "ADMIN"];
const statuses = ["ACTIVE", "INACTIVE", "BLOCKED"];

function createEmptyForm() {
  return {
    name: "",
    email: "",
    tel: "",
    avatarUrl: "",
    role: "",
    status: "",
    password: "",
  };
}

function enumName(value, options) {
  if (typeof value === "number") return options[value] ?? "";
  const normalized = String(value ?? "").toUpperCase();
  if (/^\d+$/.test(normalized)) return options[Number(normalized)] ?? "";
  return options.includes(normalized) ? normalized : "";
}

export function useUsers() {
  const { users, loading, errorMessage, hasMore, loadUsers, reloadUsers } = usePaginatedUsers();
  const search = ref("");
  const editOpen = ref(false);
  const editingUser = ref(null);
  const editLoading = ref(false);
  const editError = ref("");
  const updateMessage = ref("");
  const deleteUser = ref(null);
  const deleteLoading = ref(false);
  const deleteError = ref("");
  const editForm = ref(createEmptyForm());

  const filteredUsers = computed(() => {
    const query = search.value.trim().toLowerCase();
    if (!query) return users.value;

    return users.value.filter((user) =>
      [user.displayName, user.name, user.email, user.role]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  });

  function openEditModal(user) {
    editingUser.value = user;
    editForm.value = {
      name: user.displayName || user.name || "",
      email: user.email || "",
      tel: user.tel ?? "",
      avatarUrl: user.avatarUrl ?? "",
      role: enumName(user.role, roles),
      status: enumName(user.status, statuses),
      password: "",
    };
    editError.value = "";
    updateMessage.value = "";
    editOpen.value = true;
  }

  function closeEditModal() {
    if (editLoading.value) return;
    editOpen.value = false;
    editingUser.value = null;
    editForm.value.password = "";
  }

  function openCreateModal() {
    editingUser.value = null;
    editForm.value = {
      ...createEmptyForm(),
      role: "JOYENT",
      status: "ACTIVE",
    };
    editError.value = "";
    updateMessage.value = "";
    editOpen.value = true;
  }

  function openDeleteModal(user) {
    deleteUser.value = user;
    deleteError.value = "";
    updateMessage.value = "";
  }

  function closeDeleteModal() {
    if (!deleteLoading.value) deleteUser.value = null;
  }

  async function confirmDeleteUser() {
    if (!deleteUser.value || deleteLoading.value || loading.value) return;
    deleteLoading.value = true;
    deleteError.value = "";
    const id = deleteUser.value.id;

    try {
      await userService.delete(id);
      updateMessage.value = "El usuario se eliminó correctamente.";
      deleteLoading.value = false;
      closeDeleteModal();
      await reloadUsers();
    } catch (error) {
      deleteError.value = getErrorMessagge(error);
    } finally {
      deleteLoading.value = false;
    }
  }

  async function saveUser() {
    if (editLoading.value) return;

    editLoading.value = true;
    editError.value = "";

    const name = editForm.value.name.trim();
    const email = editForm.value.email.trim();
    if (!name || !email || !editForm.value.role || !editForm.value.status) {
      editError.value = "El nombre, correo, rol y estado son obligatorios.";
      editLoading.value = false;
      return;
    }
    if (
      (!editingUser.value && !editForm.value.password.trim()) ||
      (editForm.value.password &&
        (!editForm.value.password.trim() || editForm.value.password.length < 8))
    ) {
      editError.value =
        "La contraseña debe tener al menos 8 caracteres y no puede contener solo espacios.";
      editLoading.value = false;
      return;
    }

    const payload = {
      displayName: name,
      email,
      tel: editForm.value.tel.trim(),
      avatarUrl: editForm.value.avatarUrl.trim(),
      role: editForm.value.role,
      status: editForm.value.status,
      ...(editForm.value.password ? { password: editForm.value.password } : {}),
    };

    try {
      const isEditing = Boolean(editingUser.value);
      const savedUser = isEditing
        ? await userService.update(editingUser.value.id, payload)
        : await userService.create(payload);
      if (!savedUser?.id || (isEditing && savedUser.id !== editingUser.value.id)) {
        editError.value =
          "El servidor no devolvió los datos guardados. Recarga la página para comprobar el resultado.";
        return;
      }

      const userIndex = users.value.findIndex((user) => user.id === savedUser.id);
      if (userIndex !== -1) {
        users.value[userIndex] = savedUser;
      } else if (!isEditing) {
        users.value.push(savedUser);
      }

      updateMessage.value = isEditing
        ? "Los datos del usuario se actualizaron correctamente."
        : "El usuario se creó correctamente.";
      editLoading.value = false;
      closeEditModal();
    } catch (error) {
      editError.value = getErrorMessagge(error);
    } finally {
      editLoading.value = false;
    }
  }

  onMounted(loadUsers);

  return {
    users,
    loading,
    errorMessage,
    hasMore,
    search,
    editOpen,
    editingUser,
    editLoading,
    editError,
    updateMessage,
    deleteUser,
    deleteLoading,
    deleteError,
    editForm,
    roles,
    statuses,
    filteredUsers,
    enumName,
    loadUsers,
    openEditModal,
    closeEditModal,
    openCreateModal,
    openDeleteModal,
    closeDeleteModal,
    confirmDeleteUser,
    saveUser,
  };
}