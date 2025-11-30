# Documentación de la API REST

A continuación se detallan los puntos de acceso (endpoints) disponibles en la API.

## Autenticación (`/api/auth`)

### `POST /api/auth/login`

- **Método**: `POST`
- **Middleware**: ninguno.
- **Descripción**: Autentica a un usuario con su nombre de usuario y contraseña. Si las credenciales son correctas, devuelve un `accessToken` para ser usado en peticiones protegidas y establece una cookie `httpOnly` con el `refreshToken` para poder renovar la sesión.

- **Payload**

    ```json
    {
      "username": "nombre_de_usuario",
      "password": "tu_contraseña"
    }
    ```

- **Respuestas**:

  - **`200 OK`**: Inicio de sesión exitoso.

      ```json
        {
          "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXJ9...",
          "message": "Inicio de sesión exitoso"
        }
      ```

  - **`400 Bad Request`**:
    - Faltan los campos `username` o `password`.

        ```json
          { "message": "El username y password son requeridos" }
        ```

    - **`401 Unauthorized`**: El `username` no existe o la `password` es incorrecta.

      ```json
        { "message": "Credenciales inválidas" }
      ```

    - **`500 Internal Server Error`**: Ocurrió un error inesperado en el servidor.

      ```json
        { "message": "Error interno del servidor." }
      ```

### `POST /api/auth/refresh`

- **Método**: `POST`
- **Middleware**: ninguno.
- **Descripción**: Renueva un `accessToken` expirado. Requiere que la cookie `refreshToken` (obtenida durante el login) sea enviada en la petición.
- **Payload**: Ninguno.
- **Respuestas**:
  - **`200 OK`**: Token refrescado exitosamente.

    ```json
      {
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXV9...",
        "message": "Token refrescado exitosamente"
      }
    ```

  - **`401 Unauthorized`**: La cookie `refreshToken` no fue encontrada en la petición.

    ```json
      { "message": "Falta el token de actualización" }
    ```

  - **`403 Forbidden`**: El `refreshToken` es inválido o ha expirado. El usuario debe volver a iniciar sesión.

    ```json
      { "message": "Refresh token inválido o expirado" }
    ```

#### ¿Cómo Funciona el `refreshToken`? El Dúo Dinámico

El `refreshToken` trabaja en conjunto con el `accessToken`. Piensa en ellos así:

- **`accessToken` (Pase de un día):** Es un token de corta duración (ej. 15 minutos). Se usa para acceder a los recursos protegidos de tu API. Es como un pase temporal que te dan en la entrada de un edificio para acceder a ciertas áreas.

- **`refreshToken` (Tu credencial de empleado):** Es un token de larga duración (ej. 7 días). Su **único propósito** es obtener un nuevo `accessToken` cuando el actual expira. No se puede usar para acceder a datos. Es como tu credencial de empleado, que no abre las puertas directamente, pero te permite ir a la recepción a pedir un nuevo pase de un día si el tuyo se vence.

### `POST /api/auth/logout`

- **Método**: `POST`
- **Middleware**: ninguno.
- **Descripción**: Cierra la sesión del usuario invalidando el `refreshToken`. El servidor instruye al navegador para que elimine la cookie.
- **Payload**: Ninguno.
- **Respuestas**:
  - **`200 OK`**: Sesión cerrada correctamente.

    ```json
    { "message": "Sesión cerrada exitosamente" }
    ```

  - **`500 Internal Server Error`**: Ocurrió un error inesperado en el servidor.

    ```json
    { "message": "Error interno del servidor." }
    ```

---

## Administración `ADMIN`

Estos endpoints requieren que el usuario esté autenticado con un `accessToken` válido y que el `role` del usuario sea `ADMIN`.

## Respuestas del Middleware `verifyToken`

| Código HTTP | Escenario de Falla | Mensaje JSON Estándar |
| --- | --- | --- |
| `401 Unauthorized` | **Token Ausente/Formato**: No se encontró el encabezado `Authorization: Bearer <token>`. | `{"message": "Token de acceso ausente o con formato incorrecto."}` |
| `401 Unauthorized` | **Payload Inválido**: El contenido del token no tiene la estructura esperada (`username`, `role`, etc.). |`{"message": "La estructura del token no es válida."}` |
| `401 Unauthorized` | **Usuario No Encontrado**: El ID del usuario en el token no corresponde a ningún registro activo en la base de datos (DB). | `{"message": "Usuario no encontrado."}` |
| `403 Forbidden` | **Token Expirado/Inválido**: El JWT falló la verificación de la firma o ha expirado. | `{"message": "Token de acceso inválido o expirado."}` |

---

### `GET /api/socket/admin/update-inventory-master`

- **Método**: `GET`

- **Descripción**: Dispara una actualización del inventario maestro desde **Google Sheet**. Una vez actualizado, notifica a todos los clientes web conectados a través de WebSockets. Solo accesible por administradores.

