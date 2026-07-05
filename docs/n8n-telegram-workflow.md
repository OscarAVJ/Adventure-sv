# n8n + Telegram para Adventure-sv

## Endpoint del backend

Usa este endpoint para mensajes desde Telegram:

```txt
POST /api/webhooks/n8n/telegram
```

Body minimo:

```json
{
  "message": "Quiero 3 dias desde 2026-07-24, somos 4 personas, presupuesto $600",
  "chatId": "123456789"
}
```

El backend guarda la conversacion con:

```txt
channel=telegram
phone=telegram:123456789
```

## Crear bot

1. En Telegram busca `@BotFather`.
2. Ejecuta `/newbot`.
3. Guarda el token que devuelve BotFather.
4. En n8n crea credenciales de Telegram con ese token.

## Flujo recomendado en n8n

1. `Telegram Trigger`
2. `Code` para normalizar payload
3. `HTTP Request` hacia Adventure-sv
4. `Telegram` para enviar respuesta

## Code node: Normalize Telegram Payload

```js
const message = $json.message?.text || "";
const chatId = $json.message?.chat?.id;

return [
  {
    json: {
      message,
      chatId,
      phone: `telegram:${chatId}`
    }
  }
];
```

## HTTP Request

```txt
Method: POST
URL: {{$env.ADVENTURE_SV_API_URL}}/api/webhooks/n8n/telegram
Body Content Type: JSON
```

Body:

```js
={{
  JSON.stringify({
    message: $json.message,
    chatId: $json.chatId,
    phone: $json.phone
  })
}}
```

Activa la opcion para incluir datos de entrada en la respuesta si tu version de n8n la tiene. Si no, usa un nodo `Merge` para recuperar `chatId` despues del HTTP Request.

## Telegram Send Message

```txt
Chat ID: {{$node["Normalize Telegram Payload"].json.chatId}}
Text: {{$json.replyText}}
```

Si el texto queda demasiado largo para Telegram, divide `replyText` en varios mensajes o limita la respuesta desde el backend.
