import { MapPinned, MessageCircle, Sparkles, Star } from "lucide-react";
import { display, features } from "../services/Data.js";

const ICONS = {
  sparkles: Sparkles,
  mapPinned: MapPinned,
  star: Star,
  messageCircle: MessageCircle,
};

function FeatureCard({ iconKey, title, text, accent }) {
  const Icon = ICONS[iconKey];
  return (
    <article
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      style={{ borderLeft: `4px solid ${accent}` }}
    >
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full"
        style={{ backgroundColor: `${accent}1A`, color: accent }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-5 font-bold text-slate-950" style={display}>
        {title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </article>
  );
}

export function Features() {
  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold text-brand-700">
          Por qué Adventure-sv
        </p>
        <h2
          className="mt-3 max-w-xl text-3xl font-bold text-slate-950"
          style={display}
        >
          Cada recomendación tiene una razón detrás.
        </h2>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;
