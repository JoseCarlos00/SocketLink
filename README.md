# Socket Link

| **Módulo/Proceso** | **Responsabilidad** | **Protocolo Principal** | **Documentación Recomendada** |
| --- | --- | --- | --- |
| **AlertScanner** | Comunicación en tiempo real (ALARM, PING, MESSAGE) y estado del dispositivo. | **WebSocket / Socket.IO** | Tu documentación actual (Eventos y ACKs). |
| **Auth & Access** | Gestión de usuarios, roles, login, y permisos de la App Web. | **HTTP / REST** | Nueva documentación (Endpoints, SQL/SQLite, Flujo de Login). |
| **System API** | Endpoints HTTP para la administración (Ej: `/api/actualizar-inventario`). | **HTTP / REST** | Nueva documentación (Endpoints y Permisos). |

* * *

```plaintext
SocketLink/
/src
├── api/
│   ├── auth.route.ts       // Define las rutas /auth/*, usa AuthController
│   └── socket.route.ts     // Define otras rutas, usa otros controladores
├── controllers/
│   ├── auth.controller.ts  // Lógica para login, registro
│   └── inventory.controller.ts // Lógica para manejar el inventario
├── models/
│   ├── user.model.ts       // Esquema/definición del usuario
│   └── inventory.model.ts  // Esquema/definición del inventario
├── services/
│   └── googleSheetService.ts // Lógica para interactuar con Google Sheets
├── socket/
│   ├── connection.ts       // Lógica principal de conexión de socket (incluyendo middleware de auth)
│   └── state.ts            // Manejo del estado en memoria
└── types/
    └── serverEvents.ts
server.ts                   // Tu archivo principal
config.ts
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


