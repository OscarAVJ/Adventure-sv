# n8n + WhatsApp para Adventure-sv

## Endpoint del backend

Usa este endpoint para mensajes de WhatsApp:

```txt
POST /api/webhooks/n8n/whatsapp
```

Body minimo:

```json
{
  "message": "Quiero 3 dias desde 2026-07-24, somos 4 personas, presupuesto $600, nos gusta cultura y naturaleza.",
  "phone": "+50300000000"
}
```

El backend usa IA para extraer:

- `budgetUsd`
- `days`
- `startDate`
- `travelers`
- `interests`
- `occasion`
- `preferredZone`

Si faltan datos, responde:

```json
{
  "success": true,
  "status": "needs_input",
  "replyText": "Para armarte una ruta real necesito estos datos..."
}
```

Si hay datos suficientes, responde:

```json
{
  "success": true,
  "replyText": "Te arme un itinerario...",
  "itinerary": {}
}
```

## Flujo recomendado en n8n

1. `Webhook` recibe el mensaje entrante de WhatsApp.
2. `Code` normaliza el payload del proveedor a `{ message, phone }`.
3. `HTTP Request` llama `POST {{$env.ADVENTURE_SV_API_URL}}/api/webhooks/n8n/whatsapp`.
4. Enviar `replyText` al usuario por el proveedor de WhatsApp.

## Variables sugeridas en n8n

```txt
ADVENTURE_SV_API_URL=https://tu-backend.com
WHATSAPP_TOKEN=token_del_proveedor
WHATSAPP_PHONE_NUMBER_ID=id_del_numero_si_usas_meta
```

## Importar workflow base

Importa este archivo en n8n:

```txt
docs/n8n-adventure-sv-whatsapp.workflow.json
```

Ese workflow deja lista la parte de recepcion, normalizacion y llamada al backend. El nodo final responde al webhook con el JSON del backend; si tu proveedor requiere una llamada separada para enviar WhatsApp, conecta un `HTTP Request` usando `replyText`.
