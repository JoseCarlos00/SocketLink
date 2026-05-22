# Documentación de la API Socket.IO

Esta documentación describe la interfaz de programación de aplicaciones (API) que el cliente web debe utilizar para comunicarse con el servidor a través de Socket.IO y REST.

---

## 🔒 0. Seguridad y Autorización (RBAC)

Todos los eventos de Socket.IO que ejecutan acciones operativas críticas requieren que el usuario esté **autenticado**.

### Pre-requisito de Conexión (Autenticación)

Al establecer la conexión Socket.IO, el cliente **debe** incluir su `accessToken` (JWT) en el `handshake` de conexión. El servidor verificará la validez del token antes de permitir que la conexión se complete. Si el token no es válido, la conexión será rechazada.

Una vez conectado, el servidor tendrá acceso a la identidad del usuario (`id`, `username`, `role`) para todas las peticiones futuras en ese socket.

### Roles de Acceso (RBAC)

| Rol | Permisos |
| :--- | :--- |
| **SUPER_ADMIN** | **Acceso total.**  |
| **ADMIN** | **Acceso total.** Puede enviar todas las alarmas, mensajes, pings, y forzar la sincronización del inventario (API REST). |
| **USER** | **Acceso operativo.** Puede enviar alarmas y pings a dispositivos individuales, pero no comandos masivos o de administración. |

### Respuestas de Error por Seguridad (ACK)

Cualquier evento con un `callback` puede responder con uno de estos estados si la seguridad falla:

| Status | Razón | Descripción |
| :--- | :--- | :--- |
| `status: 'UNAUTHORIZED'` | Token inválido o expirado. | El usuario no ha iniciado sesión o el token es incorrecto. |
| `status: 'FORBIDDEN'` | El rol es insuficiente. | El usuario tiene un rol que no le permite ejecutar esta acción (Ej. USER intentando hacer un `SEND_ALL_MESSAGE`). |

---

## 1. Conexión e Identificación

El primer paso para cualquier cliente web es establecer una conexión de Socket.IO (autenticándose en el proceso) y luego identificarse para recibir eventos de broadcast.

### `IDENTIFY_CLIENT`

Una vez conectado, el cliente debe emitir este evento para unirse a la sala de clientes web y empezar a recibir actualizaciones.

- **Evento**: `IDENTIFY_CLIENT`
- **Descripción**: Registra el socket como un cliente de tipo "WEB", uniéndolo a una sala específica para recibir eventos dirigidos a los clientes web, como las actualizaciones de inventario.

- **Payload**:

```typescript
interface IdentifyClientPayload {
    clientType: 'WEB';
}
```

- **Ejemplo de uso**:

```javascript
// Asumimos que 'getAuthToken()' es una función que devuelve el accessToken.
const token = getAuthToken();

const socket = io("http://tu-servidor.com", {
  // Query para identificar el tipo de cliente.
  query: {
    clientType: "WEB_CLIENT"
  }
});

socket.on('connect', () => {
  console.log('¡Conectado y autenticado exitosamente!');
  
  // Ahora que estamos conectados, nos unimos a la sala de clientes web.
  socket.emit('IDENTIFY_CLIENT', { clientType: 'WEB' });
});

socket.on('connect_error', (err) => {
  // Esto se disparará si el token es inválido, expiró o no se proporcionó.
  console.error(err.message); // ej. "Authentication error: Token inválido o expirado."
});
```

## 2. Eventos Emitidos por el Cliente Web (Cliente → Servidor)

Estos son los eventos que el cliente web puede enviar al servidor para realizar acciones. Todos los eventos que esperan una respuesta del servidor utilizan un `callback`.

### Estructura del Callback

La mayoría de los eventos utilizan una función de `callback` para notificar al cliente web el resultado de la operación. La respuesta siempre sigue esta estructura:

```typescript
interface CallbackResponse {
 status: 'OK' | 'ERROR' | 'WARN';
 message: string;
 data?: any; // Datos adicionales, como la información de un dispositivo.
}
```

### `ALARM_ACTIVATE`

- **Rol Requerido**: `USER` o `ADMIN`
- **Evento**: `ALARM_ACTIVATE`
- **Descripción**: Envía una solicitud para activar una alarma en un dispositivo Android específico.
- **Payload**:

```typescript
interface AlarmActivationPayload {
    target_device_id: string; // ID del dispositivo Android
    durationSeconds?: number; // Duración de la alarma en segundos
    deviceAlias?: string;     // Alias del dispositivo para mostrar en la notificación
}
```

- **Callback**: `(response: CallbackResponse) => void`

  - `status: 'OK'` si el evento fue enviado y el dispositivo respondió afirmativamente.
  - `status: 'ERROR'` si el `target_device_id` no existe, está desconectado o el dispositivo respondió con un error.

---

### `SEND_MESSAGE`

- **Rol Requerido**: `USER` o `ADMIN`
- **Evento**: `SEND_MESSAGE`
- **Descripción**: Envía un mensaje de texto a un dispositivo Android específico.
- **Payload**:

