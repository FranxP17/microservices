<script setup>
import { useDashboard } from "../composables/useDashboard";

const {
  welcomeTitle,
  users,
  loading,
  errorMessage,
  formattedLastUpdated,
  statistics,
  roleBreakdown,
  roleName,
  statusName,
  statusLabel,
  loadDashboard,
} = useDashboard();
</script>

<template>
  <section class="dashboard">
    <div class="page-heading">
      <div>
        <h1>Dashboard</h1>
        <p>Resumen general de tu sistema administrativo</p>
      </div>
      <button
        class="refresh-button"
        type="button"
        :disabled="loading"
        @click="loadDashboard"
      >
        <span aria-hidden="true">{{ loading ? "…" : "↻" }}</span>
        {{ loading ? "Actualizando..." : "Actualizar datos" }}
      </button>
    </div>

    <p v-if="errorMessage" class="dashboard-error" role="alert">
      {{ errorMessage }}
      <button type="button" @click="loadDashboard">Reintentar</button>
    </p>

    <p v-if="formattedLastUpdated" class="last-updated">
      Datos actualizados: {{ formattedLastUpdated }}
    </p>

    <div class="statistics-grid" aria-live="polite">
      <article
        v-for="item in statistics"
        :key="item.title"
        class="stat-card"
        :class="`stat-card--${item.variant}`"
      >
        <div class="stat-top">
          <span>{{ item.title }}</span>
          <span class="stat-mark" aria-hidden="true"></span>
        </div>
        <p class="stat-value">{{ loading && !users.length ? "—" : item.value }}</p>
        <p class="stat-detail">{{ item.detail }}</p>
      </article>
    </div>

    <div class="dashboard-grid">
      <article class="dashboard-card roles-card">
        <div class="section-heading">
          <div>
            <h2>Distribución por rol</h2>
            <p>Composición de los usuarios registrados</p>
          </div>
        </div>

        <div v-if="loading && !users.length" class="empty-state" aria-live="polite">
          Cargando información...
        </div>
        <div v-else-if="!users.length" class="empty-state">
          Aún no hay usuarios para mostrar.
        </div>
        <div v-else class="role-list">
          <div v-for="role in roleBreakdown" :key="role.name" class="role-row">
            <div class="role-label">
              <span>{{ role.name }}</span>
              <span>{{ role.count }} ({{ role.percentage }}%)</span>
            </div>
            <div
              class="role-track"
              role="progressbar"
              :aria-label="`Usuarios con rol ${role.name}`"
              :aria-valuenow="role.percentage"
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <span :style="{ width: `${role.percentage}%` }"></span>
            </div>
          </div>
        </div>
      </article>

      <article class="dashboard-card actions-card">
        <div class="section-heading">
          <div>
            <h2>{{ welcomeTitle }}</h2>
            <p>Accesos rápidos para continuar</p>
          </div>
        </div>
        <p class="welcome-copy">
          Consulta el directorio, administra cuentas y revisa el estado general
          de los usuarios desde un solo lugar.
        </p>
        <RouterLink class="users-link" :to="{ name: 'users' }">
          <span>
            <strong>Administrar usuarios</strong>
            <small>Buscar, editar o registrar cuentas</small>
          </span>
          <span class="link-arrow" aria-hidden="true">→</span>
        </RouterLink>
        <p class="user-count">
          {{ users.length }} {{ users.length === 1 ? "usuario registrado" : "usuarios registrados" }}
        </p>
      </article>
    </div>

    <section class="directory-card" aria-labelledby="directory-title">
      <div class="section-heading directory-heading">
        <div>
          <h2 id="directory-title">Directorio de usuarios</h2>
          <p>Vista rápida de las cuentas registradas</p>
        </div>
        <RouterLink class="text-link" :to="{ name: 'users' }">
          Ver directorio
        </RouterLink>
      </div>

      <div v-if="loading && !users.length" class="empty-state" aria-live="polite">
        Cargando usuarios...
      </div>
      <div v-else-if="!users.length" class="empty-state">
        No hay usuarios registrados todavía.
      </div>
      <div v-else class="table-container">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo electrónico</th>
              <th>Rol</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in users.slice(0, 5)" :key="item.id">
              <td>{{ item.displayName || item.name || "Sin nombre" }}</td>
              <td>{{ item.email || "—" }}</td>
              <td>{{ roleName(item.role) || "—" }}</td>
              <td>
                <span
                  class="status-badge"
                  :class="`status-badge--${statusName(item.status).toLowerCase()}`"
                >
                  {{ statusLabel(item.status) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</template>

<style scoped>
.dashboard {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
}

.page-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 10px;
}

.page-heading h1 {
  margin-bottom: 6px;
  font-size: 26px;
}

.page-heading p,
.section-heading p {
  color: var(--color-muted);
  font-size: 14px;
}

.refresh-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 0 13px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  font-weight: 600;
  cursor: pointer;
}

