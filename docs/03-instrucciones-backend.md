# Adventure-sv - Instrucciones Backend

## Objetivo

Construir la API MERN que recibe una necesidad de viaje, consulta datos externos, aplica reglas internas y devuelve un itinerario estructurado para frontend y WhatsApp.

El backend es la fuente de verdad del sistema. La logica de ranking, prioridad comercial, temporada y ocasion debe vivir aqui.

## Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- Google Places API
- Weather API
- AI model API
- n8n via HTTP

## Estructura sugerida

```txt
backend/
  src/
    config/
      db.js
      env.js
    controllers/
      itinerary.controller.js
    models/
      Itinerary.js
      Conversation.js
      PromotedPlace.js
      Season.js
      OccasionRule.js
    routes/
      itinerary.routes.js
      webhook.routes.js
    services/
      itinerary.service.js
      intent.service.js
      googlePlaces.service.js
      weather.service.js
      ranking.service.js
      season.service.js
      occasion.service.js
      cost.service.js
      ai.service.js
      whatsappFormatter.service.js
    validators/
      itinerary.validator.js
    middleware/
      error.middleware.js
      notFound.middleware.js
    utils/
      asyncHandler.js
      AppError.js
    server.js
```

## Variables de entorno

```txt
PORT=4000
MONGODB_URI=mongodb://localhost:27017/adventure-sv
GOOGLE_MAPS_API_KEY=
WEATHER_API_KEY=
AI_API_KEY=
FRONTEND_URL=http://localhost:5173
```

## Endpoint principal

```txt
POST /api/itineraries
```

Este endpoint debe servir para frontend y n8n/WhatsApp.

## Request esperado

```json
{
  "channel": "web",
  "message": "Quiero celebrar mi aniversario en diciembre, 2 dias, presupuesto $250, playa y comida local",
  "interests": ["playa", "comida"],
  "budgetUsd": 250,
  "days": 2,
  "startDate": "2026-12-20",
  "preferredZone": "El Tunco",
  "occasion": "anniversary",
  "travelers": 2,
  "conversationId": null,
  "phone": null
}
```

## Response esperado

```json
{
  "success": true,
  "replyText": "Te arme un itinerario de 2 dias para aniversario en temporada navidena. Costo estimado: $232 de $250.",
  "itinerary": {
    "id": "itinerary_id",
    "summary": "2 dias de playa, comida local y cena tranquila para aniversario.",
    "context": {
      "season": {
        "key": "christmas",
        "label": "Navidad"
      },
      "occasion": {
        "key": "anniversary",
        "label": "Aniversario"
      }
    },
    "budgetUsd": 250,
    "estimatedCostUsd": 232,
    "adjustments": [],
    "days": []
  }
}
```

## Validacion minima

Validar:

- `channel` debe ser `web` o `whatsapp`.
- `budgetUsd` requerido y mayor que 0.
- `days` requerido y entre 1 y 10.
- `startDate` requerido y fecha valida.
- `travelers` mayor que 0.
- `message` requerido si no vienen `interests`.

## Modelos Mongoose

### PromotedPlace

Negocios con prioridad comercial.

```js
const promotedPlaceSchema = new mongoose.Schema(
  {
    googlePlaceId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    zone: {
      type: String,
      index: true,
    },
    categories: [
      {
        type: String,
        enum: ["playa", "surf", "cultura", "naturaleza", "hospedaje", "comida", "tour", "romantico", "familia"],
      },
    ],
    priority: {
      type: Number,
      default: 0,
      min: 0,
      max: 3,
    },
    visibilityWeight: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    campaignStatus: {
      type: String,
      enum: ["active", "paused", "expired"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true }
);
```

### Season

Reglas temporales.

```js
const seasonSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    label: {
      type: String,
      required: true,
    },
    startMonth: Number,
    startDay: Number,
    endMonth: Number,
    endDay: Number,
    tags: [String],
    preferredCategories: [String],
    zoneBoosts: [
      {
        zone: String,
        weight: Number,
      },
    ],
    placeBoosts: [
      {
        googlePlaceId: String,
        weight: Number,
      },
    ],
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);
```

### OccasionRule

Reglas segun contexto personal.

```js
const occasionRuleSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    label: {
      type: String,
      required: true,
    },
    tags: [String],
    preferredCategories: [String],
    avoidedCategories: [String],
    tone: {
      type: String,
      enum: ["relaxed", "romantic", "family", "adventure", "premium", "budget"],
    },
    zoneBoosts: [
      {
        zone: String,
        weight: Number,
      },
    ],
    placeBoosts: [
      {
        googlePlaceId: String,
        weight: Number,
      },
    ],
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);
```

### Itinerary

Guardar itinerarios generados.

```js
const itinerarySchema = new mongoose.Schema(
  {
    channel: {
      type: String,
      enum: ["web", "whatsapp"],
      required: true,
    },
    phone: String,
    request: Object,
    summary: String,
    context: Object,
    budgetUsd: Number,
    estimatedCostUsd: Number,
    adjustments: [String],
    days: [Object],
  },
  { timestamps: true }
);
```

