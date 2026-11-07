<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../../stores/authStore";
import AccentPicker from "../common/AccentPicker.vue";
import ThemeToggle from "../common/ThemeToggle.vue";

const roles = ["JOYENT", "CRITIC", "ADMIN"];
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const searchTerm = ref(String(route.query.q ?? ""));
const profileMenuOpen = ref(false);
const profileMenuRef = ref(null);
const profileButtonRef = ref(null);
const userRole = computed(() => {
  const role = authStore.user?.role;
  if (typeof role === "number") return roles[role] ?? "";
  const normalized = String(role ?? "").toUpperCase();
  return /^\d+$/.test(normalized) ? roles[Number(normalized)] ?? "" : normalized;
});
const isAdmin = computed(() => userRole.value === "ADMIN");
const userInitials = computed(() => {
  const name = authStore.user?.displayName || authStore.user?.name || "Usuario";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
});

async function submitSearch() {
  await router.push({
    name: "home",
    query: searchTerm.value.trim() ? { q: searchTerm.value.trim() } : {},
  });
}

function closeProfileMenu({ restoreFocus = false } = {}) {
  profileMenuOpen.value = false;
  if (restoreFocus) profileButtonRef.value?.focus();
}

async function navigateTo(name) {
  closeProfileMenu();
  await router.push({ name });
}

async function handleLogout() {
  closeProfileMenu();
  try {
    await authStore.logout();
    await router.replace({ name: "login" });
  } catch {
    await router.replace({ name: "login", query: { logoutError: "1" } });
  }
}

function handleOutsideClick(event) {
  if (profileMenuOpen.value && !profileMenuRef.value?.contains(event.target)) {
    closeProfileMenu();
  }
}

function handleKeydown(event) {
  if (event.key === "Escape" && profileMenuOpen.value) {
    closeProfileMenu({ restoreFocus: true });
  }
}

