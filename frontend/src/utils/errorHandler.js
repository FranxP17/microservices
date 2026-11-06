export function getErrorMessagge(error) {
  if (!error.response) {
    return "No se pudo establecer conexion con el servidor.";
  }

  const status = error.response.status;
  const data = error.response.data;

  if (data?.message) {
    return data.message;
  }

  switch (status) {
    case 400:
      return "Los datos enviados no son validos.";
    case 401:
      return "Debes iniciar sesion.";
    case 403:
      return "No tienes permisos suficientes.";
    case 404:
      return "El recurso solicitado no existe.";
    case 409:
      return "Existe un conflicto con la informacion.";
    case 500:
      return "Ocurrio un error interno del servidor.";
    default:
      return "Ocurrio un error inesperado.";
  }
}
