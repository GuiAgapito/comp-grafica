import * as THREE from "https://esm.sh/three";
import { OrbitControls } from "https://esm.sh/three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "https://esm.sh/three/addons/loaders/GLTFLoader.js";
import { RGBELoader } from "https://esm.sh/three/addons/loaders/RGBELoader.js";
import GUI from "https://esm.sh/lil-gui";

// são declaradas as variáveis globais
let scene, camera, renderer, controls;
let carPaintMaterials = [];
// é instanciado o carregador de texturas globalmente para ser usado em várias funções
const textureLoader = new THREE.TextureLoader();

function init() {
  // ==========================================================
  // passo 1: setup base da cena
  // ==========================================================
  setupSceneAndCamera();
  setupControls();
  setupBasicLighting();

  // ==========================================================
  // passo 2: elementos principais (geometria lisa inicial)
  // ==========================================================
  setupBasicFloor(); // nota: comente esta linha quando for ativar o passo 5
  loadCarModel();

  // ==========================================================
  // passos extras da aula (descomente um a um para exibir)
  // ==========================================================

  // passo 3: luzes cinemáticas (rim lighting)
  // setupCinematicLights();

  // passo 4: mapeamento de ambiente (hdri)
  // setupEnvironment();

  // passo 5: texturas pbr no solo (lembre-se de comentar o setupBasicFloor acima)
  // setupPBRFloor();

  // passo 6: objetos didáticos para mapeamento uv (caixa e barril)
  // setupPrimitives();

  window.addEventListener("resize", onWindowResize);
  animate();
}

// ==========================================================
// definições das funções modulares
// ==========================================================

function setupSceneAndCamera() {
  // é instanciada a cena principal
  scene = new THREE.Scene();

  // é configurada a câmera de perspectiva
  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(3, 2, 5);

  // é inicializado o renderizador webgl e configurado para sombras físicas
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  document.body.appendChild(renderer.domElement);
}

function setupControls() {
  // é configurado o controle de órbita
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  // é restrito o ângulo e o zoom
  controls.maxPolarAngle = Math.PI / 2 - 0.05;
  controls.minDistance = 3;
  controls.maxDistance = 10;
}

function setupBasicLighting() {
  // são adicionadas luzes de suporte gerais
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
  directionalLight.position.set(5, 10, 5);
  directionalLight.castShadow = true;
  scene.add(directionalLight);
}

function setupCinematicLights() {
  // são adicionadas luzes de destaque nos cantos para efeito cinemático
  const bluePointLight = new THREE.PointLight(0x0055ff, 50, 20);
  bluePointLight.position.set(-4, 1.5, 4);
  scene.add(bluePointLight);

  const redPointLight = new THREE.PointLight(0xff2255, 50, 20);
  redPointLight.position.set(4, 1.5, -4);
  scene.add(redPointLight);
}

function setupEnvironment() {
  // é instanciado o carregador e aplicado o hdri do estúdio
  const rgbeLoader = new RGBELoader();
  rgbeLoader.load("./assets/texture/studio.hdr", function (environmentMap) {
    environmentMap.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = environmentMap;
    scene.backgroundBlurriness = 0.1;
    scene.backgroundIntensity = 0.4;
    scene.environment = environmentMap;
  });
}

function setupBasicFloor() {
  // é criado um chão simples e cinza para o início da aula
  const planeGeometry = new THREE.PlaneGeometry(15, 15);
  const planeMaterial = new THREE.MeshStandardMaterial({
    color: 0x444444,
    roughness: 0.8,
  });
  const floorMesh = new THREE.Mesh(planeGeometry, planeMaterial);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.receiveShadow = true;
  scene.add(floorMesh);
}

function setupPBRFloor() {
  // são carregados todos os mapas pbr do solo
  const colorMap = textureLoader.load("./assets/texture/floor_color.jpg");
  const normalMap = textureLoader.load("./assets/texture/floor_normal.jpg");
  const displacementMap = textureLoader.load(
    "./assets/texture/floor_height.jpg"
  );
  const roughnessMap = textureLoader.load(
    "./assets/texture/floor_roughness.jpg"
  );
  const aoMap = textureLoader.load("./assets/texture/floor_occlusion.jpg");

  colorMap.colorSpace = THREE.SRGBColorSpace;

  // é configurada a repetição para todos os mapas em lote
  [colorMap, normalMap, displacementMap, roughnessMap, aoMap].forEach((map) => {
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(5, 5);
  });

  const planeGeometry = new THREE.PlaneGeometry(15, 15, 100, 100);
  const planeMaterial = new THREE.MeshStandardMaterial({
    map: colorMap,
    normalMap: normalMap,
    normalScale: new THREE.Vector2(4, 4),
    displacementMap: displacementMap,
    displacementScale: 0.1,
    roughnessMap: roughnessMap,
    aoMap: aoMap,
    aoMapIntensity: 3,
  });

  const floorMesh = new THREE.Mesh(planeGeometry, planeMaterial);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.receiveShadow = true;
  scene.add(floorMesh);
}

