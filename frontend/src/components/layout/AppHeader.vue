<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../../stores/authStore'

const authStore = useAuthStore()
const userName = computed(() => authStore.user?.name || authStore.user?.displayName || 'Usuario')
const userRole = computed(() => authStore.user?.role || 'Cuenta')
const userInitials = computed(() =>
  userName.value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase(),
)
</script>

<template>
  <header class="app-header">
    <div>
      <h3>Panel administrativo</h3>
      <p>Bienvenido al sistema</p>
    </div>

    <div class="header-user">
      <div class="avatar" aria-hidden="true">{{ userInitials }}</div>
      <div class="user-info">
        <strong>{{ userName }}</strong>
        <span>{{ userRole }}</span>
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  height: 85px;
  flex: 0 0 85px;
  padding: 16px 28px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.app-header h3 {
  font-size: 17px;
}

.app-header p {
  font-size: 12px;
  color: var(--color-muted);
  margin-top: 5px;
}

.header-user {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  flex: 0 0 40px;
  width: 40px;
  height: 40px;
  background: var(--color-primary);
  color: white;
  display: grid;
  place-items: center;
  border-radius: 8px;
  font-weight: bold;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-info strong {
  font-size: 13px;
}

.user-info span {
  font-size: 11px;
  color: var(--color-muted);
}

@media (max-width: 560px) {
  .app-header {
    padding: 12px 16px;
  }

  .user-info {
    display: none;
  }
}
</style>