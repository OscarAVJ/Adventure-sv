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

## Variables

Copia `.env.example` a `.env` y configura:

```txt
PORT=4000
MONGODB_URI=mongodb://localhost:27017/adventure-sv
GOOGLE_MAPS_API_KEY=
WEATHER_API_KEY=
AI_API_KEY=
FRONTEND_URL=http://localhost:5173
```

Si no hay `GOOGLE_MAPS_API_KEY`, la API usa candidatos fallback para mantener el contrato del MVP.
