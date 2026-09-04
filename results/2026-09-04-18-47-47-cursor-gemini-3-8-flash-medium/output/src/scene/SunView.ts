import * as THREE from 'three';

export class SunView {
  public group: THREE.Group;
  public mesh: THREE.Mesh;
  public light: THREE.PointLight;
  private coronaMesh: THREE.Mesh;

  constructor() {
    this.group = new THREE.Group();

    // Core sphere
    const coreGeom = new THREE.SphereGeometry(0.045, 32, 32);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xfff4d0,
    });
    this.mesh = new THREE.Mesh(coreGeom, coreMat);
    this.mesh.name = 'Sun';
    this.mesh.userData = { type: 'sun', id: 'Sun', name: 'Sun' };
    this.group.add(this.mesh);

    // Glowing corona shell
    const coronaGeom = new THREE.SphereGeometry(0.075, 32, 32);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
    });
    this.coronaMesh = new THREE.Mesh(coronaGeom, coronaMat);
    this.group.add(this.coronaMesh);

    // Outer soft glow shell
    const outerGeom = new THREE.SphereGeometry(0.12, 32, 32);
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0xd97706,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
    });
    const outerMesh = new THREE.Mesh(outerGeom, outerMat);
    this.group.add(outerMesh);

    // Sun light source
    this.light = new THREE.PointLight(0xffffff, 2.5, 100, 0);
    this.light.position.set(0, 0, 0);
    this.group.add(this.light);
  }

  public update(timeMs: number) {
    const pulse = 1.0 + Math.sin(timeMs * 0.002) * 0.04;
    this.coronaMesh.scale.set(pulse, pulse, pulse);
  }
}
