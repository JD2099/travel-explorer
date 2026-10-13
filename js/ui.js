import { describeWeather } from "./api.js";

const result = document.querySelector("#result");
const status = document.querySelector("#status");
const favoritesList = document.querySelector("#favorites-list");
const historyList = document.querySelector("#history-list");
const favoriteCount = document.querySelector("#favorite-count");

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[character]);
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function getCurrency(country) {
  return (country.currencyNames || []).join(", ") || "Not available";
}

function getLanguages(country) {
  return (country.languageNames || []).join(", ") || "Not available";
}

export function setStatus(message) {
  status.textContent = message;
}

export function showLoading() {
  result.innerHTML = '<div class="empty-state"><span aria-hidden="true">🌍</span><h3>Exploring...</h3><p>Fetching destination information and weather.</p></div>';
  setStatus("Loading destination...");
}

export function showError(message) {
  result.innerHTML = `<div class="empty-state"><span aria-hidden="true">🧭</span><h3>We couldn't load that destination</h3><p>${escapeHtml(message)}</p></div>`;
  setStatus("Something needs attention.");
}

function renderWeatherCard(country, weather) {
  const name = country.name?.common || "Unknown country";
  if (!weather) {
    return `<article class="card weather-card">
      <h3>Capital weather</h3>
      <p class="weather-location">${escapeHtml(country.capital?.[0] || "Capital unavailable")}</p>
      <p class="muted">Weather is not available right now. Try searching again in a moment.</p>
    </article>`;
  }
  const [description, symbol] = describeWeather(weather.current.weather_code, weather.current.is_day);
  return `<article class="card weather-card">
      <h3>Capital weather</h3><p class="weather-location">${escapeHtml(weather.place.name)}, ${escapeHtml(weather.place.country || name)}</p>
      <div class="weather-main"><span class="weather-symbol" aria-hidden="true">${symbol}</span><div><div class="temperature">${Math.round(weather.current.temperature_2m)}°C</div><div class="weather-description">${escapeHtml(description)}</div></div></div>
      <div class="weather-stats">
        <div><span>Feels like</span><strong>${Math.round(weather.current.apparent_temperature)}°C</strong></div>
        <div><span>Humidity</span><strong>${weather.current.relative_humidity_2m}%</strong></div>
        <div><span>Wind</span><strong>${weather.current.wind_speed_10m} km/h</strong></div>
        <div><span>Precipitation</span><strong>${weather.current.precipitation} mm</strong></div>
      </div>
    </article>`;
}

// weather can be null when the weather service fails; the country facts still show.
export function renderDestination(country, weather, isFavorite) {
  const name = country.name?.common || "Unknown country";
  const capital = country.capital?.[0] || "Capital unavailable";
  const flag = country.flags?.svg || country.flags?.png || "";
  result.innerHTML = `
    <article class="card country-card">
      <div class="country-top">
        <img class="flag" src="${escapeHtml(flag)}" alt="Flag of ${escapeHtml(name)}">
        <div class="country-title"><h3>${escapeHtml(name)}</h3><p>${escapeHtml(country.region || "Region unavailable")}</p></div>
        <button class="favorite-button" id="toggle-favorite" type="button" aria-pressed="${isFavorite}">${isFavorite ? "♥ Saved" : "♡ Favorite"}</button>
      </div>
      <dl class="facts">
        <div class="fact"><dt>Capital</dt><dd>${escapeHtml(capital)}</dd></div>
        <div class="fact"><dt>Population</dt><dd>${formatNumber(country.population)}</dd></div>
        <div class="fact"><dt>Currency</dt><dd>${escapeHtml(getCurrency(country))}</dd></div>
        <div class="fact"><dt>Languages</dt><dd>${escapeHtml(getLanguages(country))}</dd></div>
      </dl>
    </article>
    ${renderWeatherCard(country, weather)}`;
  setStatus(weather ? `Showing ${name}.` : `Showing ${name} (weather unavailable).`);
}

function renderMiniItems(container, items, emptyMessage, kind) {
  if (!items.length) {
    container.innerHTML = `<p class="muted">${emptyMessage}</p>`;
    return;
  }
  container.innerHTML = items.map((item) => {
    const name = item.name || item.nameCommon || "";
    const flag = item.flag || "";
    const subtitle = kind === "favorite" ? "View destination" : "Search again";
    return `<button class="mini-card" type="button" data-country="${escapeHtml(name)}">
      ${flag ? `<img src="${escapeHtml(flag)}" alt="" loading="lazy">` : ""}
      <span><strong>${escapeHtml(name)}</strong><small>${subtitle}</small></span>
    </button>`;
  }).join("");
}

export function renderFavorites(items) {
  favoriteCount.textContent = String(items.length);
  const normalized = items.map((country) => ({
    name: country.name?.common || "Unknown",
    flag: country.flags?.svg || country.flags?.png || ""
  }));
  renderMiniItems(favoritesList, normalized, "You haven't saved any favorites yet.", "favorite");
}

export function renderHistory(items) {
  if (!items.length) {
    historyList.innerHTML = '<p class="muted">Your recent searches will appear here.</p>';
    return;
  }
  historyList.innerHTML = items.map((item) =>
    `<button class="history-chip" type="button" data-country="${escapeHtml(item.name)}">${escapeHtml(item.flag ? "🌐 " : "")}${escapeHtml(item.name)}</button>`
  ).join("");
}
