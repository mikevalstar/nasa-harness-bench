import React from 'react';
import { X, ShieldAlert, Sparkles, TrendingUp, Compass, Calendar, Globe, AlertTriangle } from 'lucide-react';

interface DetailsPanelProps {
  selectedObject: any | null; // e.g. { type: 'planet' | 'asteroid' | 'comet', data: any }
  onClose: () => void;
  sentryData: Record<string, any>;
  closeApproachesData: Record<string, any[][]>; // Grouped close approaches
}

const CLASS_DESCRIPTIONS: Record<string, string> = {
  AMO: 'Amor asteroid: Orbits approach Earth closely but do not cross Earth\'s orbit.',
  APO: 'Apollo asteroid: Earth-crossing orbits with semi-major axis greater than Earth\'s.',
  ATE: 'Aten asteroid: Earth-crossing orbits with semi-major axis smaller than Earth\'s.',
  IEO: 'Atira (IEO) asteroid: Orbits contained entirely within Earth\'s orbit.',
  HTC: 'Halley-type Comet: Highly eccentric orbit with period between 20 and 200 years.',
  JFC: 'Jupiter-family Comet: Short-period comet controlled gravitationally by Jupiter.',
  ETC: 'Encke-type Comet: Short-period comet with aphelion inside Jupiter\'s orbit.',
};

