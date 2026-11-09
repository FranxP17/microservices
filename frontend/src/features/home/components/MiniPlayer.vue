<script setup>
import { useMiniPlayer } from "../composables/useMiniPlayer";

const {
  currentTrack,
  isPlaying,
  isLoading,
  currentTime,
  duration,
  notifications,
  playTrack,
  seek,
  closePlayer,
  formatTime,
} = useMiniPlayer();

function notificationIcon(type) {
  return {
    success: "fa-circle-check",
    warning: "fa-triangle-exclamation",
    error: "fa-circle-exclamation",
    info: "fa-circle-info",
  }[type] ?? "fa-circle-info";
}
</script>

<template>
  <div class="mini-player-layer" aria-live="polite">
    <TransitionGroup name="player-toast" tag="div" class="player-notifications" aria-label="Notificaciones">
      <div v-for="notification in notifications" :key="notification.id" class="player-toast" :class="`player-toast--${notification.type}`" role="status">
        <i class="fa-solid" :class="notificationIcon(notification.type)" aria-hidden="true"></i>
        <span>{{ notification.message }}</span>
      </div>
    </TransitionGroup>

    <Transition name="mini-player">
      <section v-if="currentTrack" class="mini-player" aria-label="Reproductor de música">
        <img v-if="currentTrack.cover" class="mini-player__cover" :src="currentTrack.cover" :alt="`Portada de ${currentTrack.title}`" />
        <span v-else class="mini-player__cover mini-player__cover--empty"><i class="fa-solid fa-music" aria-hidden="true"></i></span>
        <div class="mini-player__track">
          <strong>{{ currentTrack.title }}</strong>
          <small>{{ currentTrack.artist || "Preview de Deezer" }}</small>
        </div>
        <button class="mini-player__toggle" type="button" :disabled="isLoading" :aria-label="isPlaying ? 'Pausar' : 'Reproducir'" :title="isPlaying ? 'Pausar' : 'Reproducir'" @click="playTrack({ ...currentTrack, id: currentTrack.key })">
          <i class="fa-solid" :class="isLoading ? 'fa-spinner fa-spin' : isPlaying ? 'fa-pause' : 'fa-play'" aria-hidden="true"></i>
        </button>
        <span class="mini-player__time">{{ formatTime(currentTime) }}</span>
        <input class="mini-player__seek" type="range" min="0" :max="duration || 30" step="0.1" :value="currentTime" :style="{ '--progress': `${duration ? currentTime / duration * 100 : 0}%` }" aria-label="Posición de reproducción" @input="seek($event.target.value)" />
        <span class="mini-player__time">{{ formatTime(duration || 30) }}</span>
        <button class="mini-player__close" type="button" aria-label="Cerrar reproductor" title="Cerrar reproductor" @click="closePlayer"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
      </section>
    </Transition>
  </div>
</template>

<style scoped>
.mini-player-layer { position: fixed; z-index: 80; right: 16px; bottom: calc(16px + env(safe-area-inset-bottom)); left: 16px; display: grid; justify-items: center; gap: 8px; pointer-events: none; }
.player-notifications { display: grid; width: min(440px, 100%); gap: 6px; justify-items: end; }
.player-toast { display: flex; align-items: center; gap: 9px; max-width: 100%; padding: 10px 13px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-surface); color: var(--color-text); box-shadow: var(--shadow-popover); font-size: 11px; pointer-events: auto; }
.player-toast i { color: var(--color-primary); }
.player-toast--success i { color: var(--color-success); }
.player-toast--warning i { color: #b7791f; }
.player-toast--error i { color: var(--color-danger); }
.mini-player { display: grid; grid-template-columns: 42px minmax(100px, 1fr) 36px 36px minmax(80px, 1.6fr) 36px 32px; align-items: center; gap: 11px; width: min(720px, 100%); min-height: 68px; padding: 10px 14px; border: 1px solid var(--color-border); border-radius: 10px; background: color-mix(in srgb, var(--color-surface) 94%, transparent); box-shadow: var(--shadow-popover); backdrop-filter: blur(14px); pointer-events: auto; }
.mini-player__cover { width: 42px; height: 42px; border-radius: 5px; background: var(--color-surface-muted); object-fit: cover; }
.mini-player__cover--empty { display: grid; place-items: center; color: var(--color-primary); }
.mini-player__track { display: grid; min-width: 0; gap: 4px; }
.mini-player__track strong,.mini-player__track small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mini-player__track strong { color: var(--color-text); font-size: 11px; }
.mini-player__track small,.mini-player__time { color: var(--color-muted); font-size: 9px; }
.mini-player__time { text-align: center; }
.mini-player__toggle,.mini-player__close { display: grid; width: 34px; height: 34px; place-items: center; border-radius: 50%; cursor: pointer; }
.mini-player__toggle { background: var(--color-primary); color: var(--color-primary-foreground); }
.mini-player__toggle:disabled { opacity: .7; cursor: wait; }
.mini-player__close { background: transparent; color: var(--color-muted); }
.mini-player__close:hover { background: var(--color-hover); color: var(--color-text); }
.mini-player__seek { width: 100%; height: 5px; accent-color: var(--color-primary); cursor: pointer; }
.player-toast-enter-active,.player-toast-leave-active,.mini-player-enter-active,.mini-player-leave-active { transition: opacity 160ms ease, transform 160ms ease; }
.player-toast-enter-from,.player-toast-leave-to,.mini-player-enter-from,.mini-player-leave-to { opacity: 0; transform: translateY(8px); }
@media (max-width: 560px) { .mini-player-layer { right: 8px; left: 8px; } .mini-player { grid-template-columns: 38px minmax(0, 1fr) 34px 32px; gap: 8px; padding: 9px; } .mini-player__cover { width: 38px; height: 38px; } .mini-player__time:nth-of-type(1) { display: none; } .mini-player__seek { grid-column: 2; grid-row: 2; } .mini-player__time:nth-of-type(2) { grid-column: 3; grid-row: 2; } .mini-player__close { grid-column: 4; grid-row: 1 / span 2; } }
@media (prefers-reduced-motion: reduce) { .player-toast-enter-active,.player-toast-leave-active,.mini-player-enter-active,.mini-player-leave-active { transition: none; } }
</style>