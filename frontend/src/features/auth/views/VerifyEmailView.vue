<script setup>
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import BaseButton from "../../../components/common/BaseButton.vue";
import { authService } from "../services/authService";

const route = useRoute();
const state = ref("loading");
const message = ref("Confirmando tu correo electrónico...");

onMounted(async () => {
  const token = String(route.query.token ?? "").trim();
  if (!token) {
    state.value = "error";
    message.value = "El enlace no incluye un token de confirmación.";
    return;
  }

  try {
    const response = await authService.verifyEmail(token);
    state.value = "success";
    message.value = response?.message || "Correo confirmado correctamente.";
  } catch (error) {
    state.value = "error";
    message.value =
      error.response?.data?.message ||
      "No se pudo confirmar el correo. El enlace puede haber expirado.";
  }
});
</script>

<template>
  <section class="login-container">
    <div class="login-card verification-card" aria-live="polite">
      <span class="auth-kicker">VERIFICACIÓN DE CUENTA</span>
      <div
        class="verification-mark"
        :class="`verification-mark--${state}`"
        aria-hidden="true"
      >
        <i
          class="fa-solid"
          :class="{
            'fa-spinner fa-spin': state === 'loading',
            'fa-circle-check': state === 'success',
            'fa-circle-exclamation': state === 'error',
          }"
        ></i>
      </div>
      <h1 class="verification-title">
        {{ state === "success" ? "Correo confirmado" : state === "error" ? "No se pudo confirmar" : "Un momento" }}
      </h1>
      <p class="verification-copy">{{ message }}</p>
      <RouterLink v-if="state === 'success'" :to="{ name: 'login' }" class="verification-action">
        <BaseButton type="button" block>Iniciar sesión</BaseButton>
      </RouterLink>
      <RouterLink v-else-if="state === 'error'" :to="{ name: 'login' }" class="verification-back">
        Volver al inicio de sesión
      </RouterLink>
    </div>
  </section>
</template>

<style scoped>
.verification-card {
  max-width: 460px;
  text-align: center;
}

.verification-mark {
  display: grid;
  width: 52px;
  height: 52px;
  place-items: center;
  margin: 18px auto;
  border-radius: 50%;
  background: var(--color-hover);
  color: var(--color-primary);
  font-size: 20px;
}

.verification-mark--success {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.verification-mark--error {
  background: var(--color-danger-bg);
  color: var(--color-danger);
}

.verification-title {
  margin-bottom: 8px;
  font-family: var(--font-heading);
  font-size: 22px;
}

.verification-copy {
  margin-bottom: 20px;
  color: var(--color-muted);
  font-size: 13px;
  line-height: 1.6;
}

.verification-action {
  display: block;
  text-decoration: none;
}

.verification-back {
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 650;
  text-decoration: none;
}
</style>
