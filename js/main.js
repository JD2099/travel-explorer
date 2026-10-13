import { getCountry, getRandomCountry, getCapitalWeather } from "./api.js";
import { getFavorites, toggleFavorite, getHistory, saveSearch, clearHistory } from "./storage.js";
import { renderDestination, renderFavorites, renderHistory, showLoading, showError, setStatus } from "./ui.js";

const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#country-search");
const surpriseButton = document.querySelector("#surprise-button");
const clearHistoryButton = document.querySelector("#clear-history");
let currentCountry = null;
let latestRequest = 0;

function refreshSavedSections() {
  renderFavorites(getFavorites());
  renderHistory(getHistory());
}

function isFavorite(country) {
  return getFavorites().some((item) => item.cca3 === country.cca3);
}

// Loads a country plus its capital weather. Only the newest request may update the page,
// so a slow earlier search can never overwrite a newer one.
async function loadDestination(fetchCountryData) {
  const requestId = ++latestRequest;
  showLoading();
  try {
    const country = await fetchCountryData();
    if (requestId !== latestRequest) return;
    currentCountry = country;
    searchInput.value = country.name.common;

    let weather = null;
    if (country.capital?.[0]) {
      try {
        weather = await getCapitalWeather(country);
      } catch {
        // Keep the country facts visible even if the weather service is unavailable.
        weather = null;
      }
    }
    if (requestId !== latestRequest) return;

    renderDestination(country, weather, isFavorite(country));
    saveSearch(country);
    refreshSavedSections();
  } catch (error) {
    if (requestId !== latestRequest) return;
    showError(error.message);
  }
}

function searchCountry(name) {
  const searchTerm = name.trim();
  if (!searchTerm) {
    setStatus("Enter a country name first.");
    searchInput.focus();
    return;
  }
  loadDestination(() => getCountry(searchTerm));
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  searchCountry(searchInput.value);
});

surpriseButton.addEventListener("click", () => {
  loadDestination(getRandomCountry);
});

document.querySelector("#result").addEventListener("click", (event) => {
  if (event.target.closest("#toggle-favorite") && currentCountry) {
    toggleFavorite(currentCountry);
    renderFavorites(getFavorites());
    const button = document.querySelector("#toggle-favorite");
    const saved = isFavorite(currentCountry);
    button.setAttribute("aria-pressed", String(saved));
    button.textContent = saved ? "♥ Saved" : "♡ Favorite";
  }
});

function handleSavedItemClick(event) {
  const button = event.target.closest("[data-country]");
  if (button) {
    const name = button.dataset.country;
    searchInput.value = name;
    searchCountry(name);
    document.querySelector("#explore").scrollIntoView({ behavior: "smooth" });
  }
}

document.querySelector("#favorites-list").addEventListener("click", handleSavedItemClick);
document.querySelector("#history-list").addEventListener("click", handleSavedItemClick);

clearHistoryButton.addEventListener("click", () => {
  clearHistory();
  renderHistory([]);
  setStatus("Search history cleared.");
});

refreshSavedSections();
