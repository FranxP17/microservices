import api from "../../../services/api";
import { ENDPOINTS } from "../../../services/endpoints";

export const authService = {
  async register(user) {
    const response = await api.post(ENDPOINTS.AUTH.REGISTER, {
      displayName: user.displayName ?? user.name,
      email: user.email,
      password: user.password,
      ...(user.tel != null ? { tel: user.tel } : {}),
    });
    return response.data;
  },

  async login(credentials) {
    const response = await api.post(ENDPOINTS.AUTH.LOGIN, credentials);
    return response.data;
  },

  googleLoginUrl() {
    return new URL(
      api.getUri({ url: ENDPOINTS.AUTH.GOOGLE }),
      window.location.origin,
    ).toString();
  },

  async getCurrentUser() {
    const response = await api.get(ENDPOINTS.AUTH.ME);
    return response.data;
  },

  async verifyEmail(token) {
    const response = await api.post(ENDPOINTS.AUTH.VERIFY_EMAIL, { token });
    return response.data;
  },

  async resendVerification(email) {
    const response = await api.post(ENDPOINTS.AUTH.RESEND_VERIFICATION, { email });
    return response.data;
  },

  async logout() {
    const response = await api.post(ENDPOINTS.AUTH.LOGOUT);
    return response.data;
  },
};
