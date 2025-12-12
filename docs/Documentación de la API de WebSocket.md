# Documentación de la API de WebSocket - AlertScanner

Esta es la guía de referencia para todos los eventos de WebSocket que la aplicación `AlertScanner` puede recibir y enviar.

## Eventos Recibidos por la App (Servidor -> Dispositivos Android)

El servidor puede enviar los siguientes eventos a la aplicación.

---

### `ALARM_ACTIVATE`

Activa una alarma crítica en el dispositivo. Este sonido es persistente, interrumpe el modo "No Molestar" y usa el volumen máximo.

- **Payload (desde el servidor)**: `JSONObject` (Opcional)
  - `durationSeconds` (Number, Opcional): Duración de la alarma en segundos. **Default: 10**.
  - `deviceAlias` (String, Opcional): Un nombre para identificar el origen de la alarma en los logs. **Default: "desconocido"**.

  ```JavaScript
    {
      "durationSeconds": 10, // Opcional: Duración en segundos. Default: 10
      "deviceAlias": "some-name" // Opcional: Alias del dispositivo para logging.
    }
  ```

- **Callback ack (hacia el servidor)**:
  - Si la alarma se activa con éxito:

    ```JavaScript
        { "status": "OK" }
    ```

  - Si ya hay otro sonido en reproducción:

    ```JavaScript
        {
          "status": "ERROR",
          "reason": "No se ha podido reproducir el sonido, es posible que haya otro sonido activo."
        }
    ```

- **Ejemplo de Uso (Node.js):**

```JavaScript
     // Alarma simple de 10 segundos
    socket.emit('ALARM_ACTIVATE', (success) => {
      if (success) {
        console.log('La alarma se activó correctamente en el dispositivo.');
      } else {
        console.error('El dispositivo no pudo activar la alarma.');
      }
    });

    // Alarma personalizada
    socket.emit('ALARM_ACTIVATE', {
      durationSeconds: 30,
      deviceAlias: 'FME001'
    }, (success) => {
      console.log(`Confirmación de alarma personalizada: ${success}`);
    });
    
```

### `PING`

Activa un sonido corto (ping) con las mismas condiciones críticas de una alarma (máximo volumen, interrumpe "No Molestar").

Duración del sonido `3 segundos` por defecto.

- **Payload (desde el servidor)**: Ninguno.

- **Callback `ack` (hacia el servidor)**:
  - Si el sonido de prueba se reproduce, el cliente espera 3 segundos y luego responde:

    ```JavaScript
      { "status": "PONG" }
    ```

  - Si el sonido de prueba no se puede reproducir:

    ```JavaScript
      {
        "status": "ERROR",
        "reason": "No se ha podido reproducir el sonido de ping."
      }
    ```

- **Ejemplo de Uso (Node.js):**

```JavaScript
    socket.emit('PING_ALARM', (success) => {
      console.log(`El ping de alarma se ejecutó: ${success}`);
    });
```

### `MESSAGE_RECEIVE`

Envía un mensaje de texto que genera una notificación push y una alerta sonora (única) de alta prioridad.

- **Payload (desde el servidor)**: `JSONObject`

  - `message` (String): El contenido del mensaje a mostrar.
  - `sender` (String, Opcional): El nombre del remitente. Si no se provee, el título será "Nuevo Mensaje".

    ```JavaScript
      {
        "message": "Este es un mensaje de prueba.",
        "sender": "Servidor Central" // Opcional: Nombre del remitente.
      }
    ```

- **Callback ack (hacia el servidor)**:
  - Si el mensaje se procesa correctamente (sonido y notificación):

      ```JavaScript
      { "status": "OK" }
      ```

  - Si el payload es nulo:

      ```JavaScript
        {
          "status": "ERROR",
          "reason": "Payload nulo o incorrecto"
        }
      ```

  - Si falla la reproducción del sonido:

    ```JavaScript
       {
          "status": "ERROR",
          "reason": "No se ha podido reproducir el sonido de notificación."
        }
    ```

  - Si se recibe un mensaje vacío:

    ```JavaScript
       {
          "status": "ERROR",
          "reason": "Mensaje vacío."
        }
    ```

- **Ejemplo de Uso (Node.js)**:

```JavaScript
    socket.emit('MESSAGE_RECEIVE', {
      message: 'Revisar el inventario de la bodega 3.',
      sender: 'Juan Pérez'
    });
```

### `CHECK_FOR_UPDATE`

