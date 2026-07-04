import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";

const steps = [
  "Entendiendo tus intereses...",
  "Buscando lugares reales en Google Maps...",
  "Revisando temporada y ocasion del viaje...",
  "Aplicando prioridades relevantes...",
  "Ajustando actividades a tu presupuesto...",
];

export function LoadingSteps() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentStep((step) => (step + 1) % steps.length);
    }, 1300);

    return () => window.clearInterval(intervalId);
  }, []);

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

