<script setup>
import AppSidebar from '../components/layout/AppSidebar.vue'
import AppHeader from '../components/layout/AppHeader.vue'
</script>

<template>
  <main class="admin-layout">
    <AppHeader />
    <div class="admin-shell">
      <AppSidebar />
      <section class="admin-content">
        <RouterView v-slot="{ Component, route }">
          <Transition name="page" mode="out-in">
            <component :is="Component" :key="route.name" />
          </Transition>
        </RouterView>
      </section>
    </div>
  </main>
</template>

<style scoped>
.admin-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--color-background);
}

.admin-shell {
  display: flex;
  flex: 1;
  min-height: calc(100vh - 85px);
  align-items: stretch;
}

.admin-content {
  flex: 1;
  min-width: 0;
  padding: 28px;
}

@media (max-width: 768px) {
  .admin-content {
    padding: 16px;
  }
}
</style>