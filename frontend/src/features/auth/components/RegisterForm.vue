<script setup>
import { reactive } from "vue";
import BaseInput from "../../../components/common/BaseInput.vue";
import BaseButton from "../../../components/common/BaseButton.vue";

defineProps({ loading: Boolean });
const emit = defineEmits(["submit"]);

const form = reactive({
  name: "",
  email: "",
  password: "",
  passwordConfirmation: "",
});

const errors = reactive({
  name: "",
  email: "",
  password: "",
  passwordConfirmation: "",
});

function validateForm() {
  Object.keys(errors).forEach((key) => {
    errors[key] = "";
  });

  if (!form.name.trim()) errors.name = "El nombre es obligatorio";

  if (!form.email.trim()) {
    errors.email = "El correo es obligatorio";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Introduce un correo válido";
  }

  if (form.password.length < 8) {
    errors.password = "La contraseña debe tener al menos 8 caracteres";
  }

  if (form.passwordConfirmation !== form.password) {
    errors.passwordConfirmation = "Las contraseñas no coinciden";
  }

  return !Object.values(errors).some(Boolean);
}

function submitForm() {
  if (!validateForm()) return;

  emit("submit", {
    name: form.name.trim(),
    email: form.email.trim(),
    password: form.password
  });
}
</script>

<template>
  <form class="login-form" @submit.prevent="submitForm">
    <div class="form-group">
      <label for="name">Nombre</label>
      <BaseInput
        id="name"
        v-model="form.name"
        type="text"
        autocomplete="name"
        :error="Boolean(errors.name)"
      />
      <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
    </div>

    <div class="form-group">
      <label for="register-email">Correo electrónico</label>
      <BaseInput
        id="register-email"
        v-model="form.email"
        type="email"
        placeholder="usuario@correo.com"
        autocomplete="email"
        :error="Boolean(errors.email)"
      />
      <span v-if="errors.email" class="field-error">{{ errors.email }}</span>
    </div>

    <div class="form-group">
      <label for="register-password">Contraseña</label>
      <BaseInput
        id="register-password"
        v-model="form.password"
        type="password"
        autocomplete="new-password"
        :error="Boolean(errors.password)"
      />
      <span v-if="errors.password" class="field-error">{{ errors.password }}</span>
    </div>

    <div class="form-group">
      <label for="password-confirmation">Confirmar contraseña</label>
      <BaseInput
        id="password-confirmation"
        v-model="form.passwordConfirmation"
        type="password"
        autocomplete="new-password"
        :error="Boolean(errors.passwordConfirmation)"
      />
      <span v-if="errors.passwordConfirmation" class="field-error">
        {{ errors.passwordConfirmation }}
      </span>
    </div>

    <BaseButton type="submit" size="lg" :loading="loading" :disabled="loading" block>
      {{ loading ? "Creando cuenta..." : "Crear cuenta" }}
    </BaseButton>
  </form>
</template>