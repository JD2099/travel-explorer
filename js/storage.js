const FAVORITES_KEY = "travel-explorer-favorites";
const HISTORY_KEY = "travel-explorer-history";

function readList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function writeList(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    
  }
}

export function getFavorites() {
  return readList(FAVORITES_KEY);
}

export function toggleFavorite(country) {
  const favorites = getFavorites();
  const code = country.cca3;
  const exists = favorites.some((item) => item.cca3 === code);
  const updated = exists ? favorites.filter((item) => item.cca3 !== code) : [country, ...favorites];
  writeList(FAVORITES_KEY, updated);
  return updated;
}

export function getHistory() {
  return readList(HISTORY_KEY);
}

export function saveSearch(country) {
  const history = getHistory().filter((item) => item.cca3 !== country.cca3);
  history.unshift({
    cca3: country.cca3,
    name: country.name.common,
    flag: country.flags?.svg || country.flags?.png || ""
  });
  writeList(HISTORY_KEY, history.slice(0, 8));
  return history.slice(0, 8);
}

export function clearHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    
  }
}
