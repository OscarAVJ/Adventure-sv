import { WalletCards } from "lucide-react";
import { formatCurrency } from "../../utils/formatCurrency";

export function BudgetSummary({ budgetUsd, estimatedCostUsd }) {
  const percentage = Math.min(
    100,
    Math.round(((estimatedCostUsd || 0) / (budgetUsd || 1)) * 100)
  );

  return (
    <section className="rounded-lg border border-brand-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
            <WalletCards className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Presupuesto usado</p>
            <p className="font-semibold text-slate-950">
              {formatCurrency(estimatedCostUsd)} de {formatCurrency(budgetUsd)}
            </p>
          </div>
        </div>
        <span className="text-sm font-semibold text-brand-700">{percentage}%</span>
      </div>

      <div className="mt-4 h-2 rounded-full bg-slate-100">
        <div
          className="h-2 rounded-full bg-brand-600"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </section>
  );
}

