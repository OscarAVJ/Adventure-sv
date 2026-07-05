import { useI18n } from "../i18n/useI18n";

export function LanguageToggle() {
  const { language, setLanguage, t } = useI18n();

  return (
    <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-1 text-xs font-semibold text-slate-600 shadow-sm" aria-label={t.common.language}>
      {[
        { value: "es", label: t.common.spanish },
        { value: "en", label: t.common.english },
      ].map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setLanguage(option.value)}
          className={`rounded-md px-2.5 py-1.5 transition ${
            language === option.value ? "bg-brand-600 text-white" : "hover:bg-brand-50 hover:text-brand-700"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
