/**
 * Modelos Procedurais Compostos (3–12 partes por THREE.Group) e Texturas Canvas
 * Inclui os 6 Personagens Guardiões 3D nas estações, borboletas/vagalumes animados,
 * marcador de toque no solo e modelos do terrário.
 */

import * as THREE from 'three';
import { CharacterAvatarId, MissionStation, PlacedDecoration } from '../core/types';

/**
 * Cria textura procedural de musgo e solo botânico com grade sutil de medição
 */
export function createBotanicalGroundTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base verde-sálvia pastel iluminada (Clean Girl Matcha/Sage)
  const grad = ctx.createRadialGradient(256, 256, 30, 256, 256, 260);
  grad.addColorStop(0, '#b7e4c7');
  grad.addColorStop(0.65, '#95d5b2');
  grad.addColorStop(1, '#74c69d');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 160; i++) {
    const x = (Math.sin(i * 78.233) * 0.5 + 0.5) * 512;
    const y = (Math.cos(i * 45.164) * 0.5 + 0.5) * 512;
    const r = 4 + (i % 9);
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 255, 255, 0.16)' : 'rgba(82, 183, 136, 0.15)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 2;
  [100, 175, 235].forEach((radius) => {
    ctx.beginPath();
    ctx.arc(256, 256, radius, 0, Math.PI * 2);
    ctx.stroke();
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Cria textura de sombra de contato radial suave (Contact Shadow)
 */
export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(64, 64, 6, 64, 64, 60);
  grad.addColorStop(0, 'rgba(120, 113, 108, 0.32)');
  grad.addColorStop(0.55, 'rgba(120, 113, 108, 0.14)');
  grad.addColorStop(1, 'rgba(120, 113, 108, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Cria a ilha-terrário principal e elementos naturais interativos (árvores botânicas clicáveis)
 */
export function createTerrariumIsland(
  groundTex: THREE.CanvasTexture
): {
  islandGroup: THREE.Group;
  walkableMesh: THREE.Mesh;
  interactiveTrees: THREE.Group[];
} {
  const islandGroup = new THREE.Group();
  const interactiveTrees: THREE.Group[] = [];

  // 1. Base de madeira clara escandinava (Birch / Carvalho Claro)
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xe6ccb2,
    roughness: 0.55,
    metalness: 0.05,
  });
  const basePedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(7.9, 8.4, 0.9, 48),
    woodMat
  );
  basePedestal.position.y = -0.95;
  basePedestal.receiveShadow = true;
  islandGroup.add(basePedestal);

  // 2. Anel de ouro champanhe / rose-gold suave
  const brassMat = new THREE.MeshPhysicalMaterial({
    color: 0xf4a261,
    roughness: 0.22,
    metalness: 0.75,
    clearcoat: 0.5,
  });
  const brassRing = new THREE.Mesh(
    new THREE.TorusGeometry(8.02, 0.11, 16, 64),
    brassMat
  );
  brassRing.rotation.x = Math.PI / 2;
  brassRing.position.y = -0.5;
  islandGroup.add(brassRing);

  // 3. Camada de areia/argila clara
  const soilMat = new THREE.MeshStandardMaterial({
    color: 0xddb892,
    roughness: 0.85,
    metalness: 0.02,
  });
  const soilLayer = new THREE.Mesh(
    new THREE.CylinderGeometry(7.65, 7.85, 0.5, 48),
    soilMat
  );
  soilLayer.position.y = -0.26;
  soilLayer.receiveShadow = true;
  islandGroup.add(soilLayer);

  // 4. Superfície caminhável de grama sálvia clara (y = 0)
  const turfMat = new THREE.MeshStandardMaterial({
    map: groundTex,
    roughness: 0.78,
    metalness: 0.02,
  });
  const walkableMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(7.55, 7.65, 0.16, 64),
    turfMat
  );
  walkableMesh.position.y = -0.08;
  walkableMesh.receiveShadow = true;
  walkableMesh.name = 'walkable-ground';
  islandGroup.add(walkableMesh);

  // 5. Riacho cristalino azul-pastel
  const waterMat = new THREE.MeshPhysicalMaterial({
    color: 0x7dd3fc,
    roughness: 0.1,
    metalness: 0.05,
    transmission: 0.65,
    thickness: 0.5,
    ior: 1.33,
  });
  const streamMesh = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, 0.05, 1.35),
    waterMat
  );
  streamMesh.position.set(-4.2, 0.01, 2.8);
  streamMesh.receiveShadow = true;
  islandGroup.add(streamMesh);

  // 6. Trilhas radiais de pedra travertino creme
  const pathMat = new THREE.MeshStandardMaterial({
    color: 0xf5ebe0,
    roughness: 0.65,
    metalness: 0.05,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    const stoneSlab = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.35, 0.04, 8),
      pathMat
    );
    stoneSlab.position.set(Math.cos(angle) * 2.2, 0.02, Math.sin(angle) * 2.2);
    stoneSlab.receiveShadow = true;
    islandGroup.add(stoneSlab);
  }

  // 7. Árvores botânicas em tons sálvia e flor de cerejeira pastel
  const treeCoords: [number, number][] = [
    [-5.8, 0.4],
    [5.8, 0.3],
    [-2.5, -5.4],
    [2.6, -5.3],
    [-1.8, 5.6],
    [2.1, 5.5],
  ];
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0xb08968, roughness: 0.75 });
  const canopyMat1 = new THREE.MeshStandardMaterial({ color: 0x52b788, roughness: 0.5 });
  const canopyMat2 = new THREE.MeshStandardMaterial({ color: 0xfbcfe8, roughness: 0.45 });

  treeCoords.forEach(([tx, tz], idx) => {
    const tree = new THREE.Group();
    tree.position.set(tx, 0, tz);

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.16, 0.65, 10), trunkMat);
    trunk.position.y = 0.32;
    trunk.castShadow = true;
    tree.add(trunk);

    const crown1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45, 1), canopyMat1);
    crown1.position.y = 0.78;
    crown1.castShadow = true;
    tree.add(crown1);

    const crown2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.32, 1), canopyMat2);
    crown2.position.set(0.14, 1.08, 0.08);
    crown2.castShadow = true;
    tree.add(crown2);

    tree.userData = { treeIndex: idx, bounceVelocity: 0 };
    islandGroup.add(tree);
    interactiveTrees.push(tree);
  });

  // 8. Aro Vítreo de Redoma Aberta
  const domeRimMat = new THREE.MeshPhysicalMaterial({
    color: 0xe0f2fe,
    roughness: 0.08,
    metalness: 0.05,
    transmission: 0.9,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  });
  const glassWall = new THREE.Mesh(
    new THREE.CylinderGeometry(7.75, 7.75, 0.55, 64, 1, true),
    domeRimMat
  );
  glassWall.position.y = 0.25;
  glassWall.renderOrder = 2;
  islandGroup.add(glassWall);

  return { islandGroup, walkableMesh, interactiveTrees };
}

