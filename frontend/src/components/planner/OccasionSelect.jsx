import { occasionOptions } from "../../constants/plannerOptions";

export function OccasionSelect({ value, onChange }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-slate-700">Ocasion especial</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
      >
        {occasionOptions.map((option) => (
          <option key={option.value || "none"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

