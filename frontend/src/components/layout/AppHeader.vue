<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/authStore'

const roles = ['JOYENT', 'CRITIC', 'ADMIN']
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const menuOpen = ref(false)
const menuRef = ref(null)
const toggleRef = ref(null)

const userName = computed(() => authStore.user?.name || authStore.user?.displayName || 'Usuario')
const roleName = computed(() => {
  const role = authStore.user?.role
  if (typeof role === 'number') return roles[role] ?? ''
  const normalized = String(role ?? '').toUpperCase()
  return /^\d+$/.test(normalized) ? (roles[Number(normalized)] ?? '') : normalized
})
const userRole = computed(() => roleName.value || 'Cuenta')
const isAdmin = computed(() => roleName.value === 'ADMIN')
const inAdminArea = computed(() => route.matched.some((record) => record.name === 'dashboard'))
const userInitials = computed(() =>
  userName.value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase(),
)

function closeMenu({ focusToggle = false } = {}) {
  menuOpen.value = false
  if (focusToggle) toggleRef.value?.focus()
}

async function go(name) {
  closeMenu()
  await router.push({ name })
}

async function handleLogout() {
  closeMenu()
  try {
    await authStore.logout()
    await router.replace({ name: 'login' })
  } catch {
    await router.replace({ name: 'login', query: { logoutError: '1' } })
  }
}

function handleOutsideClick(event) {
  if (menuOpen.value && !menuRef.value?.contains(event.target)) closeMenu()
}

function handleKeydown(event) {
  if (event.key === 'Escape' && menuOpen.value) closeMenu({ focusToggle: true })
}

onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideClick)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <header class="app-header">
    <div>
      <h3>Panel administrativo</h3>
      <p>Bienvenido al sistema</p>
    </div>

    <div ref="menuRef" class="header-menu">
      <button
        ref="toggleRef"
        class="header-user"
        type="button"
        aria-haspopup="menu"
        :aria-expanded="menuOpen"
        aria-controls="user-menu"
        @click="menuOpen = !menuOpen"
      >
        <span class="avatar" aria-hidden="true">{{ userInitials }}</span>
        <span class="user-info">
          <strong>{{ userName }}</strong>
          <span>{{ userRole }}</span>
        </span>
        <i
          class="fa-solid fa-chevron-down chevron"
          :class="{ open: menuOpen }"
          aria-hidden="true"
        ></i>
      </button>

      <div v-if="menuOpen" id="user-menu" class="dropdown" role="menu">
        <button class="dropdown-item" type="button" role="menuitem" @click="go('home')">
          <i class="fa-solid fa-user" aria-hidden="true"></i> Mi perfil
        </button>
        <button
          v-if="isAdmin && !inAdminArea"
          class="dropdown-item"
          type="button"
          role="menuitem"
          @click="go('dashboard')"
        >
          <i class="fa-solid fa-user-shield" aria-hidden="true"></i> Panel de administración
        </button>
        <hr />
        <button class="dropdown-item danger" type="button" role="menuitem" @click="handleLogout">
          <i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i> Cerrar sesión
        </button>
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

.header-menu {
  position: relative;
}

.header-user {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 8px;
  border-radius: var(--radius-lg);
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.header-user:hover {
  background: var(--color-background);
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

.chevron {
  font-size: 11px;
  color: var(--color-muted);
  transition: transform 0.16s ease;
}

.chevron.open {
  transform: rotate(180deg);
}

.dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 20;
  min-width: 220px;
  padding: 6px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 24px rgba(22, 42, 36, 0.14);
}

.dropdown hr {
  margin: 6px 0;
  border: 0;
  border-top: 1px solid var(--color-border);
}

.dropdown-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}

.dropdown-item i {
  width: 16px;
  text-align: center;
  color: var(--color-muted);
}

.dropdown-item:hover {
  background: var(--color-background);
}

.dropdown-item.danger,
.dropdown-item.danger i {
  color: #b42318;
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
