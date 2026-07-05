import { Sun } from "lucide-react";
import { Link } from "react-router-dom";
import { display } from "../services/Data.js";

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <Link
          to="/planner"
          className="flex items-center gap-2"
          aria-label="Ir al planificador Adventure-sv"
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F2A93B] text-slate-950"
            aria-hidden="true"
          >
            <Sun className="h-4 w-4" strokeWidth={2.5} />
          </span>
          <span>
            <p className="text-sm font-bold text-brand-700" style={display}>
              Adventure·sv
            </p>
            <p className="text-xs text-slate-500">Turismo inteligente</p>
          </span>
        </Link>

        <Link
          to="/planner"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Crear itinerario
        </Link>
      </nav>
    </header>
  );
}

export default Header;