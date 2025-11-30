# Documentación de la API REST

A continuación se detallan los puntos de acceso (endpoints) disponibles en la API.

## Autenticación (`/api/auth`)

### `POST /api/auth/login`

- **Método**: `POST`
- **Descripción**: Autentica a un usuario con su nombre de usuario y contraseña. Si las credenciales son correctas, devuelve un `accessToken` para ser usado en peticiones protegidas y establece una cookie `httpOnly` con el `refreshToken` para poder renovar la sesión.
- **Payload**

    ```json
    {
      "username": "nombre_de_usuario",
      "password": "tu_contraseña"
    }
    ```

**Respuestas**:

- **`200 OK`**: Inicio de sesión exitoso.

    ```json
      {
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXJ9...",
        "message": "Inicio de sesión exitoso"
      }
    ```

- **`400 Bad Request`**: El cuerpo de la petición está vacío o faltan los campos `username` o `password`.

    ```json
      { "error": "El username y password son requeridos" }
    ```

- **`401 Unauthorized`**: El `username` no existe o la `password` es incorrecta.

    ```json
      { "error": "Credenciales inválidas" }
    ```

- **`500 Internal Server Error`**: Ocurrió un error inesperado en el servidor.

    ```json
    {
      "message": "Error interno del servidor."
    }
    ```

### `POST /api/auth/refresh`

- **Método**: `POST`
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
      { "error": "Falta el token de actualización" }
    ```

  - **`403 Forbidden`**: El `refreshToken` es inválido o ha expirado. El usuario debe volver a iniciar sesión.

    ```json
        { "error": "Refresh token inválido o expirado" }
      ```

#### ¿Cómo Funciona el `refreshToken`? El Dúo Dinámico

El `refreshToken` trabaja en conjunto con el `accessToken`. Piensa en ellos así:

- **`accessToken` (Pase de un día):** Es un token de corta duración (ej. 15 minutos). Se usa para acceder a los recursos protegidos de tu API. Es como un pase temporal que te dan en la entrada de un edificio para acceder a ciertas áreas.

- **`refreshToken` (Tu credencial de empleado):** Es un token de larga duración (ej. 7 días). Su **único propósito** es obtener un nuevo `accessToken` cuando el actual expira. No se puede usar para acceder a datos. Es como tu credencial de empleado, que no abre las puertas directamente, pero te permite ir a la recepción a pedir un nuevo pase de un día si el tuyo se vence.

### `POST /api/auth/logout`

- **Método**: `POST`
- **Descripción**: Cierra la sesión del usuario invalidando el `refreshToken`. El servidor instruye al navegador para que elimine la cookie.
- **Payload**: Ninguno.
- **Respuestas**:
  - **`200 OK`**: Sesión cerrada correctamente.

    ```json
    { "message": "Sesión cerrada exitosamente" }
    ```

  - **`500 Internal Server Error`**: Ocurrió un error inesperado en el servidor.

    ```json
    {
      "message": "Error interno del servidor."
    }
    ```

---

## Administración

Estos endpoints requieren que el usuario esté autenticado con un `accessToken` válido y que el rol del usuario sea `ADMIN`.

**`/api/socket/admin`**

### `GET /api/socket/admin/update-inventory-master`

- **Método**: `GET`
- **Descripción**: Dispara una actualización del inventario maestro desde **Google Sheet**. Una vez actualizado, notifica a todos los clientes web conectados a través de WebSockets. Solo accesible por administradores.

- **Middleware**: `verifyToken` (implícito), `checkAdminRole`.
- **Payload**: Ninguno.

- **Respuestas**:
  - **`200 OK`**: El inventario se actualizó correctamente.

    ```json
    {
      "message": "Inventario maestro actualizado."
    }
    ```

- **`401 Unauthorized`**: Token JWT inválido o ausente.

- **`403 Forbidden`**: El usuario no tiene rol de `ADMIN`.

- **`500 Internal Server Error`**: Ocurrió un error en el servidor al intentar
actualizar el inventario.

  ```json
  {
    "message": "Error interno del servidor."
  }
  ```

---

**`api/admin/users`**

### `POST /api/admin/register`

- **Método**: `POST`
- **Descripción**: Registra un nuevo usuario en el sistema. Solo accesible por administradores.
- **Middleware**: `verifyToken` (implícito en tu configuración de rutas), `checkAdminRole`.

- **`Payload`**:

  ```json
  {
    "username": "nuevo_usuario",
    "password": "una_contraseña_segura",
    "role": "USER" | "ADMIN"
  }
  ```

- **`Respuestas`**:
  - **`201 Created`**: Usuario registrado con éxito.

    ```json
    { "message": "Nuevo usuario registrado con éxito." }
    ```

  - **`400 Bad Request`**: Faltan campos requeridos (`username`, `password`, `role`).

    ```json
    { "message": "Username, password y role son requeridos." }
    ```

    O el rol no es válido (`ADMIN` o `USER`).

    ```json
    { "message": "El rol debe ser ADMIN o USER." }
    ```

  - **`403 Forbidden`**: El usuario que realiza la petición no tiene el rol de `ADMIN`.

    ```json
    { "message": "Acceso denegado: solo para administradores." }
    ```

  - **`409 Conflict`**: El `username` ya está en uso.

    ```json
    { "message": "El nombre de usuario ya existe." }
    ```

  - **`500 Internal Server Error`**: Ocurrió un error inesperado en el servidor.

    ```json
    {
      "message": "Error interno del servidor."
    }
    ```

### `GET /api/admin/users`

- **Método**: `GET`
- **Descripción**: Obtiene una lista de todos los usuarios registrados
- **Middleware**: `verifyToken` (implícito), `checkAdminRole` (Recomendado).
- **Payload**: Ninguno.
- **Respuesta**:
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
