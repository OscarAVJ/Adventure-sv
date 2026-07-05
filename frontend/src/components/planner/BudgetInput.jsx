import { formatCurrency } from "../../utils/formatCurrency";
import { useI18n } from "../../i18n/useI18n";

export function BudgetInput({ value, onChange }) {
  const { t } = useI18n();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label htmlFor="budgetUsd" className="text-sm font-medium text-slate-700">
          {t.form.budget}
        </label>
        <span className="text-sm font-semibold text-brand-700">
          {formatCurrency(value)}
        </span>
      </div>
      <input
        id="budgetUsd"
        min="50"
        max="1000"
        step="1"
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        placeholder={t.form.budgetPlaceholder}
        className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
      />
    </div>
  );
}
