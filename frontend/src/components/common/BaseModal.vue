<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  labelledby: { type: String, required: true },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue"]);
const dialog = ref(null);

watch(
  [() => props.modelValue, dialog],
  ([open, element]) => {
    if (!element) return;
    if (open && !element.open) element.showModal();
    else if (!open && element.open) element.close();
  },
  { immediate: true, flush: "post" },
);

function requestClose() {
  if (!props.loading) emit("update:modelValue", false);
}
</script>

<template>
  <Teleport to="body">
    <dialog
      ref="dialog"
      class="base-modal"
      :aria-labelledby="labelledby"
      @cancel.prevent="requestClose"
    >
      <slot :close="requestClose" />
    </dialog>
  </Teleport>
</template>

<style scoped>
.base-modal {
  width: min(calc(100vw - 32px), 540px);
  max-height: min(90vh, 720px);
  margin: auto;
  padding: 0;
  overflow: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: var(--shadow-modal);
  animation: modal-enter 180ms cubic-bezier(0.2, 0.7, 0.2, 1);
}

.base-modal:focus {
  outline: none;
}

.base-modal::backdrop {
  background: var(--color-backdrop);
  backdrop-filter: blur(3px);
  animation: backdrop-enter 180ms ease;
}

@keyframes modal-enter {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes backdrop-enter {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@media (max-width: 560px) {
  .base-modal {
    width: calc(100vw - 20px);
    max-height: 92vh;
  }
}

@media (prefers-reduced-motion: reduce) {
  .base-modal,
  .base-modal::backdrop {
    animation: none;
  }
}
</style>
