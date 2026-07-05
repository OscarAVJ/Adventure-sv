/**
 * Shared design tokens + content for the Adventure-sv landing page.
 * Import from here so every component stays in sync (one place to
 * edit copy, colors, and placeholder images).
 */

export const display = { fontFamily: "'Baloo 2', sans-serif" };
export const mono = { fontFamily: "'JetBrains Mono', monospace" };

// Placeholder — swap for your own photo (e.g. /images/hero.jpg)
export const HERO_IMAGE =
  "https://picsum.photos/seed/el-salvador-hero/1600/900";

export const destinations = [
  {
    image: "https://picsum.photos/seed/ruta-de-las-flores/600/500",
    tag: "Pueblos",
    title: "Ruta de las Flores",
    price: "$45 / persona",
  },
  {
    image: "https://picsum.photos/seed/volcan-santa-ana/600/500",
    tag: "Aventura",
    title: "Volcan de Santa Ana",
    price: "$35 / persona",
  },
  {
    image: "https://picsum.photos/seed/playa-el-tunco/600/500",
    tag: "Playa",
    title: "Playa El Tunco",
    price: "$28 / persona",
  },
];

// icon fields are set inside Steps.jsx / Features.jsx (components own
// their lucide-react imports), so these arrays only hold text + keys.
export const steps = [
  {
    iconKey: "sliders",
    title: "Elige tus intereses",
    text: "Montanas, playas o ciudades coloniales? Tu decides el ritmo de tu aventura.",
  },
  {
    iconKey: "sparkles",
    title: "Generamos tu plan",
    text: "Nuestra IA analiza miles de rutas para crear una experiencia 100% personalizada.",
  },
  {
    iconKey: "gift",
    title: "A disfrutar!",
    text: "Recibe tu itinerario detallado con mapas, reservas y consejos locales exclusivos.",
  },
];

export const features = [
  {
    iconKey: "sparkles",
    accent: "#F2A93B",
    title: "Personalizacion real",
    text: "Intereses, presupuesto, temporada y ocasion especial en una sola recomendacion.",
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
    title: "WhatsApp con n8n",
    text: "El mismo motor responde desde el sitio web o desde una conversacion por WhatsApp.",
  },
];

export const testimonials = [
  {
    name: "Sofia Mendez",
    role: "Viajera Solo · Mexico",
    quote:
      "La mejor forma de planear mi viaje. No sabia por donde empezar y Adventure-sv me dio una ruta perfecta que incluyo lugares que nunca hubiera encontrado solo.",
  },
  {
    name: "James Wilson",
    role: "Viajero de Lujo · USA",
    quote:
      "El concierge digital es increible. Necesitabamos un cambio de ultimo minuto por el clima y la IA nos dio alternativas geniales al instante.",
  },
  {
    name: "Renata Alas",
    role: "Viaje en pareja · Guatemala",
    quote:
      "Todo el itinerario respeto nuestro presupuesto al centavo y cada lugar recomendado fue exactamente como lo describieron.",
  },
  {
    name: "Marco Duarte",
    role: "Viaje familiar · El Salvador",
    quote:
      "Reservar por WhatsApp fue lo mas comodo. En minutos teniamos un plan de 3 dias listo para toda la familia.",
  },
];

// ui-avatars.com generates an initials avatar — no real photos, so no
// attribution/likeness concerns. Swap for real traveler photos later.
export const avatarUrl = (name) =>
  `https://ui-avatars.com/api/?background=1B1B2F&color=F2A93B&bold=true&name=${encodeURIComponent(
    name
  )}`;