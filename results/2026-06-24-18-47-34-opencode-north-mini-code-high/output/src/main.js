import * as THREE from 'three';

function solveKepler(e, a, n, epoch, ma0, t) {
    const currentMa = ma0 + n * t;
    let eccAnom = currentMa;
    
    for (let i = 0; i < 10; i++) {
        const delta = currentMa - eccAnom + e * Math.sin(eccAnom);
        eccAnom += delta / (1 - e * Math.cos(eccAnom));
    }
    
    const nu = 2 * Math.atan(Math.sqrt((1 + e) / (1 - e)) * Math.tan(eccAnom / 2));
    return nu;
}

class SolarSystem {
    constructor() {
        this.app = document.getElementById('app');
        this.controls = document.getElementById('controls');
        
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.app.appendChild(this.renderer.domElement);
        
        this.time = 0;
        this.timeStep = 1;
        this.playing = false;
        this.animationId = null;
        
        this.bodies = [];
        this.lines = [];
        
        this.initControls();
        this.loadData();
    }
    
    initControls() {
        this.controlsHtml = `
            <style>
                #controls {
                    position: absolute;
                    top: 10px;
                    left: 10px;
                    background: rgba(0, 0, 0, 0.7);
                    color: white;
                    padding: 15px;
                    border-radius: 5px;
                    font-family: monospace;
                    max-width: 300px;
                    z-index: 1000;
                }
                .control-row {
                    margin: 10px 0;
                }
                button {
                    background: #444;
                    color: white;
                    border: none;
                    padding: 5px 10px;
                    border-radius: 3px;
                    cursor: pointer;
                    margin: 2px;
                }
                input[type='range'] { width: 150px; }
                .info { margin-top: 10px; padding-top: 10px; border-top: 1px solid #555; }
                .highlight { color: #ff6; }
            </style>
            <div class="control-row">
                <h2>Solar System Visualization</h2>
            </div>
            <div class="control-row">
                <button id="play-pause">Play/Pause</button>
                <button id="reset-time">Reset</button>
            </div>
            <div class="control-row">
                <label>Time (days): </label>
                <input type="range" id="time-slider" min="0" max="3000" value="0">
            </div>
            <div class="control-row">
                <label>Speed: </label>
                <input type="range" id="speed-slider" min="0.01" max="10" value="1" step="0.01">
            </div>
            <div class="control-row">
                <button id="toggle-asteroids">Toggle Asteroids (42k)</button>
                <button id="toggle-planets">Toggle Planets (8)</button>
            </div>
        `;
        this.controls.innerHTML = this.controlsHtml;
        
        document.getElementById('play-pause').addEventListener('click', () => {
            this.playing = !this.playing;
        });
        
        document.getElementById('reset-time').addEventListener('click', () => {
            this.time = 0;
            this.playing = false;
        });
        
        document.getElementById('time-slider').addEventListener('input', (e) => {
            this.time = parseFloat(e.target.value);
            this.playing = false;
        });
        
        document.getElementById('speed-slider').addEventListener('input', (e) => {
            this.timeStep = parseFloat(e.target.value);
        });
        
        document.getElementById('toggle-asteroids').addEventListener('click', () => {
            const asteroids = this.bodies.filter(b => b.userData.type === 'asteroid');
            const visible = asteroids[0] && asteroids[0].visible;
            asteroids.forEach(b => b.visible = !visible);
        });
        
        document.getElementById('toggle-planets').addEventListener('click', () => {
            const planets = this.bodies.filter(b => b.userData.type === 'planet');
            const visible = planets[0] && planets[0].visible;
            planets.forEach(b => b.visible = !visible);
        });
    }
    
    async loadData() {
        const planetsData = await fetch('./data/planets.json').then(r => r.json());
        this.createPlanetBodies(planetsData);
        
        const asteroidsData = await fetch('./data/asteroids.json').then(r => r.json());
        this.createGenericBodies(asteroidsData, 'asteroid');
        
        const cometsData = await fetch('./data/comets.json').then(r => r.json());
        this.createGenericBodies(cometsData, 'comet');
        
        this.animate();
    }
    
