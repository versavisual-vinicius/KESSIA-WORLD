/**
 * TerrariumCanvas & WorldBridge Interativo
 * Cena 3D em Three.js com 6 Personagens Guardiões animados que olham e acenam para o estudante,
 * projeção 3D->2D para balões de fala flutuantes, vagalumes/borboletas procedurais,
 * árvores clicáveis com mola (squash-and-stretch) e suporte mobile touch-first.
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { soundController } from '../core/audio';
import { MISSIONS } from '../core/missions';
import {
  MissionStation,
  PlacedDecoration,
  ProjectedStationMarker,
  TourStep,
} from '../core/types';
import {
  createBotanicalGroundTexture,
  createCategoryModel,
  createContactShadowTexture,
  createExplorerCharacter,
  createMissionStationGroup,
  createTerrariumIsland,
} from './proceduralModels';

interface TerrariumCanvasProps {
  activeMissionId: string;
  completedMissionIds: string[];
  placedDecorations: PlacedDecoration[];
  selectedCreativeReward: MissionStation['rewardItem'] | null;
  isCreativeMode: boolean;
  isBuildMode?: boolean;
  isDialogueOpen: boolean;
  tourStep: TourStep;
  mobileMoveDir: { x: number; z: number };
  reducedStimuli: boolean;
  highContrast: boolean;
  celebrationTrigger: number;
  onSelectMission: (missionId: string) => void;
  onPlaceDecoration: (x: number, z: number) => void;
  onNearbyStationChange: (missionId: string | null) => void;
  onUpdateProjections: (markers: ProjectedStationMarker[]) => void;
}

// Objetos matemáticos pré-alocados fora do loop de animação (Zero GC)
const _playerTarget = new THREE.Vector3(0, 0, 3.8);
const _moveDir = new THREE.Vector3();
const _camForward = new THREE.Vector3();
const _camRight = new THREE.Vector3();
const _upAxis = new THREE.Vector3(0, 1, 0);
const _stationPos = new THREE.Vector3();
const _npcWorldPos = new THREE.Vector3();
const _projVec = new THREE.Vector3();
const _desiredCamTarget = new THREE.Vector3(0, 0.4, 0.5);
const _dummyMatrix = new THREE.Matrix4();
const _dummyPos = new THREE.Vector3();
const _dummyQuat = new THREE.Quaternion();
const _dummyScale = new THREE.Vector3();
const _dummyColor = new THREE.Color();

export const TerrariumCanvas: React.FC<TerrariumCanvasProps> = ({
  activeMissionId,
  completedMissionIds,
  placedDecorations,
  selectedCreativeReward,
  isCreativeMode,
  isBuildMode = false,
  isDialogueOpen,
  tourStep,
  mobileMoveDir,
  reducedStimuli,
  highContrast,
  celebrationTrigger,
  onSelectMission,
  onPlaceDecoration,
  onNearbyStationChange,
  onUpdateProjections,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  const stateRef = useRef({
    activeMissionId,
    completedMissionIds,
    selectedCreativeReward,
    isCreativeMode,
    isBuildMode,
    isDialogueOpen,
    tourStep,
    mobileMoveDir,
    reducedStimuli,
    highContrast,
    onSelectMission,
    onPlaceDecoration,
    onNearbyStationChange,
    onUpdateProjections,
  });

  useEffect(() => {
    stateRef.current = {
      activeMissionId,
      completedMissionIds,
      selectedCreativeReward,
      isCreativeMode,
      isBuildMode,
      isDialogueOpen,
      tourStep,
      mobileMoveDir,
      reducedStimuli,
      highContrast,
      onSelectMission,
      onPlaceDecoration,
      onNearbyStationChange,
      onUpdateProjections,
    };
  }, [
    activeMissionId,
    completedMissionIds,
    selectedCreativeReward,
    isCreativeMode,
    isBuildMode,
    isDialogueOpen,
    tourStep,
    mobileMoveDir,
    reducedStimuli,
    highContrast,
    onSelectMission,
    onPlaceDecoration,
    onNearbyStationChange,
    onUpdateProjections,
  ]);

  // Quando a missão ativa muda, caminha até perto do personagem daquela estação
  useEffect(() => {
    const station = MISSIONS.find((m) => m.id === activeMissionId);
    if (station) {
      _playerTarget.set(
        station.npcOffset3D[0] * 0.72,
        0,
        station.npcOffset3D[2] * 0.72
      );
    }
  }, [activeMissionId]);

  const stationsMapRef = useRef<
    Map<
      string,
      {
        group: THREE.Group;
        npcGroup: THREE.Group;
        npcWaveArm: THREE.Object3D;
        bloomParts: THREE.Object3D[];
        beaconRing: THREE.Mesh;
      }
    >
  >(new Map());

  const decorationsGroupRef = useRef<THREE.Group | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const burstParticlesRef = useRef<{
    mesh: THREE.InstancedMesh;
    velocities: THREE.Vector3[];
    positions: THREE.Vector3[];
    age: number;
    active: boolean;
  } | null>(null);

  // Sincroniza decorações do Modo Criativo e Peças Construídas com suas cores temáticas
  useEffect(() => {
    const decorGroup = decorationsGroupRef.current;
    if (!decorGroup) return;

    while (decorGroup.children.length > 0) {
      decorGroup.remove(decorGroup.children[0]);
    }

    const CATEGORY_COLORS: Record<string, string> = {
      bridge: '#10b981',
      flora: '#0ea5e9',
      lantern: '#f59e0b',
      fountain: '#ec4899',
      crystal: '#a855f7',
      monument: '#eab308',
    };

    placedDecorations.forEach((item) => {
      const hex = CATEGORY_COLORS[item.category] || '#10b981';
      const model = createCategoryModel(item.category, new THREE.Color(hex));
      model.position.set(item.x, 0, item.z);
      model.rotation.y = item.rotationY;
      model.scale.setScalar(0.78);
      decorGroup.add(model);
    });
  }, [placedDecorations]);

  // Sincroniza cor de fundo com alto contraste ou estética Clean Girl clara (#FAF8F5)
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const bgHex = highContrast ? 0xffffff : 0xfaf8f5;
    scene.background = new THREE.Color(bgHex);
    scene.fog = new THREE.FogExp2(bgHex, 0.015);
  }, [highContrast]);

  // Partículas comemorativas ao acertar uma fração ou ao construir uma peça no mundo
  useEffect(() => {
    if (celebrationTrigger === 0 || stateRef.current.reducedStimuli) return;
    const burst = burstParticlesRef.current;
    const activeMission = MISSIONS.find((m) => m.id === stateRef.current.activeMissionId);
    if (!burst || !activeMission) return;

    burst.active = true;
    burst.age = 0;

    // Se acabou de construir uma peça, explode as partículas no ponto exato da peça construída!
    const lastDecor = placedDecorations[placedDecorations.length - 1];
    let spawnX = activeMission.position3D[0];
    let spawnZ = activeMission.position3D[2];
    if (lastDecor && Math.hypot(lastDecor.x, lastDecor.z) <= 6.8) {
      spawnX = lastDecor.x;
      spawnZ = lastDecor.z;
    }

    for (let i = 0; i < burst.positions.length; i++) {
      burst.positions[i].set(spawnX, 0.55, spawnZ);
      const angle = (i / burst.positions.length) * Math.PI * 2;
      const speed = 1.4 + (i % 5) * 0.45;
      burst.velocities[i].set(
        Math.cos(angle) * speed,
        2.3 + (i % 4) * 0.6,
        Math.sin(angle) * speed
      );
    }
    burst.mesh.visible = true;
  }, [celebrationTrigger, placedDecorations.length]);

  // Inicialização única da cena Three.js
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isHeadless =
      navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);

    const scene = new THREE.Scene();
    const isMobile =
      typeof window !== 'undefined' &&
      (window.innerWidth <= 768 ||
        /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent));

    const initAspect = container.clientWidth / container.clientHeight;
    // No Moto G34 5G (tela 20:9 estreita ~0.45), ajusta o FOV para enquadrar todo o terrário sem cortar laterais
    const initFov =
      initAspect < 1 ? Math.min(68, Math.max(46, (46 / initAspect) * 0.69)) : 46;

    const camera = new THREE.PerspectiveCamera(
      initFov,
      initAspect,
      0.1,
      120
    );
    camera.position.set(0, 8.4, 11.6);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isHeadless && !isMobile, // Otimização para GPU Adreno 619 a 120Hz
      powerPreference: 'high-performance',
      precision: isMobile ? 'mediump' : 'highp',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(
      isHeadless ? 1 : Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2)
    );
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = !isHeadless;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Iluminação Diurna Suave (Luz natural de janela + Hemisphere creme/sálvia)
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xe6ccb2, 1.15);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.65);
    keyLight.position.set(8, 14, 9);
    keyLight.castShadow = !isHeadless;
    const d = 9.5;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 35;
    keyLight.shadow.mapSize.width = isMobile ? 512 : 1024;
    keyLight.shadow.mapSize.height = isMobile ? 512 : 1024;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xfde2e4, 0.65);
    rimLight.position.set(-9, 7, -8);
    scene.add(rimLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.08;
    controls.minPolarAngle = 0.25;
    controls.minDistance = 5.2;
    controls.maxDistance = 18.5;
    controls.target.set(0, 0.4, 0.5);

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    const groundTex = createBotanicalGroundTexture(maxAnisotropy);
    const shadowTex = createContactShadowTexture();

    const { islandGroup, walkableMesh, interactiveTrees } =
      createTerrariumIsland(groundTex);
    scene.add(islandGroup);

    // Marcador visual de toque no solo
    const targetStepRing = new THREE.Mesh(
      new THREE.RingGeometry(0.18, 0.28, 24),
      new THREE.MeshBasicMaterial({
        color: 0x10b981,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75,
      })
    );
    targetStepRing.rotation.x = -Math.PI / 2;
    targetStepRing.position.set(0, 0.03, 3.8);
    scene.add(targetStepRing);

    // Pedras travertino e sálvia na borda (InstancedMesh > 20 itens)
    const pebbleCount = 36;
    const pebbleGeo = new THREE.DodecahedronGeometry(0.18, 1);
    const pebbleMat = new THREE.MeshStandardMaterial({
      roughness: 0.6,
      metalness: 0.05,
    });
    const pebbleInstanced = new THREE.InstancedMesh(pebbleGeo, pebbleMat, pebbleCount);
    pebbleInstanced.castShadow = true;
    pebbleInstanced.receiveShadow = true;

    for (let i = 0; i < pebbleCount; i++) {
      const angle = (i / pebbleCount) * Math.PI * 2;
      const radius = 6.6 + (i % 3) * 0.25;
      _dummyPos.set(Math.cos(angle) * radius, 0.06, Math.sin(angle) * radius);
      _dummyQuat.setFromAxisAngle(_upAxis, i * 1.1);
      const s = 0.85 + (i % 4) * 0.1;
      _dummyScale.set(s, s * 0.7, s);
      _dummyMatrix.compose(_dummyPos, _dummyQuat, _dummyScale);
      pebbleInstanced.setMatrixAt(i, _dummyMatrix);

      _dummyColor.setHSL(0.08 + (i % 4) * 0.08, 0.28, 0.84 + (i % 3) * 0.04);
      pebbleInstanced.setColorAt(i, _dummyColor);
    }
    pebbleInstanced.instanceMatrix.needsUpdate = true;
    if (pebbleInstanced.instanceColor) pebbleInstanced.instanceColor.needsUpdate = true;
    pebbleInstanced.computeBoundingSphere();
    scene.add(pebbleInstanced);

    // Vagalumes / Polen Bioluminescente orbitando o terrário (InstancedMesh de 24 luzes vivas)
    const fireflyCount = 24;
    const fireflyGeo = new THREE.SphereGeometry(0.055, 8, 8);
    const fireflyMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
    const fireflyMesh = new THREE.InstancedMesh(fireflyGeo, fireflyMat, fireflyCount);
    fireflyMesh.frustumCulled = false;
    scene.add(fireflyMesh);

    // Estações de Missão + Personagens Guardiões 3D
    const stationHitboxes: THREE.Object3D[] = [];
    stationsMapRef.current.clear();

    MISSIONS.forEach((mission) => {
      const {
        group,
        npcGroup,
        npcWaveArm,
        interactiveHitbox,
        bloomParts,
        beaconRing,
      } = createMissionStationGroup(mission, shadowTex);
      scene.add(group);
      stationHitboxes.push(interactiveHitbox);
      stationsMapRef.current.set(mission.id, {
        group,
        npcGroup,
        npcWaveArm,
        bloomParts,
        beaconRing,
      });
    });

    const decorationsGroup = new THREE.Group();
    scene.add(decorationsGroup);
    decorationsGroupRef.current = decorationsGroup;

    // Personagem Explorador 3D
    const explorer = createExplorerCharacter(shadowTex);
    explorer.root.position.set(0, 0, 3.8);
    scene.add(explorer.root);

    // Partículas de comemoração
    const particleCount = 24;
    const partGeo = new THREE.OctahedronGeometry(0.09, 0);
    const partMat = new THREE.MeshBasicMaterial({ color: 0x34d399 });
    const partMesh = new THREE.InstancedMesh(partGeo, partMat, particleCount);
    partMesh.visible = false;
    partMesh.frustumCulled = false;
    scene.add(partMesh);

    burstParticlesRef.current = {
      mesh: partMesh,
      velocities: Array.from({ length: particleCount }, () => new THREE.Vector3()),
      positions: Array.from({ length: particleCount }, () => new THREE.Vector3()),
      age: 0,
      active: false,
    };

    renderer.compile(scene, camera);

    // Teclado
    const heldKeys = new Set<string>();
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(
          e.code
        )
      ) {
        heldKeys.add(e.code);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      heldKeys.delete(e.code);
    };
    const onBlur = () => {
      heldKeys.clear();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    // Raycasting para estações, árvores interativas e terreno
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };

    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      const dx = e.clientX - pointerDownPos.x;
      const dy = e.clientY - pointerDownPos.y;
      if (Math.hypot(dx, dy) > 8) return;

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);

      // 1. Verifica toque em estação ou personagem guardião
      const stationHits = raycaster.intersectObjects(stationHitboxes, false);
      if (stationHits.length > 0) {
        const missionId = stationHits[0].object.userData.missionId as string;
        if (missionId) {
          stateRef.current.onSelectMission(missionId);
          return;
        }
      }

      // 2. Verifica toque em árvores botânicas interativas (efeito mola + som)
      const treeHits = raycaster.intersectObjects(interactiveTrees, true);
      if (treeHits.length > 0) {
        let obj: THREE.Object3D | null = treeHits[0].object;
        while (obj && obj.userData.treeIndex === undefined) {
          obj = obj.parent;
        }
        if (obj) {
          obj.scale.set(1.25, 0.78, 1.25);
          soundController.playTick(0.75);
          return;
        }
      }

      // 3. Verifica toque no solo caminhável
      const groundHits = raycaster.intersectObject(walkableMesh, false);
      if (groundHits.length > 0) {
        const pt = groundHits[0].point;
        const distFromCenter = Math.hypot(pt.x, pt.z);
        if (distFromCenter <= 6.8) {
          if (
            (stateRef.current.isCreativeMode || stateRef.current.isBuildMode) &&
            stateRef.current.selectedCreativeReward
          ) {
            stateRef.current.onPlaceDecoration(
              Number(pt.x.toFixed(2)),
              Number(pt.z.toFixed(2))
            );
          } else {
            _playerTarget.set(pt.x, 0, pt.z);
            soundController.playTick(0.3);
          }
        }
      }
    };

    // Anel holográfico giratório para prévia visual de construção no solo
    const buildHoloRing = new THREE.Mesh(
      new THREE.RingGeometry(0.34, 0.46, 32),
      new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      })
    );
    buildHoloRing.rotation.x = -Math.PI / 2;
    buildHoloRing.position.set(0, 0.04, 0);
    buildHoloRing.visible = false;
    scene.add(buildHoloRing);

    const onPointerMove = (e: PointerEvent) => {
      const isBuilding =
        stateRef.current.isCreativeMode || stateRef.current.isBuildMode;
      if (!isBuilding || !stateRef.current.selectedCreativeReward) {
        buildHoloRing.visible = false;
        return;
      }
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const groundHits = raycaster.intersectObject(walkableMesh, false);
      if (groundHits.length > 0) {
        const pt = groundHits[0].point;
        if (Math.hypot(pt.x, pt.z) <= 6.8) {
          buildHoloRing.position.set(pt.x, 0.04, pt.z);
          buildHoloRing.visible = true;
          return;
        }
      }
      buildHoloRing.visible = false;
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointermove', onPointerMove);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      const aspect = w / h;
      camera.aspect = aspect;
      if (aspect < 1) {
        camera.fov = Math.min(68, Math.max(46, (46 / aspect) * 0.69));
      } else {
        camera.fov = 46;
      }
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    const clock = new THREE.Clock();
    let animFrameId = 0;
    let lastNearbyId: string | null = null;
    let lastProjectionTime = 0;

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      const rawDt = clock.getDelta();
      const dt = Math.min(rawDt, 0.05);
      const elapsed = clock.getElapsedTime();

      // Movimentação combinada: Teclado (WASD/Setas) + Direcional Mobile Touch
      let moveZ = stateRef.current.mobileMoveDir.z;
      let moveX = stateRef.current.mobileMoveDir.x;
      if (heldKeys.has('KeyW') || heldKeys.has('ArrowUp')) moveZ -= 1;
      if (heldKeys.has('KeyS') || heldKeys.has('ArrowDown')) moveZ += 1;
      if (heldKeys.has('KeyA') || heldKeys.has('ArrowLeft')) moveX -= 1;
      if (heldKeys.has('KeyD') || heldKeys.has('ArrowRight')) moveX += 1;

      if (moveX !== 0 || moveZ !== 0) {
        camera.getWorldDirection(_camForward);
        _camForward.y = 0;
        _camForward.normalize();
        _camRight.crossVectors(_camForward, _upAxis).normalize();

        _moveDir
          .set(0, 0, 0)
          .addScaledVector(_camForward, -moveZ)
          .addScaledVector(_camRight, moveX)
          .normalize();

        const speed = 4.3;
        _playerTarget.x = explorer.root.position.x + _moveDir.x * speed * dt;
        _playerTarget.z = explorer.root.position.z + _moveDir.z * speed * dt;

        const r = Math.hypot(_playerTarget.x, _playerTarget.z);
        if (r > 6.6) {
          _playerTarget.x = (_playerTarget.x / r) * 6.6;
          _playerTarget.z = (_playerTarget.z / r) * 6.6;
        }
      }

      // Atualiza anel de destino no solo
      targetStepRing.position.x = _playerTarget.x;
      targetStepRing.position.z = _playerTarget.z;

      // Damping suave do explorador
      const dx = _playerTarget.x - explorer.root.position.x;
      const dz = _playerTarget.z - explorer.root.position.z;
      const distToTarget = Math.hypot(dx, dz);

      explorer.root.position.x = THREE.MathUtils.damp(
        explorer.root.position.x,
        _playerTarget.x,
        8,
        dt
      );
      explorer.root.position.z = THREE.MathUtils.damp(
        explorer.root.position.z,
        _playerTarget.z,
        8,
        dt
      );

      if (distToTarget > 0.05) {
        const targetAngle = Math.atan2(dx, dz);
        let angleDiff = targetAngle - explorer.bodyGroup.rotation.y;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        explorer.bodyGroup.rotation.y += angleDiff * Math.min(1, dt * 12);

        explorer.bodyGroup.position.y = stateRef.current.reducedStimuli
          ? 0
          : Math.abs(Math.sin(elapsed * 11)) * 0.08;
        targetStepRing.visible = true;
      } else {
        explorer.bodyGroup.position.y = THREE.MathUtils.damp(
          explorer.bodyGroup.position.y,
          0,
          10,
          dt
        );
        targetStepRing.visible = false;
      }

      // Recuperação elástica das árvores clicáveis
      interactiveTrees.forEach((tree) => {
        tree.scale.x = THREE.MathUtils.damp(tree.scale.x, 1, 7, dt);
        tree.scale.y = THREE.MathUtils.damp(tree.scale.y, 1, 7, dt);
        tree.scale.z = THREE.MathUtils.damp(tree.scale.z, 1, 7, dt);
      });

      // Anima vagalumes pelo terrário
      fireflyMesh.visible = !stateRef.current.reducedStimuli;
      if (!stateRef.current.reducedStimuli) {
        for (let i = 0; i < fireflyCount; i++) {
          const baseAngle = (i / fireflyCount) * Math.PI * 2 + elapsed * 0.22;
          const radius = 2.2 + (i % 5) * 0.95;
          const yPos = 0.7 + Math.sin(elapsed * 1.8 + i) * 0.35;
          _dummyPos.set(
            Math.cos(baseAngle) * radius,
            yPos,
            Math.sin(baseAngle) * radius
          );
          _dummyScale.setScalar(0.8 + Math.sin(elapsed * 3 + i) * 0.25);
          _dummyMatrix.compose(_dummyPos, _dummyQuat, _dummyScale);
          fireflyMesh.setMatrixAt(i, _dummyMatrix);
        }
        fireflyMesh.instanceMatrix.needsUpdate = true;
      }

      // Atualiza Personagens Guardiões 3D (olham para o explorador e acenam)
      let closestId: string | null = null;
      let closestDist = 2.55;

      MISSIONS.forEach((m) => {
        _stationPos.set(m.position3D[0], 0, m.position3D[2]);
        const dStation = explorer.root.position.distanceTo(_stationPos);
        if (dStation < closestDist) {
          closestDist = dStation;
          closestId = m.id;
        }

        const stEntry = stationsMapRef.current.get(m.id);
        if (stEntry) {
          const isCompleted = stateRef.current.completedMissionIds.includes(m.id);
          const isActive = stateRef.current.activeMissionId === m.id;

          const targetBloom = isCompleted ? 1.18 : 0.72;
          stEntry.bloomParts.forEach((part) => {
            const nextScale = THREE.MathUtils.damp(part.scale.y, targetBloom, 5, dt);
            part.scale.set(nextScale, nextScale, nextScale);
          });

          const ringScale = isActive ? 1.14 : 1.0;
          stEntry.beaconRing.scale.setScalar(
            THREE.MathUtils.damp(stEntry.beaconRing.scale.x, ringScale, 6, dt)
          );

          // Faz o NPC olhar suavemente na direção do personagem explorador
          const npcWorldX = m.npcOffset3D[0];
          const npcWorldZ = m.npcOffset3D[2];
          const lookAngle = Math.atan2(
            explorer.root.position.x - npcWorldX,
            explorer.root.position.z - npcWorldZ
          );
          stEntry.npcGroup.rotation.y = lookAngle;

          // Anima aceno amigável do braço do personagem guardião
          if (!stateRef.current.reducedStimuli) {
            const waveSpeed = isActive || dStation < 3.0 ? 7.5 : 2.5;
            stEntry.npcWaveArm.rotation.z =
              -0.75 + Math.sin(elapsed * waveSpeed + m.order) * 0.35;
            stEntry.npcGroup.position.y =
              Math.abs(Math.sin(elapsed * 2.4 + m.order)) * 0.05;
          } else {
            stEntry.npcWaveArm.rotation.z = -0.6;
            stEntry.npcGroup.position.y = 0;
          }
        }
      });

      if (closestId !== lastNearbyId) {
        lastNearbyId = closestId;
        stateRef.current.onNearbyStationChange(closestId);
      }

      // Foco suave da câmera: enquadra o personagem guardião ativo para que ele e seu balão de fala acima da cabeça fiquem visíveis no centro da cena
      const activeStation = MISSIONS.find(
        (m) => m.id === stateRef.current.activeMissionId
      );
      const isPortraitMobile = container.clientWidth < container.clientHeight;
      if (activeStation && stateRef.current.isDialogueOpen) {
        _desiredCamTarget.set(
          activeStation.npcOffset3D[0] * 0.52,
          isPortraitMobile ? 0.45 : 0.55,
          activeStation.npcOffset3D[2] * 0.52 + (isPortraitMobile ? 1.25 : 0.85)
        );
      } else {
        _desiredCamTarget.set(
          explorer.root.position.x * 0.3,
          0.4,
          explorer.root.position.z * 0.3 + (isPortraitMobile ? 0.4 : 0)
        );
      }

      controls.target.x = THREE.MathUtils.damp(
        controls.target.x,
        _desiredCamTarget.x,
        4.5,
        dt
      );
      controls.target.y = THREE.MathUtils.damp(
        controls.target.y,
        _desiredCamTarget.y,
        4.5,
        dt
      );
      controls.target.z = THREE.MathUtils.damp(
        controls.target.z,
        _desiredCamTarget.z,
        4.5,
        dt
      );

      // Atualiza partículas comemorativas
      const burst = burstParticlesRef.current;
      if (burst && burst.active) {
        burst.age += dt;
        if (burst.age > 1.4) {
          burst.active = false;
          burst.mesh.visible = false;
        } else {
          const s = Math.max(0.01, 1 - burst.age / 1.4);
          _dummyScale.setScalar(s);
          for (let i = 0; i < burst.positions.length; i++) {
            burst.positions[i].addScaledVector(burst.velocities[i], dt);
            burst.velocities[i].y -= 4.8 * dt;
            _dummyMatrix.compose(burst.positions[i], _dummyQuat, _dummyScale);
            burst.mesh.setMatrixAt(i, _dummyMatrix);
          }
          burst.mesh.instanceMatrix.needsUpdate = true;
        }
      }

      if (buildHoloRing.visible) {
        buildHoloRing.rotation.z += 0.025;
      }

      // Durante o Passo 1 do Tour Guiado (Câmera Orbital), gira suavemente a câmera para demonstrar a órbita 360°
      controls.autoRotate =
        stateRef.current.tourStep === 1 && !stateRef.current.reducedStimuli;
      controls.autoRotateSpeed = 0.9;

      controls.update();
      renderer.render(scene, camera);

      // Projeta coordenadas das cabeças dos 6 personagens guardiões para os balões de fala 3D
      if (elapsed - lastProjectionTime > 0.03) {
        lastProjectionTime = elapsed;
        const w = container.clientWidth;
        const h = container.clientHeight;
        const projected: ProjectedStationMarker[] = MISSIONS.map((m) => {
          _npcWorldPos.set(m.npcOffset3D[0], 1.45, m.npcOffset3D[2]);
          const distToPlayer = explorer.root.position.distanceTo(_npcWorldPos);
          _projVec.copy(_npcWorldPos).project(camera);
          const screenX = ((_projVec.x + 1) / 2) * w;
          const screenY = (-(_projVec.y - 1) / 2) * h;
          const isInFront = _projVec.z >= -1 && _projVec.z <= 1;
          return {
            missionId: m.id,
            x: Math.round(screenX),
            y: Math.round(screenY),
            visible:
              isInFront &&
              screenX > 10 &&
              screenX < w - 10 &&
              screenY > 45 &&
              screenY < h - 40,
            distanceToPlayer: Number(distToPlayer.toFixed(2)),
          };
        });
        stateRef.current.onUpdateProjections(projected);
      }
    };

    animFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      controls.dispose();
      groundTex.dispose();
      shadowTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 w-screen h-screen overflow-hidden z-0 touch-none"
      aria-label="Cenário 3D interativo do Pequeno Mundo das Frações. Toque nos personagens ou no terreno para explorar."
    />
  );
};
