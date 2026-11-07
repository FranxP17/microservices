<script setup>
import { useTheme } from "../../composables/useTheme";

const { theme, toggleTheme } = useTheme();
</script>

<template>
  <button
    class="theme-toggle"
    type="button"
    :aria-label="`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`"
    :aria-pressed="theme === 'dark'"
    :title="`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`"
    @click="toggleTheme"
  >
    <span class="theme-toggle__label">{{ theme === "light" ? "Claro" : "Oscuro" }}</span>
    <span class="theme-toggle__track" aria-hidden="true">
      <i
        class="fa-solid theme-toggle__icon"
        :class="theme === 'light' ? 'fa-sun' : 'fa-moon'"
      ></i>
    </span>
  </button>
</template>

<style scoped>
.theme-toggle {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  min-height: 36px;
  padding: 0 2px 0 10px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--color-text);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: color 160ms ease;
}

.theme-toggle:hover {
  color: var(--color-primary);
}

.theme-toggle__track {
  display: flex;
  align-items: center;
  width: 42px;
  height: 26px;
  padding: 3px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-hover);
  transition:
    background-color 180ms ease,
    border-color 180ms ease;
}

.theme-toggle__icon {
  display: grid;
  width: 18px;
  height: 18px;
  place-items: center;
  border-radius: 50%;
  background: var(--color-primary);
  color: var(--color-primary-foreground);
  font-size: 10px;
  transform: translateX(0);
  transition:
    transform 180ms ease,
    background-color 180ms ease;
}

[data-theme="dark"] .theme-toggle__icon {
  transform: translateX(14px);
}

@media (max-width: 560px) {
  .theme-toggle__label {
    display: none;
  }
}
</style>
