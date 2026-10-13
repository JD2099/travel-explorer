import { RESTCOUNTRIES_API_KEY } from "./config.js";

const COUNTRIES_API = "https://api.restcountries.com/countries/v5";
const GEOCODING_API = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_API = "https://api.open-meteo.com/v1/forecast";
const RESPONSE_FIELDS = "names.common,names.official,capitals,region,population,currencies,languages,codes.alpha_2,codes.alpha_3,flag.url_svg,flag.url_png";
const ESTIMATED_COUNTRY_COUNT = 240;

function networkError() {
  return new Error("Could not connect. Check your internet connection. If you are online, make sure this page's hostname is listed in your API key's allowed origins.");
}

async function request(url, headers) {
  try {
    return await fetch(url, headers ? { headers } : undefined);
  } catch {
    throw networkError();
  }
}

async function fetchJson(url) {
  const response = await request(url);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}). Please try again.`);
  }
  return response.json();
}

// Calls the REST Countries v5 API and returns the list of country objects.
// A 404 means "no matches", so it returns an empty list instead of throwing.
async function fetchCountries(path) {
  if (!RESTCOUNTRIES_API_KEY || RESTCOUNTRIES_API_KEY.startsWith("PASTE_")) {
    throw new Error("Missing API key. Add your REST Countries key in js/config.js.");
  }
  const response = await request(`${COUNTRIES_API}${path}`, { Authorization: `Bearer ${RESTCOUNTRIES_API_KEY}` });
  if (response.status === 404) return [];
  if (response.status === 401) throw new Error("The REST Countries API key is missing or invalid. Check js/config.js.");
  if (response.status === 403) throw new Error("The REST Countries API key is not allowed to make more requests right now.");
  if (response.status === 429) throw new Error("Too many requests. Wait a few seconds and try again.");
  if (!response.ok) throw new Error(`Request failed (${response.status}). Please try again.`);
  const body = await response.json();
  return (body.data?.objects || []).map(normalizeCountry);
}

function toNames(value, preferredKeys) {
  const items = Array.isArray(value) ? value : Object.entries(value || {}).map(([key, item]) =>
    (item && typeof item === "object" ? { code: key, ...item } : { name: item, code: key })
  );
  return items.map((item) => {
    if (typeof item === "string") return item;
    for (const key of preferredKeys) {
      if (item?.[key]) return item[key];
    }
    return item?.code || "";
  }).filter(Boolean);
}

function readCoordinates(coordinates) {
  if (!coordinates || Array.isArray(coordinates)) return null;
  const latitude = coordinates.lat ?? coordinates.latitude;
  const longitude = coordinates.lng ?? coordinates.lon ?? coordinates.longitude;
  return Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude))
    ? { latitude: Number(latitude), longitude: Number(longitude) }
    : null;
}

// Converts the v5 response shape into the simple shape the rest of the app uses.
function normalizeCountry(raw) {
  const capitals = Array.isArray(raw.capitals) ? raw.capitals : [];
  const mainCapital = capitals.find((item) => item?.attributes?.primary) || capitals[0];
  const alpha2 = raw.codes?.alpha_2 || "";
  const fallbackFlag = alpha2 ? `https://flags.restcountries.com/v5/w320/${alpha2.toLowerCase()}.png` : "";
  return {
    cca2: alpha2,
    cca3: raw.codes?.alpha_3 || alpha2,
    name: { common: raw.names?.common || "", official: raw.names?.official || "" },
    capital: mainCapital?.name ? [mainCapital.name] : [],
    capitalCoordinates: readCoordinates(mainCapital?.coordinates),
    region: raw.region || "",
    population: raw.population || 0,
    currencyNames: toNames(raw.currencies, ["name", "code"]),
    languageNames: toNames(raw.languages, ["name", "english_name", "english", "native_name"]),
    flags: { svg: raw.flag?.url_svg || "", png: raw.flag?.url_png || fallbackFlag }
  };
}

function pickBestMatch(countries, searchTerm) {
  const term = searchTerm.toLowerCase();
  const exact = countries.find((country) =>
    country.name.common.toLowerCase() === term || country.name.official.toLowerCase() === term
  );
  if (exact) return exact;
  // For partial matches (e.g. "united"), prefer the most populous country.
  return [...countries].sort((a, b) => b.population - a.population)[0];
}

export async function getCountry(searchTerm) {
  const query = encodeURIComponent(searchTerm.trim());
  // Try an exact name first so "Niger" does not return "Nigeria".
  let data = await fetchCountries(`/names.common/${query}?response_fields=${RESPONSE_FIELDS}`);
  if (data.length === 0) {
    data = await fetchCountries(`/name?q=${query}&limit=25&response_fields=${RESPONSE_FIELDS}`);
  }
  if (data.length === 0) {
    throw new Error("No country was found. Check the spelling and try again.");
  }
  return pickBestMatch(data, searchTerm.trim());
}

export async function getRandomCountry() {
  // Ask for one country at a random position instead of downloading the whole list.
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const offset = Math.floor(Math.random() * ESTIMATED_COUNTRY_COUNT);
    const [country] = await fetchCountries(`?limit=1&offset=${offset}&response_fields=${RESPONSE_FIELDS}`);
    if (country && country.capital.length > 0) return country;
  }
  throw new Error("No destinations are available right now. Please try again.");
}

async function getCapitalPlace(country) {
  const capital = country.capital[0];
  // REST Countries usually provides capital coordinates already.
  if (country.capitalCoordinates) {
    return { name: capital, country: country.name.common, ...country.capitalCoordinates };
  }
  const params = new URLSearchParams({ name: capital, count: "1", language: "en", format: "json" });
  if (country.cca2) params.set("countryCode", country.cca2);
  const locations = await fetchJson(`${GEOCODING_API}?${params.toString()}`);
  if (!locations.results || locations.results.length === 0) {
    throw new Error("Weather is unavailable for this capital city.");
  }
  return locations.results[0];
}

export async function getCapitalWeather(country) {
  const place = await getCapitalPlace(country);
  const params = new URLSearchParams({
    latitude: place.latitude,
    longitude: place.longitude,
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m",
    timezone: "auto"
  });
  const weatherData = await fetchJson(`${WEATHER_API}?${params.toString()}`);
  return { place, current: weatherData.current, units: weatherData.current_units };
}

export function describeWeather(code, isDay) {
  const descriptions = {
    0: ["Clear sky", isDay ? "☀️" : "🌙"],
    1: ["Mainly clear", "🌤️"],
    2: ["Partly cloudy", "⛅"],
    3: ["Overcast", "☁️"],
    45: ["Fog", "🌫️"],
    48: ["Depositing rime fog", "🌫️"],
    51: ["Light drizzle", "🌦️"],
    53: ["Moderate drizzle", "🌦️"],
    55: ["Dense drizzle", "🌧️"],
    61: ["Slight rain", "🌧️"],
    63: ["Moderate rain", "🌧️"],
    65: ["Heavy rain", "🌧️"],
    71: ["Slight snow", "🌨️"],
    73: ["Moderate snow", "🌨️"],
    75: ["Heavy snow", "❄️"],
    80: ["Rain showers", "🌦️"],
    81: ["Moderate showers", "🌧️"],
    82: ["Violent showers", "⛈️"],
    95: ["Thunderstorm", "⛈️"],
    96: ["Thunderstorm with hail", "⛈️"],
    99: ["Thunderstorm with heavy hail", "⛈️"]
  };
  return descriptions[code] || ["Weather conditions unavailable", "🌍"];
}
