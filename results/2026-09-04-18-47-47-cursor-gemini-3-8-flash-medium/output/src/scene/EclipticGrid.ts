import * as THREE from 'three';

export class EclipticGrid {
  public group: THREE.Group;

  constructor() {
    this.group = new THREE.Group();
    this.buildGrid();
  }

  private buildGrid() {
    const auRadii = [0.5, 1.0, 1.5, 2.0, 3.0, 5.0, 10.0, 20.0, 30.0];
    const ringMaterial = new THREE.LineBasicMaterial({
      color: 0x334155,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });

    const highlightRingMaterial = new THREE.LineBasicMaterial({
      color: 0x475569,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });

    // Draw concentric AU rings on ecliptic plane (X-Z in Three.js)
    for (const r of auRadii) {
      const segments = 128;
      const positions = new Float32Array((segments + 1) * 3);
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        positions[i * 3 + 0] = Math.cos(theta) * r;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = Math.sin(theta) * r;
      }
      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const line = new THREE.Line(
        geom,
        r === 1.0 ? highlightRingMaterial : ringMaterial
      );
      this.group.add(line);
    }

    // Radial spokes every 30 degrees out to 5 AU
    const spokeMaterial = new THREE.LineBasicMaterial({
      color: 0x1e293b,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
    });
    for (let deg = 0; deg < 360; deg += 30) {
      const rad = (deg * Math.PI) / 180;
      const positions = new Float32Array([
        Math.cos(rad) * 0.3, 0, Math.sin(rad) * 0.3,
        Math.cos(rad) * 5.0, 0, Math.sin(rad) * 5.0,
      ]);
      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const line = new THREE.Line(geom, spokeMaterial);
      this.group.add(line);
    }
  }

  public setVisible(visible: boolean) {
    this.group.visible = visible;
  }
}
