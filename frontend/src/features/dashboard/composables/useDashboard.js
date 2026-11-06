import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useAuthStore } from "../../../stores/authStore";

export function useDashboard() {
	const authStore = useAuthStore();
	const { user, isAuthenticated, isLoading } = storeToRefs(authStore);

	const welcomeTitle = computed(() => {
		const name = user.value?.name || user.value?.displayName;
		return name ? `Bienvenido, ${name}` : "Bienvenido";
	});

	return {
		user,
		isAuthenticated,
		isLoading,
		welcomeTitle,
		logout: authStore.logout,
	};
}

