import { AlertCircle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { LoadingSteps } from "../components/planner/LoadingSteps";
import { TripForm } from "../components/planner/TripForm";
import { ItineraryResult } from "../components/itinerary/ItineraryResult";
import { useItinerary } from "../hooks/useItinerary";

export function PlannerPage() {
  const { itinerary, status, error, generateItinerary } = useItinerary();
  const isLoading = status === "loading";

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
              aria-label="Volver a landing"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <p className="text-sm font-medium text-brand-700">Adventure-sv</p>
              <h1 className="text-xl font-semibold text-slate-950">
                Planificador turistico inteligente
              </h1>
            </div>
          </div>
          <span className="hidden rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700 sm:inline-flex">
            MERN + Google Places
          </span>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[420px_1fr] lg:px-8">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <TripForm onSubmit={generateItinerary} isLoading={isLoading} />
        </aside>

        <section className="space-y-5">
          {isLoading && <LoadingSteps />}

          {status === "error" && (
            <div className="rounded-lg border border-red-200 bg-white p-5 text-red-700 shadow-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                <p className="font-semibold">No se pudo generar el itinerario</p>
              </div>
              <p className="mt-2 text-sm">{error}</p>
            </div>
          )}

          {!itinerary && !isLoading && status !== "error" && (
            <div className="rounded-lg border border-dashed border-brand-200 bg-white p-8 text-center shadow-sm">
              <p className="text-sm font-medium text-brand-700">
                Completa tus preferencias
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                Tu itinerario aparecera aqui
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm text-slate-500">
                El resultado mostrara presupuesto, actividades por dia, mapa,
                negocios recomendados, temporada y ocasion especial.
              </p>
            </div>
          )}

          {itinerary && <ItineraryResult itinerary={itinerary} />}
        </section>
      </div>
    </main>
  );
}