onMounted(() => {
  document.addEventListener("click", handleOutsideClick);
  document.addEventListener("keydown", handleKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleOutsideClick);
  document.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <header class="music-header">
    <div class="music-header__brand-nav">
      <RouterLink class="music-brand" :to="{ name: 'home' }" aria-label="Faudix, explorar">
        <span class="music-brand__mark" aria-hidden="true">
          <i class="fa-solid fa-wave-square"></i>
        </span>
        <span>Faudix</span>
      </RouterLink>

      <nav class="music-nav" aria-label="Navegación principal">
        <RouterLink class="music-nav__link" :class="{ 'is-active': route.name === 'home' && !route.hash }" :to="{ name: 'home' }">
          Explorar
        </RouterLink>
        <RouterLink class="music-nav__link" :to="{ name: 'home', hash: '#new-releases' }">
          Novedades
        </RouterLink>
        <RouterLink class="music-nav__link" :to="{ name: 'home', hash: '#lists' }">
          Listas
        </RouterLink>
        <RouterLink class="music-nav__link" :to="{ name: 'home', hash: '#community' }">
          Comunidad
        </RouterLink>
      </nav>
    </div>

    <div class="music-header__tools">
      <form class="music-search" role="search" @submit.prevent="submitSearch">
        <button type="submit" aria-label="Buscar">
          <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
        </button>
        <input
          v-model="searchTerm"
          type="search"
          placeholder="Buscar canciones, álbumes, artistas o usuarios"
          aria-label="Buscar canciones, álbumes, artistas o usuarios"
        />
      </form>
      <RouterLink class="write-review-link" :to="{ name: 'write-review' }">
        <i class="fa-solid fa-plus" aria-hidden="true"></i>
        <span>Escribir reseña</span>
      </RouterLink>
      <ThemeToggle />
      <AccentPicker />
      <div ref="profileMenuRef" class="profile-menu">
        <button
          v-if="authStore.isAuthenticated"
          ref="profileButtonRef"
          class="music-profile-link"
          type="button"
          aria-label="Abrir menú de usuario"
          aria-haspopup="menu"
          aria-controls="music-user-menu"
          :aria-expanded="profileMenuOpen"
          @click="profileMenuOpen = !profileMenuOpen"
        >
          <span class="music-profile-avatar" aria-hidden="true">{{ userInitials }}</span>
        </button>
        <div v-else class="guest-actions">
          <RouterLink class="guest-actions__login" :to="{ name: 'login' }">Iniciar sesión</RouterLink>
          <RouterLink class="guest-actions__register" :to="{ name: 'register' }">Crear cuenta</RouterLink>
        </div>

        <Transition name="profile-menu">
          <div
            v-if="profileMenuOpen && authStore.isAuthenticated"
            id="music-user-menu"
            class="profile-dropdown"
            role="menu"
          >
            <div class="profile-dropdown__identity">
              <span class="music-profile-avatar" aria-hidden="true">{{ userInitials }}</span>
              <span>
                <strong>{{ authStore.user?.displayName || authStore.user?.name || "Usuario" }}</strong>
                <small>{{ authStore.user?.email || userRole }}</small>
              </span>
            </div>
            <div class="profile-dropdown__links">
              <button type="button" role="menuitem" @click="navigateTo('profile')">
                <i class="fa-regular fa-user" aria-hidden="true"></i>
                <span>Mi perfil</span>
              </button>
              <button
                v-if="isAdmin"
                type="button"
                role="menuitem"
                @click="navigateTo('dashboard')"
              >
                <i class="fa-solid fa-shield-halved" aria-hidden="true"></i>
                <span>Panel de administración</span>
                <i class="fa-solid fa-arrow-up-right-from-square profile-dropdown__arrow" aria-hidden="true"></i>
              </button>
            </div>
            <div class="profile-dropdown__links profile-dropdown__footer">
              <button class="is-danger" type="button" role="menuitem" @click="handleLogout">
                <i class="fa-solid fa-arrow-right-from-bracket" aria-hidden="true"></i>
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
.music-header {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  min-height: 64px;
  padding: 8px clamp(16px, 3vw, 40px);
  border-bottom: 1px solid var(--color-border);
  background: color-mix(in srgb, var(--color-surface) 92%, transparent);
  color: var(--color-text);
  backdrop-filter: blur(12px);
}

.music-header__brand-nav,
.music-header__tools,
.music-brand,
.music-nav,
.music-search,
.write-review-link {
  display: flex;
  align-items: center;
}

.music-header__brand-nav {
  min-width: 0;
  gap: clamp(16px, 3vw, 40px);
}

.music-brand {
  gap: 8px;
  color: var(--color-text);
  font-family: var(--font-heading);
  font-size: 17px;
  font-weight: 800;
  text-decoration: none;
}

.music-brand__mark {
  display: grid;
  width: 25px;
  height: 25px;
  place-items: center;
  color: var(--color-primary);
  font-size: 16px;
}

.music-nav {
  gap: 4px;
}

.music-nav__link {
  padding: 8px 12px;
  border-radius: 999px;
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  transition:
    background-color 140ms ease,
    color 140ms ease;
}

.music-nav__link:hover,
.music-nav__link.is-active {
  background: var(--color-hover);
  color: var(--color-primary);
}

.music-header__tools {
  flex: 1;
  justify-content: flex-end;
  gap: 10px;
}

.music-search {
  width: min(28vw, 340px);
  height: 40px;
  gap: 9px;
  padding: 0 12px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: var(--color-surface-muted);
  transition:
    background-color 140ms ease,
    border-color 140ms ease;
}

.music-search:focus-within {
  border-color: var(--color-primary);
  background: var(--color-surface);
}

.music-search button {
  padding: 0;
  background: transparent;
  color: var(--color-muted);
  cursor: pointer;
}

.music-search input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--color-text);
  font: inherit;
  font-size: 12px;
}

.music-search input::placeholder {
  color: var(--color-muted);
}

.write-review-link {
  justify-content: center;
  gap: 8px;
  min-height: 40px;
  padding: 0 15px;
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: var(--color-primary-foreground);
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
  transition: background-color 140ms ease;
}

