import React, { useEffect, useRef } from 'react';
import { OrbitalElements, Planet } from '../types';
import { getOrbitPath, propagateOrbit } from '../utils/propagation';

interface OrbitSchematicProps {
  selectedBody: OrbitalElements & { name?: string; full_name?: string; pdes?: string };
  earth: Planet;
  currentJD: number;
}

export const OrbitSchematic: React.FC<OrbitSchematicProps> = ({
  selectedBody,
  earth,
  currentJD,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Clear background
    ctx.fillStyle = '#0b0f19'; // space-900
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = 'rgba(61, 79, 115, 0.1)';
    ctx.lineWidth = 1;
    for (let x = 50; x < width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 50; y < height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Determine scale: we want to fit the orbits.
    // Earth's orbit is at 1.0 AU.
    // The selected body's aphelion 'ad' or semi-major axis 'a' determines orbit size.
    const a = selectedBody.a || selectedBody.q; // fallback to q for parabolic
    const maxAU = Math.max(1.3, a * (1 + selectedBody.e) * 1.1); // fit orbit with margin
    const scale = (width / 2) / maxAU; // pixels per AU

    // Helper to project 3D point (J2000) to top-down 2D canvas coordinates
    // We project onto the ecliptic plane (X-Y plane)
    const project = (x: number, y: number) => {
      return {
        cx: centerX + x * scale,
        cy: centerY - y * scale, // flip Y for standard screen coordinates
      };
    };

    // 1. Draw Sun (at center)
    ctx.beginPath();
    ctx.arc(centerX, centerY, 6, 0, 2 * Math.PI);
    ctx.fillStyle = '#eab308'; // yellow-500
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#eab308';
    ctx.fill();
    ctx.shadowBlur = 0; // reset shadow

    // 2. Draw Earth's Orbit (light blue)
    ctx.beginPath();
    const earthPath = getOrbitPath(earth, 100);
    earthPath.forEach((pt, idx) => {
      const { cx, cy } = project(pt.x, pt.y);
      if (idx === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    });
    ctx.closePath();
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)'; // blue-500 with opacity
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 3. Draw Selected Body's Orbit
    ctx.beginPath();
    const bodyPath = getOrbitPath(selectedBody, 120);
    bodyPath.forEach((pt, idx) => {
      const { cx, cy } = project(pt.x, pt.y);
      if (idx === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    });
    // Don't close if it is hyperbolic/parabolic (e >= 0.999)
    if (selectedBody.e < 0.999) {
      ctx.closePath();
    }
    
    let orbitColor = 'rgba(234, 179, 8, 0.7)'; // yellow-500
    if ('pha' in selectedBody && selectedBody.pha) {
      orbitColor = 'rgba(249, 115, 22, 0.7)'; // orange-500
    } else if ('M1' in selectedBody) {
      orbitColor = 'rgba(168, 85, 247, 0.7)'; // purple-500
    }
    
    ctx.strokeStyle = orbitColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // 4. Calculate and Draw Current Positions
    const earthPos = propagateOrbit(earth, currentJD);
    const bodyPos = propagateOrbit(selectedBody, currentJD);

    const pEarth = project(earthPos.x, earthPos.y);
    const pBody = project(bodyPos.x, bodyPos.y);

    // Draw Earth Position
    ctx.beginPath();
    ctx.arc(pEarth.cx, pEarth.cy, 4, 0, 2 * Math.PI);
    ctx.fillStyle = '#3b82f6'; // blue-500
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw Body Position
    ctx.beginPath();
    ctx.arc(pBody.cx, pBody.cy, 4, 0, 2 * Math.PI);
    ctx.fillStyle = orbitColor;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw lines connecting them to Sun (optional, but shows distance vectors!)
    ctx.setLineDash([2, 3]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(pEarth.cx, pEarth.cy);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(pBody.cx, pBody.cy);
    ctx.stroke();

    // Draw distance line between Earth and Asteroid
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)'; // red-500
    ctx.beginPath();
    ctx.moveTo(pEarth.cx, pEarth.cy);
    ctx.lineTo(pBody.cx, pBody.cy);
    ctx.stroke();
    ctx.setLineDash([]); // reset

    // Compute direct distance
    const distAU = Math.sqrt(
      Math.pow(earthPos.x - bodyPos.x, 2) +
      Math.pow(earthPos.y - bodyPos.y, 2) +
      Math.pow(earthPos.z - bodyPos.z, 2)
    );
    const distLD = distAU * 389.17;

    // Display labels on canvas
    ctx.fillStyle = '#9ca3af'; // gray-400
    ctx.font = '10px monospace';
    ctx.fillText('SUN', centerX + 10, centerY + 4);
    
    ctx.fillStyle = '#3b82f6';
    ctx.fillText('EARTH', pEarth.cx + 8, pEarth.cy + 4);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    const nameStr = selectedBody.name || selectedBody.pdes || 'Object';
    ctx.fillText(nameStr.toUpperCase(), pBody.cx + 8, pBody.cy + 4);

    // Display Distance HUD inside Schematic
    ctx.fillStyle = '#111827'; // gray-900 back
    ctx.fillRect(5, 5, 140, 42);
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(5, 5, 140, 42);

    ctx.fillStyle = '#9ca3af';
    ctx.font = '9px monospace';
    ctx.fillText('EARTH DISTANCE:', 10, 18);
    ctx.fillStyle = '#ef4444'; // red-500
    ctx.font = 'bold 10px monospace';
    ctx.fillText(`${distAU.toFixed(4)} AU`, 10, 30);
    ctx.font = '9px monospace';
    ctx.fillStyle = '#f3f4f6';
    ctx.fillText(`(${distLD.toFixed(1)} LD)`, 72, 30);

    // Display scale indicator
    ctx.fillStyle = '#9ca3af';
    ctx.font = '8px monospace';
    ctx.fillText('SCALE: TOP-DOWN ECLIPTIC', width - 125, height - 15);
    ctx.fillText(`1 AU = ${scale.toFixed(0)}px`, width - 125, height - 6);

  }, [selectedBody, earth, currentJD]);

  return (
    <div className="relative border border-gray-800 rounded-lg overflow-hidden bg-gray-950 shadow-inner">
      <canvas
        ref={canvasRef}
        width={300}
        height={220}
        className="w-full block aspect-[30/22] max-h-[220px]"
      />
    </div>
  );
};
