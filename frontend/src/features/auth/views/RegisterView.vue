<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../../stores/authStore";
import GoogleAuthButton from "../components/GoogleAuthButton.vue";
import RegisterForm from "../components/RegisterForm.vue";

const router = useRouter();
const authStore = useAuthStore();
const errorMessage = ref("");

async function handleRegister(user) {
  errorMessage.value = "";

  try {
    const result = await authStore.register(user);
    if (result?.requiresEmailConfirmation) {
      await router.replace({
        name: "login",
        query: { registered: "1", email: result.email ?? user.email },
      });
      return;
    }
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
        <span class="auth-kicker">ÚNETE A FAUDIX</span>
        <h1>Crea tu cuenta</h1>
        <p>Descubre nuevos álbumes y comparte tus reseñas.</p>
      </header>

      <ol class="signup-steps" aria-label="Pasos de registro">
        <li class="active" aria-current="step"><span>1</span><small>Auth</small></li>
        <li><span>2</span><small>Profile</small></li>
        <li><span>3</span><small>Preferences</small></li>
      </ol>
      <p class="signup-step-note">Confirma tu correo e inicia sesión para completar tu perfil y preferencias.</p>

      <div v-if="errorMessage" class="error-message" role="alert">
        {{ errorMessage }}
      </div>

      <RegisterForm :loading="authStore.isLoading" @submit="handleRegister" />
      <div class="auth-provider-divider"><span>o crea tu cuenta con</span></div>
      <GoogleAuthButton :disabled="authStore.isLoading" />

      <p class="auth-switch">
        ¿Ya tienes cuenta? <RouterLink :to="{ name: 'login' }">Iniciar sesión</RouterLink>
      </p>
    </div>
  </section>
</template>