# Vue 3 + Vite

This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about IDE Support for Vue in the [Vue Docs Scaling up Guide](https://vuejs.org/guide/scaling-up/tooling.html#ide-support).

## Administración de usuarios

En la pantalla de usuarios, un administrador activo puede crear y editar cuentas con nombre, correo, teléfono, avatar, rol y estado. La contraseña es obligatoria al crear y opcional al editar. Eliminar requiere confirmación y borra la cuenta permanentemente; desde el panel no se permite eliminar la propia cuenta.

Estas operaciones usan `POST /admin/users`, `PUT /admin/users/{id}` y `DELETE /admin/users/{id}` bajo la URL base de la API. Requieren la versión del servicio de autenticación con estos endpoints. El directorio y la barra lateral cargan usuarios en páginas de 10 mediante el botón «Cargar más». La búsqueda filtra únicamente los usuarios que ya se han cargado; tras eliminar un usuario, el directorio vuelve a cargar la primera página.

Desde el perfil autenticado, cada usuario también puede actualizar sus datos con `PUT /users/{id}/update` y eliminar su propia cuenta con `DELETE /users/{id}/delete`. La eliminación solicita confirmación y, si tiene éxito, cierra la sesión y vuelve al inicio de sesión.
