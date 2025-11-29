# Socket Link

| **Módulo/Proceso** | **Responsabilidad** | **Protocolo Principal** | **Documentación Recomendada** |
| --- | --- | --- | --- |
| **AlertScanner** | Comunicación en tiempo real (ALARM, PING, MESSAGE) y estado del dispositivo. | **WebSocket / Socket.IO** | Tu documentación actual (Eventos y ACKs). |
| **Auth & Access** | Gestión de usuarios, roles, login, y permisos de la App Web. | **HTTP / REST** | Nueva documentación (Endpoints, SQL/SQLite, Flujo de Login). |
| **System API** | Endpoints HTTP para la administración (Ej: `/api/actualizar-inventario`). | **HTTP / REST** | Nueva documentación (Endpoints y Permisos). |

* * *

```plaintext
SocketLink/
├── server.js           # Punto de entrada principal
├── config.js           # Variables de configuración (puerto, secretos)
└── src/
    ├── socket/
    │   ├── connection.js   # Lógica principal de conexión de Socket.IO
    │   ├── handlers/       # Manejadores para cada evento de socket
    │   │   ├── deviceHandler.js
    │   │   └── webHandler.js
    │   └── state.js        # Estado en memoria (conexiones, inventario)
    ├── api/
    │   └── routes.js       # Rutas de la API de Express
    └── services/
        └── googleSheetService.js # Lógica para comunicarse con Google Sheets
```

```plaintext
// io.sockets.adapter.rooms (es un Map)
{
  // Salas explícitas que creaste con socket.join()
  'ANDROID_CLIENT' => Set { 'sock_A', 'sock_B' },
  'WEB_CLIENT'     => Set { 'sock_C' },

  // Salas implícitas (una por cada socket conectado)
  'sock_A'         => Set { 'sock_A' },
  'sock_B'         => Set { 'sock_B' },
  'sock_C'         => Set { 'sock_C' }
}```