/**
 * Cria o Personagem Explorador 3D controlado pelo estudante (Guardiã Késsia)
 */
export function createExplorerCharacter(shadowTex: THREE.CanvasTexture): {
  root: THREE.Group;
  bodyGroup: THREE.Group;
} {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.05, 1.05),
    new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.55,
    })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.02;
  root.add(shadowPlane);

  // Texturas de alta resolução da Guardiã Késsia
  const textureLoader = new THREE.TextureLoader();
  const frontTex = textureLoader.load('/characters/kessia/body_front.png');
  frontTex.colorSpace = THREE.SRGBColorSpace;

  const backTex = textureLoader.load('/characters/kessia/body_back.png');
  backTex.colorSpace = THREE.SRGBColorSpace;

  // Plano Frontal (Vista dianteira com casaco explorer e tranças)
  const frontMat = new THREE.MeshStandardMaterial({
    map: frontTex,
    transparent: true,
    alphaTest: 0.06,
    roughness: 0.55,
    metalness: 0.05,
    side: THREE.FrontSide,
  });
  const frontPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 1.35), frontMat);
  frontPlane.position.set(0, 0.675, 0.015);
  frontPlane.castShadow = true;
  bodyGroup.add(frontPlane);

  // Plano Traseiro (Vista traseira com mochila explorer e dreadlocks)
  const backMat = new THREE.MeshStandardMaterial({
    map: backTex,
    transparent: true,
    alphaTest: 0.06,
    roughness: 0.55,
    metalness: 0.05,
    side: THREE.FrontSide,
  });
  const backPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 1.35), backMat);
  backPlane.rotation.y = Math.PI;
  backPlane.position.set(0, 0.675, -0.015);
  backPlane.castShadow = true;
  bodyGroup.add(backPlane);

  // Colisor de volume interno para projeção suave de sombras 3D
  const coreVolume = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.22, 1.1, 12),
    new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.6,
      transparent: true,
      opacity: 0.0,
    })
  );
  coreVolume.position.y = 0.6;
  coreVolume.castShadow = true;
  bodyGroup.add(coreVolume);

  return { root, bodyGroup };
}

