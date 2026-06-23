import type { Asteroid, CloseApproach, Comet, LoadedData, Planet, SentryRisk } from "./types";

const DATA_ROOT = "./data";

export async function loadData(): Promise<LoadedData> {
  const [planets, asteroids, comets, approaches, sentry] = await Promise.all([
    fetchJson<Planet[]>("planets.json"),
    fetchJson<Asteroid[]>("asteroids.json"),
    fetchJson<Comet[]>("comets.json"),
    fetchJson<CloseApproach[]>("close-approaches.json"),
    fetchJson<SentryRisk[]>("sentry.json"),
  ]);

  const sentryByDes = new Map<string, SentryRisk>();
  for (const risk of sentry) {
    sentryByDes.set(risk.des, risk);
  }

  const approachesByDes = new Map<string, CloseApproach[]>();
  for (const approach of approaches) {
    const list = approachesByDes.get(approach.des);
    if (list) {
      list.push(approach);
    } else {
      approachesByDes.set(approach.des, [approach]);
    }
  }

  for (const list of approachesByDes.values()) {
    list.sort((a, b) => a.jd - b.jd);
  }

  return { planets, asteroids, comets, sentryByDes, approachesByDes };
}

async function fetchJson<T>(file: string): Promise<T> {
  const response = await fetch(`${DATA_ROOT}/${file}`);
  if (!response.ok) {
    throw new Error(`Failed to load ${file}: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}
