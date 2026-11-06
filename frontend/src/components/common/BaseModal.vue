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
  width: min(100% - 32px, 520px);
  max-height: min(90vh, 700px);
  margin: auto;
  padding: 0;
  overflow: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: 0 20px 60px rgb(15 23 42 / 25%);
}

.base-modal::backdrop {
  background: rgb(15 23 42 / 55%);
  backdrop-filter: blur(2px);
}
</style>