/**
 * Cria um Personagem Guardião 3D exclusivo (NPC) para cada estação de missão
 */
export function createGuardianNPCGroup(
  avatarId: CharacterAvatarId,
  accentHex: string,
  shadowTex: THREE.CanvasTexture
): {
  npcGroup: THREE.Group;
  waveArm: THREE.Object3D;
} {
  const npcGroup = new THREE.Group();
  const accentColor = new THREE.Color(accentHex);

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.95, 0.95),
    new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.5,
    })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  npcGroup.add(shadow);

  const bodyMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    roughness: 0.4,
    metalness: 0.2,
  });
  const headMat = new THREE.MeshStandardMaterial({
    color: avatarId === 'geoda' ? 0xe9d5ff : 0xfde68a,
    roughness: 0.45,
  });
  const glowMat = new THREE.MeshPhysicalMaterial({
    color: accentColor,
    emissive: accentColor,
    emissiveIntensity: 0.55,
    roughness: 0.2,
  });

  if (avatarId === 'kessia') {
    const textureLoader = new THREE.TextureLoader();
    const frontTex = textureLoader.load('/characters/kessia/body_front.png');
    frontTex.colorSpace = THREE.SRGBColorSpace;

    const kessiaMat = new THREE.MeshStandardMaterial({
      map: frontTex,
      transparent: true,
      alphaTest: 0.06,
      roughness: 0.5,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });

    const kessiaPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 1.35), kessiaMat);
    kessiaPlane.position.set(0, 0.675, 0.02);
    kessiaPlane.castShadow = true;
    npcGroup.add(kessiaPlane);

    // Braço de aceno animado no loop Three.js
    const waveArm = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.045, 0.2, 6, 8),
      new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.4 })
    );
    waveArm.position.set(0.34, 0.72, 0.06);
    waveArm.rotation.z = -0.55;
    npcGroup.add(waveArm);

    return { npcGroup, waveArm };
  }

  // Corpo principal
  const body = new THREE.Mesh(
    avatarId === 'geoda'
      ? new THREE.OctahedronGeometry(0.28, 0)
      : new THREE.CylinderGeometry(0.18, 0.25, 0.46, 16),
    bodyMat
  );
  body.position.y = 0.34;
  body.castShadow = true;
  npcGroup.add(body);

  // Cabeça
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 18), headMat);
  head.position.y = 0.74;
  head.castShadow = true;
  npcGroup.add(head);

  // Braço que acena para o jogador
  const waveArm = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.055, 0.22, 6, 8),
    bodyMat
  );
  waveArm.position.set(0.25, 0.52, 0.05);
  waveArm.rotation.z = -0.6;
  waveArm.castShadow = true;
  npcGroup.add(waveArm);

  // Acessório distintivo por personagem (Chapéu / Asas / Lanterna / Coroa)
  if (avatarId === 'lino' || avatarId === 'milo') {
    const wingMat = new THREE.MeshPhysicalMaterial({
      color: 0xe0f2fe,
      transmission: 0.8,
      transparent: true,
      opacity: 0.75,
      roughness: 0.1,
    });
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 0.03), wingMat);
    wingL.position.set(-0.2, 0.48, -0.16);
    wingL.rotation.y = 0.4;
    npcGroup.add(wingL);

    const wingR = wingL.clone();
    wingR.position.set(0.2, 0.48, -0.16);
    wingR.rotation.y = -0.4;
    npcGroup.add(wingR);
  }

  const crown = new THREE.Mesh(
    avatarId === 'solis'
      ? new THREE.TorusGeometry(0.22, 0.035, 10, 24)
      : new THREE.ConeGeometry(0.22, 0.24, 6),
    glowMat
  );
  crown.position.y = 0.98;
  npcGroup.add(crown);

  return { npcGroup, waveArm };
}

