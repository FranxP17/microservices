<script setup>
import BaseButton from "../../../components/common/BaseButton.vue";
import BaseInput from "../../../components/common/BaseInput.vue";
import BaseModal from "../../../components/common/BaseModal.vue";
import { useUsers } from "../composables/useUsers";

const {
  users,
  loading,
  errorMessage,
  hasMore,
  search,
  editOpen,
  editingUser,
  editLoading,
  editError,
  updateMessage,
  deleteUser,
  deleteLoading,
  deleteError,
  editForm,
  roles,
  statuses,
  filteredUsers,
  enumName,
  loadUsers,
  openEditModal,
  closeEditModal,
  openCreateModal,
  openDeleteModal,
  closeDeleteModal,
  confirmDeleteUser,
  saveUser,
} = useUsers();
</script>

<template>
  <section class="users-page">
    <div class="page-heading">
      <div>
        <span class="page-kicker">Administración</span>
        <h1>Usuarios</h1>
        <p>Administra los usuarios registrados en el sistema.</p>
      </div>
      <div class="page-actions">
        <BaseButton type="button" color="primary" @click="openCreateModal">
          Registrar usuario
        </BaseButton>
        <span class="record-count">{{ users.length }} registros cargados</span>
      </div>
    </div>

    <p v-if="updateMessage" class="update-message" role="status">
      {{ updateMessage }}
    </p>

    <div class="users-card">
      <div class="table-toolbar">
        <div class="table-heading">
          <h2>Directorio</h2>
          <p>{{ filteredUsers.length }} resultados entre los usuarios cargados</p>
        </div>
        <label class="search-control">
          <span class="visually-hidden">Buscar usuarios</span>
          <input
            v-model="search"
            type="search"
            placeholder="Buscar por nombre, correo o rol"
          />
        </label>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Telefono</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="filteredUsers.length === 0 && !loading && !errorMessage">
              <td colspan="7" class="empty-state">
                {{
                  search ? "No hay usuarios que coincidan." : "No hay usuarios."
                }}
              </td>
            </tr>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td class="user-id">{{ user.id }}</td>
              <td>{{ user.displayName || user.name || "Sin nombre" }}</td>
              <td>{{ user.email }}</td>
              <td>{{ user.tel ? user.tel : "Nulo" }}</td>
              <td>{{ enumName(user.role, roles) || user.role }}</td>
              <td>
                <span
                  class="status"
                  :class="{
                    active: enumName(user.status, statuses) === 'ACTIVE',
                    inactive: ['INACTIVE', 'BLOCKED'].includes(enumName(user.status, statuses)),
                  }"
                >
                  {{ { ACTIVE: "ACTIVO", INACTIVE: "INACTIVO", BLOCKED: "BLOQUEADO" }[enumName(user.status, statuses)] || user.status }}
                </span>
              </td>
              <td>
                <BaseButton
                  type="button"
                  color="secondary"
                  size="sm"
                  :aria-label="`Editar usuario ${user.displayName || user.name || user.email}`"
                  @click="openEditModal(user)"
                >
                  Editar
                </BaseButton>
                <BaseButton
                  type="button"
                  color="danger"
                  size="sm"
                  :disabled="loading"
                  :aria-label="`Eliminar usuario ${user.displayName || user.name || user.email}`"
                  @click="openDeleteModal(user)"
                >
                  Eliminar
                </BaseButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="errorMessage || hasMore" class="pagination-controls">
        <p v-if="errorMessage" class="error-message" role="alert">{{ errorMessage }}</p>
        <BaseButton
          type="button"
          color="secondary"
          size="sm"
          :loading="loading"
          :disabled="deleteLoading"
          @click="loadUsers"
        >
          {{ loading ? "Cargando usuarios..." : errorMessage ? "Reintentar" : "Cargar más" }}
        </BaseButton>
      </div>
    </div>

    <BaseModal
      :model-value="editOpen"
      labelledby="edit-dialog-title"
      :loading="editLoading"
      @update:model-value="closeEditModal"
    >
      <form class="edit-form" @submit.prevent="saveUser">
        <header class="edit-header">
          <div>
            <p class="page-kicker">Directorio de usuarios</p>
            <h2 id="edit-dialog-title">{{ editingUser ? "Editar usuario" : "Registrar usuario" }}</h2>
          </div>
          <BaseButton
            type="button"
            color="neutral"
            size="sm"
            aria-label="Cerrar"
            :disabled="editLoading"
            @click="closeEditModal"
          >
            Cerrar
          </BaseButton>
        </header>

        <p v-if="editError" class="error-message" role="alert">
          {{ editError }}
        </p>

        <div class="edit-fields">
          <label class="form-group" for="edit-user-name">
            <span>Nombre</span>
            <BaseInput
                id="edit-user-name"
                v-model="editForm.name"
                name="name"
                autocomplete="name"
                required
                :disabled="editLoading"
            />
          </label>

          <label class="form-group" for="edit-user-email">
            <span>Correo electrónico</span>
            <BaseInput
                id="edit-user-email"
                v-model="editForm.email"
                name="email"
                type="email"
                autocomplete="email"
                required
                :disabled="editLoading"
            />
          </label>

          <label class="form-group" for="edit-user-tel">
            <span>Teléfono</span>
            <BaseInput
                id="edit-user-tel"
                v-model="editForm.tel"
                name="tel"
                type="tel"
                autocomplete="tel"
                :disabled="editLoading"
            />
          </label>

          <label class="form-group" for="edit-user-avatar">
            <span>URL del avatar</span>
            <BaseInput
              id="edit-user-avatar"
              v-model="editForm.avatarUrl"
              name="avatarUrl"
              type="url"
              :disabled="editLoading"
            />
          </label>

          <label class="form-group" for="edit-user-role">
            <span>Rol</span>
            <select id="edit-user-role" v-model="editForm.role" required :disabled="editLoading">
              <option disabled value="">Selecciona un rol</option>
              <option v-for="role in roles" :key="role" :value="role">{{ role }}</option>
            </select>
          </label>

          <label class="form-group" for="edit-user-status">
            <span>Estado</span>
            <select id="edit-user-status" v-model="editForm.status" required :disabled="editLoading">
              <option disabled value="">Selecciona un estado</option>
              <option value="ACTIVE">Activo</option>
              <option value="INACTIVE">Inactivo</option>
              <option value="BLOCKED">Bloqueado</option>
            </select>
          </label>

          <label class="form-group" for="edit-user-password">
            <span>{{ editingUser ? "Nueva contraseña (opcional)" : "Contraseña" }}</span>
            <BaseInput
              id="edit-user-password"
              v-model="editForm.password"
              name="password"
              type="password"
              autocomplete="new-password"
              minlength="8"
              :required="!editingUser"
              :disabled="editLoading"
            />
          </label>
        </div>

        <footer class="edit-actions">
          <BaseButton
            type="button"
            color="neutral"
            :disabled="editLoading"
            @click="closeEditModal"
          >
            Cancelar
          </BaseButton>
          <BaseButton type="submit" :loading="editLoading">
            {{ editLoading ? "Guardando..." : editingUser ? "Guardar cambios" : "Crear usuario" }}
          </BaseButton>
        </footer>
      </form>
    </BaseModal>

    <BaseModal
      :model-value="Boolean(deleteUser)"
      labelledby="delete-dialog-title"
      :loading="deleteLoading"
      @update:model-value="closeDeleteModal"
    >
      <form class="edit-form" @submit.prevent="confirmDeleteUser">
        <header class="edit-header">
          <h2 id="delete-dialog-title">Eliminar usuario</h2>
        </header>
        <p>
          Se eliminará permanentemente a
          <strong>{{ deleteUser?.displayName || deleteUser?.name || deleteUser?.email }}</strong>.
          Esta acción no se puede deshacer.
        </p>
        <p v-if="deleteError" class="error-message" role="alert">{{ deleteError }}</p>
        <footer class="edit-actions">
          <BaseButton type="button" color="neutral" :disabled="deleteLoading" @click="closeDeleteModal">
            Cancelar
          </BaseButton>
          <BaseButton type="submit" color="danger" :loading="deleteLoading" :disabled="loading">
            {{ deleteLoading ? "Eliminando..." : "Eliminar definitivamente" }}
          </BaseButton>
        </footer>
      </form>
    </BaseModal>
  </section>
