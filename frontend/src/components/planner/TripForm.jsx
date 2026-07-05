import { CalendarDays, MapPin, MessageSquareText, Users } from "lucide-react";
import { useState } from "react";
import { zoneOptions } from "../../constants/plannerOptions";
import { BudgetInput } from "./BudgetInput";
import { InterestChips } from "./InterestChips";
import { OccasionSelect } from "./OccasionSelect";

const today = new Date().toISOString().slice(0, 10);

export function TripForm({ onSubmit, isLoading }) {
  const [message, setMessage] = useState("");
  const [interests, setInterests] = useState([]);
  const [budgetUsd, setBudgetUsd] = useState("");
  const [days, setDays] = useState("");
  const [startDate, setStartDate] = useState("");
  const [preferredZone, setPreferredZone] = useState("");
  const [occasion, setOccasion] = useState("");
  const [travelers, setTravelers] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    onSubmit({
      channel: "web",
      message,
      interests,
      budgetUsd: Number(budgetUsd),
      days: Number(days),
      startDate,
      preferredZone: preferredZone || null,
      occasion: occasion || null,
      travelers: Number(travelers),
      conversationId: null,
      phone: null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <div className="space-y-2">
        <label htmlFor="message" className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <MessageSquareText className="h-4 w-4 text-brand-600" />
          Describe tu viaje
        </label>
        <textarea
          id="message"
          rows="4"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
          placeholder="Ej. Quiero playa, comida local, presupuesto $250, voy por aniversario..."
        />
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-slate-700">Intereses</p>
        <InterestChips selected={interests} onChange={setInterests} />
      </div>

      <BudgetInput value={budgetUsd} onChange={setBudgetUsd} />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <CalendarDays className="h-4 w-4 text-brand-600" />
            Fecha de inicio
          </span>
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            min={today}
            required
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Días</span>
          <input
            type="number"
            min="1"
            max="10"
            value={days}
            onChange={(event) => setDays(event.target.value)}
            required
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
          />
        </label>

        <label className="space-y-2">
          <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <MapPin className="h-4 w-4 text-brand-600" />
            Zona preferida
          </span>
          <select
            value={preferredZone}
            onChange={(event) => setPreferredZone(event.target.value)}
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
          >
            {zoneOptions.map((zone) => (
              <option key={zone || "empty"} value={zone}>
                {zone || "Sin preferencia"}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Users className="h-4 w-4 text-brand-600" />
            Viajeros
          </span>
          <input
            type="number"
            min="1"
            max="20"
            value={travelers}
            onChange={(event) => setTravelers(event.target.value)}
            required
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
          />
        </label>
      </div>

      <OccasionSelect value={occasion} onChange={setOccasion} />

      <button
        type="submit"
        disabled={isLoading}
        className="h-12 w-full rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isLoading ? "Generando itinerario..." : "Generar itinerario"}
      </button>
    </form>
  );
}