Ordena a la aplicación que verifique si hay una nueva versión disponible en el servidor. Si existe una, mostrará una notificación al usuario.

- **Payload (desde el servidor)**: Ninguno.
- **Callback ack (hacia el servidor)**: Ninguno.
- **Ejemplo de Uso (Node.js):**

```JavaScript
    socket.emit('CHECK_FOR_UPDATE');
```

### `GET_DEVICE_INFO`

- **Payload (desde el servidor): Ninguno.**

- **Respuesta ack (enviada por el cliente)**: El cliente responde inmediatamente con un ack que contiene el mismo objeto JSON que se utiliza en el evento `REGISTER_DEVICE`.

    ```JavaScript
    {
      "androidId": "abcdef1234567890",
      "ipAddress": "192.168.15.10",
      "appVersion": "1.0.0"
    }
    ```

- **Ejemplo de Uso (Node.js):**

```JavaScript
    socket.emit('GET_DEVICE_INFO', (response) => { // JSONObject
      if (response) {
        console.log('Información del dispositivo recibida:', response);
      } else {
        console.error('No se recibió respuesta del dispositivo.');
      }
    });
    
```

### `SET_MAINTENANCE_MODE`

- **Descripción**: El servidor emite este evento a TODOS los dispositivos Android para informarles que entrará en modo mantenimiento. Los dispositivos deben desconectarse y programar un despertar automático.

- **Payload**:

```typescript
  {
    untilTimestampMs: number,     // Timestamp cuando terminará el mantenimiento
    reason?: string,              // Razón del mantenimiento
    estimatedDuration?: number    // Duración en segundos
  }
```

- **Callback ACK**:

```javascript
  { "status": "OK", "message": "Entrando en modo mantenimiento" }
```

---

## Eventos que Enviados por la App (Dispositivos Android → Servidor)

La aplicación envía los siguientes eventos al servidor.

### `REGISTER_DEVICE`

Se emite automáticamente cuando la aplicación se conecta por primera vez al servidor.

- **Payload (desde el cliente)**:

  - Un `JSONObject` con los siguientes campos:
    - **androidId (String)**: El ID único del dispositivo Android.
    - **ipAddress (String)**: La dirección IP local del dispositivo.
    - **appVersion (String)**: La versión actual de la aplicación instalada.

      ```JSON
      {
        "androidId": "abcdef1234567890",
        "ipAddress": "192.168.15.10",
        "appVersion": "1.0.0"
      }    
      ```

  - `query` options:
    - **clientType**: Indentificador de cliente para verificar si es un dispositivo permitido.

    - **`apiKey`**: Clave secreta a comparar por el servidor.

      ```JSON
        "clientType": "ANDROID_APP"
        "apikey": "CLAVE_SECRETA",
      ```

- **Respuesta `ack` (esperada por el cliente): El servidor debe responder a través del ack para confirmar si el registro fue exitoso.**

Esta respuesta se mostrara en la UI de la app

- En caso de éxito:

    ```JavaScript
      { "status": "OK" }
    ```

- Si hay un error o no se puede registrar:

    ```JavaScript
      {
        "status": "ERROR",
        "reason": "Motivo del fallo en el registro"
      }
    ```

- **Ejemplo de Uso (Node.js):**

```JavaScript
  socket.on('REGISTER_DEVICE', (data, ack) => { // JSONObject
    const { androidId: deviceId, ipAddress } = data;

    if (!deviceId) {
      console.error('Error de registro: falta DEVICE_ID');
      ack.({ status: 'ERROR', reason: 'Datos de identificación incompletos.' });
      return;
    }

    // Asignamos el deviceId a la propiedad personalizada del socket
    socket.data.deviceId = deviceId;
    socket.join(deviceId);
    socket.join(roomsName.ANDROID_APP);

    activeConnections.set(deviceId, socket.id);
    console.log(`Dispositivo registrado: ${deviceId} (IP: ${ipAddress})`);
    console.log(`Conexiones activas: ${activeConnections.size}`);

    ack.({ status: 'OK' })
  });
```

### `HEARTBEAT`

- **Evento**: `HEARTBEAT`
- **Descripción**: Los dispositivos Android envían periódicamente (cada 45s) su estado de salud al servidor.

- **Payload**:

```typescript
  {
    deviceId: string,
    battery: number,      // 0-100
    charging: boolean,
    timestamp: number
  }
```

- **Callback ACK** (opcional):

```javascript
  { 
    "status": "OK", 
    "serverTime": 1705123456789 
  }
```
