import { ref } from "vue";

const STORAGE_KEY = "app-accent";
const accents = ["ocean", "lagoon", "coral", "violet", "forest"];

function getInitialAccent() {
  try {
    const savedAccent = localStorage.getItem(STORAGE_KEY);
    return accents.includes(savedAccent) ? savedAccent : "ocean";
  } catch {
    return "ocean";
  }
}

const accent = ref(getInitialAccent());
document.documentElement.dataset.accent = accent.value;

function setAccent(nextAccent) {
  if (!accents.includes(nextAccent)) return;
  accent.value = nextAccent;
  document.documentElement.dataset.accent = nextAccent;
  try {
    localStorage.setItem(STORAGE_KEY, nextAccent);
  } catch {
    // The selection remains active for this session when storage is unavailable.
  }
}

export function useAccent() {
  return { accent, setAccent };
}
