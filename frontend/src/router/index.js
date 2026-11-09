import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/authStore";
import AuthLayout from "../layouts/AuthLayout.vue";
import AdminLayout from "../layouts/AdminLayout.vue";
import HomeLayout from "../layouts/HomeLayout.vue";
import Login from "../features/auth/views/LoginView.vue";
import Register from "../features/auth/views/RegisterView.vue";
import OnboardingView from "../features/auth/views/OnboardingView.vue";
import VerifyEmailView from "../features/auth/views/VerifyEmailView.vue";
import Dashboard from "../features/dashboard/views/DashboardView.vue";
import CuratorProfileView from "../features/home/views/CuratorProfileView.vue";
import FeedView from "../features/home/views/FeedView.vue";
import MainView from "../features/home/views/MainView.vue";
import ReviewComposeView from "../features/home/views/ReviewComposeView.vue";
import AlbumDetailView from "../features/home/views/AlbumDetailView.vue";
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
    path: "/verify-email",
    name: "verify-email",
    component: VerifyEmailView,
  },
  {
    path: "/onboarding",
    component: AuthLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: "",
        name: "onboarding",
        component: OnboardingView,
        meta: { onboarding: true },
      },
    ],
  },
  {
    path: "/",
    component: HomeLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: "",
        name: "home",
        component: FeedView,
      },
      {
        path: "profile/:userId?",
        name: "profile",
        component: CuratorProfileView,
      },
      {
        path: "community/users",
        name: "user-directory",
        component: MainView,
      },
      {
        path: "review/new",
        name: "write-review",
        component: ReviewComposeView,
      },
      {
        path: "albums/:externalId",
        name: "album-detail",
        component: AlbumDetailView,
      },
    ],
  },
  {
    path: "/admin/dashboard",
    component: AdminLayout,
    meta: { requiresAuth: true, adminOnly: true },
    children: [
      {
        path: "",
        name: "dashboard",
        component: Dashboard,
        meta: {
          navigation: {
            label: "Dashboard",
            icon: "fa-solid fa-house",
            section: "GENERAL",
            order: 1,
          },
        },
      },
      {
        path: "u",
        name: "users",
        component: Users,
        meta: {
          navigation: {
            label: "Usuarios",
            icon: "fa-solid fa-users",
            section: "GENERAL",
            order: 2,
          },
        },
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
  scrollBehavior(to) {
    return to.hash ? { el: to.hash, behavior: "smooth" } : { top: 0 };
  },
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore();
  await authStore.initializeAuth();
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: "login" };
  }
  if (to.meta.onboarding && !(await authStore.checkOnboarding())) {
    return { name: "home" };
  }
  if (
    to.meta.requiresAuth &&
    !to.meta.onboarding &&
    !to.meta.adminOnly &&
    (await authStore.checkOnboarding())
  ) {
    return { name: "onboarding" };
  }
  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return { name: "home" };
  }
  if (to.meta.adminOnly) {
    const role = authStore.user?.role;
    const roleName = typeof role === "number"
      ? ["JOYENT", "CRITIC", "ADMIN"][role]
      : String(role ?? "").toUpperCase();
    const isAdmin = roleName === "ADMIN" || roleName === "2";
    if (!isAdmin) return { name: "home" };
  }
});

export default router;
