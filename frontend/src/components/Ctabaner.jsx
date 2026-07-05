import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { display } from "../services/Data.js";

export function CtaBanner() {
  return (
    <section className="bg-white px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-slate-950 px-6 py-16 text-center sm:px-12 lg:py-20">
        <span
          className="pointer-events-none absolute inset-0 flex items-center justify-center whitespace-nowrap text-6xl font-bold text-white/5 sm:text-7xl"
          style={display}
          aria-hidden="true"
        >
          Descubre El Salvador
        </span>

        <div className="relative">
          <h2
            className="mx-auto max-w-xl text-3xl font-bold text-white sm:text-4xl"
            style={display}
          >
            Listo para la aventura?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-white/70 sm:text-base">
            Unete a miles de viajeros que ya estan descubriendo la magia de
            El Salvador con planes inteligentes y personalizados.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/planner"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1C7C74] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#15625c]"
            >
              Genera tu itinerario gratis
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#como-funciona"
              className="inline-flex items-center justify-center rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Hablar con un experto
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CtaBanner;