<script setup>
import AppHeader from '../components/layout/AppHeader.vue';
const main = 'main';
</script>

<template>
  <AppHeader />
  <main :class="main">
    <RouterView />
  </main>
</template>