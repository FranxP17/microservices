<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import BaseButton from "../../../components/common/BaseButton.vue";
import BaseInput from "../../../components/common/BaseInput.vue";
import { useTheme } from "../../../composables/useTheme";
import { profileService } from "../../home/services/profileService";
import { useAuthStore } from "../../../stores/authStore";
import { getErrorMessagge } from "../../../utils/errorHandler";

const router = useRouter();
const authStore = useAuthStore();
const { setTheme } = useTheme();
const step = ref(2);
const loading = ref(true);
const saving = ref(false);
const errorMessage = ref("");
const profileExists = ref(false);
const avatars = ref([]);
const genres = [
  "Indie Rock",
  "Pop",
  "Hip-Hop",
  "Electrónica",
  "R&B",
  "Jazz",
  "Clásica",
  "Metal",
  "Folk",
  "Post-Punk",
  "Dream Pop",
  "Ambient",
  "Reggaetón",
  "Soul",
  "Shoegaze",
];
const profileForm = reactive({ name: "", username: "", bio: "", avatarId: "" });
const preferences = reactive({
  favoriteGenres: [],
  language: "es",
  theme: "system",
  explicitContent: false,
});
const stepTitle = computed(() => step.value === 2 ? "Personaliza tu perfil" : "Ajusta tu experiencia");

function getArray(data) {
  const value = data?.data ?? data?.Data ?? data?.avatars ?? data;
  return Array.isArray(value) ? value : [];
}

function avatarId(avatar) {
  return avatar.id ?? avatar.Id ?? "";
}

function avatarName(avatar) {
  return avatar.name ?? avatar.Name ?? "Avatar";
}

function avatarUrl(avatar) {
  return avatar.image_url ?? avatar.Image_url ?? avatar.imageUrl ?? "";
}

function toggleGenre(genre) {
  preferences.favoriteGenres = preferences.favoriteGenres.includes(genre)
    ? preferences.favoriteGenres.filter((item) => item !== genre)
    : [...preferences.favoriteGenres, genre];
}

async function loadOnboarding() {
  loading.value = true;
  errorMessage.value = "";
  try {
    try {
      const profile = await profileService.getMe();
      profileExists.value = true;
      profileForm.name = profile.name ?? profile.Name ?? "";
      profileForm.username = profile.username ?? profile.Username ?? "";
      profileForm.bio = profile.bio ?? profile.Bio ?? "";
      profileForm.avatarId = profile.avatar_id ?? profile.Avatar_id ?? "";
      step.value = 3;
    } catch (error) {
      if (error.response?.status !== 404) throw error;
      profileExists.value = false;
      profileForm.name = authStore.user?.displayName || authStore.user?.name || "";
      profileForm.username = authStore.user?.email?.split("@")[0] || "";
      step.value = 2;
    }

    const avatarResponse = await profileService.getAvatars();
    avatars.value = getArray(avatarResponse);
    if (!profileForm.avatarId && avatars.value.length) {
      profileForm.avatarId = avatarId(avatars.value[0]);
    }

    if (profileExists.value) {
      const saved = await profileService.getPreferences();
      preferences.favoriteGenres = saved.favoriteGenres ?? saved.FavoriteGenres ?? [];
      preferences.language = saved.language ?? saved.Language ?? "es";
      preferences.theme = saved.theme ?? saved.Theme ?? "system";
      preferences.explicitContent = saved.explicitContent ?? saved.ExplicitContent ?? false;
    }
  } catch (error) {
    errorMessage.value = getErrorMessagge(error);
  } finally {
    loading.value = false;
  }
}

async function saveProfile() {
  if (!profileForm.name.trim() || !profileForm.username.trim() || !profileForm.avatarId) {
    errorMessage.value = "Completa el nombre, usuario y avatar para continuar.";
    return;
  }
  if (profileForm.name.trim().length > 100 || profileForm.username.trim().length > 50 || profileForm.bio.trim().length > 500) {
    errorMessage.value = "El nombre admite 100, el usuario 50 y la biografía 500 caracteres como máximo.";
    return;
  }

  saving.value = true;
  errorMessage.value = "";
  try {
    const payload = {
      name: profileForm.name.trim(),
      username: profileForm.username.trim(),
      bio: profileForm.bio.trim(),
      avatar_id: profileForm.avatarId,
    };
    if (profileExists.value) await profileService.update(payload);
    else await profileService.create(payload);

    profileExists.value = true;
    authStore.user = {
      ...authStore.user,
      name: payload.name,
      displayName: payload.name,
    };
    step.value = 3;
  } catch (error) {
    errorMessage.value = getErrorMessagge(error);
  } finally {
    saving.value = false;
  }
}