/**
 * Cria uma Estação de Missão 3D + Personagem Guardião 3D
 */
export function createMissionStationGroup(
  mission: MissionStation,
  shadowTex: THREE.CanvasTexture
): {
  group: THREE.Group;
  npcGroup: THREE.Group;
  npcWaveArm: THREE.Object3D;
  interactiveHitbox: THREE.Mesh;
  bloomParts: THREE.Object3D[];
  beaconRing: THREE.Mesh;
} {
  const group = new THREE.Group();
  group.position.set(mission.position3D[0], 0, mission.position3D[2]);

  const accentColor = new THREE.Color(mission.accentColor);
  const bloomParts: THREE.Object3D[] = [];

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 2.2),
    new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.45,
    })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.015;
  group.add(shadow);

  const beaconMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    emissive: accentColor,
    emissiveIntensity: 0.45,
    roughness: 0.3,
    metalness: 0.5,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const beaconRing = new THREE.Mesh(
    new THREE.RingGeometry(0.95, 1.14, 32),
    beaconMat
  );
  beaconRing.rotation.x = -Math.PI / 2;
  beaconRing.position.y = 0.025;
  group.add(beaconRing);

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0xf5ebe0,
    roughness: 0.6,
    metalness: 0.05,
  });
  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(0.85, 0.95, 0.18, 24),
    stoneMat
  );
  plinth.position.y = 0.09;
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  group.add(plinth);

  // Régua física 3D de 0 a 1 na frente da estação dividida em targetDenominator partes
  const rulerGroup = new THREE.Group();
  rulerGroup.position.set(0, 0.2, 0.65);
  const barWidth = 1.4;
  const barBase = new THREE.Mesh(
    new THREE.BoxGeometry(barWidth, 0.06, 0.18),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 })
  );
  rulerGroup.add(barBase);

  const d = mission.targetDenominator;
  const partWidth = barWidth / d;
  for (let i = 0; i <= d; i++) {
    const tickX = -barWidth / 2 + i * partWidth;
    const isUnitMark = i === 1;
    const tickMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, isUnitMark ? 0.14 : 0.1, 0.22),
      new THREE.MeshStandardMaterial({
        color: isUnitMark ? accentColor : 0x94a3b8,
        emissive: isUnitMark ? accentColor : new THREE.Color(0x000000),
        emissiveIntensity: isUnitMark ? 0.5 : 0,
      })
    );
    tickMesh.position.set(tickX, 0.04, 0);
    rulerGroup.add(tickMesh);
  }

  const unitFillMesh = new THREE.Mesh(
    new THREE.BoxGeometry(partWidth * 0.92, 0.09, 0.16),
    new THREE.MeshStandardMaterial({
      color: accentColor,
      emissive: accentColor,
      emissiveIntensity: 0.35,
      roughness: 0.25,
    })
  );
  unitFillMesh.position.set(-barWidth / 2 + partWidth * 0.5, 0.05, 0);
  rulerGroup.add(unitFillMesh);
  bloomParts.push(unitFillMesh);
  group.add(rulerGroup);

  const mainStructure = createCategoryModel(mission.rewardItem.category, accentColor);
  mainStructure.position.y = 0.18;
  group.add(mainStructure);
  bloomParts.push(mainStructure);

  // Personagem Guardião 3D posicionado ao lado da estação
  const { npcGroup, waveArm: npcWaveArm } = createGuardianNPCGroup(
    mission.avatarId,
    mission.accentColor,
    shadowTex
  );
  npcGroup.position.set(
    mission.npcOffset3D[0] - mission.position3D[0],
    0,
    mission.npcOffset3D[2] - mission.position3D[2]
  );
  group.add(npcGroup);

  // Hitbox invisível ampla para facilitar o toque mobile tanto na estação quanto no personagem
  const interactiveHitbox = new THREE.Mesh(
    new THREE.CylinderGeometry(1.65, 1.65, 2.0, 14),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  interactiveHitbox.position.y = 0.95;
  interactiveHitbox.userData = { missionId: mission.id };
  group.add(interactiveHitbox);

  return { group, npcGroup, npcWaveArm, interactiveHitbox, bloomParts, beaconRing };
}

