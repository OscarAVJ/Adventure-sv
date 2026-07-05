export const display = { fontFamily: "'Baloo 2', sans-serif" };
export const mono = { fontFamily: "'JetBrains Mono', monospace" };

export const HERO_IMAGE =
  "https://picsum.photos/seed/el-salvador-hero/1600/900";

const landingContent = {
  es: {
    destinations: [
      {
        image: "https://picsum.photos/seed/ruta-de-las-flores/600/500",
        tag: "Pueblos",
        title: "Ruta de las Flores",
        price: "$45 / persona",
      },
      {
        image: "https://picsum.photos/seed/volcan-santa-ana/600/500",
        tag: "Aventura",
        title: "Volcán de Santa Ana",
        price: "$35 / persona",
      },
      {
        image: "https://picsum.photos/seed/playa-el-tunco/600/500",
        tag: "Playa",
        title: "Playa El Tunco",
        price: "$28 / persona",
      },
    ],
    steps: [
      {
        iconKey: "sliders",
        title: "Elige tus intereses",
        text: "¿Montañas, playas o ciudades coloniales? Tú decides el ritmo de tu aventura.",
      },
      {
        iconKey: "sparkles",
        title: "Generamos tu plan",
        text: "Nuestra IA analiza rutas y lugares reales para crear una experiencia personalizada.",
      },
      {
        iconKey: "gift",
        title: "¡A disfrutar!",
        text: "Recibe tu itinerario detallado con mapas, costos estimados y consejos locales.",
      },
    ],
    features: [
      {
        iconKey: "sparkles",
        accent: "#F2A93B",
        title: "Personalización real",
        text: "Intereses, presupuesto, temporada y ocasión especial en una sola recomendación.",
      },
      {
        iconKey: "mapPinned",
        accent: "#1C7C74",
        title: "Lugares reales",
        text: "El backend usa Google Places para elegir opciones verificables, no inventadas.",
      },
      {
        iconKey: "star",
        accent: "#D14D72",
        title: "Visibilidad priorizada",
        text: "Los negocios recomendados suben solo cuando coinciden con la necesidad del viajero.",
      },
      {
        iconKey: "messageCircle",
        accent: "#E8563C",
        title: "Telegram con n8n",
        text: "El mismo motor responde desde el sitio web o desde una conversación por Telegram.",
      },
    ],
    testimonials: [
      {
        name: "Sofía Méndez",
        role: "Viajera sola · México",
        quote:
          "La mejor forma de planear mi viaje. No sabía por dónde empezar y Adventure-sv me dio una ruta perfecta que incluyó lugares que nunca hubiera encontrado sola.",
      },
      {
        name: "James Wilson",
        role: "Viajero de lujo · USA",
        quote:
          "El concierge digital es increíble. Necesitábamos un cambio de último minuto por el clima y la IA nos dio alternativas geniales al instante.",
      },
      {
        name: "Renata Alas",
        role: "Viaje en pareja · Guatemala",
        quote:
          "Todo el itinerario respetó nuestro presupuesto y cada lugar recomendado fue exactamente como lo describieron.",
      },
      {
        name: "Marco Duarte",
        role: "Viaje familiar · El Salvador",
        quote:
          "Reservar por Telegram fue muy cómodo. En minutos teníamos un plan de 3 días listo para toda la familia.",
      },
    ],
  },
  en: {
    destinations: [
      {
        image: "https://picsum.photos/seed/ruta-de-las-flores/600/500",
        tag: "Towns",
        title: "Route of the Flowers",
        price: "$45 / person",
      },
      {
        image: "https://picsum.photos/seed/volcan-santa-ana/600/500",
        tag: "Adventure",
        title: "Santa Ana Volcano",
        price: "$35 / person",
      },
      {
        image: "https://picsum.photos/seed/playa-el-tunco/600/500",
        tag: "Beach",
        title: "El Tunco Beach",
        price: "$28 / person",
      },
    ],
    steps: [
      {
        iconKey: "sliders",
        title: "Choose your interests",
        text: "Mountains, beaches, or colonial towns? You decide the pace of your adventure.",
      },
      {
        iconKey: "sparkles",
        title: "We build your plan",
        text: "Our AI reviews real routes and places to create a personalized experience.",
      },
      {
        iconKey: "gift",
        title: "Enjoy the trip",
        text: "Receive a detailed itinerary with maps, estimated costs, and local tips.",
      },
    ],
    features: [
      {
        iconKey: "sparkles",
        accent: "#F2A93B",
        title: "Real personalization",
        text: "Interests, budget, season, and special occasion in one recommendation.",
      },
      {
        iconKey: "mapPinned",
        accent: "#1C7C74",
        title: "Real places",
        text: "The backend uses Google Places to choose verifiable options, not invented ones.",
      },
      {
        iconKey: "star",
        accent: "#D14D72",
        title: "Relevant visibility",
        text: "Recommended businesses rise only when they match the traveler need.",
      },
      {
        iconKey: "messageCircle",
        accent: "#E8563C",
        title: "Telegram with n8n",
        text: "The same engine responds from the website or through a Telegram conversation.",
      },
    ],
    testimonials: [
      {
        name: "Sofía Méndez",
        role: "Solo traveler · Mexico",
        quote:
          "The best way to plan my trip. I did not know where to start and Adventure-sv gave me a perfect route with places I would not have found alone.",
      },
      {
        name: "James Wilson",
        role: "Luxury traveler · USA",
        quote:
          "The digital concierge is incredible. We needed a last-minute change because of the weather and the AI gave us great alternatives instantly.",
      },
      {
        name: "Renata Alas",
        role: "Couple trip · Guatemala",
        quote:
          "The whole itinerary respected our budget and every recommended place was exactly as described.",
      },
      {
        name: "Marco Duarte",
        role: "Family trip · El Salvador",
        quote:
          "Booking through Telegram was very easy. In minutes we had a 3-day plan ready for the whole family.",
      },
    ],
  },
};

export const getLandingContent = (language) => landingContent[language] || landingContent.es;

export const avatarUrl = (name) =>
  `https://ui-avatars.com/api/?background=1B1B2F&color=F2A93B&bold=true&name=${encodeURIComponent(
    name
  )}`;