async function savePreferences() {
  if (!preferences.favoriteGenres.length) {
    errorMessage.value = "Elige al menos un género para personalizar tu feed.";
    return;
  }

  saving.value = true;
  errorMessage.value = "";
  try {
    await profileService.updatePreferences({
      favoriteGenres: preferences.favoriteGenres,
      language: preferences.language,
      theme: preferences.theme,
      explicitContent: preferences.explicitContent,
    });
    const resolvedTheme = preferences.theme === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : preferences.theme;
    setTheme(resolvedTheme);
    authStore.completeOnboarding();
    await router.replace({ name: "home" });
  } catch (error) {
    errorMessage.value = getErrorMessagge(error);
  } finally {
    saving.value = false;
  }
}

onMounted(loadOnboarding);
</script>

<template>
  <section class="login-container">
    <div class="login-card onboarding-card">
      <header class="login-header">
        <span class="auth-kicker">CONFIGURA TU CUENTA · {{ step }} DE 3</span>
        <h1>{{ stepTitle }}</h1>
        <p>Tu cuenta está verificada. Completa estos pasos para entrar en Faudix.</p>
      </header>

      <ol class="onboarding-steps" aria-label="Pasos de configuración">
        <li class="is-complete"><span><i class="fa-solid fa-check" aria-hidden="true"></i></span><small>Auth</small></li>
        <li :class="{ 'is-active': step === 2, 'is-complete': profileExists }"><span>{{ profileExists ? "✓" : "2" }}</span><small>Perfil</small></li>
        <li :class="{ 'is-active': step === 3 }"><span>3</span><small>Preferencias</small></li>
      </ol>

      <p v-if="loading" class="loading-message" role="status">Cargando tus datos...</p>
      <p v-if="errorMessage" class="error-message" role="alert">{{ errorMessage }}</p>

      <form v-if="!loading && step === 2" class="onboarding-form" @submit.prevent="saveProfile">
        <label class="form-group" for="onboarding-name">
          <span>Nombre visible</span>
          <BaseInput id="onboarding-name" v-model="profileForm.name" name="name" autocomplete="name" maxlength="100" required :disabled="saving" />
        </label>
        <label class="form-group" for="onboarding-username">
          <span>Nombre de usuario</span>
          <BaseInput id="onboarding-username" v-model="profileForm.username" name="username" autocomplete="username" maxlength="50" required :disabled="saving" />
        </label>
        <label class="form-group" for="onboarding-bio">
          <span>Biografía <small>{{ profileForm.bio.length }}/500</small></span>
          <textarea id="onboarding-bio" v-model="profileForm.bio" name="bio" maxlength="500" rows="3" :disabled="saving" placeholder="¿Qué música te mueve?"></textarea>
        </label>
        <fieldset class="onboarding-field avatar-field">
          <legend>Elige tu avatar</legend>
          <div v-if="avatars.length" class="onboarding-avatars">
            <label v-for="avatar in avatars" :key="avatarId(avatar)" class="onboarding-avatar" :class="{ selected: profileForm.avatarId === avatarId(avatar) }">
              <input v-model="profileForm.avatarId" type="radio" name="avatar" :value="avatarId(avatar)" :disabled="saving" />
              <img :src="avatarUrl(avatar)" :alt="avatarName(avatar)" />
              <span>{{ avatarName(avatar) }}</span>
            </label>
          </div>
          <p v-else class="avatar-empty">No hay avatares disponibles.</p>
        </fieldset>
        <BaseButton type="submit" size="lg" block :loading="saving" :disabled="saving || !avatars.length">Continuar a preferencias</BaseButton>
      </form>

      <form v-else-if="!loading && step === 3" class="onboarding-form" @submit.prevent="savePreferences">
        <fieldset class="onboarding-field genre-field">
          <legend>¿Qué géneros escuchas? <small>Elige los que te interesan</small></legend>
          <div class="genre-choices">
            <button v-for="genre in genres" :key="genre" type="button" :aria-pressed="preferences.favoriteGenres.includes(genre)" :class="{ selected: preferences.favoriteGenres.includes(genre) }" @click="toggleGenre(genre)">{{ genre }}</button>
          </div>
        </fieldset>
        <label class="form-group" for="onboarding-language">
          <span>Idioma</span>
          <select id="onboarding-language" v-model="preferences.language" :disabled="saving"><option value="es">Español</option><option value="en">English</option></select>
        </label>
        <fieldset class="onboarding-field theme-field">
          <legend>Aspecto</legend>
          <div class="theme-options">
            <label v-for="option in [{ value: 'system', label: 'Sistema' }, { value: 'light', label: 'Claro' }, { value: 'dark', label: 'Oscuro' }]" :key="option.value" :class="{ selected: preferences.theme === option.value }">
              <input v-model="preferences.theme" type="radio" name="theme" :value="option.value" :disabled="saving" />
              <span>{{ option.label }}</span>
            </label>
          </div>
        </fieldset>
        <label class="explicit-option"><input v-model="preferences.explicitContent" type="checkbox" :disabled="saving" /><span><strong>Permitir contenido explícito</strong><small>Podrás cambiar esta preferencia más adelante.</small></span></label>
        <div class="onboarding-actions">
          <BaseButton type="button" color="secondary" :disabled="saving" @click="step = 2">Volver al perfil</BaseButton>
          <BaseButton type="submit" size="lg" :loading="saving" :disabled="saving">{{ saving ? "Guardando..." : "Entrar a Faudix" }}</BaseButton>
        </div>
      </form>
    </div>
  </section>
