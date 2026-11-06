<script setup>
import { computed, onMounted, ref } from "vue";
import { userService } from "../../users/services/userService";
import { getErrorMessagge } from "../../../utils/errorHandler";
import { useDashboard } from "../composables/useDashboard";

const { welcomeTitle } = useDashboard();


const users = ref([]);
const loading = ref(false);
const errorMessage = ref("");

const loadDashboard = async () => {
  loading.value = true;
  errorMessage.value = "";

  try {
    const response = await userService.getAll();
    users.value = Array.isArray(response)
      ? response
      : (response?.data ?? response?.Data ?? []);
  } catch (error) {
    errorMessage.value = getErrorMessagge(error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadDashboard();
});

const totalUsers = computed(() => {
  return users.value.length;
});

const statistics = ref([
  {
    title: "Usuarios registrados",
    value: totalUsers,
    icon: "<i class='fa-solid fa-users'></i>",
  },
  {
    title: "Usuarios activos",
    value: "850",
    icon: "<i class='fa-solid fa-check'></i>",
  },
]);
</script>

<template>
  <section class="dashboard">
    <div class="page-heading">
      <div>
        <h1>Dashboard</h1>
        <p>Resumen general de tu sistema administrativo.</p>
      </div>
    </div>

    <div class="main-grid">
      <div class="statistics-grid">
        <article v-for="item in statistics" :key="item.title" class="stat-card">
          <div class="stat-top">
            <span>{{ item.title }}</span>
            <span class="stat-icon" v-html="item.icon"></span>
          </div>

          <h2>{{ item.value }}</h2>
        </article>
      </div>
    </div>
    <div class="dashboard-content">
      <article class="welcome-card">
        <h2>{{ welcomeTitle }}</h2>
        <p>
          Desde aquí puedes gestionar y supervisar las diferentes
          funcionalidades de tu aplicación.
        </p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.page-heading {
  margin-bottom: 28px;
}

.page-heading h1 {
  font-size: 25px;
  margin-bottom: 8px;
}

.page-heading p {
  color: var(--color-muted);
  font-size: 14px;
}

.main-grid {
  display: flex;
  position: relative;
  gap: 1rem;
}

.statistics-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.stat-card {
  padding: 22px;
  background: white;
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

.stat-icon {
  font-size: 20px;
  color: var(--color-primary);
}

.stat-card h2 {
  font-size: 28px;
  margin: 22px 0 10px;
}

.stat-percentage {
  font-size: 11px;
  color: #16a36a;
}

.dashboard-content {
  position: absolute;
  right: 1rem;
  box-shadow: 2px #000 solid;
  max-width: 300px;
  top: 6rem;
}

.welcome-card {
  padding: 28px;
  background: white;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}

.welcome-card h2 {
  font-size: 19px;
  margin-bottom: 12px;
}

.welcome-card p {
  font-size: 14px;
  color: var(--color-muted);
  line-height: 1.6;
}

@media (max-width: 1000px) {
  .statistics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 560px) {
  .statistics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
