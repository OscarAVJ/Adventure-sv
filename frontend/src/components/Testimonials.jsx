import { useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useI18n } from "../i18n/useI18n";
import { avatarUrl, display, getLandingContent } from "../services/Data.js";

function TestimonialCard({ name, role, quote }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex gap-1 text-[#F2A93B]">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="h-4 w-4" fill="currentColor" strokeWidth={0} />
        ))}
      </div>
      <p className="mt-4 text-sm italic leading-6 text-slate-600">
        &ldquo;{quote}&rdquo;
      </p>
      <div className="mt-5 flex items-center gap-3">
        <img src={avatarUrl(name)} alt={name} className="h-10 w-10 rounded-full" />
        <div>
          <p className="text-sm font-semibold text-slate-950">{name}</p>
          <p className="text-xs text-slate-500">{role}</p>
        </div>
      </div>
    </article>
  );
}

export function Testimonials() {
  const { language, t } = useI18n();
  const { testimonials } = getLandingContent(language);
  const [start, setStart] = useState(0);

  const visible = [
    testimonials[start % testimonials.length],
    testimonials[(start + 1) % testimonials.length],
  ];

  const showPrev = () =>
    setStart((i) => (i - 2 + testimonials.length) % testimonials.length);
  const showNext = () => setStart((i) => (i + 2) % testimonials.length);

  return (
    <section className="bg-slate-50 py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sm font-semibold text-[#1C7C74]">
              {t.testimonials.eyebrow}
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-950" style={display}>
              {t.testimonials.title}
            </h2>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={showPrev}
              aria-label={t.testimonials.previous}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition hover:border-slate-950 hover:text-slate-950"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={showNext}
              aria-label={t.testimonials.next}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition hover:border-slate-950 hover:text-slate-950"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {visible.map((testimonial) => (
            <TestimonialCard key={testimonial.name} {...testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default Testimonials;
