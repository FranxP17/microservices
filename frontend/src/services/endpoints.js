export const ENDPOINTS = {
  AUTH: {
    REGISTER: "/auth/register",
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
  },
  ADMIN: {
    BASE: "/admin",
    CHANGEROL: (id) => `/admin/${id}/role`,
    CHANGESTATUS: (id) => `/admin/${id}/status`,
    DELETE: (id) => `/admin/${id}/delete`,
    DETAIL: (id) => `/admin/${id}/detail`,
    LIST: "/admin/list",
    CREATE: "/admin/create",
    UPDATE: (id) => `/admin/${id}/update`,
    UPDATE_USER: (id) => `/admin/users/${id}`,
    CREATE_USER: "/admin/users",
  },
  USERS: {
    BASE: "/users",
    ME: '/users/me',
    UPDATE: (id) => `/users/${id}/update`,
    DELETE: (id) => `/users/${id}/delete`,
    DETAIL: (id) => `/users/${id}`,
  },
};
