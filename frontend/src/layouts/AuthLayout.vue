<template>
  <main class="auth-layout">
    <header class="auth-topbar">
      <RouterLink class="auth-brand" :to="{ name: 'login' }" aria-label="Faudix, acceso">
        <span class="auth-brand__mark" aria-hidden="true">
          <i class="fa-solid fa-wave-square"></i>
        </span>
        <span>Faudix</span>
      </RouterLink>
      <div class="auth-controls">
        <ThemeToggle />
        <AccentPicker />
      </div>
    </header>

    <div class="auth-stage">
      <aside class="auth-story" aria-label="Faudix, comunidad de crítica musical">
        <div class="auth-story__art-wrap">
          <img
            class="auth-story__art"
            src="https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=900&h=900&fit=crop&auto=format&q=85"
            alt="Arte del álbum destacado de Faudix"
          />
          <span class="auth-story__tag">Álbum de la semana</span>
        </div>
        <p class="auth-story__eyebrow">ESCUCHA · DESCUBRE · COMPARTE</p>
        <h1>La música también se escribe.</h1>
        <p class="auth-story__copy">
          Un espacio para descubrir álbumes y compartir lo que te hacen sentir.
        </p>
      </aside>

      <section class="auth-panel">
        <RouterView v-slot="{ Component, route }">
          <Transition name="page" mode="out-in">
            <component :is="Component" :key="route.name" />
          </Transition>
        </RouterView>
      </section>
    </div>
  </main>
</template>

<script setup>
import AccentPicker from '../components/common/AccentPicker.vue'
import ThemeToggle from '../components/common/ThemeToggle.vue'
</script>

<style scoped>
.auth-layout {
  min-height: 100vh;
  background: var(--color-background);
}

.auth-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: min(100% - 48px, 1320px);
  height: 72px;
  margin: 0 auto;
  border-bottom: 1px solid var(--color-border);
}

.auth-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.auth-brand {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  color: var(--color-text);
  font-family: var(--font-heading);
  font-size: 18px;
  font-weight: 800;
  text-decoration: none;
}

.auth-brand__mark {
  color: var(--color-primary);
  font-size: 17px;
}

.auth-stage {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(380px, 460px);
  align-items: center;
  gap: clamp(40px, 8vw, 120px);
  width: min(100% - 48px, 1120px);
  min-height: calc(100vh - 73px);
  margin: 0 auto;
  padding: 36px 0;
}

.auth-story {
  max-width: 520px;
  justify-self: center;
}

.auth-story__art-wrap {
  position: relative;
  width: min(100%, 410px);
  aspect-ratio: 1.28;
  margin-bottom: 30px;
  overflow: hidden;
  border-radius: 10px;
  background: var(--color-surface-muted);
}

.auth-story__art {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.auth-story__tag {
  position: absolute;
  bottom: 14px;
  left: 14px;
  padding: 7px 10px;
  border: 1px solid rgb(255 255 255 / 55%);
  border-radius: 999px;
  background: rgb(255 255 255 / 90%);
  color: #1e40af;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}

.auth-story__eyebrow {
  margin-bottom: 12px;
  color: var(--color-primary);
  font-size: 11px;
  font-weight: 750;
}

.auth-story h1 {
  max-width: 480px;
  margin-bottom: 12px;
  font-family: var(--font-heading);
  font-size: clamp(32px, 4vw, 48px);
  line-height: 1.08;
}

.auth-story__copy {
  max-width: 390px;
  color: var(--color-muted);
  font-size: 15px;
  line-height: 1.7;
}

.auth-panel {
  width: 100%;
}

@media (max-width: 820px) {
  .auth-stage {
    grid-template-columns: minmax(0, 1fr) minmax(340px, 430px);
    gap: 28px;
  }

  .auth-story__art-wrap {
    aspect-ratio: 1;
  }
}

@media (max-width: 680px) {
  .auth-topbar,
  .auth-stage {
    width: min(100% - 32px, 460px);
  }

  .auth-stage {
    display: block;
    min-height: auto;
    padding: 34px 0 42px;
  }

  .auth-story {
    display: none;
  }
}

@media (max-width: 380px) {
  .auth-topbar,
  .auth-stage {
    width: calc(100% - 24px);
  }
}
</style>