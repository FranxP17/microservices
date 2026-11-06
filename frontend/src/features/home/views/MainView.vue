<script setup>
import { computed, ref } from "vue";
import { useAuthStore } from "../../../stores/authStore";
import { userService } from "../../users/services/userService";
import { getErrorMessagge } from "../../../utils/errorHandler";
import HomeSideBar from "../components/HomeSideBar.vue";

const roles = ["JOYENT", "CRITIC", "ADMIN"];
const statuses = ["ACTIVE", "INACTIVE", "BLOCKED"];
const statusLabels = { ACTIVE: "Activo", INACTIVE: "Inactivo", BLOCKED: "Bloqueado" };

const authStore = useAuthStore();
const selectedUser = ref(null);
const detailLoading = ref(false);
const detailError = ref("");
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

function enumName(value, options) {
  if (typeof value === "number") return options[value] ?? "";
  const normalized = String(value ?? "").toUpperCase();
  if (/^\d+$/.test(normalized)) return options[Number(normalized)] ?? "";
  return options.includes(normalized) ? normalized : normalized;
}

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
  { label: "ID", value: profile.value.id },
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
</script>

<template>
  <div class="home-view">
    <HomeSideBar :selected-id="selectedUser?.id" @select="selectUser" />

    <section class="profile-panel" aria-live="polite">
      <button v-if="!isOwnProfile" class="back-button" type="button" @click="showOwnProfile">
        ← Volver a mi perfil
      </button>

      <article class="profile-card">
        <div class="profile-header">
          <div class="profile-avatar" aria-hidden="true">
            <img v-if="profile.avatarUrl" :src="profile.avatarUrl" alt="" />
            <template v-else>{{ initials }}</template>
          </div>
          <div>
            <span class="profile-kicker">{{ isOwnProfile ? "Mi perfil" : "Detalle de usuario" }}</span>
            <h1>{{ name }}</h1>
            <p>{{ profile.email }}</p>
          </div>
        </div>

        <p v-if="detailLoading" class="profile-state">Cargando detalles...</p>
        <p v-if="detailError" class="profile-state error" role="alert">{{ detailError }}</p>

        <dl class="profile-details">
          <div v-for="item in details" :key="item.label">
            <dt>{{ item.label }}</dt>
            <dd>{{ item.value || "—" }}</dd>
          </div>
        </dl>
      </article>
    </section>
  </div>
</template>

<style scoped>
.home-view {
  display: flex;
  align-items: flex-start;
  min-height: calc(100vh - 85px);
}

.profile-panel {
  flex: 1;
  min-width: 0;
  padding: 28px;
}

.back-button {
  margin-bottom: 16px;
  background: transparent;
  color: var(--color-primary);
  font-weight: 600;
  cursor: pointer;
}

.profile-card {
  max-width: 720px;
  padding: 28px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--color-border);
}

.profile-avatar {
  flex: 0 0 80px;
  width: 80px;
  height: 80px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: var(--radius-lg);
  background: var(--color-primary);
  color: white;
  font-size: 26px;
  font-weight: bold;
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-kicker {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--color-primary);
}

h1 {
  margin: 4px 0;
  font-size: 24px;
}

.profile-header p,
dt {
  font-size: 13px;
  color: var(--color-muted);
}

.profile-state {
  margin-top: 16px;
  font-size: 13px;
  color: var(--color-muted);
}

.profile-state.error {
  color: #b42318;
}

.profile-details {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  margin-top: 24px;
}

dd {
  margin: 4px 0 0;
  font-weight: 600;
  overflow-wrap: anywhere;
}

@media (max-width: 768px) {
  .home-view {
    flex-direction: column;
  }

  .profile-panel {
    width: 100%;
    padding: 16px;
  }

  .profile-details {
    grid-template-columns: 1fr;
  }
}
</style>
