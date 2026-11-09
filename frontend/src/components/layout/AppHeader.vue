<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/authStore'
import AccentPicker from '../common/AccentPicker.vue'
import NotificationBell from '../common/NotificationBell.vue'
import ThemeToggle from '../common/ThemeToggle.vue'

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
      <h3> {{ userRole !== 'ADMIN' ? 'Home' : 'Panel administrativo' }}</h3>
      <p>Bienvenido {{userRole !== 'ADMIN' ? userName : 'al sistema'}}</p>
    </div>

    <div class="header-actions">
      <ThemeToggle />
      <AccentPicker />
      <NotificationBell />
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

        <Transition name="dropdown">
          <div v-if="menuOpen" id="user-menu" class="dropdown" role="menu">
            <div class="dropdown-profile">
              <span class="avatar" aria-hidden="true">{{ userInitials }}</span>
              <span class="dropdown-profile-text">
                <strong>{{ userName }}</strong>
                <small>{{ authStore.user?.email || userRole }}</small>
              </span>
            </div>

            <div class="dropdown-section">
              <button class="dropdown-item" type="button" role="menuitem" @click="go('profile')">
                <i class="fa-solid fa-user" aria-hidden="true"></i>
                <span>Mi perfil</span>
              </button>
              <button
                v-if="isAdmin && !inAdminArea"
                class="dropdown-item accent"
                type="button"
                role="menuitem"
                @click="go('dashboard')"
              >
                <i class="fa-solid fa-user-shield" aria-hidden="true"></i>
                <span>Panel de administración</span>
                <i class="fa-solid fa-arrow-right dropdown-arrow" aria-hidden="true"></i>
              </button>
            </div>

            <div class="dropdown-section">
              <button class="dropdown-item danger" type="button" role="menuitem" @click="handleLogout">
                <i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i>
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>
        </Transition>
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
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
  color: var(--color-primary-foreground);
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
  top: calc(100% + 10px);
  right: 0;
  z-index: 20;
  width: 270px;
  overflow: hidden;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-popover);
  transform-origin: top right;
}

.dropdown::before {
  content: "";
  position: absolute;
  top: -6px;
  right: 24px;
  width: 11px;
  height: 11px;
  background: var(--color-background);
  border-top: 1px solid var(--color-border);
  border-left: 1px solid var(--color-border);
  transform: rotate(45deg);
}

.dropdown-profile {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--color-background);
  border-bottom: 1px solid var(--color-border);
}

.dropdown-profile-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.dropdown-profile-text strong {
  font-size: 14px;
}

.dropdown-profile-text small {
  font-size: 12px;
  color: var(--color-muted);
}

.dropdown-profile-text strong,
.dropdown-profile-text small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px;
}

.dropdown-section + .dropdown-section {
  border-top: 1px solid var(--color-border);
}

.dropdown-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--radius-lg);
  background: transparent;
  color: var(--color-text);
  font-size: 13px;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition:
    background-color 0.14s ease,
    color 0.14s ease;
}

.dropdown-item > i:first-child {
  flex: 0 0 18px;
  text-align: center;
  color: var(--color-muted);
  transition: color 0.14s ease;
}

.dropdown-item:hover,
.dropdown-item:focus-visible {
  background: var(--color-background);
}

.dropdown-item:hover > i:first-child {
  color: var(--color-primary);
}

.dropdown-item.accent {
  color: var(--color-primary-dark);
}

.dropdown-item.accent > i:first-child {
  color: var(--color-primary);
}

.dropdown-arrow {
  margin-left: auto;
  font-size: 11px;
  opacity: 0.6;
  transition: transform 0.14s ease;
}

.dropdown-item.accent:hover .dropdown-arrow {
  transform: translateX(3px);
}

.dropdown-item.danger,
.dropdown-item.danger > i:first-child {
  color: var(--color-danger);
}

.dropdown-item.danger:hover {
  background: var(--color-danger-bg);
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition:
    opacity 0.14s ease,
    transform 0.14s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
}

@media (prefers-reduced-motion: reduce) {
  .dropdown-enter-active,
  .dropdown-leave-active {
    transition: none;
  }
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
