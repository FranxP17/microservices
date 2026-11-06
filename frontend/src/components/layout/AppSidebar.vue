<script setup>
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../../stores/authStore";

const title = document.getElementById("title");

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const menuItems = [
  { name: "Dashboard", routeName: "dashboard", icon: "<i class='fa-solid fa-house'></i>" },
  { name: "Usuarios", routeName: "users", icon: "<i class='fa-solid fa-users'></i>" },
];

async function handleLogout() {
  try {
    await authStore.logout();
    await router.replace({ name: "login" });
  } catch {
    await router.replace({ name: "login", query: { logoutError: "1" } });
  }
}
</script>

<template>
  <aside class="sidebar">
    <nav class="sidebar-menu">
      <p class="menu-label">GENERAL</p>

      <RouterLink
        v-for="item in menuItems"
        :key="item.routeName"
        :to="{ name: item.routeName }"
        class="menu-item"
        :class="{ active: route.name === item.routeName }"
        :aria-current="route.name === item.routeName ? 'page' : undefined"
        :aria-label="item.name"
        :title="item.name"
      >
        <span class="menu-icon" aria-hidden="true" v-html="item.icon"></span>
        <span class="menu-text">{{ item.name }}</span>
      </RouterLink>
    </nav>

    <div class="sidebar-footer">
      <button
        class="logout-button"
        type="button"
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
        @click="handleLogout"
      >
        <span class="menu-icon" aria-hidden="true">↪</span>
        <span class="logout-text">Cerrar sesión</span>
      </button>
      <span class="sidebar-version">Administracion</span>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 250px;
  flex: 0 0 250px;
  min-height: 100%;
  background: var(--color-sidebar);
  color: white;
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
}

.sidebar-brand {
  padding: 8px 12px 35px;
}

.sidebar-brand h2 {
  font-size: 22px;
  white-space: nowrap;
}

.sidebar-brand span {
  color: var(--color-primary);
}

.menu-label {
  font-size: 11px;
  color: #9299a8;
  padding: 0 12px;
  margin-bottom: 12px;
}

.sidebar-menu {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  color: #c4c9d4;
  text-decoration: none;
  border-radius: 0 8px 8px 0;
  transition:
    background-color 0.16s ease,
    color 0.16s ease;
}

.menu-item:hover,
.menu-item.active {
  background: var(--color-sidebar-hover);
  color: white;
}

.menu-item.active {
  border-left: 3px solid var(--color-primary);
  padding-left: 9px;
}

.menu-icon {
  width: 22px;
  text-align: center;
}

.sidebar-footer {
  margin-top: auto;
  padding: 20px 12px 0;
  font-size: 12px;
  color: #9299a8;
}

.logout-button {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #c4c9d4;
  text-align: left;
}

.logout-button:hover {
  background: var(--color-sidebar-hover);
  color: white;
}

.menu-item:focus-visible,
.logout-button:focus-visible {
  outline-color: white;
}

.sidebar-version {
  display: block;
  padding: 16px 0 0;
}

@media (max-width: 768px) {
  .sidebar {
    width: 190px;
    flex-basis: 190px;
  }
}

@media (max-width: 560px) {
  .sidebar {
    width: 65px;
    flex-basis: 65px;
    padding: 20px 8px;
  }

  .sidebar-brand h2 {
    font-size: 0;
  }

  .sidebar-brand h2::after {
    content: "A";
    font-size: 22px;
  }

  .menu-label,
  .menu-text,
  .logout-text,
  .sidebar-version {
    display: none;
  }

  .menu-item {
    justify-content: center;
  }

  .logout-button {
    justify-content: center;
    padding: 12px 0;
  }

  .sidebar-footer {
    padding-right: 0;
    padding-left: 0;
  }
}
</style>
