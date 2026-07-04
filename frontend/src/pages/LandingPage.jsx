import {
  CalendarDays,
  MapPinned,
  MessageCircle,
  Route,
  Sparkles,
  Star,
  WalletCards,
} from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: Sparkles,
    title: "Personalizacion real",
    text: "Intereses, presupuesto, temporada y ocasion especial en una sola recomendacion.",
  },
  {
    icon: MapPinned,
    title: "Lugares reales",
    text: "El backend usara Google Places para seleccionar opciones verificables.",
  },
  {
    icon: Star,
    title: "Visibilidad priorizada",
    text: "Los negocios recomendados suben solo cuando coinciden con la necesidad del viajero.",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp con n8n",
    text: "El mismo motor podra responder desde frontend o desde conversaciones por WhatsApp.",
  },
];

const itineraryPreview = [
  {
    time: "10:00",
    title: "Playa El Tunco",
    badge: "Interes principal",
  },
  {
    time: "14:00",
    title: "Clase de surf grupal",
    badge: "Dentro del presupuesto",
  },
  {
    time: "19:00",
    title: "Cena frente al mar",
    badge: "Recomendado",
  },
];

export function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            to="/planner"
            className="text-left"
            aria-label="Ir al planificador Adventure-sv"
          >
            <p className="text-sm font-semibold text-brand-700">Adventure-sv</p>
            <p className="text-xs text-slate-500">Turismo inteligente</p>
          </Link>

          <Link
            to="/planner"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Crear itinerario
          </Link>
        </nav>
      </header>

      <section className="border-b border-slate-200 bg-orange-500 text-white">
        <div className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_480px] lg:items-center lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-200">
              Itinerarios para El Salvador
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              Planes turisticos que respetan tu presupuesto y tu contexto.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
              Adventure-sv combina preferencias, fechas, temporada, ocasion
              especial y lugares reales para crear rutas claras, alcanzables y
              listas para compartir por web o WhatsApp.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/planner"
                className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
              >
                Empezar ahora
              </Link>
              <a
                href="#como-funciona"
                className="rounded-lg border border-blue-200 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Ver funcionamiento
              </a>
            </div>
          </div>

          <div className="rounded-lg border border-white/20 bg-white p-4 text-slate-950 shadow-soft">
            <div className="rounded-lg bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-brand-700">
                    Vista previa
                  </p>
                  <h2 className="text-xl font-semibold text-slate-950">
                    Aniversario en El Tunco
                  </h2>
                </div>
                <span className="rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">
                  Navidad
                </span>
              </div>

              <div className="mt-5 grid gap-3">
                {itineraryPreview.map((item) => (
                  <div
                    key={`${item.time}-${item.title}`}
                    className="rounded-lg border border-slate-200 bg-white p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-brand-700">
                          {item.time}
                        </p>
                        <p className="font-semibold text-slate-950">
                          {item.title}
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                        {item.badge}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-lg bg-white p-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-600">
                    Presupuesto usado
                  </span>
                  <span className="font-semibold text-brand-700">
                    $232 / $250
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-200">
                  <div className="h-2 w-[92%] rounded-full bg-brand-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="bg-slate-50 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-brand-700">
              Como funciona
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-950">
              Una sola logica para web y WhatsApp.
            </h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <StepCard
              icon={CalendarDays}
              title="1. Captura necesidad"
              text="El usuario indica intereses, presupuesto, fechas y ocasion."
            />
            <StepCard
              icon={Route}
              title="2. Backend decide"
              text="Express cruza Google Places, MongoDB, temporada y prioridad."
            />
            <StepCard
              icon={WalletCards}
              title="3. Entrega itinerario"
              text="La respuesta vuelve estructurada para frontend o n8n."
            />
          </div>
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({ icon: Icon, title, text }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </article>
  );
}

function StepCard({ icon: Icon, title, text }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <Icon className="h-6 w-6 text-brand-600" />
      <h3 className="mt-4 font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </article>
  );
}
