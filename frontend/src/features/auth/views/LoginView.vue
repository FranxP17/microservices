<script setup>
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../../../stores/authStore";
import LoginForm from "../components/LoginForm.vue";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const errorMessage = ref("");

async function handleLogin(credentials) {
  errorMessage.value = "";

  try {
    await authStore.login(credentials);

    router.push({ name: "home" });
  } catch (error) {
    const status = error.response?.status;

    if (status === 401) {
      errorMessage.value = "Correo o contraseña incorrectos";
    } else if (status === 403) {
      errorMessage.value = "No tienes autorización para ingresar";
    } else if (!error.response) {
      errorMessage.value = "No se pudo conectar con el servidor";
    } else {
      errorMessage.value =
        error.response.data?.message || "Ocurrió un error al iniciar sesión";
    }
  }
}
</script>

<template>
  <section class="login-container">
    <div class="login-card">
      <header class="login-header">
        <span class="auth-kicker">TU CUENTA FAUDIX</span>
        <h1>Qué bueno verte de nuevo</h1>
        <p>Inicia sesión y continúa descubriendo música.</p>
      </header>

      <div v-if="errorMessage" class="error-message" role="alert">
        {{ errorMessage }}
      </div>

      <div v-if="route.query.registered" class="success-message" role="status">
        Registro completado. Ya puedes iniciar sesión.
      </div>

      <div v-if="route.query.logoutError" class="error-message" role="alert">
        El cierre de sesión no pudo confirmarse con el servidor.
      </div>

      <LoginForm :loading="authStore.isLoading" @submit="handleLogin" />

      <p class="auth-switch">
        ¿No tienes cuenta? <RouterLink :to="{ name: 'register' }">Crear cuenta</RouterLink>
      </p>

      <div v-if="authStore.isLoading" class="loading-message">
        Verificando credenciales...
      </div>
    </div>
  </section>
</template>
