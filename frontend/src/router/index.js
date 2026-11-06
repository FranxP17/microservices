import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/authStore";
import AuthLayout from "../layouts/AuthLayout.vue";
import AdminLayout from "../layouts/AdminLayout.vue";
import Login from "../features/auth/views/LoginView.vue";
import Register from "../features/auth/views/RegisterView.vue";
import Dashboard from "../features/dashboard/views/DashboardView.vue";
import Users from "../features/users/views/UsersView.vue";

const routes = [
  {
    path: "/login",
    component: AuthLayout,

    children: [
      {
        path: "",
        name: "login",
        component: Login,
        meta: { guestOnly: true },
      },
    ],
  },

  {
    path: "/register",
    component: AuthLayout,
    children: [
      {
        path: "",
        name: "register",
        component: Register,
        meta: { guestOnly: true },
      },
    ],
  },

  {
    path: "/",
    component: AdminLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: "",
        name: "dashboard",
        component: Dashboard,
      },
      {
        path: "users",
        name: "users",
        component: Users,
      },
    ],
  },

  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore();
  await authStore.initializeAuth();
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: "login" };
  }
  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return { name: "dashboard" };
  }
});

export default router;
