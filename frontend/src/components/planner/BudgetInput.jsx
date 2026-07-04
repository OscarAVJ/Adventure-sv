import { formatCurrency } from "../../utils/formatCurrency";

export function BudgetInput({ value, onChange }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label htmlFor="budgetUsd" className="text-sm font-medium text-slate-700">
          Presupuesto total
        </label>
        <span className="text-sm font-semibold text-brand-700">
          {formatCurrency(value)}
        </span>
      </div>
      <input
        id="budgetUsd"
        min="50"
        max="1000"
        step="10"
        type="range"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="budget-slider"
      />
    </div>
  );
}
