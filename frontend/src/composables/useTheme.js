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
  const resolvedTheme = nextTheme === "system"
    ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : nextTheme;
  if (!themes.includes(resolvedTheme)) return;
  theme.value = resolvedTheme;
  document.documentElement.dataset.theme = resolvedTheme;
  try {
    localStorage.setItem(STORAGE_KEY, resolvedTheme);
  } catch {
    // The theme still works for this session when storage is unavailable.
  }
}

export function useTheme() {
  return {
    theme,
    setTheme,
    toggleTheme: () => setTheme(theme.value === "light" ? "dark" : "light"),
  };
}
