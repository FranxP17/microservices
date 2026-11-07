<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useAccent } from "../../composables/useAccent";

const options = [
  { id: "ocean", label: "Azul océano", color: "#2563eb" },
  { id: "lagoon", label: "Verde laguna", color: "#0f766e" },
  { id: "coral", label: "Coral", color: "#c2410c" },
  { id: "violet", label: "Violeta", color: "#7c3aed" },
  { id: "forest", label: "Verde bosque", color: "#15803d" },
];

const { accent, setAccent } = useAccent();
const open = ref(false);
const picker = ref(null);
const trigger = ref(null);

function close({ restoreFocus = false } = {}) {
  open.value = false;
  if (restoreFocus) trigger.value?.focus();
}

function chooseAccent(id) {
  setAccent(id);
  close();
}

function handleOutsideClick(event) {
  if (open.value && !picker.value?.contains(event.target)) close();
}

function handleKeydown(event) {
  if (event.key === "Escape" && open.value) close({ restoreFocus: true });
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
  <div ref="picker" class="accent-picker">
    <button
      ref="trigger"
      class="accent-picker__trigger"
      type="button"
      aria-label="Elegir color de acento"
      aria-haspopup="menu"
      aria-controls="accent-options"
      :aria-expanded="open"
      :title="`Color de acento: ${options.find((option) => option.id === accent)?.label}`"
      @click="open = !open"
    >
      <i class="fa-solid fa-palette" aria-hidden="true"></i>
      <span class="accent-picker__current" :style="{ '--swatch': options.find((option) => option.id === accent)?.color }"></span>
    </button>

    <Transition name="accent-picker">
      <div
        v-if="open"
        id="accent-options"
        class="accent-picker__menu"
        role="menu"
        aria-label="Colores de acento"
      >
        <p>Color de acento</p>
        <button
          v-for="option in options"
          :key="option.id"
          class="accent-picker__option"
          type="button"
          role="menuitemradio"
          :aria-label="option.label"
          :aria-checked="accent === option.id"
          :title="option.label"
          @click="chooseAccent(option.id)"
        >
          <span class="accent-picker__swatch" :style="{ '--swatch': option.color }"></span>
          <span>{{ option.label }}</span>
          <i v-if="accent === option.id" class="fa-solid fa-check" aria-hidden="true"></i>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.accent-picker {
  position: relative;
  display: inline-flex;
}

.accent-picker__trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  width: 38px;
  height: 38px;
  border: 1px solid transparent;
  border-radius: 50%;
  background: transparent;
  color: var(--color-muted);
  cursor: pointer;
  transition:
    border-color 140ms ease,
    color 140ms ease,
    background-color 140ms ease;
}

.accent-picker__trigger:hover,
.accent-picker__trigger[aria-expanded="true"] {
  border-color: var(--color-border);
  background: var(--color-hover);
  color: var(--color-primary);
}

.accent-picker__current,
.accent-picker__swatch {
  display: block;
  width: 13px;
  height: 13px;
  flex: 0 0 13px;
  border: 2px solid var(--color-surface);
  border-radius: 50%;
  background: var(--swatch);
  box-shadow: 0 0 0 1px var(--color-border);
}

.accent-picker__menu {
  position: absolute;
  top: calc(100% + 9px);
  right: 0;
  z-index: 45;
  width: 196px;
  padding: 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-popover);
  transform-origin: top right;
}

.accent-picker__menu > p {
  padding: 7px 9px 8px;
  color: var(--color-muted);
  font-size: 11px;
  font-weight: 700;
}

.accent-picker__option {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 36px;
  padding: 0 9px;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text);
  font-size: 12px;
  text-align: left;
  cursor: pointer;
}

.accent-picker__option:hover,
.accent-picker__option[aria-checked="true"] {
  background: var(--color-hover);
}

.accent-picker__option > i:last-child {
  margin-left: auto;
  color: var(--color-primary);
  font-size: 11px;
}

.accent-picker-enter-active,
.accent-picker-leave-active {
  transition: opacity 130ms ease, transform 130ms ease;
}

.accent-picker-enter-from,
.accent-picker-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}

@media (prefers-reduced-motion: reduce) {
  .accent-picker-enter-active,
  .accent-picker-leave-active {
    transition: none;
  }
}
</style>
