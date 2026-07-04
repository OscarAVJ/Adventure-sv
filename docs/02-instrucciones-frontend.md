# Adventure-sv - Instrucciones Frontend

## Objetivo

Construir la experiencia visual para que el usuario pueda pedir un itinerario turistico personalizado y entender por que el sistema eligio cada lugar.

El frontend no debe decidir el ranking de lugares. Su responsabilidad es capturar datos, llamar al backend y mostrar la respuesta de forma clara.

## Stack

- React
- Vite
- Tailwind CSS
- shadcn/ui
- lucide-react
- Google Maps React o Leaflet

## Estructura sugerida

```txt
frontend/
  src/
    components/
      planner/
        TripForm.jsx
        InterestChips.jsx
        OccasionSelect.jsx
        BudgetInput.jsx
        LoadingSteps.jsx
      itinerary/
        ItineraryResult.jsx
        DayTimeline.jsx
        ActivityCard.jsx
        BudgetSummary.jsx
        AdjustmentsPanel.jsx
        MapView.jsx
        BadgeList.jsx
    hooks/
      useItinerary.js
    pages/
      PlannerPage.jsx
    services/
      itineraryApi.js
    utils/
      formatCurrency.js
    App.jsx
    main.jsx
```

## Pantalla principal

La primera pantalla debe ser la app usable, no una landing page.

Debe incluir:

- texto libre: "Describe tu viaje"
- intereses con chips
- presupuesto total en USD
- cantidad de dias
- fecha de inicio
- zona preferida opcional
- ocasion especial opcional
- cantidad de viajeros

Intereses iniciales:

```js
[
  "playa",
  "surf",
  "comida",
  "cultura",
  "naturaleza",
  "aventura",
  "romantico",
  "familia"
]
```

Ocasiones iniciales:

```js
[
  { value: "", label: "Ninguna" },
  { value: "birthday", label: "Cumpleanos" },
  { value: "anniversary", label: "Aniversario" },
  { value: "family", label: "Viaje familiar" },
  { value: "friends", label: "Con amigos" },
  { value: "romantic", label: "Romantico" }
]
```

## Payload hacia backend

El frontend debe enviar exactamente este formato:

```js
const payload = {
  channel: "web",
  message,
  interests,
  budgetUsd: Number(budgetUsd),
  days: Number(days),
  startDate,
  preferredZone: preferredZone || null,
  occasion: occasion || null,
  travelers: Number(travelers),
  conversationId: null,
  phone: null,
};
```

Endpoint:

```txt
POST /api/itineraries
```

Variable de entorno:

```txt
VITE_API_URL=http://localhost:4000
```

## Servicio API

```js
const API_URL = import.meta.env.VITE_API_URL;

export async function createItinerary(payload) {
  const response = await fetch(`${API_URL}/api/itineraries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(data.message || "No se pudo generar el itinerario.");
  }

  return data.itinerary;
}
```

## Hook principal

```js
import { useState } from "react";
import { createItinerary } from "../services/itineraryApi";

export function useItinerary() {
  const [itinerary, setItinerary] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  async function generateItinerary(payload) {
    try {
      setStatus("loading");
      setError(null);

      const result = await createItinerary(payload);

      setItinerary(result);
      setStatus("success");
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  }

  return {
    itinerary,
    status,
    error,
    generateItinerary,
  };
}
```

## Loading narrativo

Mientras el backend responde, mostrar pasos rotativos:

```js
[
  "Entendiendo tus intereses...",
  "Buscando lugares reales en Google Maps...",
  "Revisando temporada y ocasion del viaje...",
  "Aplicando prioridades relevantes...",
  "Ajustando actividades a tu presupuesto..."
]
```

Esto comunica que el agente esta trabajando y mejora la experiencia de demo.

## Response esperado

El componente de resultado debe renderizar esta estructura:

```js
{
  id,
  summary,
  context: {
    season: { key, label },
    occasion: { key, label }
  },
  budgetUsd,
  estimatedCostUsd,
  adjustments,
  days: [
    {
      day,
      date,
      zone,
      weatherSummary,
      costUsd,
      activities: [
        {
          time,
          name,
          type,
          costUsd,
          googlePlaceId,
          coordinates,
          featured,
          seasonal,
          occasionMatch,
          badges,
          matchReasons,
          notes
        }
      ]
    }
  ]
}
```

## Visualizacion de resultado

Debe incluir:

- resumen del viaje
- presupuesto usado
- temporada detectada
- ocasion detectada
- lista de ajustes
- timeline por dia
- actividades con hora y costo
- badges por actividad
- mapa con pines

Badges recomendados:

- `Recomendado`
- `Sugerido por temporada`
- `Ideal para aniversario`
- `Ideal para cumpleanos`
- `Abierto ahora`
- `Dentro del presupuesto`

## ActivityCard

```jsx
export function ActivityCard({ activity }) {
  return (
    <article className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{activity.time}</p>
          <h3 className="font-semibold text-slate-900">{activity.name}</h3>
          <p className="text-sm text-slate-600">{activity.type}</p>
        </div>

        <p className="font-semibold text-slate-900">${activity.costUsd}</p>
      </div>

      {activity.badges?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {activity.badges.map((badge) => (
            <span
              key={badge}
              className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800"
            >
              {badge}
            </span>
          ))}
        </div>
      )}

      {activity.matchReasons?.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm text-slate-600">
          {activity.matchReasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      )}

      {activity.notes && (
        <p className="mt-3 text-sm text-slate-500">{activity.notes}</p>
      )}
    </article>
  );
}
```

## Mock temporal

Mientras backend no este listo, usar un mock con la misma forma del response. No inventar otro contrato.

Crear:

```txt
src/mocks/itineraryMock.js
```

El mock debe tener:

- actividad destacada
- actividad por temporada
- actividad por ocasion
- coordenadas
- ajustes
- costo total

## Manejo de errores

Si el backend falla, mostrar:

- mensaje claro
- boton para intentar de nuevo
- no dejar pantalla en blanco

Ejemplo:

```txt
No se pudo generar el itinerario. Revisa presupuesto, fecha o conexion e intenta nuevamente.
```

## Mapa

Si usan Google Maps:

- usar los `coordinates` que vienen del backend
- pin dorado para `featured`
- pin verde para `seasonal`
- pin azul para normal

El mapa no debe llamar Google Places por su cuenta. El backend ya debe entregar los lugares seleccionados.

## Criterio de terminado frontend

Frontend esta listo cuando:

- formulario genera payload correcto
- consume `POST /api/itineraries`
- renderiza response real o mock
- muestra loading narrativo
- muestra errores
- muestra badges y razones
- mapa muestra actividades con coordenadas

