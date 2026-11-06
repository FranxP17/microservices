<script setup>
import { reactive, ref } from "vue";

import BaseInput from "../../../components/common/BaseInput.vue";
import BaseButton from "../../../components/common/BaseButton.vue";

const emit = defineEmits(["submit"]);
defineProps({ loading: Boolean });

const visiblePassword = ref(false);

const form = reactive({
  email: "",
  password: "",
});

const errors = reactive({
  email: "",
  password: "",
});

function validateForm() {
  errors.email = "";
  errors.password = "";

  if (!form.email.trim()) {
    errors.email = "El correo es obligatorio";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Introduce un correo valido";
  }

  if (!form.password) {
    errors.password = "La contraseña es obligatorio";
  }
  return !errors.email && !errors.password;
}

function submitForm() {
  if (!validateForm()) return;

  emit("submit", {
    email: form.email.trim(),
    password: form.password,
  });
}
</script>

<template>
  <form class="login-form" @submit.prevent="submitForm">
    <div class="form-group">
      <label for="email">Correo electrónico</label>

      <BaseInput
        id="email"
        v-model="form.email"
        type="email"
        placeholder="usuario@correo.com"
        autocomplete="username"
        :error="Boolean(errors.email)"
      />

      <span v-if="errors.email" class="field-error">
        {{ errors.email }}
      </span>
    </div>

    <div class="form-group">
      <label for="password">Contraseña</label>

      <div class="password-wrapper">
        <BaseInput
          id="password"
          v-model="form.password"
          :type="visiblePassword ? 'text' : 'password'"
          placeholder="Ingresa tu contraseña"
          autocomplete="current-password"
          :error="Boolean(errors.email)"
        />

        <button
          type="button"
          class="password-toggle"
          @click="visiblePassword = !visiblePassword"
          :aria-label="
            visiblePassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
          "
        >
          {{ visiblePassword ? "Ocultar" : "Mostrar" }}
        </button>
      </div>

      <span v-if="errors.password" class="field-error">
        {{ errors.password }}
      </span>
    </div>

    <BaseButton
      type="submit"
      size="lg"
      :loading="loading"
      :disabled="loading"
      block
    >
      {{ loading ? "Ingresando..." : "Iniciar sesión" }}
    </BaseButton>
  </form>
</template>
