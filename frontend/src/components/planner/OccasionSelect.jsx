import { occasionOptions } from "../../constants/plannerOptions";
import { useI18n } from "../../i18n/useI18n";

export function OccasionSelect({ value, onChange }) {
  const { language, t } = useI18n();
  const options = occasionOptions[language] || occasionOptions.es;

  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-slate-700">{t.form.occasion}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
      >
        {options.map((option) => (
          <option key={option.value || "none"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

