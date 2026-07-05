import { Gift, SlidersHorizontal, Sparkles } from "lucide-react";
import { display, mono, steps } from "../services/Data.js";

const ICONS = {
  sliders: SlidersHorizontal,
  sparkles: Sparkles,
  gift: Gift,
};

function StepCard({ iconKey, title, text, index }) {
  const Icon = ICONS[iconKey];
  return (
    <article className="flex flex-col items-center text-center">
      <span
        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-md ring-1 ring-slate-200"
        aria-hidden="true"
      >
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="mt-5 font-bold text-slate-950" style={display}>
        <span style={mono} className="mr-1 text-brand-700">
          {index}.
        </span>
        {title}
      </h3>
      <p className="mt-2 max-w-xs text-sm leading-6 text-slate-600">{text}</p>
    </article>
  );
}

export function Steps() {
  return (
    <section id="como-funciona" className="bg-slate-50 py-20 lg:py-24">
      <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-slate-950" style={display}>
          Tu plan perfecto en 3 pasos.
        </h2>

        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {steps.map((step, i) => (
            <StepCard key={step.title} index={i + 1} {...step} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default Steps;