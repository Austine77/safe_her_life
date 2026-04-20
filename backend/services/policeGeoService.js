
const USER_AGENT = process.env.USER_AGENT || "SafeHerLifePoliceContact/1.0";
const geoCache = new Map();
const stationCache = new Map();

function setCache(map, key, value, ttlMs = 10 * 60 * 1000) {
  map.set(key, { value, expiresAt: Date.now() + ttlMs });
}

function getCache(map, key) {
  const hit = map.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    map.delete(key);
    return null;
  }
  return hit.value;
}

export async function geocodeNigeriaLocation(location) {
  const clean = String(location || "").trim();
  if (!clean) throw new Error("Location is required.");
  const cacheKey = clean.toLowerCase();
  const cached = getCache(geoCache, cacheKey);
  if (cached) return cached;

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", `${clean}, Nigeria`);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("countrycodes", "ng");

  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) throw new Error("Unable to search that location right now.");
  const results = await response.json();
  if (!Array.isArray(results) || !results.length) throw new Error("Location not found in Nigeria.");

  const first = {
    lat: Number(results[0].lat),
    lon: Number(results[0].lon),
    displayName: results[0].display_name,
    address: results[0].address || {},
  };
  setCache(geoCache, cacheKey, first);
  return first;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export async function findNearbyPoliceStations(lat, lon, radiusMeters = 30000) {
  const cacheKey = `${lat}:${lon}:${radiusMeters}`;
  const cached = getCache(stationCache, cacheKey);
  if (cached) return cached;

  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="police"](around:${radiusMeters},${lat},${lon});
      way["amenity"="police"](around:${radiusMeters},${lat},${lon});
      relation["amenity"="police"](around:${radiusMeters},${lat},${lon});
    );
    out center tags;
  `;

  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
      "User-Agent": USER_AGENT,
    },
    body: query,
  });

  if (!response.ok) throw new Error("Unable to search nearby police stations right now.");
  const data = await response.json();
  const elements = Array.isArray(data.elements) ? data.elements : [];

  const stations = elements
    .map((item, index) => {
      const itemLat = item.lat ?? item.center?.lat;
      const itemLon = item.lon ?? item.center?.lon;
      if (!itemLat || !itemLon) return null;
      const tags = item.tags || {};
      return {
        id: `${item.type}-${item.id}-${index}`,
        name: tags.name || "Police Station",
        phone: tags.phone || tags["contact:phone"] || "",
        email: tags.email || tags["contact:email"] || "",
        website: tags.website || tags["contact:website"] || "",
        address: [tags["addr:housenumber"], tags["addr:street"], tags["addr:suburb"], tags["addr:city"], tags["addr:state"]].filter(Boolean).join(", "),
        lat: Number(itemLat),
        lon: Number(itemLon),
      };
    })
    .filter(Boolean)
    .map((item) => ({
      ...item,
      distanceKm: Number(haversineKm(lat, lon, item.lat, item.lon).toFixed(2)),
      mapUrl: `https://www.openstreetmap.org/?mlat=${item.lat}&mlon=${item.lon}#map=18/${item.lat}/${item.lon}`,
      googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lon}`,
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 20);

  setCache(stationCache, cacheKey, stations);
  return stations;
}
