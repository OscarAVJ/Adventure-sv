import { Link } from "react-router-dom";
import { useI18n } from "../i18n/useI18n";
import { display } from "../services/Data.js";
import { LanguageToggle } from "./LanguageToggle.jsx";

export function Header() {
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <Link
          to="/planner"
          className="flex items-center gap-2"
          aria-label={t.header.plannerAria}
        >
          <img src="/logo.png" alt="" className="h-9 w-9 rounded-full object-cover" aria-hidden="true" />
          <span>
            <p className="text-sm font-bold text-brand-700" style={display}>
              Adventure-sv
            </p>
            <p className="text-xs text-slate-500">{t.header.tagline}</p>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <Link
            to="/planner"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            {t.header.cta}
          </Link>
        </div>
      </nav>
    </header>
  );
}

export default Header;
