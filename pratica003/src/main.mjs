import * as THREE from "https://esm.sh/three";
import { OrbitControls } from "https://esm.sh/three/addons/controls/OrbitControls.js";
import { createSolarSystem } from "./solarSystem.mjs";

let scene, camera, renderer, controls;
let pointLight, asteroidBelt;
let astros = {};

// ——— Velocidades orbitais (proporcional à realidade: mais perto = mais rápido) ———
const orbitSpeeds = {
  mercury: 0.047,
  venus:   0.035,
  earth:   0.029,
  mars:    0.024,
  jupiter: 0.013,
  saturn:  0.009,
  uranus:  0.006,
  neptune: 0.005,
};

const selfRotation = {
  sun:     0.002,
  mercury: 0.003,
  venus:   0.002,
  earth:   0.02,
  mars:    0.018,
  jupiter: 0.04,
  saturn:  0.035,
  uranus:  0.025,
  neptune: 0.022,
};

function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(0, 50, 120);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  document.body.appendChild(renderer.domElement);

  // ——— Iluminação ———
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.04);
  scene.add(ambientLight);

  pointLight = new THREE.PointLight(0xfff4e0, 20000, 3000);
  pointLight.position.set(0, 0, 0);
  pointLight.castShadow = true;
  pointLight.shadow.mapSize.width = 2048;
  pointLight.shadow.mapSize.height = 2048;
  pointLight.shadow.bias = -0.001;
  scene.add(pointLight);

  astros = createSolarSystem(scene);

  // ——— Campo estelar ———
  const starCount = 5000;
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount * 3; i++) {
    starPos[i] = (Math.random() - 0.5) * 1200;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.25, transparent: true, opacity: 0.7 });
  scene.add(new THREE.Points(starGeo, starMat));

  // ——— Cinturão de asteroides (entre Marte e Júpiter, ~50–56) ———
  const meteorGeometries = [];

  const geom1 = new THREE.BufferGeometry();
  geom1.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
     0, 1, 0,  -1,-1, 1,  1,-1, 1,
     0, 1, 0,   1,-1, 1,  1,-1,-1,
     0, 1, 0,   1,-1,-1, -1,-1,-1,
     0, 1, 0,  -1,-1,-1, -1,-1, 1,
    -1,-1, 1,   1,-1,-1,  1,-1, 1,
    -1,-1, 1,  -1,-1,-1,  1,-1,-1,
  ]), 3));
  geom1.computeVertexNormals();
  meteorGeometries.push(geom1);

  const geom2 = new THREE.BufferGeometry();
  geom2.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
     0, 2, 0,  -0.5, 0, 0.5,  0.5, 0, 0.5,
     0, 2, 0,   0.5, 0, 0.5,  0,   0,-0.5,
     0, 2, 0,   0,   0,-0.5, -0.5, 0, 0.5,
     0,-1, 0,   0.5, 0, 0.5, -0.5, 0, 0.5,
     0,-1, 0,   0,   0,-0.5,  0.5, 0, 0.5,
     0,-1, 0,  -0.5, 0, 0.5,  0,   0,-0.5,
  ]), 3));
  geom2.computeVertexNormals();
  meteorGeometries.push(geom2);

  asteroidBelt = new THREE.Group();
  const meteorMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9 });

  for (let i = 0; i < 300; i++) {
    const meteor = new THREE.Mesh(
      meteorGeometries[Math.floor(Math.random() * meteorGeometries.length)],
      meteorMat
    );
    const angle = Math.random() * Math.PI * 2;
    const radius = 49 + Math.random() * 7;
    meteor.position.set(Math.cos(angle) * radius, (Math.random() - 0.5) * 3, Math.sin(angle) * radius);
    meteor.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    const s = 0.15 + Math.random() * 0.4;
    meteor.scale.setScalar(s);
    meteor.castShadow = true;
    asteroidBelt.add(meteor);
  }
  scene.add(asteroidBelt);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 15;
  controls.maxDistance = 800;

  window.addEventListener('resize', onWindowResize);
  animate();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  if (astros.sun) {
    // auto-rotação
    astros.sun.rotation.y      += selfRotation.sun;
    astros.mercury.rotation.y  += selfRotation.mercury;
    astros.venus.rotation.y    += selfRotation.venus;
    astros.earth.rotation.y    += selfRotation.earth;
    astros.mars.rotation.y     += selfRotation.mars;
    astros.jupiter.rotation.y  += selfRotation.jupiter;
    astros.saturn.rotation.y   += selfRotation.saturn;
    astros.uranus.rotation.y   += selfRotation.uranus;
    astros.neptune.rotation.y  += selfRotation.neptune;

    // órbitas
    astros.mercuryPivot.rotation.y += orbitSpeeds.mercury;
    astros.venusPivot.rotation.y   += orbitSpeeds.venus;
    astros.earthPivot.rotation.y   += orbitSpeeds.earth;
    astros.marsPivot.rotation.y    += orbitSpeeds.mars;
    astros.jupiterPivot.rotation.y += orbitSpeeds.jupiter;
    astros.saturnPivot.rotation.y  += orbitSpeeds.saturn;
    astros.uranusPivot.rotation.y  += orbitSpeeds.uranus;
    astros.neptunePivot.rotation.y += orbitSpeeds.neptune;
  }

  if (asteroidBelt) asteroidBelt.rotation.y += 0.0008;

  controls.update();
  renderer.render(scene, camera);
}

init();
