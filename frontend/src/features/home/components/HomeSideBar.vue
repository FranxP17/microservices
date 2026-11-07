<script setup>
import { computed, onMounted, ref } from "vue";
import BaseButton from "../../../components/common/BaseButton.vue";
import { usePaginatedUsers } from "../../users/composables/usePaginatedUsers";
import { useAuthStore } from "../../../stores/authStore";

defineProps({
  selectedId: { type: [String, Number], default: null },
});
const emit = defineEmits(["select"]);

const authStore = useAuthStore();
const { users, loading, errorMessage, hasMore, loadUsers } = usePaginatedUsers();
const search = ref("");

const visibleUsers = computed(() => {
  const query = search.value.trim().toLowerCase();
  return users.value
    .filter((user) => user.id !== authStore.user?.id)
    .filter(
      (user) =>
        !query ||
        [user.displayName, user.name, user.email, user.tel, user.avatarUrl]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query)),
    );
});

function displayName(user) {
  return user.displayName || user.name || user.email || "Sin nombre";
}

function initials(user) {
  return displayName(user)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

onMounted(loadUsers);
</script>

<template>
  <aside class="user-list" aria-label="Lista de usuarios">
    <h2>Usuarios</h2>
    <input
      v-model="search"
      class="user-search"
      type="search"
      placeholder="Buscar usuario"
      aria-label="Buscar usuario"
    />
    <p v-if="search" class="list-state">La búsqueda solo incluye usuarios cargados.</p>

    <p v-if="visibleUsers.length === 0 && !loading && !errorMessage" class="list-state">
      No hay usuarios para mostrar.
    </p>

    <ul v-if="visibleUsers.length">
      <li v-for="user in visibleUsers" :key="user.id">
        <button
          type="button"
          class="user-item"
          :class="{ active: user.id === selectedId }"
          :aria-pressed="user.id === selectedId"
          @click="emit('select', user)"
        >
          <span class="user-avatar" aria-hidden="true">
            <img v-if="user.avatarUrl" :src="user.avatarUrl" alt="" />
            <template v-else>{{ initials(user) }}</template>
          </span>
          <span class="user-text">
            <strong>{{ displayName(user) }}</strong>
            <small>{{ user.email }}</small>
          </span>
        </button>
      </li>
    </ul>
    <p v-if="errorMessage" class="list-state" role="alert">
      {{ errorMessage }}
      <button type="button" @click="loadUsers">Reintentar</button>
    </p>
    <BaseButton
      v-else-if="hasMore"
      type="button"
      color="secondary"
      size="sm"
      :loading="loading"
      @click="loadUsers"
    >
      {{ loading ? "Cargando usuarios..." : "Cargar más" }}
    </BaseButton>
  </aside>
</template>

<style scoped>
.user-list {
  width: 300px;
  flex: 0 0 300px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px 16px;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  max-height: calc(100vh - 85px);
  overflow-y: auto;
}

h2 {
  font-size: 16px;
}

.user-search {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  font: inherit;
  font-size: 13px;
}

ul {
  display: flex;
  flex-direction: column;
  gap: 4px;
  list-style: none;
}

.user-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 0 10px 10px 0;
  background: transparent;
  color: var(--color-text);
  text-align: left;
  cursor: pointer;
}

.user-item:hover,
.user-item.active {
  background: var(--color-background);
}

.user-item.active {
  box-shadow: inset 3px 0 0 var(--color-primary);
}

.user-avatar {
  flex: 0 0 36px;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: var(--radius-lg);
  background: var(--color-primary);
  color: var(--color-primary-foreground);
  font-size: 13px;
  font-weight: bold;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-text strong,
.user-text small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-text strong {
  font-size: 13px;
}

.user-text small,
.list-state {
  font-size: 12px;
  color: var(--color-muted);
}

.list-state button {
  margin-left: 6px;
  background: transparent;
  color: var(--color-primary);
  text-decoration: underline;
  cursor: pointer;
}

@media (max-width: 768px) {
  .user-list {
    width: 100%;
    flex-basis: auto;
    max-height: 280px;
    border-right: 0;
    border-bottom: 1px solid var(--color-border);
  }
}
</style>
