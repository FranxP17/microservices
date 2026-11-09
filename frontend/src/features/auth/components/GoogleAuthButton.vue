<script setup>
import { authService } from "../services/authService";

defineProps({ disabled: Boolean });

function startGoogleLogin() {
  window.location.assign(authService.googleLoginUrl());
}
</script>

<template>
  <button
    class="google-auth-button"
    type="button"
    :disabled="disabled"
    @click="startGoogleLogin"
  >
    <i class="fa-brands fa-google" aria-hidden="true"></i>
    <span>Continuar con Google</span>
  </button>
</template>
