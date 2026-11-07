<script setup>
import BaseButton from "../../../components/common/BaseButton.vue";
import BaseInput from "../../../components/common/BaseInput.vue";
import BaseModal from "../../../components/common/BaseModal.vue";
import HomeSideBar from "../components/HomeSideBar.vue";
import { useHome } from "../composables/useHome.js";

const {
  selectedUser,
  isOwnProfile,
  profile,
  name,
  initials,
  details,
  detailLoading,
  detailError,
  selectUser,
  showOwnProfile,
  editOpen,
  editLoading,
  editError,
  editForm,
  openEditProfile,
  closeEditProfile,
  saveProfile,
  deleteOpen,
  deleteLoading,
  deleteError,
  openDeleteAccount,
  closeDeleteAccount,
  confirmDeleteAccount,
} = useHome();
</script>

<template>
  <div class="home-view">
    <HomeSideBar :selected-id="selectedUser?.id" @select="selectUser" />

    <section class="profile-panel" aria-live="polite">
      <button
        v-if="!isOwnProfile"
        class="back-button"
        type="button"
        @click="showOwnProfile"
      >
        ← Volver a mi perfil
      </button>

      <article class="profile-card">
        <div class="profile-header">
          <div class="profile-avatar" aria-hidden="true">
            <img v-if="profile.avatarUrl" :src="profile.avatarUrl" alt="" />
            <template v-else>{{ initials }}</template>
          </div>
          <div>
            <span class="profile-kicker">{{
              isOwnProfile ? "Mi perfil" : "Detalle de usuario"
            }}</span>
            <h1>{{ name }}</h1>
            <p>{{ profile.email }}</p>
          </div>
        </div>

        <p v-if="detailLoading" class="profile-state">Cargando detalles...</p>
        <p v-if="detailError" class="profile-state error" role="alert">
          {{ detailError }}
        </p>

        <dl class="profile-details">
          <div v-for="item in details" :key="item.label">
            <dt>{{ item.label }}</dt>
            <dd>{{ item.value || "—" }}</dd>
          </div>
        </dl>

        <div v-if="isOwnProfile" class="profile-actions">
          <BaseButton type="button" color="secondary" @click="openEditProfile">
            Actualizar datos
          </BaseButton>
          <BaseButton type="button" color="danger" @click="openDeleteAccount">
            Eliminar cuenta
          </BaseButton>
        </div>
      </article>
    </section>

    <BaseModal
      :model-value="editOpen"
      labelledby="edit-profile-title"
      :loading="editLoading"
      @update:model-value="closeEditProfile"
    >
      <form class="profile-form" @submit.prevent="saveProfile">
        <header class="profile-form-header">
          <h2 id="edit-profile-title">Actualizar mis datos</h2>
          <BaseButton
            type="button"
            color="neutral"
            size="sm"
            aria-label="Cerrar"
            :disabled="editLoading"
            @click="closeEditProfile"
          >
            Cerrar
          </BaseButton>
        </header>

        <p v-if="editError" class="profile-state error" role="alert">
          {{ editError }}
        </p>

        <div class="profile-form-fields">
          <label class="profile-form-group" for="profile-name">
            <span>Nombre</span>
            <BaseInput
              id="profile-name"
              v-model="editForm.name"
              name="name"
              autocomplete="name"
              required
              :disabled="editLoading"
            />
          </label>

          <label class="profile-form-group" for="profile-email">
            <span>Correo electrónico</span>
            <BaseInput
              id="profile-email"
              v-model="editForm.email"
              name="email"
              type="email"
              autocomplete="email"
              required
              :disabled="editLoading"
            />
          </label>

          <label class="profile-form-group" for="profile-tel">
            <span>Teléfono</span>
            <BaseInput
              id="profile-tel"
              v-model="editForm.tel"
              name="tel"
              type="tel"
              autocomplete="tel"
              :disabled="editLoading"
            />
          </label>

          <label class="profile-form-group" for="profile-avatar">
            <span>URL del avatar</span>
            <BaseInput
              id="profile-avatar"
              v-model="editForm.avatarUrl"
              name="avatarUrl"
              type="url"
              :disabled="editLoading"
            />
          </label>

          <label class="profile-form-group" for="profile-password">
            <span>Nueva contraseña (opcional)</span>
            <BaseInput
              id="profile-password"
              v-model="editForm.password"
              name="password"
              type="password"
              autocomplete="new-password"
              minlength="8"
              :disabled="editLoading"
            />
          </label>
        </div>

        <footer class="profile-form-actions">
          <BaseButton
            type="button"
            color="neutral"
            :disabled="editLoading"
            @click="closeEditProfile"
          >
            Cancelar
          </BaseButton>
          <BaseButton type="submit" :loading="editLoading">
            {{ editLoading ? "Guardando..." : "Guardar cambios" }}
          </BaseButton>
        </footer>
      </form>
    </BaseModal>

    <BaseModal
      :model-value="deleteOpen"
      labelledby="delete-account-title"
      :loading="deleteLoading"
      @update:model-value="closeDeleteAccount"
    >
      <form class="profile-form" @submit.prevent="confirmDeleteAccount">
        <header class="profile-form-header">
          <h2 id="delete-account-title">Eliminar mi cuenta</h2>
        </header>
        <p>
          Esta acción eliminará permanentemente tu cuenta y no se puede
          deshacer.
        </p>
        <p v-if="deleteError" class="profile-state error" role="alert">
          {{ deleteError }}
        </p>
        <footer class="profile-form-actions">
          <BaseButton
            type="button"
            color="neutral"
            :disabled="deleteLoading"
            @click="closeDeleteAccount"
          >
            Cancelar
          </BaseButton>
          <BaseButton type="submit" color="danger" :loading="deleteLoading">
            {{ deleteLoading ? "Eliminando..." : "Eliminar definitivamente" }}
          </BaseButton>
        </footer>
      </form>
    </BaseModal>
  </div>