</template>

<style scoped>
.onboarding-card { max-width: 520px; }
.onboarding-steps { display: grid; grid-template-columns: repeat(3, 1fr); margin: 0 0 22px; padding: 0; list-style: none; }
.onboarding-steps li { position: relative; display: grid; justify-items: center; gap: 5px; color: var(--color-muted); font-size: 10px; }
.onboarding-steps li:not(:last-child)::after { position: absolute; top: 14px; left: calc(50% + 17px); width: calc(100% - 34px); height: 1px; background: var(--color-border); content: ""; }
.onboarding-steps li > span { z-index: 1; display: grid; width: 28px; height: 28px; place-items: center; border: 1px solid var(--color-border); border-radius: 50%; background: var(--color-surface); color: var(--color-muted); font-size: 11px; font-weight: 700; }
.onboarding-steps li.is-active > span,.onboarding-steps li.is-complete > span { border-color: var(--color-primary); background: var(--color-primary); color: var(--color-primary-foreground); }
.onboarding-steps li.is-active small,.onboarding-steps li.is-complete small { color: var(--color-text); font-weight: 700; }
.onboarding-form { display: grid; gap: 15px; }
.onboarding-form .form-group > span { display: flex; justify-content: space-between; }
.onboarding-form .form-group small,.onboarding-field legend small { color: var(--color-muted); font-size: 10px; font-weight: 500; }
.onboarding-form textarea,.onboarding-form select { width: 100%; min-height: 42px; padding: 10px 11px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); color: var(--color-text); font: inherit; font-size: 13px; }
.onboarding-form textarea { min-height: 84px; resize: vertical; }
.onboarding-field { min-width: 0; border: 0; padding: 0; }
.onboarding-field legend { margin-bottom: 8px; color: var(--color-text); font-size: 12px; font-weight: 650; }
.onboarding-avatars { display: grid; grid-template-columns: repeat(auto-fill, minmax(68px, 1fr)); gap: 7px; max-height: 180px; overflow-y: auto; }
.onboarding-avatar { display: grid; justify-items: center; gap: 5px; min-width: 0; padding: 7px 4px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); cursor: pointer; }
.onboarding-avatar.selected,.theme-options label.selected { border-color: var(--color-primary); background: var(--color-primary-container); }
.onboarding-avatar input,.theme-options input { position: absolute; width: 1px; height: 1px; opacity: 0; }
.onboarding-avatar:focus-within,.theme-options label:focus-within { outline: 2px solid var(--color-primary); outline-offset: 2px; }
.onboarding-avatar img { width: 38px; height: 38px; border-radius: 50%; object-fit: cover; background: var(--color-surface-muted); }
.onboarding-avatar span { max-width: 100%; overflow: hidden; color: var(--color-muted); font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }
.genre-choices { display: flex; flex-wrap: wrap; gap: 6px; }
.genre-choices button { min-height: 30px; padding: 0 10px; border: 1px solid var(--color-border); border-radius: 999px; background: var(--color-surface); color: var(--color-text); font-size: 10px; cursor: pointer; }
.genre-choices button.selected { border-color: var(--color-primary); background: var(--color-primary); color: var(--color-primary-foreground); }
.theme-options { display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px; }
.theme-options label { display: grid; min-height: 36px; place-items: center; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); color: var(--color-text); font-size: 11px; cursor: pointer; }
.explicit-option { display: flex; align-items: center; gap: 10px; padding: 11px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface-muted); cursor: pointer; }
.explicit-option input { width: 17px; height: 17px; accent-color: var(--color-primary); }
.explicit-option span { display: grid; gap: 3px; }
.explicit-option strong { font-size: 11px; }
.explicit-option small,.avatar-empty { color: var(--color-muted); font-size: 10px; }
.onboarding-actions { display: flex; justify-content: space-between; gap: 10px; margin-top: 4px; }
</style>
