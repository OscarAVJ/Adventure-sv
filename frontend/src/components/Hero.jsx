import { CalendarDays, MapPin, Search, Sun, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useI18n } from "../i18n/useI18n";
import { display, HERO_IMAGE } from "../services/Data.js";

export function Hero() {
  const { t } = useI18n();

  return (
    <section className="relative isolate flex min-h-[88vh] items-center overflow-hidden">
      <img
        src={HERO_IMAGE}
        alt="Paisaje de El Salvador al atardecer"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/20" />

      <div className="relative mx-auto w-full max-w-5xl px-4 py-24 text-center text-white sm:px-6 lg:px-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide backdrop-blur">
          <Sun className="h-3.5 w-3.5 text-[#F2A93B]" />
          {t.hero.eyebrow}
        </span>

        <h1
          className="mx-auto mt-6 max-w-3xl text-4xl leading-tight sm:text-5xl lg:text-6xl"
          style={{ ...display, fontWeight: 700 }}
        >
          {t.hero.title}
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-white/80 sm:text-lg">
          {t.hero.description}
        </p>

        <div className="mx-auto mt-10 flex max-w-3xl flex-col gap-2 rounded-full bg-white/10 p-2 text-left backdrop-blur sm:flex-row sm:items-center sm:gap-0 sm:rounded-full sm:p-2">
          <div className="flex flex-1 items-center gap-2 rounded-full px-4 py-3 sm:border-r sm:border-white/15">
            <MapPin className="h-4 w-4 shrink-0 text-[#F2A93B]" />
            <span className="text-sm text-white/90">{t.hero.where}</span>
          </div>
          <div className="flex flex-1 items-center gap-2 rounded-full px-4 py-3 sm:border-r sm:border-white/15">
            <CalendarDays className="h-4 w-4 shrink-0 text-[#1C7C74]" />
            <span className="text-sm text-white/90">{t.hero.when}</span>
          </div>
          <div className="flex flex-1 items-center gap-2 rounded-full px-4 py-3">
            <Users className="h-4 w-4 shrink-0 text-[#D14D72]" />
            <span className="text-sm text-white/90">{t.hero.people}</span>
          </div>
          <Link
            to="/planner"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1C7C74] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#15625c]"
          >
            {t.hero.explore}
            <Search className="h-4 w-4" />
          </Link>
        </div>

        <p className="mt-6 text-xs font-medium uppercase tracking-wide text-white/60">
          {t.hero.proof}
        </p>
      </div>
    </section>
  );
}

export default Hero;