</template>

<style scoped>
.home-view {
  display: flex;
  align-items: flex-start;
  min-height: calc(100vh - 85px);
}

.profile-panel {
  flex: 1;
  min-width: 0;
  padding: 28px;
}

.back-button {
  margin-bottom: 16px;
  background: transparent;
  color: var(--color-primary);
  font-weight: 600;
  cursor: pointer;
}

.profile-card {
  max-width: 720px;
  padding: 28px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--color-border);
}

.profile-avatar {
  flex: 0 0 80px;
  width: 80px;
  height: 80px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: var(--radius-lg);
  background: var(--color-primary);
  color: white;
  font-size: 26px;
  font-weight: bold;
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-kicker {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--color-primary);
}

h1 {
  margin: 4px 0;
  font-size: 24px;
}

.profile-header p,
dt {
  font-size: 13px;
  color: var(--color-muted);
}

.profile-state {
  margin-top: 16px;
  font-size: 13px;
  color: var(--color-muted);
}

.profile-state.error {
  color: #b42318;
}

.profile-details {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  margin-top: 24px;
}

.profile-actions,
.profile-form-actions,
.profile-form-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.profile-actions {
  justify-content: flex-start;
  flex-wrap: wrap;
  margin-top: 24px;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
}

.profile-form-header h2 {
  font-size: 21px;
}

.profile-form-fields {
  display: grid;
  gap: 16px;
}

.profile-form-group {
  display: grid;
  gap: 7px;
  color: var(--color-text);
  font-size: 13px;
  font-weight: 600;
}

.profile-form-actions {
  justify-content: flex-end;
  padding-top: 4px;
}

dd {
  margin: 4px 0 0;
  font-weight: 600;
  overflow-wrap: anywhere;
}

@media (max-width: 768px) {
  .home-view {
    flex-direction: column;
  }

  .profile-panel {
    width: 100%;
    padding: 16px;
  }

  .profile-details {
    grid-template-columns: 1fr;
  }
}
</style>
