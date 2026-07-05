import { AlertCircle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { ItineraryResult } from "../components/itinerary/ItineraryResult";
import { LanguageToggle } from "../components/LanguageToggle";
import { LoadingSteps } from "../components/planner/LoadingSteps";
import { TripForm } from "../components/planner/TripForm";
import { useItinerary } from "../hooks/useItinerary";
import { useI18n } from "../i18n/useI18n";

export function PlannerPage() {
  const { t } = useI18n();
  const { itinerary, status, error, rerollingActivityId, rerollError, generateItinerary, changeActivity } = useItinerary();
  const isLoading = status === "loading";

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
              aria-label={t.planner.back}
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <img src="/logo.png" alt="" className="hidden h-10 w-10 rounded-full object-cover sm:block" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-brand-700">Adventure-sv</p>
              <h1 className="text-xl font-semibold text-slate-950">{t.planner.title}</h1>
            </div>
          </div>
          <LanguageToggle />
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
                <p className="font-semibold">{t.planner.errorTitle}</p>
              </div>
              <p className="mt-2 text-sm">{error}</p>
            </div>
          )}

          {!itinerary && !isLoading && status !== "error" && (
            <div className="rounded-lg border border-dashed border-brand-200 bg-white p-8 text-center shadow-sm">
              <p className="text-sm font-medium text-brand-700">{t.planner.emptyEyebrow}</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">{t.planner.emptyTitle}</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm text-slate-500">{t.planner.emptyDescription}</p>
            </div>
          )}

          {itinerary && (
            <ItineraryResult
              itinerary={itinerary}
              onRerollActivity={changeActivity}
              rerollingActivityId={rerollingActivityId}
              rerollError={rerollError}
            />
          )}
        </section>
      </div>
    </main>
  );
}
