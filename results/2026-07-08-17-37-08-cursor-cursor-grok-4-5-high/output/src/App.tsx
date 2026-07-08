import { useEffect, useState } from "react";
import { loadAppData } from "./data/load";
import type { AppData } from "./data/types";
import { StoreProvider } from "./state/store";
import { Scene } from "./scene/Scene";
import { Hud } from "./ui/Hud";

export default function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState("Starting…");

  useEffect(() => {
    let cancelled = false;
    loadAppData(setProgress)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="boot boot-error">
        <h1>Failed to load data</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="boot">
        <div className="boot-brand">NEO Atlas</div>
        <div className="boot-bar">
          <div className="boot-bar-fill" />
        </div>
        <p>{progress}</p>
      </div>
    );
  }

  return (
    <StoreProvider data={data}>
      <div className="app">
        <Scene />
        <Hud />
      </div>
    </StoreProvider>
  );
}
