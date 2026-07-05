import { cn } from "../../utils/cn";
import { interestOptions } from "../../constants/plannerOptions";
import { useI18n } from "../../i18n/useI18n";

export function InterestChips({ selected, onChange }) {
  const { language } = useI18n();
  const options = interestOptions[language] || interestOptions.es;

  function toggleInterest(value) {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
      return;
    }

    onChange([...selected, value]);
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {options.map((option) => {
        const isSelected = selected.includes(option.value);

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => toggleInterest(option.value)}
            className={cn(
              "flex h-11 items-center justify-center rounded-lg border px-3 text-sm font-medium transition",
              isSelected
                ? "border-brand-600 bg-brand-600 text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-700 hover:border-brand-200 hover:bg-brand-50"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
