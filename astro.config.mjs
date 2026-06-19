import { defineConfig } from "astro/config";

// For a GitHub Pages *project* site the app is served from a sub-path
// (e.g. https://<user>.github.io/nasa-harness-bench/). Set BASE_PATH in CI to
// that sub-path so every fetch()/iframe URL (built from import.meta.env.BASE_URL)
// resolves correctly. Defaults to "/" for local dev and user/root pages.
const base = process.env.BASE_PATH ?? "/";
const site = process.env.SITE_URL ?? "http://localhost:4321";

// https://astro.build
export default defineConfig({
  site,
  base,
  // Plain static HTML output — no SSR. The site is a shell that fetches
  // results/all.json at runtime and iframes each bench's compiled dist/.
  output: "static",
  trailingSlash: "ignore",
});
