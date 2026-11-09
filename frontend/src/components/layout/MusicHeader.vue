<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../../stores/authStore";
import { musicService } from "../../features/home/services/musicService";
import AccentPicker from "../common/AccentPicker.vue";
import NotificationBell from "../common/NotificationBell.vue";
import ThemeToggle from "../common/ThemeToggle.vue";

const roles = ["JOYENT", "CRITIC", "ADMIN"];
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const searchTerm = ref(String(route.query.q ?? ""));
const searchType = ref("track");
const searchResults = ref([]);
const searchLoading = ref(false);
const searchError = ref("");
const searchOpen = ref(false);
const searchWrapRef = ref(null);
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
  const query = searchTerm.value.trim();
  if (!query) {
    searchResults.value = [];
    searchOpen.value = false;
    return;
  }

  searchOpen.value = true;
  searchLoading.value = true;
  searchError.value = "";
  try {
    const response = await musicService.searchDeezer(query, searchType.value);
    const results = Array.isArray(response)
      ? response
      : response?.data ?? response?.Data ?? response?.items ?? response?.Items ?? [];
    searchResults.value = results.map((item) => ({
      id: String(item.id ?? item.Id ?? ""),
      title: item.name ?? item.Name ?? item.title ?? item.Title ?? "Canción",
      type: item.type ?? item.Type ?? searchType.value,
      artists: item.artists ?? item.Artists ?? [],
      albumTitle: item.albumTitle ?? item.AlbumTitle ?? item.album?.title ?? item.album?.Title ?? "",
      imageUrl: item.imageUrl ?? item.ImageUrl ?? "",
      durationSeconds: item.durationSeconds ?? item.DurationSeconds ?? 0,
      genres: item.genres ?? item.Genres ?? [],
    })).filter((item) => item.id);
  } catch {
    searchError.value = "No se pudo buscar en el catálogo. Inténtalo de nuevo.";
    searchResults.value = [];
  } finally {
    searchLoading.value = false;
  }
}

function artistNames(artists) {
  return artists
    .map((artist) => typeof artist === "string" ? artist : artist.name ?? artist.Name)
    .filter(Boolean)
    .join(", ");
}

async function reviewResult(track) {
  searchOpen.value = false;
  if (track.type === "album") {
    await router.push({
      name: "write-review",
      query: { deezerAlbumId: track.id, q: searchTerm.value.trim() },
    });
    return;
  }
  await router.push({
    name: "write-review",
    query: { deezerId: track.id, q: searchTerm.value.trim() },
  });
}

async function openAlbumDetails(track) {
  searchOpen.value = false;
  await router.push({ name: "album-detail", params: { externalId: track.id } });
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
  if (searchOpen.value && !searchWrapRef.value?.contains(event.target)) {
    searchOpen.value = false;
  }
}

