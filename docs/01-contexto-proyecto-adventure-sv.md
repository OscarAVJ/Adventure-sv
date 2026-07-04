# Adventure-sv - Contexto e Instrucciones Generales

## Objetivo del proyecto

Adventure-sv es una plataforma MERN para generar itinerarios turisticos personalizados en El Salvador. El sistema debe tomar una necesidad expresada por el usuario, analizar presupuesto, fechas, intereses, temporada, ocasion especial y negocios priorizados, y devolver un itinerario ejecutable.

El producto no debe comportarse como un chatbot generico. Debe actuar como un planificador que consulta datos, aplica reglas de negocio y entrega una respuesta estructurada.

## Stack principal

- Frontend: React, Vite, Tailwind CSS, shadcn/ui.
- Backend: Node.js, Express.js, MongoDB, Mongoose.
- APIs externas: Google Maps/Places API, API de clima, modelo IA.
- Automatizacion: n8n + WhatsApp como canal conversacional.

## Alcance del MVP

El MVP debe permitir:

1. Generar itinerarios desde el frontend.
2. Generar itinerarios desde WhatsApp via n8n.
3. Consultar lugares reales usando Google Places.
4. Aplicar prioridad comercial a ciertos negocios guardados en MongoDB.
5. Considerar temporada, por ejemplo Navidad, Semana Santa o vacaciones.
6. Considerar ocasion del viaje, por ejemplo cumpleanos, aniversario o viaje familiar.
7. Devolver un itinerario con dias, actividades, costos, badges y razones.

Fuera del MVP:

- Reservas reales.
- Pagos.
- Registro de negocios por WhatsApp.
- Panel administrativo completo.
- Garantia exacta de clima o precios.

## Arquitectura general

```txt
React Frontend --------------\
                              \
                               -> Backend Express -> MongoDB
WhatsApp -> n8n -------------/          |
                                        |-> Google Places API
                                        |-> Weather API
                                        |-> AI model
```

Frontend y WhatsApp deben consumir la misma logica del backend. n8n no decide lugares ni arma itinerarios; solo recibe mensajes, llama al backend y responde por WhatsApp.

## Responsabilidades por capa

### Frontend

- Captura preferencias del usuario.
- Llama al endpoint `POST /api/itineraries`.
- Muestra loading narrativo.
- Renderiza itinerario, costos, mapa, badges y razones.
- No calcula ranking ni decide prioridades.

### Backend

- Valida input.
- Extrae intencion desde texto libre si aplica.
- Consulta Google Places.
- Cruza resultados con MongoDB para prioridades comerciales.
- Aplica boosts por temporada y ocasion.
- Calcula score final de lugares.
- Genera itinerario estructurado.
- Guarda itinerario y conversacion si aplica.

### MongoDB

Guarda datos internos que no vienen de Google:

- negocios priorizados
- temporadas
- reglas por ocasion
- itinerarios generados
- conversaciones de WhatsApp

Google Places es la fuente principal de lugares reales. MongoDB no reemplaza Google; agrega reglas de negocio encima.

## Ranking de lugares

El backend debe calcular un score por lugar:

```txt
score =
  relevancia con la necesidad del usuario +
  rating/calidad +
  cercania/logistica +
  boost por negocio priorizado +
  boost por temporada +
  boost por ocasion
```

Regla importante:

Un negocio priorizado puede subir entre opciones relevantes, pero nunca debe aparecer si no coincide con la necesidad, presupuesto o contexto del usuario.

Ejemplo correcto:

```txt
Usuario quiere comida economica en El Tunco.
El sistema busca restaurantes economicos en El Tunco.
Si uno esta priorizado y cumple, aparece mas arriba.
```

Ejemplo incorrecto:

```txt
Usuario quiere comida economica.
El sistema recomienda un hotel caro solo porque esta patrocinado.
```

## Temporadas

Las temporadas deben manejarse como reglas en MongoDB.

Ejemplos:

- Navidad
- Semana Santa
- Vacaciones agostinas
- Fin de ano
- Temporada de surf

La temporada da boost, no filtra de forma absoluta.

