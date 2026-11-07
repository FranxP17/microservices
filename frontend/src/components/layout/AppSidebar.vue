<script setup>
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../../stores/authStore";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const isCollapsed = ref(false);

const navigationGroups = computed(() => {
  const userRole = authStore.userRole?.toLowerCase();
  const items = router
    .getRoutes()
    .filter((record) => {
      const navigation = record.meta.navigation;
      return (
        record.name &&
        navigation &&
        (!navigation.roles?.length ||
          navigation.roles.some((role) => role.toLowerCase() === userRole))
      );
    })
    .map((record) => ({
      routeName: record.name,
      ...record.meta.navigation,
      section: record.meta.navigation.section || "GENERAL",
      order: record.meta.navigation.order ?? 0,
    }))
    .sort((a, b) => a.order - b.order);

  return items.reduce((groups, item) => {
    const group = groups.find((entry) => entry.name === item.section);
    if (group) {
      group.items.push(item);
    } else {
      groups.push({ name: item.section, items: [item] });
    }
    return groups;
  }, []);
});

function isActive(routeName) {
  return route.matched.some((record) => record.name === routeName);
}

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
  <aside class="sidebar" :class="{ 'is-collapsed': isCollapsed }">
    <button
      class="sidebar-toggle"
      type="button"
      :aria-label="isCollapsed ? 'Expandir menú' : 'Contraer menú'"
      :aria-expanded="!isCollapsed"
      @click="isCollapsed = !isCollapsed"
    >
      <i
        class="menu-icon"
        :class="isCollapsed ? 'fa-solid fa-angles-right' : 'fa-solid fa-angles-left'"
        aria-hidden="true"
      ></i>
      <span class="menu-text">{{ isCollapsed ? "Expandir" : "Contraer" }}</span>
    </button>

    <nav class="sidebar-menu" aria-label="Navegación principal">
      <section v-for="group in navigationGroups" :key="group.name" class="menu-group">
        <p class="menu-label">{{ group.name }}</p>

        <RouterLink
          v-for="item in group.items"
          :key="item.routeName"
          :to="{ name: item.routeName }"
          class="menu-item"
          :class="{ active: isActive(item.routeName) }"
          :aria-current="isActive(item.routeName) ? 'page' : undefined"
          :aria-label="item.label"
          :title="item.label"
        >
          <i class="menu-icon" :class="item.icon" aria-hidden="true"></i>
          <span class="menu-text">{{ item.label }}</span>
        </RouterLink>
      </section>
    </nav>

    <div class="sidebar-footer">
      <button
        class="logout-button"
        type="button"
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
        @click="handleLogout"
      >
        <i class="menu-icon fa-solid fa-right-from-bracket" aria-hidden="true"></i>
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
  color: var(--color-text);
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
  transition:
    width 0.18s ease,
    flex-basis 0.18s ease;
}

.sidebar.is-collapsed {
  width: 76px;
  flex-basis: 76px;
}

.sidebar-toggle {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-bottom: 20px;
  padding: 8px 12px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--color-sidebar-text);
  cursor: pointer;
}

.sidebar-toggle:hover {
  background: var(--color-sidebar-hover);
  color: var(--color-primary);
}

.sidebar.is-collapsed .sidebar-toggle {
  justify-content: center;
}

.menu-label {
  font-size: 11px;
  color: var(--color-sidebar-muted);
  padding: 0 12px;
  margin-bottom: 12px;
}

.menu-group + .menu-group {
  margin-top: 20px;
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
  color: var(--color-sidebar-text);
  text-decoration: none;
  border-radius: 0 8px 8px 0;
  transition:
    background-color 0.16s ease,
    color 0.16s ease;
}

.menu-item:hover,
.menu-item.active {
  background: var(--color-sidebar-hover);
  color: var(--color-primary);
}

.menu-item.active {
  border-left: 3px solid var(--color-primary);
  padding-left: 9px;
}

.menu-icon {
  flex: 0 0 22px;
  width: 22px;
  text-align: center;
}

.sidebar.is-collapsed .menu-label,
.sidebar.is-collapsed .menu-text,
.sidebar.is-collapsed .logout-text,
.sidebar.is-collapsed .sidebar-version {
  display: none;
}

.sidebar.is-collapsed .menu-item,
.sidebar.is-collapsed .logout-button {
  justify-content: center;
  padding-right: 0;
  padding-left: 0;
}

.sidebar-footer {
  margin-top: auto;
  padding: 20px 12px 0;
  font-size: 12px;
  color: var(--color-sidebar-muted);
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
  color: var(--color-sidebar-text);
  text-align: left;
}

.logout-button:hover {
  background: var(--color-sidebar-hover);
  color: var(--color-danger);
}

.menu-item:focus-visible,
.sidebar-toggle:focus-visible,
.logout-button:focus-visible {
  outline-color: var(--color-primary);
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

  .sidebar.is-collapsed {
    width: 76px;
    flex-basis: 76px;
  }
}

@media (max-width: 560px) {
  .sidebar {
    width: 65px;
    flex-basis: 65px;
    padding: 20px 8px;
  }

  .sidebar-toggle {
    display: none;
  }

  .menu-label,
  .menu-text,
  .logout-text,
  .sidebar-version {
    display: none;
  }

  .menu-item {
    justify-content: center;
    padding-right: 0;
    padding-left: 0;
  }

  .sidebar-toggle {
    justify-content: center;
    padding-right: 0;
    padding-left: 0;
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