- **Payload**: Ninguno.

- **Respuestas**:
  
  - Para fallos de Autenticación/Autorización, ver la sección [Respuestas del Middleware `verifyToken`](#respuestas-del-middleware-verifytoken).

  - **`200 OK`**: El inventario se actualizó correctamente.

    ```json
    { "message": "Inventario maestro actualizado." }
    ```

  - **`403 Forbidden`**: El usuario no tiene rol de `ADMIN`.

    ```json
    { "message": "Acceso denegado: solo para administradores." }
    ```

  - **`500 Internal Server Error`**: Ocurrió un error en el servidor al intentar
  actualizar el inventario.

    ```json
    { "message": "Error interno del servidor." }
    ```

---

## Administración `SUPER_ADMIN`

Estos endpoints requieren que el usuario esté autenticado con un `accessToken` válido y que el `role` del usuario sea `SUPER_ADMIN`.

🧩 Sección de Rutas: `api/admin/users`

### `POST /api/admin/users`

- **Método**: `POST`

- **Descripción**: Registra un nuevo usuario en el sistema. Solo accesible por administradores.

- **`Payload`**:

  ```json
  {
    "username": "nuevo_usuario",
    "password": "una_contraseña_segura",
    "role": "SUPER_ADMIN" | "ADMIN" | "USER"
  }
  ```

- **`Respuestas`**:
  
  - Para fallos de Autenticación/Autorización, ver la sección [Respuestas del Middleware `verifyToken`](#respuestas-del-middleware-verifytoken).
  - **`201 Created`**: Usuario registrado con éxito.

    ```json
    { "message": "Nuevo usuario registrado con éxito." }
    ```

  - **`400 Bad Request`**:
    - Datos de entrada inválidos.

      ```json
      { "message": "Username, password y role son requeridos." }
      ```

    - El `role` es incorrecto.

      ```json
      { "message": "El rol debe ser ADMIN o USER." }
      ```

  - **`403 Forbidden`**: El usuario que realiza la petición no tiene el rol de `SUPER_ADMIN`.

    ```json
    { "message": "Acceso denegado: solo para super administradores." }
    ```

  - **`409 Conflict`**: El `username` ya está en uso.

    ```json
    { "message": "El nombre de usuario ya existe." }
    ```

  - **`500 Internal Server Error`**: Ocurrió un error inesperado en el servidor.

    ```json
    { "message": "Error interno del servidor." }
    ```

### `GET /api/admin/users`

- **Método**: `GET`
- **Descripción**: Obtiene una lista de todos los usuarios registrados
- **Payload**: Ninguno.

- **Respuestas**:

  - Para fallos de Autenticación/Autorización, ver la sección [Respuestas del Middleware `verifyToken`](#respuestas-del-middleware-verifytoken).

  - **`200 OK`**: Retorna un array con todos los usuarios.

    ```json
    [
      {
        "id": 1,
        "username": "admin_user",
        "role": "ADMIN"
      },
      {
        "id": 2,
        "username": "test_user",
        "role": "USER"
      }
    ]
    ```
  
  - **`403 Forbidden`**: El usuario que realiza la petición no tiene el rol de `SUPER_ADMIN`.

    ```json
    { "message": "Acceso denegado: solo para super administradores." }
    ```

  - **`404 Not Found:`**: No se encontraron usuarios en la base de datos.

    ```json
    { "message": "No se encontraron usuarios." }
    ```

  - **`500 Internal Server Error`**: Ocurrió un error inesperado en el servidor.

    ```json
    { "message": "Error interno del servidor." }
    ```

### `GET /api/admin/users/:id`

- **Método**: `GET`
- **Descripción**: Obtiene los detalles de un usuario específico mediante su ID.
- **Parámetros de Ruta**: `id` (INTEGER) - ID del usuario a buscar.
- **Respuestas**:
  
  - Para fallos de Autenticación/Autorización, ver la sección [Respuestas del Middleware `verifyToken`](#respuestas-del-middleware-verifytoken).

  - **`200 OK`**: Retorna el objeto del usuario.

    ```JSON
    {
      "id": 1,
      "username": "admin_user",
      "role": "ADMIN"
    }
    ```

  - **`400 Bad Request`**: El `ID` de usuario no existe o no es valido.

      ```json
        { "message": "El ID debe ser un número." }
      ```

  - **`403 Forbidden`**: El usuario no tiene el rol de `SUPER_ADMIN`.

      ```json
      { "message": "Acceso denegado: solo para super administradores." }
      ```

  - **`404 Not Found`**: El ID de usuario no existe en la base de datos.

      ```json
      { "message": "Usuario no encontrado" }
      ```

  - **`500 Internal Server Error`**: Error inesperado.

    ```json
      { "message": "Error interno del servidor." }
      ```

### `PATCH /api/admin/users/:id`

- **Método**: `PATCH`
- **Descripción**: Actualiza los datos de un usuario específico. Esto se utiliza típicamente para cambiar el `username` o el `role` de un usuario.
- **Parámetros de Ruta**: `id` (INTEGER) - ID del usuario a actualizar.
- **Payload**:

    ```JSON
      {
        "username?": "nuevo_nombre",
        "role?": "USER" 
      }
    ```

- **Respuestas**:
  
  - Para fallos de Autenticación/Autorización, ver la sección [Respuestas del Middleware `verifyToken`](#respuestas-del-middleware-verifytoken).

  - **`204 No Content`**: Usuario actualizado con éxito.

  - **`400 Bad Request`**:
    - El `ID` de usuario no existe o no es valido.

      ```json
        { "message": "El ID debe ser un número." }
      ```

    - El contenido del `body` está vacío.

      ```json
          { "message": "No se proporcionaron datos para actualizar." }
      ```

    - El `password` se encontró el `body`

      ```json
          { "message": "Para cambiar la contraseña, utiliza el endpoint dedicado." }
      ```

    - El `role` proporcionado es incorrecto.

      ```json
      { "message": "El rol debe ser ADMIN o USER." }
      ```

  - **`403 Forbidden`**: El usuario no tiene el rol de `SUPER_ADMIN`.

      ```json
      { "message": "Acceso denegado: solo para super administradores." }
      ```

  - **`404 Not Found`**: No se encontró un usuario con ese ID.

      ```json
        { "message": "Usuario no encontrado" }
      ```

  - **`409 Conflict`**: El `username` ya está en uso.

    ```json
    { "message": "El nombre de usuario ya existe." }
    ```

  - **`500 Internal Server Error`**: Error inesperado.

      ```json
        { "message": "Error interno del servidor." }
      ```

### `PUT /api/admin/users/:id`

- **Método**: `PUT`
- **Descripción**: Actualiza el `password` del usuario
- **Parámetros de Ruta**: `id` (INTEGER) - ID del usuario a actualizar.
- **Payload**:

    ```JSON
      {
        "oldPassword?": "old_password",
        "newPassword": "new_password"
      }
    ```

- **Respuestas**:
  
  - Para fallos de Autenticación/Autorización, ver la sección [Respuestas del Middleware `verifyToken`](#respuestas-del-middleware-verifytoken).

  - **`204 No Content`**: Usuario actualizado con éxito.

  - **`400 Bad Request`**:
    - El `ID` de usuario no existe o no es valido.

      ```json
        { "message": "El ID debe ser un número." }
      ```

    - El contenido del `body` está incompleto.

      ```json
          { "message": "Se requieren la contraseña anterior y la nueva." }
      ```

    - El `role` proporcionado es incorrecto.

      ```json
      { "message": "El rol debe ser ADMIN o USER." }
      ```

  - **`401 Unauthorized`**: La contraseña actual `oldPassword` es incorrecta.

      ```json
      { "message": "La contraseña actual es incorrecta." }
      ```

  - **`403 Forbidden`**: El usuario no tiene el rol de `SUPER_ADMIN`.

      ```json
      { "message": "Acceso denegado: solo para super administradores." }
      ```

  - **`404 Not Found`**: No se encontró un usuario con ese ID.

      ```json
        { "message": "Usuario no encontrado" }
      ```

  - **`409 Conflict`**: El `password` a actualizar es el mismo que el anterior

      ```json
          { "message": "La nueva contraseña no puede ser igual a la anterior.." }
      ```

  - **`500 Internal Server Error`**: Error inesperado.

      ```json
        { "message": "Error interno del servidor." }
      ```

### `DELETE /api/admin/users/:id`

- **Método**: `DELETE`
- **Descripción**: Elimina un usuario del sistema mediante su ID.
- **Parámetros de Ruta**: `id` (INTEGER) - ID del usuario a eliminar.

- **Respuestas**:  
  
  - Para fallos de Autenticación/Autorización, ver la sección [Respuestas del Middleware `verifyToken`](#respuestas-del-middleware-verifytoken).

  - **`204 No Content`**: Usuario eliminado con éxito.

  - **`400 Bad Request`**: El `ID` de usuario no existe o no es valido.

    ```json
      { "message": "El ID debe ser un número." }
    ```
  
  - **`403 Forbidden`**: El usuario no tiene el rol de `SUPER_ADMIN`.

    ```json
      { "message": "Acceso denegado: solo para super administradores." }
    ```

  - **`404 Not Found`**: No se encontró un usuario con ese ID.

      ```json
        { "message": "Usuario no encontrado" }
      ```

  - **`500 Internal Server Error`**: Error inesperado.

      ```json
        { "message": "Error interno del servidor." }
      ```

---
