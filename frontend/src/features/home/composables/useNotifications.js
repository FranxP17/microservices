import { computed, onBeforeUnmount, ref, watch } from "vue";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { useAuthStore } from "../../../stores/authStore";
import { profileService } from "../services/profileService";

const notifications = ref([]);
const connected = ref(false);
const onlineUserIds = ref(new Set());
let connection = null;
let connecting = false;
let reconnectTimer = null;
let nextId = 0;
let subscribers = 0;

function isAdmin(user) {
  const role = user?.role;
  if (typeof role === "number") return role === 2;
  const value = String(role ?? "").toUpperCase();
  return value === "ADMIN" || value === "2";
}

function getNotificationText(payload = {}) {
  switch (payload.type) {
    case "new_follower":
      return { title: "Nuevo seguidor", message: "Empezó a seguirte." };
    case "review_created":
      return {
        title: "Nueva reseña",
        message: payload.title ? `Publicó “${payload.title}”.` : "Publicó una reseña.",
      };
    case "review_liked":
      return { title: "Reseña valorada", message: "Le gustó una de tus reseñas." };
    case "review_commented":
      return { title: "Nuevo comentario", message: "Comentó una de tus reseñas." };
    default:
      return { title: "Actividad de Faudix", message: "Tienes una nueva notificación." };
  }
}

async function stopConnection() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  const activeConnection = connection;
  connection = null;
  connected.value = false;
  onlineUserIds.value = new Set();
  if (activeConnection) await activeConnection.stop().catch(() => {});
}

function scheduleReconnect(authStore) {
  if (reconnectTimer || !authStore.isAuthenticated || subscribers === 0) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    void startConnection(authStore);
  }, 8000);
}

async function startConnection(authStore) {
  if (!authStore.isAuthenticated || connection || connecting) return;
  connecting = true;

  try {
    const apiUrl = new URL(import.meta.env.VITE_API_URL, window.location.origin);
    const hubUrl = new URL("/hubs/social", apiUrl.origin).toString();
    const hub = new HubConnectionBuilder()
      .withUrl(hubUrl, { withCredentials: true })
      .withAutomaticReconnect([0, 2000, 10000, 30000])
      .configureLogging(LogLevel.Warning)
      .build();

    hub.on("notification", async (payload) => {
      const senderId = payload?.userId ?? payload?.UserId;
      let senderName = "Miembro de Faudix";
      let senderAvatar = "";
      if (senderId) {
        try {
          const profile = await profileService.getById(senderId);
          senderName = profile?.name ?? profile?.Name ?? profile?.username ?? profile?.Username ?? senderName;
          try {
            const avatar = await profileService.getUserAvatar(senderId);
            senderAvatar = avatar?.imageUrl ?? avatar?.ImageUrl ?? "";
          } catch {
            senderAvatar = "";
          }
        } catch {
          senderName = "Miembro de Faudix";
        }
      }
      const copy = getNotificationText(payload);
      notifications.value = [
        {
          id: ++nextId,
          type: payload?.type ?? "activity",
          senderId,
          senderName,
          senderAvatar,
          title: copy.title,
          message: copy.message,
          createdAt: payload?.createdAt ?? new Date().toISOString(),
          read: false,
        },
        ...notifications.value,
      ].slice(0, 30);
    });
    hub.on("presence_changed", (payload) => {
      const userId = String(payload?.userId ?? payload?.UserId ?? "").toLowerCase();
      if (!userId) return;
      const next = new Set(onlineUserIds.value);
      if (payload?.online ?? payload?.Online) next.add(userId);
      else next.delete(userId);
      onlineUserIds.value = next;
    });
    hub.onreconnecting(() => { connected.value = false; });
    hub.onreconnected(() => { connected.value = true; });
    hub.onclose(() => {
      connected.value = false;
      if (connection === hub) connection = null;
      scheduleReconnect(authStore);
    });

    connection = hub;
    await hub.start();
    connected.value = true;
    if (isAdmin(authStore.user)) {
      const users = await hub.invoke("GetOnlineUsers");
      onlineUserIds.value = new Set(users.map((userId) => String(userId).toLowerCase()));
    }
  } catch {
    connection = null;
    connected.value = false;
    scheduleReconnect(authStore);
  } finally {
    connecting = false;
  }
}

export function useNotifications() {
  const authStore = useAuthStore();
  subscribers += 1;
  const unreadCount = computed(() => notifications.value.filter((item) => !item.read).length);

  const stopWatching = watch(
    () => authStore.isAuthenticated,
    (isAuthenticated) => {
      if (isAuthenticated) void startConnection(authStore);
      else {
        notifications.value = [];
        onlineUserIds.value = new Set();
        void stopConnection();
      }
    },
    { immediate: true },
  );

  function markAllRead() {
    notifications.value = notifications.value.map((item) => ({ ...item, read: true }));
  }

  onBeforeUnmount(() => {
    stopWatching();
    subscribers = Math.max(0, subscribers - 1);
    if (subscribers === 0) void stopConnection();
  });

  return { notifications, unreadCount, connected, onlineUserIds, markAllRead };
}
