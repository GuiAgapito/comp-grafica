import * as THREE from "https://esm.sh/three";
import { OrbitControls } from "https://esm.sh/three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "https://esm.sh/three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "https://esm.sh/three/addons/loaders/DRACOLoader.js";
import Stats from "https://esm.sh/three/addons/libs/stats.module.js";
import GUI from "https://esm.sh/lil-gui";

let scene, camera, renderer, controls, clock, stats;
let mixer;
let actions = [];
let activeAction;
let modelsGroup;
let currentActionText;
let skeletonHelper; 
let mainLight; // Mover para escopo global (Exercício 2)

function init() {
  clock = new THREE.Clock();
  
  stats = new Stats();
  document.body.appendChild(stats.dom);

  setupSceneAndCamera();
  setupLights();
  setupControls();
  setupInteractiveUI();
  loadModels();
  setupKeyboardEvents();

  animate();
}

function setupSceneAndCamera() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111);
  
  // Exercício 3: Adicionar névoa exponencial
  scene.fog = new THREE.FogExp2(0x111111, 0.05);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(5, 3, 8);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  document.body.appendChild(renderer.domElement);

  window.addEventListener("resize", onWindowResize);

  modelsGroup = new THREE.Group();
  modelsGroup.visible = false; 
  scene.add(modelsGroup);
}

function setupLights() {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);

  mainLight = new THREE.DirectionalLight(0xffffff, 2);
  mainLight.position.set(5, 10, 5);
  mainLight.castShadow = true;
  mainLight.shadow.mapSize.width = 2048;
  mainLight.shadow.mapSize.height = 2048;
  scene.add(mainLight);

  mainLight.target.position.set(5, 0, 0);
  scene.add(mainLight.target);

  const blueLight = new THREE.PointLight(0x0055ff, 50, 10);
  blueLight.position.set(2, 1.5, 2);
  scene.add(blueLight);

  const pinkLight = new THREE.PointLight(0xff00aa, 50, 10);
  pinkLight.position.set(8, 1.5, 2);
  scene.add(pinkLight);
}

function setupControls() {
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxPolarAngle = Math.PI / 2 + 0.05;
  controls.minDistance = 2;
  controls.maxDistance = 15;
  controls.target.set(5, 1, 0);
  controls.update();
}

function setupInteractiveUI() {
  const gui = new GUI({ title: "painel de controle" });
  
  // Exercício 2: Adicionar parâmetro intensidadeLuz
  const configuracoes = { 
    velocidade: 1.0, 
    mostrarOssos: false,
    intensidadeLuz: 2  // Valor inicial igual a 2
  };

  gui.add(configuracoes, "velocidade", 0.1, 3.0).name("multiplicador de tempo").onChange(function (value) {
    if (mixer) {
      mixer.timeScale = value;
    }
  });

  gui.add(configuracoes, "mostrarOssos").name("exibir estrutura (bones)").onChange(function (value) {
    if (skeletonHelper) {
      skeletonHelper.visible = value;
    }
  });

  // Exercício 2: Adicionar controle de intensidade da luz
  gui.add(configuracoes, "intensidadeLuz", 0, 10).name("intensidade da luz").onChange(function (value) {
    if (mainLight) {
      mainLight.intensity = value;
    }
  });

  currentActionText = document.createElement("div");
  currentActionText.style.position = "absolute";
  currentActionText.style.bottom = "20px";
  currentActionText.style.left = "50%";
  currentActionText.style.transform = "translateX(-50%)";
  currentActionText.style.color = "#00ffaa";
  currentActionText.style.fontFamily = "monospace";
  currentActionText.style.fontSize = "0.7rem";
  currentActionText.style.background = "rgba(0,0,0,0.5)";
  currentActionText.style.padding = "5px 15px";
  currentActionText.style.borderRadius = "8px";
  currentActionText.style.display = "none";
  document.body.appendChild(currentActionText);
}

function loadModels() {
  const loadingText = document.createElement("div");
  loadingText.style.position = "absolute";
  loadingText.style.top = "50%";
  loadingText.style.left = "50%";
  loadingText.style.transform = "translate(-50%, -50%)";
  loadingText.style.color = "#ffffff";
  loadingText.style.fontFamily = "monospace";
  loadingText.style.fontSize = "1rem";
  loadingText.innerHTML = "carregando... 0%";
  document.body.appendChild(loadingText);

  const manager = new THREE.LoadingManager();

  manager.onProgress = function (url, itemsLoaded, itemsTotal) {
    const progress = Math.floor((itemsLoaded / itemsTotal) * 100);
    loadingText.innerHTML = `carregando... ${progress}%`;
  };

  manager.onLoad = function () {
    loadingText.remove();
    modelsGroup.visible = true;
    currentActionText.style.display = "block";
  };

  manager.onError = function (url) {
    loadingText.innerHTML = "erro de requisição de malha!";
    loadingText.style.color = "#ff4444";
  };

  const gltfLoader = new GLTFLoader(manager);

  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");
  gltfLoader.setDRACOLoader(dracoLoader);

  gltfLoader.load("./assets/models/small_stage.glb", function (gltf) {
    const stage = gltf.scene;
    stage.traverse(function (child) {
      if (child.isMesh) {
        child.receiveShadow = true;
        child.castShadow = true;
      }
    });
    stage.scale.set(0.05, 0.05, 0.05);
    modelsGroup.add(stage);
  });

  gltfLoader.load("./assets/models/elvis.glb", function (gltf) {
    const elvis = gltf.scene;
    elvis.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    elvis.position.y = 0.85;
    elvis.position.x = 5;
    elvis.rotation.y = Math.PI / 2;
    elvis.scale.set(2, 2, 2);
    modelsGroup.add(elvis);

    skeletonHelper = new THREE.SkeletonHelper(elvis);
    skeletonHelper.visible = false; 
    modelsGroup.add(skeletonHelper);

    mixer = new THREE.AnimationMixer(elvis);
    const clips = gltf.animations;

    console.log("=== trilhas de animação identificadas no arquivo ===");

    clips.forEach(function (clip, index) {
      console.log(`[tecla ${index + 1}]: ${clip.name} (duração: ${clip.duration.toFixed(2)}s)`);
      const action = mixer.clipAction(clip);
      actions.push(action);
    });

    if (actions.length > 0) {
      activeAction = actions[0];
      activeAction.play();
      currentActionText.innerHTML = `animação em execução: ${clips[0].name}`;
    }
  });
}

function setupKeyboardEvents() {
  window.addEventListener("keydown", function (event) {
    const keyNumber = parseInt(event.key);

    if (keyNumber >= 1 && keyNumber <= 5) {
      const animationIndex = keyNumber - 1;

      if (actions[animationIndex]) {
        fadeToAction(animationIndex);
      }
    }
  });
}

function fadeToAction(index, duration = 0.5) {
  const nextAction = actions[index];

  if (nextAction === activeAction) return;

  nextAction.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(duration).play();

  if (activeAction) {
    activeAction.fadeOut(duration);
  }

  activeAction = nextAction;

  const clipName = nextAction.getClip().name;
  currentActionText.innerHTML = `animação em execução: ${clipName}`;
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  if (mixer) {
    mixer.update(delta);
  }

  controls.update();
  
  if(stats) {
    stats.update();
  }
  
  renderer.render(scene, camera);
}

init();