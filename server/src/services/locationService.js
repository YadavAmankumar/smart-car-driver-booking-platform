const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";

const requestJson = async (url) => {
  const response = await fetch(url, {
    headers: { "User-Agent": "SmartCarDriverBookingPlatform/1.0" },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error("Location service is unavailable");
  return response.json();
};

exports.searchLocations = async (query) => {
  const url = new URL(NOMINATIM_URL);
  url.search = new URLSearchParams({ q: query, format: "jsonv2", addressdetails: "1", limit: "5" }).toString();
  const results = await requestJson(url);
  return results.map((result) => ({
    id: result.place_id,
    label: result.display_name,
    latitude: Number(result.lat),
    longitude: Number(result.lon),
  }));
};

exports.getRoute = async ({ pickup, drop }) => {
  const coordinates = `${pickup.longitude},${pickup.latitude};${drop.longitude},${drop.latitude}`;
  const result = await requestJson(`${OSRM_URL}/${coordinates}?overview=false`);
  const route = result.routes?.[0];
  if (!route) throw new Error("No driving route found for these locations");
  return { distanceKm: Math.round((route.distance / 1000) * 100) / 100, durationMinutes: Math.ceil(route.duration / 60) };
};