</template>

<style scoped>
.update-message {
  margin-bottom: 16px;
  padding: 12px 14px;
  border: 1px solid #bbf7d0;
  border-radius: var(--radius-md);
  background: #f0fdf4;
  color: #166534;
  font-size: 13px;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
}

.edit-header,
.edit-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.edit-header h2 {
  font-size: 21px;
}

.edit-fields {
  display: grid;
  gap: 16px;
}

.form-group {
  display: grid;
  gap: 7px;
  color: var(--color-text);
  font-size: 13px;
  font-weight: 600;
}

.form-group select {
  width: 100%;
  height: 46px;
  padding: 0 13px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
}

.form-group select:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
}

.error-message {
  padding: 12px;
  border: 1px solid #fecaca;
  border-radius: var(--radius-md);
  background: #fef2f2;
  color: #b91c1c;
  font-size: 13px;
}

.edit-actions {
  justify-content: flex-end;
  padding-top: 4px;
}

.users-page {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
}

.page-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
  margin-bottom: 24px;
}

.page-kicker {
  display: block;
  margin-bottom: 7px;
  color: var(--color-primary);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

.page-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-heading h1 {
  margin-bottom: 6px;
  font-size: 26px;
  line-height: 1.2;
}

.page-heading p {
  color: var(--color-muted);
  font-size: 14px;
}

.record-count {
  flex: 0 0 auto;
  padding: 7px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-muted);
  font-size: 12px;
}