Si el usuario pide surf en Navidad, el sistema debe mantener surf como prioridad y puede agregar una cena, paseo nocturno o lugar decorado si encaja.

## Ocasiones especiales

El sistema debe detectar o recibir ocasiones como:

- cumpleanos
- aniversario
- viaje familiar
- viaje romantico
- viaje con amigos
- aventura
- descanso

La ocasion tambien da boost. No debe dominar la intencion principal del usuario.

Ejemplo:

```txt
"Quiero playa y voy celebrando aniversario"
```

Resultado esperado:

- playa como actividad principal
- cena tranquila o atardecer como actividad contextual
- badge: "Ideal para aniversario"

## n8n/WhatsApp

n8n queda como canal conversacional:

1. Recibe mensaje de WhatsApp.
2. Limpia datos basicos.
3. Llama al backend.
4. Recibe `replyText` e `itinerary`.
5. Responde al usuario por WhatsApp.

n8n no debe:

- rankear lugares
- consultar MongoDB para reglas de negocio
- decidir negocios priorizados
- construir itinerarios complejos

## Endpoint principal compartido

Todo debe girar alrededor de:

```txt
POST /api/itineraries
```

Este endpoint debe funcionar tanto para frontend como para n8n.

## Contrato de request

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

Campos importantes:

- `channel`: `"web"` o `"whatsapp"`.
- `message`: texto libre del usuario.
- `interests`: intereses seleccionados en frontend. Puede venir vacio si el usuario escribe por WhatsApp.
- `budgetUsd`: presupuesto total.
- `days`: cantidad de dias.
- `startDate`: fecha inicial en formato `YYYY-MM-DD`.
- `preferredZone`: zona opcional.
- `occasion`: ocasion opcional. Ejemplo: `birthday`, `anniversary`, `family`, `friends`, `romantic`.
- `travelers`: cantidad de personas.
- `conversationId`: usado para continuidad por WhatsApp.
- `phone`: usado solo cuando `channel` es `"whatsapp"`.

## Contrato de response

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
    "adjustments": [
      "Se mantuvo playa como interes principal y se agrego cena tranquila por aniversario.",
      "Se priorizo un restaurante recomendado porque coincide con presupuesto y zona."
    ],
    "days": [
      {
        "day": 1,
        "date": "2026-12-20",
        "zone": "El Tunco",
        "weatherSummary": "Clima esperado parcialmente soleado.",
        "costUsd": 118,
        "activities": [
          {
            "time": "10:00",
            "name": "Playa El Tunco",
            "type": "playa",
            "costUsd": 0,
            "googlePlaceId": "ChIJ...",
            "coordinates": {
              "lat": 13.4938,
              "lng": -89.3838
            },
            "featured": false,
            "seasonal": false,
            "occasionMatch": false,
            "badges": ["Abierto ahora"],
            "matchReasons": ["Coincide con interes de playa", "Cerca de la zona preferida"],
            "notes": "Actividad principal del dia."
          }
        ]
      }
    ]
  }
}
```

## Manejo de errores esperado

```json
{
  "success": false,
  "message": "No se pudo generar el itinerario con los datos enviados.",
  "details": [
    "budgetUsd es requerido",
    "days debe ser mayor que 0"
  ]
}
```

## Division recomendada del trabajo

### Persona frontend

- Crear proyecto Vite React.
- Construir formulario de planificacion.
- Consumir `POST /api/itineraries`.
- Construir pantalla de resultado usando el contrato definido.
- Usar mock local mientras backend termina.

### Persona backend

- Crear API Express.
- Conectar MongoDB.
- Crear modelos Mongoose.
- Implementar `POST /api/itineraries`.
- Implementar ranking, temporada, ocasion y prioridad.
- Exponer response igual al contrato.

## Orden de implementacion

1. Definir repositorio y estructura.
2. Crear frontend y backend.
3. Implementar contrato con mock.
4. Backend conecta MongoDB.
5. Backend implementa ranking interno.
6. Frontend consume backend real.
7. Integrar Google Places.
8. Integrar n8n/WhatsApp.
9. Ajustar demo final.