.refresh-button:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.refresh-button:disabled {
  cursor: wait;
  opacity: 0.7;
}

.refresh-button span {
  font-size: 20px;
  line-height: 1;
}

.last-updated {
  margin-bottom: 18px;
  color: var(--color-muted);
  font-size: 12px;
}

.dashboard-error {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin: 18px 0;
  padding: 12px 14px;
  border: 1px solid #fecaca;
  border-radius: var(--radius-md);
  background: #fef2f2;
  color: #b91c1c;
  font-size: 13px;
}

.dashboard-error button {
  flex: 0 0 auto;
  padding: 0;
  background: transparent;
  color: inherit;
  font-weight: 700;
  text-decoration: underline;
  cursor: pointer;
}

.statistics-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-top: 20px;
}

.stat-card {
  min-width: 0;
  padding: 20px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}

.stat-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-muted);
}

.stat-mark {
  width: 10px;
  height: 10px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: var(--color-primary);
}

.stat-card--active .stat-mark {
  background: #16a36a;
}

.stat-card--inactive .stat-mark {
  background: #d97706;
}

.stat-card--blocked .stat-mark {
  background: #dc5656;
}

.stat-value {
  margin: 18px 0 5px;
  font-size: 30px;
  font-weight: 700;
  line-height: 1.1;
}

.stat-detail {
  color: var(--color-muted);
  font-size: 12px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
  gap: 18px;
  margin-top: 18px;
}

.dashboard-card,
.directory-card {
  min-width: 0;
  padding: 22px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.section-heading h2 {
  margin-bottom: 5px;
  font-size: 16px;
}

.section-heading p {
  font-size: 12px;
}

.role-list {
  display: grid;
  gap: 19px;
  margin-top: 24px;
}

.role-label {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
  font-size: 13px;
}

.role-label span:last-child {
  color: var(--color-muted);
}

.role-track {
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: #edf2f0;
}

.role-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--color-primary);
  transition: width 180ms ease;
}

.welcome-copy {
  margin: 20px 0;
  font-size: 14px;
  color: var(--color-muted);
  line-height: 1.6;
}

.users-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text);
  text-decoration: none;
  transition: border-color 150ms ease, background 150ms ease;
}

.users-link:hover {
  border-color: var(--color-primary);
  background: #f5faf8;
}

.users-link strong,
.users-link small {
  display: block;
}

.users-link strong {
  font-size: 13px;
}

.users-link small {
  margin-top: 5px;
  color: var(--color-muted);
  font-size: 12px;
}

.link-arrow {
  color: var(--color-primary);
  font-size: 20px;
}

.user-count {
  margin-top: 14px;
  color: var(--color-muted);
  font-size: 12px;
}

.directory-card {
  margin-top: 18px;
  padding: 0;
  overflow: hidden;
}

.directory-heading {
  padding: 20px 22px;
  border-bottom: 1px solid var(--color-border);
}

.text-link {
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
}

.text-link:hover {
  text-decoration: underline;
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  white-space: nowrap;
}

th,
td {
  padding: 13px 22px;
  border-bottom: 1px solid var(--color-border);
  font-size: 13px;
}

th {
  background: #f6f9f8;
  color: var(--color-muted);
  font-weight: 600;
}

tbody tr:last-child td {
  border-bottom: 0;
}

.status-badge {
  display: inline-flex;
  padding: 4px 8px;
  border-radius: 999px;
  background: #edf2f0;
  color: var(--color-muted);
  font-size: 11px;
  font-weight: 600;
}

.status-badge--active {
  background: #e6f4ef;
  color: #17684f;
}

.status-badge--inactive {
  background: #fff3dc;
  color: #9a5b08;
}

.status-badge--blocked {
  background: #fcebea;
  color: #a63c3c;
}

.empty-state {
  padding: 26px 20px;
  color: var(--color-muted);
  font-size: 13px;
  text-align: center;
}

@media (max-width: 1000px) {
  .statistics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .page-heading {
    align-items: flex-start;
  }

  .page-heading h1 {
    font-size: 23px;
  }

  .refresh-button {
    padding: 0 10px;
    font-size: 12px;
  }

  .statistics-grid {
    gap: 10px;
  }

  .stat-card {
    padding: 15px;
  }

  .stat-top {
    align-items: flex-start;
    font-size: 12px;
  }

  .stat-value {
    font-size: 26px;
  }

  .directory-heading,
  .dashboard-card {
    padding: 17px;
  }

  th,
  td {
    padding: 12px 15px;
  }
}
</style>