function handleKeydown(event) {
  if (event.key === "Escape" && profileMenuOpen.value) {
    closeProfileMenu({ restoreFocus: true });
  }
  if (event.key === "Escape" && searchOpen.value) searchOpen.value = false;
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
      <div ref="searchWrapRef" class="music-search-wrap">
        <form class="music-search" role="search" @submit.prevent="submitSearch">
          <button type="submit" :aria-label="searchType === 'album' ? 'Buscar álbumes' : 'Buscar canciones'">
            <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
          </button>
          <input
            v-model="searchTerm"
            type="search"
            :placeholder="searchType === 'album' ? 'Buscar álbumes o artistas' : 'Buscar canciones o artistas'"
            :aria-label="searchType === 'album' ? 'Buscar álbumes o artistas' : 'Buscar canciones o artistas'"
            aria-controls="music-search-results"
            :aria-expanded="searchOpen"
            @focus="searchOpen = true"
          />
        </form>
        <Transition name="search-results">
          <div v-if="searchOpen" id="music-search-results" class="music-search-results" role="region" aria-label="Resultados de búsqueda musical">
            <div class="music-search__modes" role="group" aria-label="Buscar tipo de obra">
              <button type="button" :class="{ selected: searchType === 'track' }" :aria-pressed="searchType === 'track'" @click="searchType = 'track'; searchResults = []; searchOpen = true">Canciones</button>
              <button type="button" :class="{ selected: searchType === 'album' }" :aria-pressed="searchType === 'album'" @click="searchType = 'album'; searchResults = []; searchOpen = true">Álbumes</button>
            </div>
            <p v-if="searchLoading" class="music-search-results__state" role="status">Buscando {{ searchType === 'album' ? 'álbumes' : 'canciones' }}...</p>
            <p v-else-if="searchError" class="music-search-results__state is-error" role="alert">{{ searchError }}</p>
            <p v-else-if="!searchResults.length" class="music-search-results__state">Escribe un nombre y pulsa buscar.</p>
            <div v-for="track in searchResults" :key="track.id" class="music-search-result">
              <button class="music-search-result__main" type="button" @click="reviewResult(track)">
                <img v-if="track.imageUrl" :src="track.imageUrl" alt="" />
                <span v-else class="music-search-result__placeholder"><i class="fa-solid" :class="track.type === 'album' ? 'fa-compact-disc' : 'fa-music'" aria-hidden="true"></i></span>
                <span class="music-search-result__copy"><strong>{{ track.title }}</strong><small>{{ track.type === 'album' ? 'Álbum' : artistNames(track.artists) }}<span v-if="track.albumTitle && track.type !== 'album'"> · {{ track.albumTitle }}</span><span v-else-if="track.type === 'album' && track.artists.length"> · {{ artistNames(track.artists) }}</span></small></span>
                <span class="music-search-result__action">Reseñar <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span>
              </button>
              <button v-if="track.type === 'album'" class="music-search-result__details" type="button" :aria-label="`Ver detalles de ${track.title}`" title="Ver detalles del álbum" @click="openAlbumDetails(track)"><i class="fa-solid fa-list" aria-hidden="true"></i></button>
            </div>
          </div>
        </Transition>
      </div>
      <RouterLink class="write-review-link" :to="{ name: 'write-review' }">
        <i class="fa-solid fa-plus" aria-hidden="true"></i>
        <span>Escribir reseña</span>
      </RouterLink>
      <ThemeToggle />
      <AccentPicker />
      <NotificationBell />
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

.music-search-wrap {
  position: relative;
  flex: 0 1 340px;
  min-width: 180px;
}

.music-search {
  width: 100%;
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

.music-search-results {
  position: absolute;
  top: calc(100% + 9px);
  right: 0;
  z-index: 45;
  width: min(420px, calc(100vw - 32px));
  max-height: min(68vh, 480px);
  overflow: auto;
  padding: 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-popover);
}

.music-search-results__state {
  padding: 13px 10px;
  color: var(--color-muted);
  font-size: 12px;
}

.music-search-results__state.is-error {
  color: var(--color-danger);
}

.music-search-result {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-width: 0;
  padding: 8px;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text);
  transition: background-color 140ms ease;
}

.music-search__modes { display: flex; gap: 4px; padding: 4px; border-radius: var(--radius-md); background: var(--color-surface-muted); }
.music-search__modes button { min-height: 30px; flex: 1; border-radius: 5px; background: transparent; color: var(--color-muted); font-size: 10px; font-weight: 650; cursor: pointer; }
.music-search__modes button.selected { background: var(--color-surface); color: var(--color-primary); box-shadow: var(--shadow-card); }
.music-search-result:hover { background: var(--color-hover); }
.music-search-result__main { display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1; padding: 0; border: 0; background: transparent; color: inherit; font: inherit; text-align: left; cursor: pointer; }
.music-search-result__main:focus-visible,
.music-search-result__details:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
.music-search-result__details { display: grid; width: 34px; height: 34px; flex: 0 0 34px; place-items: center; border: 1px solid var(--color-border); border-radius: 6px; background: var(--color-surface); color: var(--color-primary); cursor: pointer; }
.music-search-result__details:hover {
  background: var(--color-hover);
}

.music-search-result__main > img,
.music-search-result__placeholder {
  display: grid;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  place-items: center;
  border-radius: 5px;
  background: var(--color-surface-muted);
  color: var(--color-primary);
  object-fit: cover;
}

.music-search-result__copy {
  display: grid;
  min-width: 0;
  flex: 1;
  gap: 3px;
}

.music-search-result__copy strong,
.music-search-result__copy small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.music-search-result__copy strong { font-size: 12px; }
.music-search-result__copy small { color: var(--color-muted); font-size: 10px; }
.music-search-result__action { display: inline-flex; align-items: center; gap: 6px; color: var(--color-primary); font-size: 10px; font-weight: 700; white-space: nowrap; }
.music-search-result__action i { font-size: 9px; }

.search-results-enter-active,
.search-results-leave-active { transition: opacity 120ms ease, transform 120ms ease; }
.search-results-enter-from,
.search-results-leave-to { opacity: 0; transform: translateY(-4px); }

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
  .music-search-wrap {
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

  .music-search-wrap {
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