/**
 * Cria um modelo 3D composto para estações e para itens do Modo Criativo
 */
export function createCategoryModel(
  category: PlacedDecoration['category'],
  accentColor: THREE.Color
): THREE.Group {
  const model = new THREE.Group();

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x78350f,
    roughness: 0.7,
    metalness: 0.1,
  });
  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.65,
    metalness: 0.2,
  });
  const glowMat = new THREE.MeshPhysicalMaterial({
    color: accentColor,
    emissive: accentColor,
    emissiveIntensity: 0.45,
    roughness: 0.2,
    metalness: 0.3,
    clearcoat: 0.8,
  });
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    roughness: 0.5,
    metalness: 0.1,
  });

  if (category === 'bridge') {
    const deck = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.1, 0.65), woodMat);
    deck.position.y = 0.28;
    deck.castShadow = true;
    model.add(deck);

    [-0.5, 0, 0.5].forEach((x, idx) => {
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.1, 0.45, 12),
        idx === 1 ? glowMat : woodMat
      );
      pillar.position.set(x, 0.22, 0.26);
      pillar.castShadow = true;
      model.add(pillar);

      const pillarBack = pillar.clone();
      pillarBack.position.set(x, 0.22, -0.26);
      model.add(pillarBack);
    });
  } else if (category === 'flora') {
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.35, 0.25, 16),
      stoneMat
    );
    pot.position.y = 0.12;
    pot.castShadow = true;
    model.add(pot);

    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.05, 0.55, 10),
        leafMat
      );
      stem.position.set(Math.cos(angle) * 0.16, 0.42, Math.sin(angle) * 0.16);
      stem.castShadow = true;
      model.add(stem);

      const blossom = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.16, 1),
        i === 0 ? glowMat : leafMat
      );
      blossom.position.set(Math.cos(angle) * 0.16, 0.74, Math.sin(angle) * 0.16);
      blossom.castShadow = true;
      model.add(blossom);
    }
  } else if (category === 'lantern') {
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.11, 0.75, 12),
      woodMat
    );
    post.position.y = 0.37;
    post.castShadow = true;
    model.add(post);

    const lanternCore = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.32, 0.28),
      glowMat
    );
    lanternCore.position.y = 0.85;
    lanternCore.castShadow = true;
    model.add(lanternCore);

    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(0.32, 0.24, 4),
      stoneMat
    );
    roof.position.y = 1.12;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    model.add(roof);
  } else if (category === 'fountain') {
    const basin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.48, 0.22, 20),
      stoneMat
    );
    basin.position.y = 0.11;
    basin.castShadow = true;
    model.add(basin);

    const tier2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.26, 0.35, 16),
      stoneMat
    );
    tier2.position.y = 0.36;
    tier2.castShadow = true;
    model.add(tier2);

    const waterCrown = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 16, 16),
      glowMat
    );
    waterCrown.position.y = 0.65;
    model.add(waterCrown);
  } else if (category === 'crystal') {
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6;
      const height = i === 0 ? 0.85 : 0.45 + (i % 3) * 0.12;
      const crystal = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.12, height, 6),
        glowMat
      );
      crystal.position.set(
        Math.cos(angle) * 0.18,
        height / 2,
        Math.sin(angle) * 0.18
      );
      crystal.rotation.z = (Math.random() - 0.5) * 0.25;
      crystal.castShadow = true;
      model.add(crystal);
    }
  } else {
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.3, 0.45, 16),
      stoneMat
    );
    pillar.position.y = 0.22;
    pillar.castShadow = true;
    model.add(pillar);

    const outerRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.38, 0.04, 12, 32),
      glowMat
    );
    outerRing.position.y = 0.78;
    outerRing.castShadow = true;
    model.add(outerRing);

    const innerRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.24, 0.03, 12, 24),
      woodMat
    );
    innerRing.position.y = 0.78;
    innerRing.rotation.y = Math.PI / 3;
    model.add(innerRing);

    const coreStar = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.12, 0),
      glowMat
    );
    coreStar.position.y = 0.78;
    model.add(coreStar);
  }

  return model;
}
