# Adventure-sv Backend

API Express/MongoDB para generar itinerarios turisticos personalizados para frontend y WhatsApp/n8n.

## Comandos

```bash
npm install
npm run dev
```

Para probar sin MongoDB local:

```bash
SKIP_DB_CONNECTION=true npm run dev
```

En PowerShell:

```powershell
$env:SKIP_DB_CONNECTION="true"; npm.cmd run dev
```

## Endpoint principal

`POST /api/itineraries`

Tambien existe `POST /api/webhooks/whatsapp/itineraries` como alias para n8n/WhatsApp.

Para WhatsApp con n8n se recomienda usar:

`POST /api/webhooks/n8n/whatsapp`

Ese endpoint acepta un mensaje libre y telefono, extrae campos con IA, pide datos faltantes si hace falta y devuelve `replyText` listo para enviar.

## Variables

Copia `.env.example` a `.env` y configura:

```txt
PORT=4000
MONGODB_URI=mongodb://localhost:27017/adventure-sv
GOOGLE_MAPS_API_KEY=
WEATHER_API_KEY=
AI_PROVIDER=gemini
AI_API_KEY=
AI_MODEL=gemini-2.5-flash
FRONTEND_URL=http://localhost:5173
```

El clima usa Open-Meteo, asi que no requiere API key. `GOOGLE_MAPS_API_KEY` debe tener habilitada Places API (New); no se usan lugares fallback ni recomendaciones predeterminadas.

Si `AI_PROVIDER=gemini` y `AI_API_KEY` esta configurado, el backend usa `AI_MODEL=gemini-2.5-flash` para:

- enriquecer la intencion del usuario
- generar consultas de Google Places mas precisas para El Salvador
- seleccionar y ordenar el itinerario final usando solo candidatos verificados
- redactar un resumen mas natural

La IA no puede inventar lugares: recibe una lista de candidatos con `googlePlaceId` y el backend descarta cualquier seleccion que no exista en esa lista. Si la IA o Google Places fallan, el backend devuelve un error explicito o pide mas informacion en el flujo de n8n.

Tambien se mantiene soporte para `AI_PROVIDER=openai` si el equipo decide volver a OpenAI.
