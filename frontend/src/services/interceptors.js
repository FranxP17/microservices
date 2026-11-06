import api from "./api";

api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (!error.response) {
      console.error("No se pudo conectar con el servidor.");
    } else {
      switch (error.response.status) {
        case 401:
          console.error("No autorizado");
          break;
        case 403:
          console.error("No tienes permisos para realizar esta accion.");
          break;
        case 404:
          console.error("Recurso no encontrado.");
          break;
        case 500:
          console.error("Error interno del servidor.");
          break;
      }
    }
    return Promise.reject(error);
  },
);