.write-review-link:hover {
  background: var(--color-primary-dark);
}

.music-profile-link {
  display: grid;
  flex: 0 0 38px;
  width: 38px;
  height: 38px;
  place-items: center;
  padding: 0;
  border: 2px solid var(--color-border);
  border-radius: 50%;
  background: var(--color-surface);
  cursor: pointer;
  transition: border-color 140ms ease;
}

.music-profile-link:hover,
.music-profile-link[aria-expanded="true"] {
  border-color: var(--color-primary);
}

.profile-menu {
  position: relative;
}

.profile-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  z-index: 40;
  width: min(280px, calc(100vw - 24px));
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-popover);
  transform-origin: top right;
}

.profile-dropdown__identity {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
  padding: 14px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-hover);
}

.profile-dropdown__identity > span:last-child {
  display: grid;
  min-width: 0;
  gap: 3px;
}

.profile-dropdown__identity strong,
.profile-dropdown__identity small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-dropdown__identity strong {
  color: var(--color-text);
  font-size: 13px;
}

.profile-dropdown__identity small {
  color: var(--color-muted);
  font-size: 11px;
}

.profile-dropdown__links {
  display: grid;
  gap: 2px;
  padding: 6px;
}

.profile-dropdown__footer {
  border-top: 1px solid var(--color-border);
}

.profile-dropdown__links button {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 38px;
  padding: 0 10px;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text);
  font: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}

.profile-dropdown__links button:hover,
.profile-dropdown__links button:focus-visible {
  background: var(--color-hover);
}

.profile-dropdown__links button > i:first-child {
  width: 16px;
  color: var(--color-muted);
  text-align: center;
}

.profile-dropdown__links .profile-dropdown__arrow {
  margin-left: auto;
  color: var(--color-muted);
  font-size: 11px;
}

.profile-dropdown__links button.is-danger,
.profile-dropdown__links button.is-danger > i:first-child {
  color: var(--color-danger);
}

.profile-dropdown__links button.is-danger:hover {
  background: var(--color-danger-bg);
}

.profile-menu-enter-active,
.profile-menu-leave-active {
  transition: opacity 140ms ease, transform 140ms ease;
}

.profile-menu-enter-from,
.profile-menu-leave-to {
  opacity: 0;
  transform: translateY(-5px) scale(0.98);
}

.guest-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.guest-actions__login,
.guest-actions__register {
  padding: 9px 12px;
  border-radius: var(--radius-md);
  color: var(--color-text);
  font-size: 12px;
  font-weight: 650;
  text-decoration: none;
}

.guest-actions__login:hover {
  background: var(--color-hover);
}

.guest-actions__register {
  background: var(--color-primary);
  color: var(--color-primary-foreground);
}

.guest-actions__register:hover {
  background: var(--color-primary-dark);
}

.music-profile-avatar {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border-radius: 50%;
  background: var(--color-primary-container);
  color: var(--color-primary);
  font-size: 11px;
  font-weight: 700;
}

@media (max-width: 1000px) {
  .music-search {
    width: 220px;
  }

  .music-header__brand-nav {
    gap: 16px;
  }

  .music-nav__link {
    padding-inline: 8px;
  }
}

@media (max-width: 760px) {
  .music-header {
    flex-wrap: wrap;
    gap: 4px 12px;
    padding: 8px 16px;
  }

  .music-header__brand-nav {
    flex: 1;
    justify-content: space-between;
  }

  .music-nav {
    gap: 0;
  }

  .music-nav__link {
    padding: 7px 8px;
    font-size: 12px;
  }

  .music-header__tools {
    flex: 1 1 100%;
    justify-content: space-between;
  }

  .music-search {
    flex: 1;
    width: auto;
  }

  .write-review-link {
    padding-inline: 12px;
  }
}

@media (max-width: 480px) {
  .music-nav__link:nth-child(n + 3) {
    display: none;
  }

  .write-review-link span {
    display: none;
  }

  .write-review-link {
    width: 40px;
    padding: 0;
  }

  .guest-actions__login {
    display: none;
  }
}
</style>