export const DetailsPanel: React.FC<DetailsPanelProps> = ({
  selectedObject,
  onClose,
  sentryData,
  closeApproachesData,
}) => {
  if (!selectedObject) return null;

  const { type, data } = selectedObject;

  // Render Planets
  if (type === 'planet') {
    return (
      <div className="absolute right-6 top-6 bottom-24 w-96 hud-panel rounded-2xl p-6 text-slate-100 z-10 shadow-2xl overflow-y-auto flex flex-col select-none border-l-4 border-l-cyan-500">
        <div className="flex justify-between items-start border-b border-slate-900 pb-4 mb-4">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400">Solar Planet</span>
            <h2 className="text-2xl font-bold uppercase tracking-wide">{data.name}</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white transition">
            <X size={18} />
          </button>
        </div>

        {/* Physical Details */}
        <div className="flex flex-col gap-4 flex-1">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Globe size={12} /> Physical Properties
            </h3>
            <div className="grid grid-cols-2 gap-3 bg-slate-900/30 border border-slate-900 rounded-xl p-3 text-xs font-mono">
              <div>
                <span className="text-slate-500 block">Radius (Mean)</span>
                <span className="text-white font-semibold">{(data.radius_km).toLocaleString()} km</span>
              </div>
              <div>
                <span className="text-slate-500 block">Diameter</span>
                <span className="text-white font-semibold">{(data.radius_km * 2).toLocaleString()} km</span>
              </div>
            </div>
          </div>

          {/* Orbital elements */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Compass size={12} /> Orbital Parameters
            </h3>
            <div className="bg-slate-900/30 border border-slate-900 rounded-xl p-3 flex flex-col gap-2.5 text-xs font-mono">
              <div className="flex justify-between border-b border-slate-900/50 pb-1.5">
                <span className="text-slate-500">Semi-major Axis (a)</span>
                <span className="text-white font-semibold">{data.a.toFixed(5)} au</span>
              </div>
              <div className="flex justify-between border-b border-slate-900/50 pb-1.5">
                <span className="text-slate-500">Eccentricity (e)</span>
                <span className="text-white font-semibold">{data.e.toFixed(5)}</span>
              </div>
              <div className="flex justify-between border-b border-slate-900/50 pb-1.5">
                <span className="text-slate-500">Inclination (i)</span>
                <span className="text-white font-semibold">{data.i.toFixed(5)}°</span>
              </div>
              <div className="flex justify-between border-b border-slate-900/50 pb-1.5">
                <span className="text-slate-500">Ascending Node (Ω)</span>
                <span className="text-white font-semibold">{data.om.toFixed(5)}°</span>
              </div>
              <div className="flex justify-between border-b border-slate-900/50 pb-1.5">
                <span className="text-slate-500">Arg. of Perihelion (ω)</span>
                <span className="text-white font-semibold">{data.w.toFixed(5)}°</span>
              </div>
              <div className="flex justify-between border-b border-slate-900/50 pb-1.5">
                <span className="text-slate-500">Mean Anomaly (M₀)</span>
                <span className="text-white font-semibold">{data.ma.toFixed(5)}°</span>
              </div>
              <div className="flex justify-between border-b border-slate-900/50 pb-1.5">
                <span className="text-slate-500">Orbital Period</span>
                <span className="text-white font-semibold">{(data.per / 365.25).toFixed(2)} years <span className="text-[10px] text-slate-500">({data.per.toFixed(0)}d)</span></span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mean Motion (n)</span>
                <span className="text-white font-semibold">{data.n.toFixed(6)} deg/day</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Asteroid & Comet Details Setup
  const isAsteroid = type === 'asteroid';
  const pdes = isAsteroid ? data[0] : data[0];
  const name = isAsteroid ? (data[1] ? `${data[1]} (${pdes})` : data[2] || pdes) : (data[1] || pdes);
  const astClass = isAsteroid ? data[14] : data[12];
  
  const orbitalElements = isAsteroid
    ? {
        a: data[4],
        e: data[5],
        i: data[6],
        om: data[7],
        w: data[8],
        ma: data[9],
        epoch: data[3],
        per: data[10],
        n: data[11],
        tp: data[12],
        q: data[4] ? data[4] * (1 - data[5]) : null,
      }
    : {
        a: data[3],
        e: data[4],
        i: data[5],
        om: data[6],
        w: data[7],
        ma: data[8],
        epoch: data[2],
        per: data[9],
        n: data[10],
        tp: data[11],
        q: data[3] ? data[3] * (1 - data[4]) : null,
      };

  const isPHA = isAsteroid && data[13] === 1;
  const diameter = isAsteroid ? data[15] : data[13];
  const moid = isAsteroid ? data[16] : null;
  const H_mag = isAsteroid ? data[17] : data[14]; // M1 for comets, H for asteroids

  // Join data
  const sentryRecord = sentryData[pdes];
  const closeApproaches = closeApproachesData[pdes] || [];

  return (
    <div className={`absolute right-6 top-6 bottom-24 w-96 hud-panel rounded-2xl p-6 text-slate-100 z-10 shadow-2xl overflow-y-auto flex flex-col select-none border-l-4 ${isPHA ? 'border-l-red-500' : sentryRecord ? 'border-l-amber-500' : 'border-l-cyan-500'}`}>
      {/* Header */}
      <div className="flex justify-between items-start border-b border-slate-900 pb-4 mb-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            {isAsteroid ? 'Near-Earth Object' : 'Heliocentric Comet'}
          </span>
          <h2 className="text-xl font-bold truncate max-w-[280px]" title={name}>{name}</h2>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-400">
              {astClass}
            </span>
            {isPHA && (
              <span className="text-[9px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-0.5">
                <ShieldAlert size={10} /> PHA Risk
              </span>
            )}
            {sentryRecord && (
              <span className="text-[9px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                ☄ Sentry Risk
              </span>
            )}
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white transition">
          <X size={18} />
        </button>
      </div>

      <div className="flex flex-col gap-4 flex-1">
        {/* Class Description */}
        {CLASS_DESCRIPTIONS[astClass] && (
          <p className="text-[11px] text-slate-400 bg-slate-900/20 border border-slate-900/50 p-2.5 rounded-lg flex items-start gap-1.5 leading-relaxed">
            <Info size={12} className="text-cyan-400 shrink-0 mt-0.5" />
            {CLASS_DESCRIPTIONS[astClass]}
          </p>
        )}

        {/* CNEOS Sentry Overlay */}
        {sentryRecord && (
          <div className="border border-amber-500/20 bg-amber-500/5 rounded-xl p-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
              <AlertTriangle size={13} /> CNEOS Sentry Impact Threat
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div>
                <span className="text-slate-500 block">Impact Probability</span>
                <span className="text-amber-400 font-bold">{(sentryRecord.ip * 100).toFixed(6)}%</span>
              </div>
              <div>
                <span className="text-slate-500 block">Torino Scale Max</span>
                <span className="text-white font-bold">{sentryRecord.ts_max}</span>
              </div>
              <div className="col-span-2 border-t border-slate-800/50 pt-2 flex justify-between items-center">
                <div>
                  <span className="text-slate-500 block">Palermo Scale (Max/Cum)</span>
                  <span className="text-white font-semibold">{sentryRecord.ps_max} / {sentryRecord.ps_cum}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Impact Window</span>
                  <span className="text-white font-semibold">{sentryRecord.range}</span>
                </div>
              </div>
              <div className="col-span-2 border-t border-slate-800/50 pt-2">
                <span className="text-[10px] text-slate-400">Potential Impacts: <strong className="text-white font-semibold">{sentryRecord.n_imp}</strong> within timeframe. Encounter velocity: <strong className="text-white font-semibold">{sentryRecord.v_inf.toFixed(1)} km/s</strong>.</span>
              </div>
            </div>
          </div>
        )}

        {/* Physical Properties */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <Globe size={12} /> Physical & Observation Profile
          </h3>
          <div className="grid grid-cols-2 gap-3 bg-slate-900/30 border border-slate-900 rounded-xl p-3 text-xs font-mono">
            <div>
              <span className="text-slate-500 block">Est. Diameter</span>
              <span className="text-white font-semibold">
                {diameter ? `${diameter.toFixed(2)} km` : 'Unknown'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">{isAsteroid ? 'Absolute Mag (H)' : 'Total Mag (M1)'}</span>
              <span className="text-white font-semibold">{H_mag ? `${H_mag.toFixed(1)}` : 'Unknown'}</span>
            </div>
            {isAsteroid && (
              <>
                <div className="col-span-2 border-t border-slate-800/50 pt-2 flex justify-between">
                  <div>
                    <span className="text-slate-500">Earth MOID</span>
                    <p className="text-white font-semibold">{moid ? `${moid.toFixed(4)} au` : 'Unknown'}</p>
                  </div>
                  {data[18] && ( // albedo
                    <div className="text-right">
                      <span className="text-slate-500">Albedo</span>
                      <p className="text-white font-semibold">{(data[18]).toFixed(3)}</p>
                    </div>
                  )}
                  {data[19] && ( // rot_per
                    <div className="text-right">
                      <span className="text-slate-500">Rotation Per.</span>
                      <p className="text-white font-semibold">{(data[19]).toFixed(1)}h</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Close Approaches Timeline */}
        {isAsteroid && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Calendar size={12} /> Earth Close Approaches
            </h3>
            {closeApproaches.length > 0 ? (
              <div className="bg-slate-900/30 border border-slate-900 rounded-xl max-h-48 overflow-y-auto divide-y divide-slate-900/50">
                {closeApproaches.map((ap, idx) => {
                  const apDate = ap[1]; //cd
                  const apDistAu = ap[2]; //dist
                  const apDistLD = apDistAu * 388.6; // convert to lunar distances
                  const apVel = ap[3]; // v_rel (km/s)
                  const isFuture = ap[0] > 2461041.5; // JD corresponding to mid-2026

                  return (
                    <div key={idx} className="p-2.5 flex justify-between items-center text-[11px] font-mono hover:bg-slate-900/20 transition">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-white font-medium flex items-center gap-1">
                          {apDate.split(' ')[0]} 
                          {isFuture && (
                            <span className="text-[9px] font-bold text-emerald-400 uppercase bg-emerald-500/10 border border-emerald-500/20 px-1 rounded-sm">
                              Upcoming
                            </span>
                          )}
                        </span>
                        <span className="text-slate-500 text-[10px]">Rel. Velocity: {apVel.toFixed(1)} km/s</span>
                      </div>
                      <div className="text-right flex flex-col">
                        <span className={`font-bold ${apDistAu < 0.05 ? 'text-red-400' : 'text-cyan-400'}`}>
                          {apDistAu.toFixed(4)} au
                        </span>
                        <span className="text-[10px] text-slate-500">{apDistLD.toFixed(1)} Lunar Dist</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-slate-900/20 border border-slate-900 rounded-xl p-3 text-center text-xs text-slate-500">
                No recorded Earth close approach events.
              </div>
            )}
          </div>
        )}

        {/* Orbital Elements Summary */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <Compass size={12} /> Keplerian Elements
          </h3>
          <div className="bg-slate-900/30 border border-slate-900 rounded-xl p-3 flex flex-col gap-2.5 text-[11px] font-mono">
            <div className="flex justify-between border-b border-slate-900/50 pb-1.5">
              <span className="text-slate-500">Semi-major Axis (a)</span>
              <span className="text-white font-semibold">
                {orbitalElements.a ? `${orbitalElements.a.toFixed(4)} au` : 'N/A (Parabolic)'}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-900/50 pb-1.5">
              <span className="text-slate-500">Eccentricity (e)</span>
              <span className="text-white font-semibold">{orbitalElements.e.toFixed(5)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-900/50 pb-1.5">
              <span className="text-slate-500">Inclination (i)</span>
              <span className="text-white font-semibold">{orbitalElements.i.toFixed(4)}°</span>
            </div>
            <div className="flex justify-between border-b border-slate-900/50 pb-1.5">
              <span className="text-slate-500">Ascending Node (Ω)</span>
              <span className="text-white font-semibold">{orbitalElements.om.toFixed(4)}°</span>
            </div>
            <div className="flex justify-between border-b border-slate-900/50 pb-1.5">
              <span className="text-slate-500">Arg. of Perihelion (ω)</span>
              <span className="text-white font-semibold">{orbitalElements.w.toFixed(4)}°</span>
            </div>
            {orbitalElements.ma !== null && (
              <div className="flex justify-between border-b border-slate-900/50 pb-1.5">
                <span className="text-slate-500">Mean Anomaly (M)</span>
                <span className="text-white font-semibold">{orbitalElements.ma.toFixed(4)}°</span>
              </div>
            )}
            <div className="flex justify-between border-b border-slate-900/50 pb-1.5">
              <span className="text-slate-500">Perihelion Dist (q)</span>
              <span className="text-white font-semibold">{orbitalElements.q ? `${orbitalElements.q.toFixed(4)} au` : 'N/A'}</span>
            </div>
            {orbitalElements.per !== null && (
              <div className="flex justify-between border-b border-slate-900/50 pb-1.5">
                <span className="text-slate-500">Period (P)</span>
                <span className="text-white font-semibold">{(orbitalElements.per / 365.25).toFixed(2)} yrs <span className="text-[10px] text-slate-500">({orbitalElements.per.toFixed(0)}d)</span></span>
              </div>
            )}
            {orbitalElements.tp !== null && (
              <div className="flex justify-between">
                <span className="text-slate-500">Perihelion Passage (tp)</span>
                <span className="text-white font-semibold">JD {orbitalElements.tp.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
