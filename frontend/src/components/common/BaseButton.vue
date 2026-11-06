<script setup>
import { computed } from "vue";

const props = defineProps({
  type: {
    type: String,
    default: "button",
    validator: (value) => ["button", "submit", "reset"].includes(value),
  },
  color: {
    type: String,
    default: "primary",
  },
  textColor: {
    type: String,
    default: "white",
  },
  size: {
    type: String,
    default: "md",
    validator: (value) => ["sm", "md", "lg"].includes(value),
  },
  block: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["click"]);

const presetColors = [
  "primary",
  "secondary",
  "success",
  "danger",
  "warning",
  "info",
  "neutral",
];

const isPresetColor = computed(() => presetColors.includes(props.color));

const classes = computed(() => [
  "base-button",
  `base-button--${isPresetColor.value ? props.color : "custom"}`,
  `base-button--${props.size}`,
  { "base-button--block": props.block },
]);

const colorStyles = computed(() =>
  isPresetColor.value
    ? undefined
    : {
        "--button-background": props.color,
        "--button-foreground": props.textColor,
      },
);

const isDisabled = computed(() => props.disabled || props.loading);

function handleClick(event) {
  if (isDisabled.value) {
    event.preventDefault();
    return;
  }

  emit("click", event);
}
</script>

<template>
  <button
    :type="type"
    :class="classes"
    :style="colorStyles"
    :disabled="isDisabled"
    :aria-busy="loading ? 'true' : undefined"
    @click="handleClick"
  >
    <span v-if="loading" class="base-button__spinner" aria-hidden="true"></span>
    <slot />
  </button>
</template>

<style scoped>
.base-button {
  --button-background: var(--color-primary);
  --button-foreground: #fff;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  line-height: 1.2;
  cursor: pointer;
  background: var(--button-background);
  color: var(--button-foreground);
  transition:
    filter 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.15s ease;
}

.base-button--sm {
  min-height: 32px;
  padding: 0 12px;
  font-size: 12px;
}

.base-button--md {
  min-height: 40px;
  padding: 0 16px;
  font-size: 14px;
}

.base-button--lg {
  min-height: 48px;
  padding: 0 20px;
  font-size: 15px;
}

.base-button--block {
  width: 100%;
}

.base-button--primary {
  --button-background: var(--color-primary);
}

.base-button--secondary {
  --button-background: var(--color-sidebar);
}

.base-button--success {
  --button-background: #15803d;
}

.base-button--danger {
  --button-background: #dc2626;
}

.base-button--warning {
  --button-background: #d97706;
  --button-foreground: #422006;
}

.base-button--info {
  --button-background: #0284c7;
}

.base-button--neutral {
  --button-background: #64748b;
}

.base-button:focus-visible {
  outline: 2px solid var(--button-background);
  outline-offset: 3px;
}

.base-button:not(:disabled):hover {
  filter: brightness(0.95);
  box-shadow: 0 2px 6px rgb(0 0 0 / 15%);
}

.base-button:not(:disabled):active {
  transform: translateY(1px);
}

.base-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.base-button__spinner {
  width: 1em;
  height: 1em;
  flex: 0 0 auto;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: base-button-spin 0.65s linear infinite;
}

@keyframes base-button-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .base-button {
    transition: none;
  }

  .base-button__spinner {
    animation-duration: 1.5s;
  }
}
</style>
