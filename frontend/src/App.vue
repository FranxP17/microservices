<template>
  <RouterView v-slot="{ Component, route }">
    <Transition name="page" mode="out-in" appear>
      <component :is="Component" :key="route.matched[0]?.path" />
    </Transition>
  </RouterView>
</template>