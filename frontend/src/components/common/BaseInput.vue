<script setup>
import { computed } from "vue";

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: "",
  },
  type: {
    type: String,
    default: "text",
  },
  id: {
    type: String,
    default: undefined,
  },
  name: {
    type: String,
    default: undefined,
  },
  placeholder: {
    type: String,
    default: "",
  },
  autocomplete: {
    type: String,
    default: undefined,
  },
  color: {
    type: String,
    default: "primary",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  error: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "blur", "focus"]);

const inputClasses = computed(() => [
  "base-input",
  `base-input--${props.color}`,
  { "base-input--error": props.error },
]);

function onInput(event) {
  emit("update:modelValue", event.target.value);
}
</script>

<template>
  <input
    :id="id"
    :name="name"
    :type="type"
    :class="inputClasses"
    :value="modelValue"
    :placeholder="placeholder"
    :autocomplete="autocomplete"
    :disabled="disabled"
    @input="onInput"
    @blur="emit('blur', $event)"
    @focus="emit('focus', $event)"
  />
</template>

<style scoped>
.base-input {
  width: 100%;
  height: 46px;
  padding: 0 13px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  outline: none;
  background: var(--color-surface);
  color: var(--color-text);
  transition: border-color 0.16s ease;
}

.base-input:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
}

.base-input--primary:focus {
  border-color: var(--color-primary);
}

.base-input--error {
  border-color: #c2410c;
}
</style>