```typescript
interface SendMessagePayload {
    target_device_id: string; // ID del dispositivo Android
    dataMessage: {
        message: string;
        sender?: string; // default "Nuevo Mensaje"
    };
}
```

- **Callback**: `(response: CallbackResponse) => void`

  - `status: 'OK'` si el mensaje fue enviado correctamente.
  - `status: 'ERROR'` si el dispositivo no está conectado o no se proporcionó el `target_device_id`.

---

### `SEND_ALL_MESSAGE`

- **Rol Requerido**: `ADMIN`
- **Evento**: `SEND_ALL_MESSAGE`
- **Descripción**: Envía un mensaje de texto a todos los dispositivos Android conectados.
- **Payload**:

```typescript
interface SendAllMessagePayload {
    dataMessage: {
        message: string;
        sender?: string; // default "Nuevo Mensaje"
    };
}
```

- **Callback**: `(response: CallbackResponse) => void`

  - `status: 'OK'` si el mensaje fue enviado. `message` indicará a cuántos dispositivos se envió.
  - `status: 'WARN'` si no hay dispositivos Android conectados.

---

### `SEND_PING`

- **Rol Requerido**: `USER` o `ADMIN`
- **Evento**: `SEND_PING`
- **Descripción**: Envía un evento `PING` a un dispositivo Android para verificar si está en línea y respondiendo.
- **Payload**:

```typescript
interface TargetedDevicePayload {
    target_device_id: string; // ID del dispositivo Android
}
```

- **Callback**: `(response: CallbackResponse) => void`

  - `status: 'OK'` si el dispositivo respondió al ping. El `message` contendrá la respuesta del dispositivo (ej. "PONG").
  - `status: 'ERROR'` si el dispositivo no está conectado o no respondió.

---

### `GET_DEVICE_INFO`

- **Rol Requerido**: `USER` o `ADMIN`
- **Evento**: `GET_DEVICE_INFO`
- **Descripción**: Solicita información detallada de un dispositivo Android específico (ej. versión de la app, nivel de batería, etc.).
- **Payload**:

```typescript
interface TargetedDevicePayload {
    target_device_id: string; // ID del dispositivo Android
}
```

- **Callback**: `(response: CallbackResponse) => void`

  - `status: 'OK'` si el dispositivo respondió con su información. Los datos estarán en el campo `data` de la respuesta.
  - `status: 'ERROR'` si el dispositivo no respondió o la respuesta no fue válida.

---

### `CHECK_FOR_UPDATE`

- **Rol Requerido**: `ADMIN`
- **Evento**: `CHECK_FOR_UPDATE`
- **Descripción**: Solicita a un dispositivo Android específico que verifique si hay actualizaciones de la aplicación.
- **Payload**:

```typescript
interface TargetedDevicePayload {
    target_device_id: string; // ID del dispositivo Android
}
```

- **Callback**: `(response: CallbackResponse) => void`

  - `status: 'OK'` si la solicitud fue enviada.
  - `status: 'ERROR'` si el dispositivo no está conectado.

---

### `CHECK_FOR_ALL_UPDATE`

- **Rol Requerido**: `ADMIN`
- **Evento**: `CHECK_FOR_ALL_UPDATE`
- **Descripción**: Envía una solicitud de búsqueda de actualización a todos los dispositivos Android conectados.
- **Payload**: Ninguno.
- **Callback**: `(response: CallbackResponse) => void`
  - `status: 'OK'` si la solicitud fue enviada. `message` indicará a cuántos dispositivos se envió.
  - `status: 'WARN'` si no hay dispositivos Android conectados.

---

## 3. Eventos Recibidos por el Cliente Web (Servidor → Cliente)

Estos son los eventos que el servidor emitirá y que el cliente web debe escuchar para mantenerse actualizado.

### `INVENTORY_UPDATE_ALERT`

- **Evento**: `INVENTORY_UPDATE_ALERT`
- **Descripción**: El servidor emite este evento cuando el inventario de dispositivos ha sido actualizado. El cliente web tiene que solicitar nuevamente la lista actualizada de dispositivos en `fetch(/api/inventory/devices)`

- **Payload**: ninguno.

- **Ejemplo de uso**:

```javascript
  socket.on('INVENTORY_UPDATE_ALERT', () => {
    console.log('Señal de actualización de inventario recibida. Iniciando fetch...');
    // Llamada a la función que realiza la solicitud HTTP GET
    fetchInventoryData(); 
  });

  function fetchInventoryData() {
    // Llama a la ruta HTTP que lee de la caché del servidor Node.js
    fetch('/api/inventory/devices', {
        // Se recomienda usar encabezados de caché como If-None-Match si es posible
    })
    .then(response => response.json())
    .then(data => {
        // Actualiza la UI de la Web con los nuevos datos
        updateDeviceListUI(data); 
    })
    .catch(error => console.error("Error al obtener el inventario:", error));
  }
```