function setupPrimitives() {
  // são criados os objetos didáticos para mapeamento uv
  const crateTexture = textureLoader.load("./assets/texture/crate.jpg");
  crateTexture.colorSpace = THREE.SRGBColorSpace;
  const crateNormal = textureLoader.load("./assets/texture/crate_normal.jpg");

  const barrelTexture = textureLoader.load("./assets/texture/barrel.jpg");
  barrelTexture.colorSpace = THREE.SRGBColorSpace;
  const barrelNormal = textureLoader.load("./assets/texture/barrel_normal.jpg");

  // caixa
  const boxGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
  const boxMaterial = new THREE.MeshStandardMaterial({
    // map: crateTexture,
    // normalMap: crateNormal,
    // normalScale: new THREE.Vector2(2, 2),
    roughness: 0.8,
  });
  const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
  boxMesh.position.set(2.5, 0.4, 1.5);
  boxMesh.castShadow = true;
  boxMesh.receiveShadow = true;
  scene.add(boxMesh);

  // barril
  const cylinderGeometry = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 32);
  const cylinderMaterial = new THREE.MeshStandardMaterial({
    // map: barrelTexture,
    // normalMap: barrelNormal,
    // normalScale: new THREE.Vector2(3, 3),
    roughness: 0.5,
    metalness: 0.3,
  });
  const cylinderMesh = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
  cylinderMesh.position.set(-2.5, 0.6, 1.5);
  cylinderMesh.castShadow = true;
  cylinderMesh.receiveShadow = true;
  scene.add(cylinderMesh);
}

function loadCarModel() {
  // é carregado o modelo glb
  const gltfLoader = new GLTFLoader();
  gltfLoader.load(
    "./assets/models/lambooo.glb",
    function (gltf) {
      const carMesh = gltf.scene;

      // é percorrida a malha interna do carro
      carMesh.traverse(function (child) {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;

          const matName = child.material.name
            ? child.material.name.toLowerCase()
            : "";
          const meshName = child.name ? child.name.toLowerCase() : "";

          // são separados os vidros e a pintura
          const isGlass =
            matName.includes("glass") || meshName.includes("glass");
          const isPaint = matName.includes("lamborghini_aventador_body");

          if (isGlass) {
            child.material.transparent = true;
            child.material.opacity = 0.3;
            child.material.roughness = 0.0;
          } else if (isPaint) {
            carPaintMaterials.push(child.material);
          } else if (carPaintMaterials.length === 0) {
            carPaintMaterials.push(child.material);
          }
        }
      });

      carMesh.scale.set(0.3, 0.3, 0.3);
      carMesh.position.y = 0.05;
      scene.add(carMesh);

      // passo 7: inicialização do painel flutuante (descomente para exibir a interface de pintura)
      // setupConfiguratorGUI();
    },
    undefined,
    function (error) {
      console.error("ocorreu um erro ao carregar o modelo glb:", error);
    }
  );
}

function setupConfiguratorGUI() {
  // é instanciado o painel e seus parâmetros
  const gui = new GUI();
  const params = {
    paintColor: "#ffcc00",
    roughness: 0.1,
    metalness: 0.8,
  };

  const paintFolder = gui.addFolder("Lataria do Veículo");

  paintFolder
    .addColor(params, "paintColor")
    .name("Cor")
    .onChange(function (value) {
      carPaintMaterials.forEach((mat) => {
        mat.color.set(value);
      });
    });

  paintFolder
    .add(params, "roughness", 0, 1)
    .name("Rugosidade")
    .onChange(function (value) {
      carPaintMaterials.forEach((mat) => {
        mat.roughness = value;
      });
    });

  paintFolder
    .add(params, "metalness", 0, 1)
    .name("Metálico")
    .onChange(function (value) {
      carPaintMaterials.forEach((mat) => {
        mat.metalness = value;
      });
    });

  paintFolder.open();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  // é atualizado o amortecimento do controle
  controls.update();
  renderer.render(scene, camera);
}

init();
