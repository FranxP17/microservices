import { ref } from "vue";

const STORAGE_KEY = "app-theme";
const themes = ["light", "dark"];

function getInitialTheme() {
  try {
    const savedTheme = localStorage.getItem(STORAGE_KEY);
    if (themes.includes(savedTheme)) return savedTheme;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
}

const theme = ref(getInitialTheme());

document.documentElement.dataset.theme = theme.value;

function setTheme(nextTheme) {
  theme.value = nextTheme;
  document.documentElement.dataset.theme = nextTheme;
  try {
    localStorage.setItem(STORAGE_KEY, nextTheme);
  } catch {
    // The theme still works for this session when storage is unavailable.
  }
}

export function useTheme() {
  return {
    theme,
    toggleTheme: () => setTheme(theme.value === "light" ? "dark" : "light"),
  };
}
