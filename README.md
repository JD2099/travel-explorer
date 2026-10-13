# Travel Explorer

A simple public-facing travel discovery web app built with HTML, CSS, and vanilla JavaScript ES modules.

## Features
- Search for a country and view facts from REST Countries.
- View current weather for the capital city using Open-Meteo.
- Save favorite destinations and recent searches with `localStorage`.
- Discover a random country.
- Responsive layout, CSS animations, loading/error messages, accessibility basics, and SEO metadata.

## APIs
1. REST Countries: `https://restcountries.com/`
2. Open-Meteo Geocoding and Weather: `https://open-meteo.com/`

No OpenWeatherMap API is used. Open-Meteo needs no key; REST Countries (v5) does.

## Set up your REST Countries API key (required)
The old REST Countries API (v1-v4) was shut down. This app uses v5, which needs a free key.
1. Create a free account: https://restcountries.com/sign-up
2. Copy your key from https://restcountries.com/api-keys
3. On that same page, add these hostnames to the key's allowed origins (hostname only, no `http://` or port): `localhost`, `127.0.0.1`, and your GitHub Pages host `YOUR-USERNAME.github.io`
4. Paste the key into `js/config.js`
The key is visible in a browser app, so keep the allowed origins restricted to your own hostnames. Free plan: 1,000 requests per month.

## Run locally
ES modules should be served over HTTP rather than opened directly as a `file://` URL. From this folder, run one of these:
- Opening `index.html` by double-click will NOT work (the app shows a warning explaining this).
- VS Code: install/use Live Server, then open `index.html` with Live Server.
- Python: `python -m http.server 8000`, then visit `http://localhost:8000`.

## Publish publicly with GitHub Pages
1. Create a public GitHub repository named `travel-explorer` (or another name).
2. Upload all project files and folders, keeping the structure intact.
3. Open repository **Settings → Pages**.
4. Under build and deployment, choose **Deploy from a branch**.
5. Choose branch `main` and folder `/ (root)`, then Save.
6. Wait for the published URL to appear in the Pages section. It will usually look like `https://YOUR-USERNAME.github.io/travel-explorer/`.
7. Open that URL in a private/incognito window to confirm that evaluators can access it.

## Final checks
- Test a few countries (Peru, Japan, Canada).
- Test the Surprise Me button, favorites, history, and clear history.
- Test a mobile-sized screen.
- Check browser DevTools Console and Network tabs for errors.
- The app requires internet access for its API requests and Google Fonts.