    createPlanetBodies(data) {
        const colors = { Mercury: 0x8C7853, Venus: 0xFFC300, Earth: 0x4169E1, Mars: 0xCD5C5C, Jupiter: 0xD4AF37, Saturn: 0xA0522D, Uranus: 0x5DE3E0, Neptune: 0x1E3A8A };
        
        data.forEach(planet => {
            const geometry = new THREE.SphereGeometry(planet.radius_km / 696000, 32, 32);
            const material = new THREE.MeshPhongMaterial({ color: colors[planet.name] || 0x808080 });
            const body = new THREE.Mesh(geometry, material);
            
            body.userData = {
                type: 'planet',
                name: planet.name,
                radius: planet.radius_km / 696000,
                data: planet
            };
            
            body.position.set(0, 0, 0);
            this.scene.add(body);
            this.bodies.push(body);
        });
    }
    
    createGenericBodies(data, type) {
        const color = type === 'asteroid' ? 0x888888 : 0xffff00;
        const limit = type === 'asteroid' ? 5000 : 500;
        const filteredData = data.slice(0, limit);
        
        filteredData.forEach(obj => {
            let radius = 0.001;
            if (obj.diameter) {
                radius = (obj.diameter / 2000) / 696000;
            }
            
            const geometry = new THREE.SphereGeometry(radius, 16, 16);
            const material = new THREE.MeshPhongMaterial({ 
                color: color,
                emissive: type === 'comet' ? 0x444400 : 0,
                emissiveIntensity: type === 'comet' ? 0.2 : 0
            });
            
            const body = new THREE.Mesh(geometry, material);
            body.userData = {
                type: type,
                name: obj.pdes || obj.full_name,
                data: obj
            };
            
            body.position.set(0, 0, 0);
            body.visible = type === 'asteroid';
            this.scene.add(body);
            this.bodies.push(body);
        });
    }
    
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        if (this.playing) {
            this.time += this.timeStep;
        }
        
        document.getElementById('time-slider').value = this.time;
        
        this.updateBodies();
        this.renderer.render(this.scene, this.camera);
    }
    
    updateBodies() {
        this.bodies.forEach(body => {
            const data = body.userData.data;
            
            const a = data.a;
            const e = data.e;
            const i = THREE.MathUtils.degToRad(data.i);
            const om = THREE.MathUtils.degToRad(data.om);
            const w = THREE.MathUtils.degToRad(data.w);
            const ma0 = THREE.MathUtils.degToRad(data.ma || 0);
            const epoch = data.epoch;
            const n = data.n || (Math.sqrt(0.00029458 / Math.pow(a, 3)) || 0.00057373);
            
            const t = (this.time - epoch) / 32400000;
            
            const nu = solveKepler(e, a, n, epoch, ma0, t);
            
            const r = a * (1 - e * Math.cos(nu));
            let x = r * Math.cos(nu);
            let y = r * Math.sin(nu);
            
            const Rx = new THREE.Matrix4()
                .makeRotationZ(om)
                .multiply(new THREE.Matrix4().makeRotationX(i))
                .multiply(new THREE.Matrix4().makeRotationZ(w));
            
            const v = new THREE.Vector3(x, y, 0);
            Rx.applyToVector3(v);
            
            body.position.set(v.x, v.y, v.z);
            
            if (body.userData.type === 'comet' && data.e >= 1) {
                body.scale.setScalar(1.5);
            }
        });
    }
    
    dispose() {
        cancelAnimationFrame(this.animationId);
        this.bodies.forEach(body => {
            this.scene.remove(body);
            body.geometry.dispose();
            body.material.dispose();
        });
        this.renderer.dispose();
    }
}

window.addEventListener('resize', () => {
    if (window.app) {
        window.app.camera.aspect = window.innerWidth / window.innerHeight;
        window.app.camera.updateProjectionMatrix();
        window.app.renderer.setSize(window.innerWidth, window.innerHeight);
    }
});

window.onload = () => {
    window.app = new SolarSystem();
    
    window.scene = window.app.scene;
    window.camera = window.app.camera;
    window.renderer = window.app.renderer;
    
    camera.position.z = 5;
    camera.position.y = 2;
    camera.lookAt(0, 0, 0);
};