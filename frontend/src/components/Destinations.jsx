import { Link } from "react-router-dom";
import { useI18n } from "../i18n/useI18n";
import { display, getLandingContent, mono } from "../services/Data.js";

function DestinationCard({ image, tag, title, price }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-[#1C7C74] px-3 py-1 text-xs font-semibold text-white">
          {tag}
        </span>
      </div>
      <div className="flex items-center justify-between p-4">
        <h3 className="font-bold text-slate-950" style={display}>
          {title}
        </h3>
        <span className="text-sm font-semibold text-brand-700" style={mono}>
          {price}
        </span>
      </div>
    </article>
  );
}

export function Destinations() {
  const { language, t } = useI18n();
  const { destinations } = getLandingContent(language);

  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-brand-700">
              {t.destinations.eyebrow}
            </p>
            <h2
              className="mt-2 max-w-xl text-3xl font-bold text-slate-950"
              style={display}
            >
              {t.destinations.title}
            </h2>
          </div>
          <Link
            to="/planner"
            className="text-sm font-semibold text-brand-700 underline-offset-4 hover:underline"
          >
            {t.destinations.viewAll}
          </Link>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {destinations.map((place) => (
            <DestinationCard key={place.title} {...place} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default Destinations;
