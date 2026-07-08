export function Legend() {
  return (
    <div className="panel legend-panel">
      <div className="swatch">
        <i style={{ background: "#ffcc55" }} /> Sun
      </div>
      <div className="swatch">
        <i style={{ background: "#4f8fba" }} /> Planets
      </div>
      <div className="swatch">
        <i style={{ background: "#7ec8ff" }} /> NEOs
      </div>
      <div className="swatch">
        <i style={{ background: "#ffb020" }} /> PHA
      </div>
      <div className="swatch">
        <i style={{ background: "#ff4d4d" }} /> Sentry risk
      </div>
      <div className="swatch">
        <i style={{ background: "#67e8f9" }} /> Comets
      </div>
      <div className="swatch">
        <i style={{ background: "#c084fc" }} /> Hyperbolic
      </div>
    </div>
  );
}
