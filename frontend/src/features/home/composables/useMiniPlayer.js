import { ref } from "vue";
import { musicService } from "../services/musicService";

const currentTrack = ref(null);
const isPlaying = ref(false);
const isLoading = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const notifications = ref([]);
let audio = null;
let nextNotificationId = 0;
const notificationTimers = new Map();

function notify(type, message) {
  const normalizedType = {
    alert: "error",
    warning: "warning",
    perfect: "success",
    success: "success",
    info: "info",
  }[type] ?? "info";

  const notification = { id: ++nextNotificationId, type: normalizedType, message };
  notifications.value = [...notifications.value, notification].slice(-3);
  notificationTimers.set(notification.id, window.setTimeout(() => {
    notifications.value = notifications.value.filter((item) => item.id !== notification.id);
    notificationTimers.delete(notification.id);
  }, 3600));
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

function stopAudio() {
  if (!audio) return;
  audio.pause();
  audio.removeAttribute("src");
  audio.load();
  audio = null;
  isPlaying.value = false;
  currentTime.value = 0;
  duration.value = 0;
}

async function playTrack(track) {
  const key = String(track?.id ?? track?.musicItemId ?? "");
  if (!key) return false;

  if (currentTrack.value?.key === key && audio) {
    currentTrack.value = {
      ...currentTrack.value,
      sourceId: track.sourceId ?? track.reviewId ?? currentTrack.value.sourceId,
    };
    if (isPlaying.value) {
      audio.pause();
      isPlaying.value = false;
    } else {
      try {
        await audio.play();
        isPlaying.value = true;
        notify("perfect", `Reproduciendo ${currentTrack.value.title}`);
      } catch {
        notify("warning", "No se pudo reanudar esta preview.");
      }
    }
    return isPlaying.value;
  }

  isLoading.value = true;
  let previewUrl = track.previewUrl ?? track.PreviewUrl ?? "";
  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (!previewUrl) {
      try {
        previewUrl = await musicService.getFreshPreview(track);
      } catch {
        previewUrl = "";
      }
    }
    if (!previewUrl) break;

    stopAudio();
    const activeAudio = new Audio(previewUrl);
    audio = activeAudio;
    activeAudio.preload = "metadata";
    activeAudio.addEventListener("timeupdate", () => { if (audio === activeAudio) currentTime.value = activeAudio.currentTime; });
    activeAudio.addEventListener("loadedmetadata", () => { if (audio === activeAudio) duration.value = activeAudio.duration; });
    activeAudio.addEventListener("ended", () => {
      if (audio !== activeAudio) return;
      isPlaying.value = false;
      currentTime.value = 0;
      activeAudio.currentTime = 0;
    }, { once: true });
    try {
      await activeAudio.play();
      currentTrack.value = {
        key,
        title: track.title ?? track.Title ?? track.name ?? track.Name ?? "Pista",
        artist: track.artist ?? track.Artist ?? track.artistName ?? track.artistNames ?? "",
        cover: track.cover ?? track.imageUrl ?? track.ImageUrl ?? track.coverUrl ?? "",
        sourceId: track.sourceId ?? track.reviewId ?? key,
        previewUrl,
      };
      isPlaying.value = true;
      isLoading.value = false;
      notify("perfect", `Reproduciendo ${currentTrack.value.title}`);
      return true;
    } catch {
      stopAudio();
      previewUrl = attempt === 0 ? "" : null;
    }
  }

  isLoading.value = false;
  notify("warning", "No hay una preview reproducible para esta canción.");
  return false;
}

function seek(value) {
  if (!audio || !duration.value) return;
  const nextTime = Math.max(0, Math.min(Number(value), duration.value));
  audio.currentTime = nextTime;
  currentTime.value = nextTime;
}

function closePlayer() {
  stopAudio();
  currentTrack.value = null;
  notify("info", "Reproductor cerrado.");
}

function isCurrentTrack(key) {
  return currentTrack.value?.key === String(key);
}

export function useMiniPlayer() {
  return {
    currentTrack,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    notifications,
    playTrack,
    seek,
    closePlayer,
    isCurrentTrack,
    notify,
    formatTime,
  };
}