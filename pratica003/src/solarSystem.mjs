import * as THREE from "https://esm.sh/three";

export function createSolarSystem(scene) {
  const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);

  // ——— Materiais ———
  const materials = {
    sun:     new THREE.MeshStandardMaterial({ color: 0xffdd00, emissive: 0xff8800, emissiveIntensity: 0.6 }),
    mercury: new THREE.MeshStandardMaterial({ color: 0x9e9e9e, roughness: 0.9 }),
    venus:   new THREE.MeshStandardMaterial({ color: 0xe8cda0, roughness: 0.8 }),
    earth:   new THREE.MeshStandardMaterial({ color: 0x2266cc, roughness: 0.7 }),
    moon:    new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 1.0 }),
    mars:    new THREE.MeshStandardMaterial({ color: 0xcc4422, roughness: 0.9 }),
    jupiter: new THREE.MeshStandardMaterial({ color: 0xc88b3a, roughness: 0.6 }),
    saturn:  new THREE.MeshStandardMaterial({ color: 0xe4d191, roughness: 0.7 }),
    ring:    new THREE.MeshBasicMaterial({ color: 0xc8b560, side: THREE.DoubleSide, transparent: true, opacity: 0.7 }),
    uranus:  new THREE.MeshStandardMaterial({ color: 0x7de8e8, roughness: 0.5 }),
    neptune: new THREE.MeshStandardMaterial({ color: 0x3f54ba, roughness: 0.5 }),
  };

  // ——— Sol ———
  const sun = new THREE.Mesh(sphereGeometry, materials.sun);
  sun.scale.setScalar(10);
  scene.add(sun);

  // ——— Helper para criar planeta com pivô ———
  function makePlanet(matKey, radius, orbitRadius, orbitAngleOffset = 0) {
    const pivot = new THREE.Group();
    pivot.rotation.y = orbitAngleOffset;
    scene.add(pivot);

    const mesh = new THREE.Mesh(sphereGeometry, materials[matKey]);
    mesh.scale.setScalar(radius);
    mesh.position.x = orbitRadius;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    pivot.add(mesh);

    return { mesh, pivot };
  }

  // ——— Helper para orbita visual ———
  function makeOrbitLine(radius) {
    const points = [];
    for (let i = 0; i <= 128; i++) {
      const angle = (i / 128) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color: 0x333355, transparent: true, opacity: 0.35 });
    scene.add(new THREE.Line(geo, mat));
  }

  // ——— Planetas (raio visual, distância orbital) ———
  //  Distâncias e tamanhos escalados para ficar visualmente agradável
  const mercuryData = { radius: 0.9,  orbit: 16  };
  const venusData   = { radius: 1.5,  orbit: 22  };
  const earthData   = { radius: 1.7,  orbit: 30  };
  const marsData    = { radius: 1.1,  orbit: 40  };
  const jupiterData = { radius: 5.5,  orbit: 58  };
  const saturnData  = { radius: 4.5,  orbit: 76  };
  const uranusData  = { radius: 3.0,  orbit: 92  };
  const neptuneData = { radius: 2.8,  orbit: 108 };

  [mercuryData, venusData, earthData, marsData, jupiterData, saturnData, uranusData, neptuneData]
    .forEach(d => makeOrbitLine(d.orbit));

  const { mesh: mercury, pivot: mercuryPivot } = makePlanet('mercury', mercuryData.radius, mercuryData.orbit, 0.5);
  const { mesh: venus,   pivot: venusPivot   } = makePlanet('venus',   venusData.radius,   venusData.orbit,   1.2);
  const { mesh: earth,   pivot: earthPivot   } = makePlanet('earth',   earthData.radius,   earthData.orbit,   2.1);
  const { mesh: mars,    pivot: marsPivot    } = makePlanet('mars',    marsData.radius,    marsData.orbit,    3.8);
  const { mesh: jupiter, pivot: jupiterPivot } = makePlanet('jupiter', jupiterData.radius, jupiterData.orbit, 0.9);
  const { mesh: saturn,  pivot: saturnPivot  } = makePlanet('saturn',  saturnData.radius,  saturnData.orbit,  4.5);
  const { mesh: uranus,  pivot: uranusPivot  } = makePlanet('uranus',  uranusData.radius,  uranusData.orbit,  1.7);
  const { mesh: neptune, pivot: neptunePivot } = makePlanet('neptune', neptuneData.radius, neptuneData.orbit, 5.2);

  // ——— Lua da Terra ———
  const moon = new THREE.Mesh(sphereGeometry, materials.moon);
  moon.scale.setScalar(0.45);
  moon.position.x = 3.2;
  moon.castShadow = true;
  moon.receiveShadow = true;
  earth.add(moon);

  // ——— Anel de Saturno ———
  const ringGeo = new THREE.TorusGeometry(1.75, 0.35, 3, 120);
  const saturnRing = new THREE.Mesh(ringGeo, materials.ring);
  saturnRing.rotation.x = Math.PI / 2.2;
  saturn.add(saturnRing);

  // ——— Anel de Urano (inclinado) ———
  const uranusRingGeo = new THREE.TorusGeometry(1.5, 0.12, 3, 80);
  const uranusRingMat = new THREE.MeshBasicMaterial({ color: 0x9af0f0, side: THREE.DoubleSide, transparent: true, opacity: 0.4 });
  const uranusRing = new THREE.Mesh(uranusRingGeo, uranusRingMat);
  uranusRing.rotation.x = Math.PI / 2;
  uranus.add(uranusRing);
  // Urano tem inclinação axial extrema (~98°)
  uranus.rotation.z = Math.PI / 2;

  return {
    sun,
    mercury, mercuryPivot,
    venus,   venusPivot,
    earth,   earthPivot,
    moon,
    mars,    marsPivot,
    jupiter, jupiterPivot,
    saturn,  saturnPivot,
    uranus,  uranusPivot,
    neptune, neptunePivot,
  };
}
