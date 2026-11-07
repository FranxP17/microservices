<script setup>
import AppHeader from '../components/layout/AppHeader.vue';
</script>

<template>
  <div class="home-layout">
    <AppHeader />
    <main class="main">
      <RouterView v-slot="{ Component, route }">
        <Transition name="page" mode="out-in">
          <component :is="Component" :key="route.name" />
        </Transition>
      </RouterView>
    </main>
  </div>
</template>

<style scoped>
.home-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
</style>