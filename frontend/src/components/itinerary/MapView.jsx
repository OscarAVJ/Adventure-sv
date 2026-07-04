import { MapPinned } from "lucide-react";
import { divIcon } from "leaflet";
import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import { formatCurrency } from "../../utils/formatCurrency";

const routeColors = [
  "#f57c00",
  "#2563eb",
  "#16a34a",
  "#9333ea",
  "#dc2626",
  "#0891b2",
];

export function MapView({ days = [] }) {
  const routeDays = days
    .map((day, dayIndex) => ({
      ...day,
      color: routeColors[dayIndex % routeColors.length],
      activities: day.activities
        .filter((activity) => activity.coordinates)
        .map((activity, activityIndex) => ({
          ...activity,
          day: day.day,
          routeOrder: activityIndex + 1,
        })),
    }))
    .filter((day) => day.activities.length > 0);

  const activities = routeDays.flatMap((day) =>
    day.activities.map((activity) => ({
      ...activity,
      routeColor: day.color,
    }))
  );

  const positions = activities.map((activity) => [
    activity.coordinates.lat,
    activity.coordinates.lng,
  ]);
  const center = positions[0] || [13.7942, -88.8965];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <MapPinned className="h-5 w-5 text-brand-600" />
        <h2 className="font-semibold text-slate-950">Mapa del recorrido</h2>
      </div>

      <div className="mt-4 h-80 overflow-hidden rounded-lg border border-slate-200">
        <MapContainer
          center={center}
          zoom={activities.length > 1 ? 9 : 13}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {routeDays.map((day) => {
            const routePositions = day.activities.map((activity) => [
              activity.coordinates.lat,
              activity.coordinates.lng,
            ]);

            if (routePositions.length < 2) return null;

            return (
              <Polyline
                key={`route-day-${day.day}`}
                positions={routePositions}
                pathOptions={{ color: day.color, weight: 4, opacity: 0.85 }}
              />
            );
          })}

          {activities.map((activity) => (
            <Marker
              key={`${activity.day}-${activity.time}-${activity.name}`}
              position={[activity.coordinates.lat, activity.coordinates.lng]}
              icon={createActivityIcon({
                label: `${activity.day}.${activity.routeOrder}`,
                featured: activity.featured,
                color: activity.routeColor,
              })}
            >
              <Popup>
                <div className="min-w-44">
                  <p className="text-xs font-semibold text-brand-700">
                    Dia {activity.day} - {activity.time}
                  </p>
                  <p className="mt-1 font-semibold text-slate-950">
                    {activity.name}
                  </p>
                  <p className="text-sm capitalize text-slate-600">
                    {activity.type} - {formatCurrency(activity.costUsd)}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
        {routeDays.map((day) => (
          <div key={`legend-day-${day.day}`} className="rounded-lg bg-slate-50 p-3">
            <div className="mb-2 flex items-center gap-2 font-semibold text-slate-900">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: day.color }}
              />
              Dia {day.day} - {day.zone}
            </div>
            <div className="space-y-1">
              {day.activities.map((activity) => (
                <div
                  key={`legend-${activity.day}-${activity.time}-${activity.name}`}
                  className="flex items-center gap-2"
                >
                  <span
                    className="flex h-6 min-w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ backgroundColor: day.color }}
                  >
                    {activity.day}.{activity.routeOrder}
                  </span>
                  <span className="truncate">{activity.name}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function createActivityIcon({ label, featured, color }) {
  return divIcon({
    className: "",
    html: `
      <div
        class="map-marker ${featured ? "map-marker-featured" : ""}"
        style="background:${color}; ${featured ? `box-shadow: 0 8px 18px rgba(15, 23, 42, 0.25), 0 0 0 5px ${color}33;` : ""}"
      >
        ${label}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}