### Conversation

Para continuidad en WhatsApp.

```js
const conversationSchema = new mongoose.Schema(
  {
    channel: {
      type: String,
      enum: ["whatsapp", "web"],
      required: true,
    },
    phone: {
      type: String,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "closed"],
      default: "active",
    },
    messages: [
      {
        role: {
          type: String,
          enum: ["user", "assistant", "system"],
        },
        content: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    lastItineraryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Itinerary",
    },
  },
  { timestamps: true }
);
```

## Flujo interno del endpoint

```txt
1. Validar request.
2. Normalizar input.
3. Extraer intereses, ocasion y zona desde message si faltan.
4. Detectar temporada activa segun startDate.
5. Buscar reglas de ocasion en MongoDB.
6. Consultar Google Places segun intereses/zona.
7. Consultar detalles relevantes: rating, horarios, estado, coordenadas.
8. Buscar promoted places activos en MongoDB por googlePlaceId.
9. Calcular score final.
10. Seleccionar lugares por dia.
11. Estimar costos.
12. Ajustar si excede presupuesto.
13. Generar response estructurado.
14. Guardar Itinerary.
15. Si channel es whatsapp, devolver replyText listo para n8n.
```

## Ranking service

El ranking debe ser deterministico y testeable.

```js
export function scorePlace({ place, userContext, promotedPlace, season, occasionRule }) {
  const relevanceScore = getRelevanceScore(place, userContext);
  const ratingScore = (place.rating || 0) * 10;
  const promotedBoost = getPromotedBoost(place, promotedPlace, userContext);
  const seasonalBoost = getSeasonalBoost(place, season);
  const occasionBoost = getOccasionBoost(place, occasionRule);

  return relevanceScore + ratingScore + promotedBoost + seasonalBoost + occasionBoost;
}
```

Regla para prioridad comercial:

```js
function getPromotedBoost(place, promotedPlace, userContext) {
  if (!promotedPlace || promotedPlace.campaignStatus !== "active") return 0;

  const matchesCategory = promotedPlace.categories.some((category) =>
    userContext.interests.includes(category)
  );

  if (!matchesCategory) return 0;

  return promotedPlace.visibilityWeight;
}
```

## Google Places

El backend debe usar Google Places para:

- buscar candidatos reales
- obtener `googlePlaceId`
- rating
- ubicacion
- estado operativo
- horarios si esta disponible

Frontend no debe llamar Places directamente para seleccionar lugares.

## Temporada

Funcion esperada:

```js
async function findActiveSeason(date) {
  // recibe YYYY-MM-DD
  // devuelve temporada activa o null
}
```

Debe soportar rangos normales y rangos que cruzan ano, por ejemplo fin de ano.

## Ocasion

Si `occasion` viene en request, usarlo directo. Si no viene, `intent.service.js` puede intentar extraerla desde `message`.

Ejemplos:

```txt
"cumpleanos" -> birthday
"aniversario" -> anniversary
"con mi familia" -> family
"con amigos" -> friends
```

## Formato de actividad para frontend

Cada actividad debe tener:

```js
{
  time: "13:00",
  name: "Restaurante recomendado",
  type: "comida",
  costUsd: 15,
  googlePlaceId: "ChIJ...",
  coordinates: {
    lat: 13.4938,
    lng: -89.3838,
  },
  featured: true,
  seasonal: false,
  occasionMatch: true,
  badges: ["Recomendado", "Ideal para aniversario", "Dentro del presupuesto"],
  matchReasons: [
    "Coincide con comida local",
    "Negocio priorizado relevante",
    "Encaja con aniversario"
  ],
  notes: "Cena tranquila cerca de la playa."
}
```

## n8n/WhatsApp

n8n debe llamar el mismo endpoint:

```json
{
  "channel": "whatsapp",
  "message": "Quiero celebrar mi cumpleanos con amigos, playa, $300, 2 dias",
  "interests": [],
  "budgetUsd": 300,
  "days": 2,
  "startDate": "2026-12-18",
  "preferredZone": null,
  "occasion": null,
  "travelers": 4,
  "conversationId": "n8n-conversation-id",
  "phone": "+50300000000"
}
```

El backend debe responder `replyText` listo para enviar por WhatsApp.

## Errores

Usar formato consistente:

```json
{
  "success": false,
  "message": "No se pudo generar el itinerario.",
  "details": ["budgetUsd es requerido"]
}
```

## Criterio de terminado backend

Backend esta listo cuando:

- conecta MongoDB
- tiene modelos principales
- expone `POST /api/itineraries`
- valida request
- devuelve response con contrato exacto
- aplica ranking con prioridad, temporada y ocasion
- guarda itinerario
- puede ser llamado desde frontend y n8n

