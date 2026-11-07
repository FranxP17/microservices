<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../../stores/authStore";
import RegisterForm from "../components/RegisterForm.vue";

const router = useRouter();
const authStore = useAuthStore();
const errorMessage = ref("");

async function handleRegister(user) {
  errorMessage.value = "";

  try {
    await authStore.register(user);
    await router.replace({ name: "login", query: { registered: "1" } });
  } catch (error) {
    const status = error.response?.status;

    if (status === 409) {
      errorMessage.value = "Ya existe una cuenta con ese correo";
    } else if (!error.response) {
      errorMessage.value = "No se pudo conectar con el servidor";
    } else {
      errorMessage.value =
        error.response.data?.message || "No se pudo crear la cuenta";
    }
  }
}
</script>

<template>
  <section class="login-container">
    <div class="login-card">
      <header class="login-header">
        <h1>Crear cuenta</h1>
        <p>Registra tus datos para continuar</p>
      </header>

      <div v-if="errorMessage" class="error-message" role="alert">
        {{ errorMessage }}
      </div>

      <RegisterForm :loading="authStore.isLoading" @submit="handleRegister" />

      <p class="auth-switch">
        ¿Ya tienes cuenta? <RouterLink :to="{ name: 'login' }">Iniciar sesión</RouterLink>
      </p>
    </div>
  </section>
</template>