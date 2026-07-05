import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useI18n } from "../../i18n/useI18n";

export function LoadingSteps() {
  const { t } = useI18n();
  const steps = t.loading;
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentStep((step) => (step + 1) % steps.length);
    }, 1300);

    return () => window.clearInterval(intervalId);
  }, [steps.length]);

  return (
    <div className="rounded-lg border border-brand-100 bg-white p-5 shadow-soft">
      <div className="flex items-center gap-3">
        <LoaderCircle className="h-5 w-5 animate-spin text-brand-600" />
        <p className="font-medium text-slate-900">{steps[currentStep]}</p>
      </div>
      <div className="mt-4 grid grid-cols-5 gap-2">
        {steps.map((step, index) => (
          <div
            key={step}
            className={`h-1 rounded-full ${
              index <= currentStep ? "bg-brand-600" : "bg-slate-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