.users-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.pagination-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid var(--color-border);
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--color-border);
}

.table-heading h2 {
  font-size: 14px;
  font-weight: 650;
}

.table-heading p {
  margin-top: 4px;
  color: var(--color-muted);
  font-size: 12px;
}

.search-control {
  width: min(100%, 340px);
}

.search-control input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
}

.table-container {
  overflow-x: auto;
  overscroll-behavior-x: contain;
}

table {
  width: 100%;
  min-width: 720px;
  border-collapse: collapse;
  text-align: left;
  white-space: nowrap;
}

th,
td {
  padding: 14px 18px;
  border-top: 1px solid var(--color-border);
  font-size: 13px;
}

th {
  color: var(--color-muted);
  font-weight: 600;
  background: #f6f9f8;
}

td > button {
  margin: 0 .5rem 0 0;
}

tbody tr:not(:has(.empty-state)):hover {
  background: #f7faf9;
}

.user-id {
  max-width: 170px;
  overflow: hidden;
  color: var(--color-muted);
  font-family: Consolas, monospace;
  text-overflow: ellipsis;
}

.status {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 3px 8px;
  border-radius: var(--radius-sm);
  background: #eef2f1;
  color: var(--color-muted);
  font-size: 11px;
}

.active {
  background: #e6f4ef;
  color: #17684f;
}

.inactive {
  background: #f9ece8;
  color: #9c4939;
}

.empty-state {
  text-align: center;
  color: var(--color-muted);
  padding: 34px 20px;
}

.empty-state button {
  margin-left: 10px;
  padding: 7px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-primary);
  font-weight: 600;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 560px) {
  .page-heading {
    align-items: center;
  }

  .page-heading h1 {
    font-size: 23px;
  }

  .table-toolbar {
    align-items: stretch;
    flex-direction: column;
    gap: 14px;
    padding: 16px;
  }

  .search-control {
    width: 100%;
  }

  .edit-form {
    padding: 20px;
  }

  .edit-actions {
    align-items: stretch;
    flex-direction: column-reverse;
  }
}
</style>
