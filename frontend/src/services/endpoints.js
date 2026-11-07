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
    LIST: "/admin/counts/users",
    CREATE: "/admin/create",
    UPDATE: (id) => `/admin/${id}/update`,
    UPDATE_USER: (id) => `/admin/users/${id}`,
    CREATE_USER: "/admin/users",
  },
  USERS: {
    BASE: "/users",
    ME: '/users/me',
    UPDATE: () => `/users/me/credentials`,
    DELETE: () => `/users/me`,
    DETAIL: (id) => `/users/${id}`,
  },
};
