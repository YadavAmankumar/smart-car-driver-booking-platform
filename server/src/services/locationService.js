const OLA_AUTOCOMPLETE_URL = "https://api.olamaps.io/places/v1/autocomplete";
const OLA_DIRECTIONS_URL = "https://api.olamaps.io/routing/v1/directions";

const requestJson = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: { "User-Agent": "SmartCarDriverBookingPlatform/1.0" },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error("Location service is unavailable");
  return response.json();
};

exports.searchLocations = async (query) => {
  if (!process.env.OLA_MAPS_API_KEY) throw new Error("Location service is not configured");
  const url = new URL(OLA_AUTOCOMPLETE_URL);
  url.search = new URLSearchParams({ input: query, api_key: process.env.OLA_MAPS_API_KEY }).toString();
  const result = await requestJson(url);
  const predictions = Array.isArray(result.predictions) ? result.predictions : [];
  return predictions
    .map((prediction) => ({
      id: prediction.place_id,
      label: prediction.description,
      latitude: Number(prediction.geometry?.location?.lat),
      longitude: Number(prediction.geometry?.location?.lng),
    }))
    .filter((location) => location.id && location.label && Number.isFinite(location.latitude) && Number.isFinite(location.longitude));
};

exports.getRoute = async ({ pickup, drop }) => {
  if (!process.env.OLA_MAPS_API_KEY) {
    throw new Error("Location service is not configured");
  }

  const url = new URL(OLA_DIRECTIONS_URL);

  url.search = new URLSearchParams({
    origin: `${pickup.latitude},${pickup.longitude}`,
    destination: `${drop.latitude},${drop.longitude}`,
    api_key: process.env.OLA_MAPS_API_KEY,
  }).toString();

  const result = await requestJson(url.toString(), { method: "POST" });
  const route = result.routes?.[0];
  const leg = route?.legs?.[0];

  if (!leg) {
    throw new Error("No driving route found for these locations");
  }

  return {
    distanceKm: Math.round((leg.distance / 1000) * 100) / 100,
    durationMinutes: Math.ceil(leg.duration / 60),
  };
};
