<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useNotifications } from "../../features/home/composables/useNotifications";

const { notifications, unreadCount, connected, markAllRead } = useNotifications();
const open = ref(false);
const root = ref(null);
const trigger = ref(null);

function handleOutsideClick(event) {
  if (open.value && !root.value?.contains(event.target)) open.value = false;
}

function handleKeydown(event) {
  if (event.key === "Escape" && open.value) {
    open.value = false;
    trigger.value?.focus();
  }
}

function formatTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Ahora"
    : new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit" }).format(date);
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
  <div ref="root" class="notification-bell">
    <button
      ref="trigger"
      class="notification-bell__trigger"
      type="button"
      aria-label="Notificaciones"
      aria-controls="notification-menu"
      :aria-expanded="open"
      :title="unreadCount ? `${unreadCount} notificaciones sin leer` : 'Notificaciones'"
      @click="open = !open"
    >
      <i class="fa-regular fa-bell" aria-hidden="true"></i>
      <span v-if="unreadCount" class="notification-bell__count">{{ unreadCount > 9 ? "9+" : unreadCount }}</span>
      <span class="notification-bell__connection" :class="{ online: connected }" aria-hidden="true"></span>
    </button>

    <Transition name="notification-menu">
      <section v-if="open" id="notification-menu" class="notification-menu" aria-label="Notificaciones recientes">
        <header>
          <div><strong>Notificaciones</strong><small>{{ connected ? "Conectado en tiempo real" : "Reconectando…" }}</small></div>
          <button v-if="unreadCount" type="button" @click="markAllRead">Marcar leídas</button>
        </header>
        <p v-if="!notifications.length" class="notification-menu__empty">Todavía no tienes notificaciones.</p>
        <ul v-else>
          <li v-for="item in notifications" :key="item.id" :class="{ unread: !item.read }">
            <span class="notification-menu__mark" aria-hidden="true"><img v-if="item.senderAvatar" :src="item.senderAvatar" alt="" /><i v-else class="fa-solid" :class="item.type === 'new_follower' ? 'fa-user-plus' : item.type === 'review_liked' ? 'fa-heart' : item.type === 'review_commented' ? 'fa-comment' : 'fa-music'"></i></span>
            <span class="notification-menu__copy"><strong>{{ item.title }}</strong><small class="notification-menu__sender">{{ item.senderName }}</small><small>{{ item.message }}</small><time>{{ formatTime(item.createdAt) }}</time></span>
            <span v-if="!item.read" class="notification-menu__unread" aria-label="Sin leer"></span>
          </li>
        </ul>
      </section>
    </Transition>
  </div>
</template>

<style scoped>
.notification-bell { position: relative; flex: 0 0 38px; }
.notification-bell__trigger { position: relative; display: grid; width: 38px; height: 38px; place-items: center; border: 1px solid transparent; border-radius: 50%; background: transparent; color: var(--color-text); font-size: 15px; cursor: pointer; }
.notification-bell__trigger:hover,.notification-bell__trigger[aria-expanded="true"] { border-color: var(--color-border); background: var(--color-hover); color: var(--color-primary); }
.notification-bell__count { position: absolute; top: 0; right: -2px; display: grid; min-width: 16px; height: 16px; place-items: center; padding: 0 3px; border: 2px solid var(--color-surface); border-radius: 999px; background: var(--color-danger); color: #fff; font-size: 8px; font-weight: 700; }
.notification-bell__connection { position: absolute; right: 4px; bottom: 4px; width: 7px; height: 7px; border: 1px solid var(--color-surface); border-radius: 50%; background: var(--color-muted); }
.notification-bell__connection.online { background: var(--color-success); }
.notification-menu { position: absolute; top: calc(100% + 10px); right: 0; z-index: 45; width: min(340px, calc(100vw - 24px)); max-height: min(72vh, 480px); overflow: auto; border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: var(--color-surface); box-shadow: var(--shadow-popover); }
.notification-menu > header { position: sticky; top: 0; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 13px 15px; border-bottom: 1px solid var(--color-border); background: var(--color-surface); }
.notification-menu > header div { display: grid; gap: 3px; }
.notification-menu > header strong { color: var(--color-text); font-size: 13px; }
.notification-menu > header small { color: var(--color-muted); font-size: 10px; }
.notification-menu > header button { padding: 5px 0; background: transparent; color: var(--color-primary); font-size: 10px; font-weight: 650; cursor: pointer; }
.notification-menu__empty { padding: 24px 16px; color: var(--color-muted); font-size: 12px; text-align: center; }
.notification-menu ul { display: grid; padding: 5px; list-style: none; }
.notification-menu li { position: relative; display: flex; align-items: flex-start; gap: 10px; padding: 11px 9px; border-radius: var(--radius-md); }
.notification-menu li.unread { background: var(--color-hover); }
.notification-menu__mark { display: grid; width: 30px; height: 30px; flex: 0 0 30px; place-items: center; border-radius: 50%; background: var(--color-primary-container); color: var(--color-primary); font-size: 11px; }
.notification-menu__mark img { width: 100%; height: 100%; border-radius: inherit; object-fit: cover; }
.notification-menu__copy { display: grid; min-width: 0; flex: 1; gap: 3px; }
.notification-menu__copy strong { color: var(--color-text); font-size: 11px; }
.notification-menu__copy .notification-menu__sender { color: var(--color-primary); font-weight: 650; }
.notification-menu__copy small,.notification-menu__copy time { color: var(--color-muted); font-size: 10px; line-height: 1.4; }
.notification-menu__unread { width: 6px; height: 6px; flex: 0 0 6px; margin-top: 5px; border-radius: 50%; background: var(--color-primary); }
.notification-menu-enter-active,.notification-menu-leave-active { transition: opacity 120ms ease, transform 120ms ease; }
.notification-menu-enter-from,.notification-menu-leave-to { opacity: 0; transform: translateY(-4px); }
@media (prefers-reduced-motion: reduce) { .notification-menu-enter-active,.notification-menu-leave-active { transition: none; } }
</style>
