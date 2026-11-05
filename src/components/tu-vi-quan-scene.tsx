"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { courtyardAssets } from "./tu-vi-quan-scene-assets";
import { QUAN_TAROT_CARDS } from "@/lib/tu-vi-quan-content";
import type { MonasteryPose } from "./tu-vi-quan-monastery";
import styles from "./tu-vi-quan-scene.module.css";
import { findQuanPath, findQuanMonasteryPath, isQuanWalkable, isQuanMonasteryWalkable, quanGroundHeight, QUAN_BOUNDS, QUAN_POND, QUAN_STATIONS, QUAN_MONASTERY_SEATS, QUAN_MONASTERY_ENTRY } from "@/lib/tu-vi-quan-world.mjs";

type Position = { x: number; z: number };
type Player = Position & { id: string; alias: string; action: string; seatIndex?: number | null; monasteryPose?: MonasteryPose; monasteryPosition?: Position };
export type QuanHost = "tuvi" | "tarot" | "iching";
type SceneProps = {
  encounter?: { kind: QuanHost; desk?: number; state: "greeting" | "listening" | "thinking" | "speaking" | "idle"; audioLevel: number };
  showHostControls?: boolean;
  onHost?: (kind: QuanHost, desk?: number) => void;
  onIncense?: () => void;
  ritual?: { kind: "incense" | "meditate" | "greet" | "tarot" | "iching" | "chart"; requestId: number; count?: number; values?: number[] };
  speech?: { id: string; text: string }[];
  ecosystemEnabled?: boolean;
  quality?: "low" | "medium" | "high";
  reducedMotion?: boolean;
  muted?: boolean;
  appearance?: Record<string, string>;
  monasteryPose?: MonasteryPose;
  monasterySeat?: number | null;
  monasteryPosition?: Position;
  monasteryDestination?: { index: number; requestId: number } | null;
  onMonasteryNearby?: (index: number | null) => void;
  onMonasteryMove?: (position: Position) => void;
  leaders?: { alias: string; points: number }[];
  eventEndsAt?: number;
  experience?: "courtyard" | "teacher" | "tarot" | "iching" | "personal" | "monastery";
  communityWishes?: { id: string; text: string; placement: "tree" | "lotus" }[];
  position: Position;
  action: string;
  players: Player[];
  onMove: (position: Position) => void;
  onUnavailable: () => void;
  interactive: boolean;
  destination?: Position & { requestId: number } | null;
};

const PALETTE = {
  wood: 0x683629, edge: 0x482b26, red: 0x934434, gold: 0xd5a366,
  roof: 0x9a4b38, ridge: 0x63362e, plaster: 0xefcea1,
  stone: 0xba9d82, moss: 0x798554, lantern: 0xf08344, light: 0xffc27a,
};

function label(text: string, large = false) {
  const canvas = document.createElement("canvas");
  canvas.width = 384;
  canvas.height = 100;
  const ctx = canvas.getContext("2d")!;
  ctx.font = `700 ${large ? 49 : 39}px "Quan Sans", sans-serif`;
  const width = Math.min(380, ctx.measureText(text).width + 39);
  ctx.fillStyle = large ? "#552c23" : "#49372b";
  ctx.beginPath();
  ctx.roundRect((384 - width) / 2, 12, width, 76, 11);
  ctx.fill();
  ctx.strokeStyle = "#c79d67";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = "#fff0cb";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 192, 53, width - 18);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, depthWrite: false, sizeAttenuation: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(large ? 5.7 : 2.7, large ? 1.48 : 0.7, 1);
  return sprite;
}

function disposeLabel(sprite: THREE.Sprite) {
  sprite.material.map?.dispose();
  sprite.material.dispose();
}

function makeScene(container: HTMLDivElement, latest: { current: SceneProps }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "low-power" });
  renderer.setClearColor(0xb99b97);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio));
  const canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true");
  container.append(canvas);

  const scene = new THREE.Scene();
  const ecosystemEnabled = latest.current.ecosystemEnabled === true;
  const assets = ecosystemEnabled ? courtyardAssets(scene) : undefined;
  scene.fog = new THREE.Fog(0x8198a6, 42, 145);
  const camera = new THREE.PerspectiveCamera(56, 1, 0.1, 260);
  const sky = new THREE.HemisphereLight(0xb9d1ef, 0x594032, 1.65);
  const sun = new THREE.DirectionalLight(0xffc185, 2);
  sky.layers.enable(1); sun.layers.enable(1);
  sun.position.set(-24, 35, -21);
  sun.intensity = 2.25;
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -48, right: 48, top: 48, bottom: -48, near: 1, far: 130 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.06;
  sun.shadow.radius = 3;
  scene.add(sky, sun);
  const skyDome = new THREE.Mesh(
    new THREE.SphereGeometry(230, 24, 12),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      vertexShader: "varying vec3 v; void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
      fragmentShader: `varying vec3 v; void main(){
        vec3 dir=normalize(v); float h=smoothstep(-.14,.57,dir.y);
        vec3 color=mix(vec3(.78,.62,.57),vec3(.15,.26,.44),h);
        float band=(dir.y-.075)*10.; float horizon=exp(-band*band);
        float wisps=smoothstep(.05,.86,sin(dir.x*9.+dir.z*5.+dir.y*23.)*.55+sin(dir.x*19.-dir.z*13.)*.28+.34);
        color=mix(color,vec3(.64,.70,.80),horizon*(.23+wisps*.28));
        float moon=max(0.,dot(dir,normalize(vec3(.47,.31,-.9))));
        color+=vec3(.34,.40,.51)*pow(moon,108.)+vec3(.67,.67,.57)*smoothstep(.99935,.9996,moon);
        float s=max(0.,dot(dir,normalize(vec3(-.42,.24,-1.))));
        color+=vec3(.33,.18,.08)*pow(s,22.)+vec3(.34,.26,.15)*smoothstep(.998,.999,s);
        gl_FragColor=vec4(color,1.);
      }`,
    }),
  );
  scene.add(skyDome);

  const geometry = {
    box: new THREE.BoxGeometry(),
    drum: new THREE.CylinderGeometry(0.5, 0.5, 1, 12),
    cone: new THREE.CylinderGeometry(0.35, 0.5, 1, 9),
    leaf: new THREE.IcosahedronGeometry(0.5, 1),
    surface: new THREE.PlaneGeometry(1, 1),
    head: new THREE.SphereGeometry(0.5, 12, 8),
    face: new THREE.SphereGeometry(0.5, 24, 16),
  };
  type Shape = keyof typeof geometry;
  const materials = new Map<number, THREE.MeshStandardMaterial>();
  const tileColors = [0xbda994, 0xc3b098, 0xb8a48c, 0xcbb7a0, 0xb7a38e];
  function material(color: number) {
    let entry = materials.get(color);
    if (!entry) {
      const surface = color === 0x91a671 ? { map: assets?.grass ?? null }
        : tileColors.includes(color) ? { map: assets?.paving ?? null }
        : [PALETTE.wood, PALETTE.edge, PALETTE.ridge].includes(color) ? assets?.wood
        : [PALETTE.stone, 0xc7b194, 0xcdb89c, 0xc3aa8c, 0xd0bba0, 0xbda58a].includes(color) ? assets?.stone : {};
      entry = new THREE.MeshStandardMaterial({ ...surface, color, roughness: 0.84,
        ...(color === 0xd9a742 || color === 0xf0c56b || color === 0xe7b957 ? { metalness: 0.28, roughness: 0.42 } : {}),
        emissive: color === PALETTE.lantern || color === PALETTE.light ? color : 0x000000,
        emissiveIntensity: color === PALETTE.lantern ? 0.75 : color === PALETTE.light ? 0.45 : 0,
      });
      materials.set(color, entry);
    }
    return entry;
  }
  let monasteryGeometry = false;
  let offsetX = 0, offsetZ = 0;
  const batches = new Map<string, { shape: Shape; color: number; monastery: boolean; matrices: THREE.Matrix4[] }>();
  const placement = new THREE.Object3D();
  function object(
    shape: Shape, color: number, x: number, y: number, z: number,
    sx: number, sy: number, sz: number, rx = 0, ry = 0, rz = 0,
  ) {
    const key = `${monasteryGeometry ? "monastery" : "courtyard"}:${shape}:${color}`;
    let entry = batches.get(key);
    if (!entry) {
      entry = { shape, color, monastery: monasteryGeometry, matrices: [] };
      batches.set(key, entry);
    }
    placement.position.set(x + offsetX, y, z + offsetZ);
    placement.scale.set(sx, sy, sz);
    placement.rotation.set(rx, ry, rz);
    placement.updateMatrix();
    entry.matrices.push(placement.matrix.clone());
  }
  function box(color: number, x: number, y: number, z: number, sx: number, sy: number, sz: number, rx = 0, ry = 0, rz = 0) {
    object("box", color, x, y, z, sx, sy, sz, rx, ry, rz);
  }
  function drum(color: number, x: number, y: number, z: number, sx: number, sy: number, sz = sx) {
    object("drum", color, x, y, z, sx, sy, sz);
  }
  function tree(x: number, z: number, size: number, warm = false) {
    if (x >= QUAN_BOUNDS.minX && x <= QUAN_BOUNDS.maxX && z >= QUAN_BOUNDS.minZ && z <= QUAN_BOUNDS.maxZ && !isQuanWalkable(x, z)) return;
    object("cone", 0x6d5942, x, size * 0.38, z, size * 0.21, size * 0.8, size * 0.22);
    const colors = warm ? [0x9c6e41, 0xb8884b, 0xc39854] : [0x536549, 0x718153, 0x869256];
    for (let j = 0; j < 7; j += 1) {
      const angle = j * 2.4;
      const spread = j === 0 ? 0 : size * 0.28;
      object("leaf", colors[j % 3], x + Math.sin(angle) * spread, size * (j === 0 ? 1 : 0.81), z + Math.cos(angle) * spread, size * 0.66, size * 0.6, size * 0.65, 0, angle);
    }
  }

  // A broad central court connects smaller gardens, with the hall as the northern landmark.
  box(0x66764d, 0, -0.23, 0, 220, 0.4, 220);
  box(0x91a671, (QUAN_BOUNDS.maxX + QUAN_BOUNDS.minX) / 2, -0.09, (QUAN_BOUNDS.maxZ + QUAN_BOUNDS.minZ) / 2, QUAN_BOUNDS.maxX - QUAN_BOUNDS.minX + 4, 0.16, QUAN_BOUNDS.maxZ - QUAN_BOUNDS.minZ + 4);
  function paving(cx: number, cz: number, width: number, depth: number) {
    box(0x9b886c, cx, -0.002, cz, width + 0.2, 0.08, depth + 0.2);
    const cols = Math.round(width / 1.4);
    const rows = Math.round(depth / 1.4);
    for (let ix = 0; ix < cols; ix++) for (let iz = 0; iz < rows; iz++) {
      box(tileColors[(ix * 13 + iz * 7 + ix * iz) % 5], cx + (ix + 0.5) * width / cols - width / 2, 0.031,
        cz + (iz + 0.5) * depth / rows - depth / 2, width / cols - 0.028, 0.065, depth / rows - 0.028);
    }
  }
  paving(0, -3, 24, 27);
  paving(0, 23, 7, 25);
  paving(-16, 13, 23, 5);
  paving(14, 5, 18, 5);
  paving(9, 17, 5, 20);
  paving(0, -16, 27, 4);
  paving(-31, -6, 36, 5);
  paving(-36, 1, 7, 18);
  paving(-26, 21, 8, 10);
  paving(-28, -7.8, 36, 3.8);
  paving(-18, 21, 4.5, 17);
  // Layers of distant hills keep the estate open without an enclosing wall of trees.
  for (let layer = 0; layer < 3; layer++) for (let i = 0; i < 16; i++) {
    const angle = i * Math.PI * 2 / 16;
    const distance = 76 + layer * 24;
    object("leaf", [0x73857c, 0x89968e, 0xa5a49a][layer], Math.sin(angle) * distance,
      2 + Math.sin(i * 3.4) * 2, Math.cos(angle) * distance, 32 + i % 4 * 6,
      22 + (i * 7) % 21 + layer * 6, 31, 0, angle);
  }
  // Low plaster walls frame the garden; the southern gate stays open.
  for (const x of [-53.5, 33.5]) {
    box(0xd1bb93, x, 0.65, 3, 0.48, 1.35, 63);
    box(PALETTE.ridge, x, 1.37, 3, 0.7, 0.2, 63.3);
    for (let z = -27; z <= 33; z += 6) {
      box(PALETTE.stone, x, 0.95, z, 0.85, 1.9, 0.85);
      box(PALETTE.ridge, x, 1.96, z, 1.04, 0.16, 1.04);
    }
  }
  for (const x of [-20.5, 20.5]) {
    box(0xd1bb93, x, 0.68, 34.8, 25, 1.4, 0.5);
    box(PALETTE.ridge, x, 1.44, 34.8, 25.4, 0.2, 0.72);
  }
  const lanternPools: THREE.Matrix4[] = [];
  function lantern(x: number, y: number, z: number) {
    drum(PALETTE.wood, x, y + 0.5, z, 0.055, 0.6);
    object("head", PALETTE.lantern, x, y, z, 0.62, 0.86, 0.62);
    for (let rib = 0; rib < 6; rib++) {
      const angle = rib * Math.PI / 3;
      object("head", PALETTE.light, x, y, z, 0.65, 0.87, 0.016, 0, angle);
    }
    drum(PALETTE.gold, x, y + 0.38, z, 0.42, 0.1);
    drum(PALETTE.light, x, y - 0.38, z, 0.36, 0.1);
    drum(PALETTE.red, x, y - 0.62, z, 0.06, 0.35);
    placement.position.set(x + offsetX, 0.083, z + offsetZ);
    placement.scale.set(2.25, 2.25, 1);
    placement.rotation.set(-Math.PI / 2, 0, 0);
    placement.updateMatrix();
    lanternPools.push(placement.matrix.clone());
  }
  function roof(cx: number, cz: number, width: number, depth: number, eaves: number, tiles = [0x9d503a, 0xad6147, 0xb56e50, 0x99503c]) {
    const cols = Math.round(width * 2.4);
    const rows = Math.round(depth / 1.05);
    const half = depth / 2;
    box(PALETTE.wood, cx, eaves - 0.15, cz, width - 0.7, 0.24, depth - 0.4);
    for (let col = 0; col < cols; col++) {
      const x = -width / 2 + (col + 0.5) * width / cols;
      const tip = Math.pow(Math.abs(x) / (width / 2), 8) * 0.65;
      for (const side of [-1, 1]) for (let row = 0; row < rows; row++) {
        const d = (row + 0.5) * half / rows;
        const y = eaves + (half - d) * 0.5 + Math.pow(d / half, 4) * 0.34 + tip;
        box(tiles[(row * 3 + col) % 4], cx + x, y, cz + side * d,
          width / cols - 0.013, 0.15, half / rows + 0.13, side * (0.47 - Math.pow(d / half, 3) * 0.56));
        box(PALETTE.ridge, cx + x, y + 0.08, cz + side * (d + half / rows * 0.35), width / cols - 0.015, 0.055, 0.07);
      }
      box(PALETTE.ridge, cx + x, eaves + half * 0.5 + 0.17 + tip, cz, width / cols, 0.3, 0.48);
      box(PALETTE.gold, cx + x, eaves + half * 0.5 + 0.34 + tip, cz, width / cols, 0.04, 0.25);
    }
    for (const side of [-1, 1]) for (const direction of [-1, 1]) {
      const x = cx + side * (width / 2 - 0.2);
      box(PALETTE.ridge, x, eaves + 1, cz + direction * (half - 0.12), 0.4, 0.24, 1.15, -direction * 0.5);
      object("leaf", PALETTE.gold, x, eaves + 1.35, cz + direction * (half + 0.25), 0.3, 0.5, 0.28);
    }
  }
  function column(x: number, z: number, height: number) {
    drum(PALETTE.stone, x, 0.2, z, 0.85, 0.4);
    drum(PALETTE.wood, x, height / 2 + 0.2, z, 0.5, height);
    drum(PALETTE.red, x, height + 0.1, z, 0.73, 0.3);
    drum(PALETTE.gold, x, 0.47, z, 0.57, 0.09);
  }
  // Main hall: timber lattice, curved tile roof, an open front veranda.
  offsetX = -36; offsetZ = 8;
  box(PALETTE.stone, 0, 0.15, -22, 26, 0.3, 10);
  box(PALETTE.stone, 0, 0.34, -22, 25.6, 0.12, 9.6);
  box(PALETTE.plaster, 0, 2.2, -26.3, 24.6, 3.7, 0.32);
  for (const x of [-12, -8, -4, 0, 4, 8, 12]) {
    column(x, -18.15, 4.72);
    column(x, -25.8, 4.72);
  }
  for (const z of [-25.9, -18.15]) {
    box(PALETTE.wood, 0, 4.8, z, 26.3, 0.4, 0.5);
    box(PALETTE.gold, 0, 4.57, z, 25.5, 0.06, 0.52);
  }
  for (const x of [-10, -6, -2, 2, 6, 10]) {
    box(PALETTE.edge, x, 2.05, -26.05, 3.1, 3.1, 0.14);
    box(PALETTE.red, x, 2.18, -25.94, 2.9, 2.6, 0.11);
    for (let i = -5; i <= 5; i++) box(PALETTE.gold, x + i * 0.25, 2.24, -25.84, 0.05, 2.28, 0.065);
    for (const y of [1.42, 2.2, 2.98]) box(PALETTE.wood, x, y, -25.8, 2.9, 0.07, 0.09);
  }
  roof(0, -22, 28.5, 11.7, 5.15);
  box(PALETTE.red, 0, 7.3, -22, 16.8, 2.45, 5.45);
  for (const x of [-7.4, -5.4, -3.4, 3.4, 5.4, 7.4]) {
    box(PALETTE.edge, x, 7.65, -19.24, 1.28, 1.27, 0.18);
    box(0xe0a568, x, 7.65, -19.13, 1.05, 1.04, 0.07);
    for (const offset of [-0.31, 0, 0.31]) box(PALETTE.wood, x + offset, 7.65, -19.06, 0.055, 1.1, 0.075);
  }
  roof(0, -22, 20.5, 7.9, 8.34);
  for (const side of [-1, 1]) {
    box(PALETTE.ridge, side * 9.25, 10.48, -22, 1.4, .24, .48, 0, 0, side * .42);
    object("leaf", PALETTE.gold, side * 9.94, 10.95, -22, .35, .64, .3, 0, 0, side * .3);
    box(PALETTE.wood, side * 3.45, 7.48, -18.93, .25, 2, .34);
    lantern(side * 3.68, 6.85, -18.77);
  }
  box(PALETTE.edge, 0, 7.5, -18.84, 6.5, 1.64, .24);
  for (const x of [-12, -8, -4, 4, 8, 12]) {
    box(PALETTE.gold, x, 4.33, -17.9, .78, .09, .24);
    box(PALETTE.ridge, x, 4.22, -17.94, .48, .41, .26, 0, 0, Math.PI / 4);
  }
  for (const x of [-10, -6, -2, 2, 6, 10]) lantern(x, 3.2, -17.8);
  for (const [x, z] of [[-39, -49], [35, -61]]) {
    offsetX = 0; offsetZ = 0;
    for (let level = 0; level < 3; level++) {
      const width = 5.4 - level * 1.32;
      box(0x536270, x, 3.2 + level * 2.3, z, width * 0.69, 2.35, width * 0.67);
      roof(x, z, width, width * 0.8, 4.45 + level * 2.3);
    }
  }
  offsetX = -36; offsetZ = 8;
  for (let i = 0; i < 3; i++) box(PALETTE.stone, 0, 0.04 + i * 0.06, -16.8 - i * 0.25, 11 - i * 0.4, 0.12, 0.5);
  for (const x of [-5.5, 0, 5.5]) {
    box(0x815139, x, 0.98, -19.5, 3.1, 0.2, 1.25);
    for (const side of [-1, 1]) box(PALETTE.wood, x + side * 1.2, 0.65, -19.5, 0.2, 0.62, 0.95);
    if (!ecosystemEnabled || x !== 5.5) {
      box(PALETTE.plaster, x - 0.2, 1.1, -19.4, 1.1, 0.035, 0.65, 0, -0.12);
      for (let i = 0; i < 5; i++) box(PALETTE.wood, x - 0.22, 1.123, -19.64 + i * 0.1, 0.8, 0.006, 0.02);
    }
    drum(0x6e9485, x + 1, 1.2, -19.5, 0.24, 0.24);
  }
  for (const side of [-1, 1]) {
    box(PALETTE.edge, 5.5, 0.86, -19.5 + side * 0.55, 2.62, 0.17, 0.10);
    box(PALETTE.gold, 5.5, 0.9, -19.5 + side * 0.606, 2.34, 0.018, 0.018);
    for (const x of [4.65, 5.5, 6.35]) box(PALETTE.gold, x, 0.84, -19.5 + side * 0.61, 0.08, 0.08, 0.018, 0, 0, Math.PI / 4);
  }
  // Carved screens and rafters frame the open side of the reading hall.
  for (const x of [-10, -6, -2, 2, 10]) {
    for (const edge of [-1, 1]) box(PALETTE.wood, x + edge * 0.86, 2.1, -18.23, 0.1, 2.85, 0.15);
    for (const y of [0.7, 1.1, 1.55, 3.02, 3.5]) box(PALETTE.edge, x, y, -18.23, 1.8, 0.10, 0.16);
    for (const offset of [-0.58, -0.29, 0, 0.29, 0.58]) {
      box(PALETTE.wood, x + offset, 2.26, -18.23, 0.065, 1.52, 0.09);
      box(PALETTE.gold, x + offset, 3.24, -18.23, 0.12, 0.12, 0.1, 0, 0, Math.PI / 4);
    }
  }
  for (let x = -12; x <= 12; x += 1.65) box(PALETTE.edge, x, 4.34, -22, 0.22, 0.23, 10.1);
  for (const x of [3.9, 7.8]) lantern(x, 3.25, -20.7);
  box(PALETTE.edge, 5.5, 2.97, -21.85, 1.8, 0.67, 0.08);
  for (const side of [-1, 1]) box(PALETTE.wood, 5.5 + side * 0.69, 3.83, -21.85, 0.08, 1.35, 0.08);
  // Gate and lantern avenue.
  offsetX = 0; offsetZ = 0;
  for (const x of [-4.6, 4.6]) {
    column(x, 35, 4.2);
    box(PALETTE.stone, x, 0.28, 35, 1.3, 0.5, 1.3);
    lantern(x < 0 ? -3.9 : 3.9, 3.3, 35);
  }
  box(PALETTE.wood, 0, 4.16, 35, 10.6, 0.4, 0.6);
  roof(0, 35, 12, 4, 4.5);
  for (const z of [24, 17, 6, -7, -13]) for (const side of [-1, 1]) {
    const x = side * (z > 12 ? 4.6 : 12.7);
    drum(PALETTE.stone, x, 0.22, z, 0.76, 0.44);
    drum(PALETTE.wood, x, 1.65, z, 0.17, 2.8);
    box(PALETTE.wood, x - side * 0.4, 3.04, z, 1, 0.13, 0.18);
    lantern(x - side * 0.78, 2.3, z);
  }
  // Incense altar stands in its own quiet garden west of the court.
  box(PALETTE.stone, -18, 0.16, 23, 3.8, 0.3, 3);
  box(PALETTE.red, -18, 0.72, 23, 2.9, 0.9, 1.5);
  box(PALETTE.wood, -18, 1.21, 23, 3.3, 0.2, 1.9);
  box(PALETTE.gold, -18, 0.8, 23.77, 2.3, 0.07, 0.035);
  drum(0x80623d, -18, 1.4, 23, 0.5, 0.25);
  object("head", 0xa77a3e, -18, 1.65, 23, 0.9, 0.55, 0.75);
  drum(PALETTE.gold, -18, 1.87, 23, 0.85, 0.14);
  for (const x of [-19.15, -16.85]) {
    drum(PALETTE.gold, x, 1.53, 23, 0.14, 0.5);
    object("leaf", PALETTE.light, x, 1.88, 23, 0.11, 0.22, 0.11);
    drum(0x86633d, x, 1.35, 23.48, .38, .07);
    for (const offset of [-.09, .09]) object("face", 0xd6934c, x + offset, 1.45, 23.48, .15, .18, .15);
  }
  for (const x of [-19.72, -16.28]) {
    box(PALETTE.wood, x, 1.59, 22.02, .2, 2.9, .23);
    box(PALETTE.gold, x, .49, 22.02, .27, .075, .29);
  }
  box(PALETTE.red, -18, 2.17, 21.93, 2.67, 1.68, .16);
  roof(-18, 22.18, 4.16, 1.72, 3.27);
  box(PALETTE.wood, 4, 1.85, -17.7, 1.5, 1.25, 1.05);
  box(PALETTE.red, 4, 2.52, -17.7, 1.66, 0.18, 1.2);
  box(PALETTE.gold, 4, 2.03, -17.15, 0.7, 0.4, 0.035);
  box(PALETTE.edge, 4, 2.62, -17.7, 0.7, 0.018, 0.08);
  // Open tea and meditation pavilions share the hall's roof and timber language.
  function pavilion(cx: number, cz: number, width: number, depth: number, accent: number, tiles: number[]) {
    box(PALETTE.stone, cx, 0.13, cz, width, 0.25, depth);
    box(0xbba17a, cx, 0.28, cz, width - 0.25, 0.06, depth - 0.25);
    for (const side of [-1, 1]) for (const end of [-1, 1]) column(cx + side * (width / 2 - 0.5), cz + end * (depth / 2 - 0.5), 3.15);
    box(PALETTE.wood, cx, 3.25, cz, width + 0.2, 0.25, depth);
    roof(cx, cz, width + 1.8, depth + 1.8, 3.55, tiles);
    const front = cz + depth / 2;
    box(PALETTE.edge, cx, 2.91, front + 0.02, 3.72, 1.04, .16);
    for (const side of [-1, 1]) {
      box(accent, cx + side * (width / 2 - 1.45), 2.18, front - 0.17, .53, 1.66, .08);
      box(PALETTE.gold, cx + side * (width / 2 - 1.45), 1.37, front - 0.12, .55, .055, .09);
    }
    for (const side of [-1, 1]) lantern(cx + side * width * 0.31, 2.55, cz + depth / 2 - 0.25);
  }
  offsetX = -6; offsetZ = 6.5;
  pavilion(-20, 8.5, 10, 5, 0x774477, [0x53455d, 0x64506b, 0x715979, 0x4b3d55]);
  offsetX = 0; offsetZ = 0;
  // Tu viện là công trình trung tâm, cao nhất; hiên và năm bậc thang mở ra sân.
  box(PALETTE.stone, 0, .6, -28, 34, 1.2, 22);
  box(0xe0be86, 0, 5.3, -39, 34, 8.2, .35);
  for (const x of [-16.7, 16.7]) box(0xcdb17c, x, 5.3, -28, .35, 8.2, 22);
  for (const x of [-15.5, -10.5, -5.5, 5.5, 10.5, 15.5]) for (const z of [-37.5, -18.6]) column(x, z, 9.1);
  box(PALETTE.edge, 0, 9.35, -18.4, 34.5, .5, .7);
  roof(0, -28, 38, 25, 9.6);
  box(PALETTE.red, 0, 12.9, -28.7, 23, 3.3, 12);
  roof(0, -28.7, 27, 16, 14.4);
  for (const x of [-9, -6, -3, 3, 6, 9]) {
    box(PALETTE.edge, x, 13, -22.63, 1.9, 2.1, .18);
    for (const offset of [-.55, 0, .55]) box(PALETTE.gold, x + offset, 13, -22.5, .07, 1.7, .08);
    box(PALETTE.gold, x, 13, -22.46, 1.7, .07, .08);
  }
  box(PALETTE.edge, 0, 10.6, -15.2, 11.5, 2.6, .25);
  for (const x of [-12, -6, 6, 12]) lantern(x, 8.2, -17.3);
  for (let step = 0; step < 5; step++) box(PALETTE.stone, 0, (step + 1) * .12, -13.4 - step * .8, 12.5, (step + 1) * .24, .8);
  for (const side of [-1, 1]) {
    for (let step = 0; step < 5; step++) drum(PALETTE.stone, side * 6.5, .7 + step * .24, -13.4 - step * .8, .35, 1.1);
    box(PALETTE.gold, side * 6.5, 1.85, -15.4, .18, .15, 4.3, -.29);
    lantern(side * 8, 3.2, -16.6);
  }
  monasteryGeometry = true;
  const templeX = -68;
  const templeGold = 0xd9a742, templeRed = 0x9d3028, templeCream = 0xe9cc8c;
  box(0xa35443, templeX, -0.03, -2, 32, 0.2, 34);
  for (let row = 0; row < 15; row++) for (let col = 0; col < 14; col++) {
    box((row + col) % 3 === 0 ? 0xbb7762 : 0xae6654, templeX - 15 + col * 2.3, 0.08, -17 + row * 2.3, 2.24, 0.03, 2.24);
  }
  box(0x7a2a24, templeX, 4.4, -18.1, 32, 8.8, 0.5);
  box(templeCream, templeX - 16, 4.2, -2, 0.4, 8.4, 32);
  box(templeCream, templeX + 16, 4.2, -2, 0.4, 8.4, 32);
  box(0x8f593d, templeX, 9.0, -2, 32, 0.25, 34);
  for (const z of [-15, -8, -1, 6, 13]) {
    box(templeRed, templeX, 8.15, z, 32, 0.48, 0.45);
    box(templeGold, templeX, 7.88, z, 32, 0.05, 0.5);
    for (const x of [-12.8, 12.8]) {
      drum(0xf2d49d, templeX + x, 0.22, z, 1.45, 0.4);
      drum(templeRed, templeX + x, 4.15, z, 0.97, 7.6);
      drum(templeGold, templeX + x, 7.8, z, 1.2, 0.3);
      for (let band = 1; band <= 6; band++) drum(0xa9402c, templeX + x, band * 1.05, z, 0.995, 0.035);
    }
    for (const x of [-8, 8]) lantern(templeX + x, 7.2, z);
  }
  for (const x of [-10, -5, 0, 5, 10]) box(0xa23929, templeX + x, 8.65, -2, 0.28, 0.25, 34);
  // Các hốc tượng nhỏ được gom vào InstancedMesh cùng các vật liệu của điện.
  for (let row = 0; row < 6; row++) for (let col = 0; col < 27; col++) {
    const x = templeX - 14.6 + col * 1.12, y = 1.3 + row * 1.05;
    box(templeGold, x, y, -17.73, 0.91, 0.88, 0.15);
    box(0x492522, x, y + 0.02, -17.59, 0.72, 0.69, 0.15);
    object("head", templeGold, x, y - 0.12, -17.40, 0.34, 0.23, 0.18);
    object("head", templeGold, x, y + 0.14, -17.40, 0.18, 0.22, 0.17);
    box(0xf0d17d, x, y - 0.33, -17.36, 0.56, 0.05, 0.22);
  }
  box(templeGold, templeX, 0.6, -13, 25, 1.1, 5.3);
  box(0xf3ce78, templeX, 1.16, -13, 25.3, 0.16, 5.5);
  for (const side of [-1, 1]) box(0x8d3129, templeX + side * 12.3, 0.65, -10.26, 0.3, 0.9, 0.1);
  for (const offset of [-8, 0, 8]) {
    const x = templeX + offset;
    for (const side of [-1, 1]) {
      const vaseX = x + side * 2.3;
      drum(0xead7aa, vaseX, 1.6, -10.9, 0.5, 0.65);
      for (const petal of [-1, 0, 1]) {
        box(0x617d48, vaseX + petal * 0.15, 2.15, -10.9, 0.035, 0.9, 0.035);
        object("head", petal === 0 ? 0xeab7c4 : 0xf4dbaa, vaseX + petal * 0.2, 2.58 + petal * 0.15, -10.9, 0.4, 0.35, 0.35);
      }
    }
  }
  for (let row = 0; row < 4; row++) for (let col = 0; col < 7; col++) {
    drum(0xc79b49, templeX - 9 + col * 3, 0.23, -6 + row * 3.5, 1.5, 0.25, 1.2);
    drum(0xeac16b, templeX - 9 + col * 3, 0.37, -6 + row * 3.5, 1.42, 0.08, 1.14);
  }
  // Hương án và vườn sen nhỏ ở phía trước điện.
  box(0xa35b38, templeX, 0.85, -9, 4.2, 1.3, 1.15);
  box(templeGold, templeX, 1.53, -9, 4.4, 0.13, 1.3);
  drum(templeGold, templeX, 1.82, -9, 0.8, 0.5);
  for (const x of [-0.15, 0, 0.15]) box(0x9b6238, templeX + x, 2.3, -9, 0.04, 0.8, 0.04);
  for (let lamp = 0; lamp < 8; lamp++) {
    const x = templeX - 10.5 + lamp * 3;
    drum(templeGold, x, 0.43, -8.2, 0.36, 0.65);
    object("head", PALETTE.light, x, 0.85, -8.2, 0.12, 0.28, 0.12);
  }
  monasteryGeometry = false;
  offsetX = -6; offsetZ = 6.5;
  for (const side of [-1, 1]) for (const offset of [-1, 0, 1]) {
    box(offset === 0 ? 0xc58bb9 : 0x946295, -20 + side * 2.7 + offset * .17, 2.95, 11.07 + offset * .015, .26, .52, .055, 0, 0, offset * .28);
  }
  drum(PALETTE.wood, -20, 0.93, 8.4, 3.4, 0.22, 1.75);
  for (const x of [-22.2, -20, -17.8]) {
    drum(0x70553d, x, 0.51, 10.1, 0.7, 0.42);
    drum(0x617c70, x, 0.77, 10.1, 0.74, 0.13);
  }
  object("head", 0x789d87, -21.1, 1.18, 7.95, 0.55, 0.44, 0.5);
  drum(0x789d87, -21.1, 1.4, 7.95, 0.28, 0.07);
  object("box", 0x789d87, -20.75, 1.19, 7.95, 0.4, 0.17, 0.17, 0, 0, 0.35);
  for (const x of [-19.5, -18.8]) drum(0xe5d6b2, x, 1.12, 8.05, 0.2, 0.18);
  offsetX = 10; offsetZ = 0;
  pavilion(18, 0.4, 8, 6, 0x38695c, [0x36564e, 0x496959, 0x597765, 0x35574c]);
  for (const side of [-1, 1]) {
    const x = 18 + side * 2.65;
    for (const y of [2.75, 3.12]) box(PALETTE.gold, x, y, 3.48, .56, .08, .08);
    for (const gap of [-.18, .18]) box(PALETTE.gold, x + gap, 2.93, 3.48, .20, .08, .08);
  }
  for (const x of [15.7, 18, 20.3]) {
    drum(0x9d4e3e, x, 0.43, 2, 1.25, 0.24, 1);
    drum(PALETTE.gold, x, 0.56, 2, 1.1, 0.035, 0.87);
  }
  // Round welcome medallion and benches around the central garden.
  offsetX = 0; offsetZ = 0;
  drum(0x927350, 0, 0.075, 10, 4, 0.04);
  drum(0xdfbd86, 0, 0.102, 10, 3.7, 0.02);
  for (let i = 0; i < 8; i++) box(PALETTE.wood, Math.sin(i * Math.PI / 4) * 1.3, 0.12, 10 + Math.cos(i * Math.PI / 4) * 1.3, 0.45, 0.018, 0.17, 0, i * Math.PI / 4);
  for (const [x, z, rotation] of [[-15, 1, 0], [-26, 14, 0], [9, 23, Math.PI / 2], [24, -7, 0]]) {
    box(PALETTE.wood, x, 0.56, z, 3.2, 0.18, 0.75, 0, rotation);
    for (const side of [-1, 1]) box(PALETTE.stone, x + Math.cos(rotation) * side * 1.15, 0.28, z - Math.sin(rotation) * side * 1.15, 0.3, 0.5, 0.5, 0, rotation);
  }
  // Lotus lake: procedural reflected sky, moving ripples and bright evening glints.
  const waterGeometry = new THREE.CircleGeometry(1, 80);
  const waterMaterial = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 } }, transparent: false,
    vertexShader: `varying vec3 world; void main(){vec4 p=modelMatrix*vec4(position,1.); world=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}`,
    fragmentShader: `uniform float time; varying vec3 world;
      void main(){vec2 p=world.xz; vec3 view=normalize(cameraPosition-world);
        float waves=sin(p.x*2.2+time*.8)*cos(p.y*1.8-time*.6);
        vec3 normal=normalize(vec3(.075*cos(p.x*2.2+time*.8),1.,.075*sin(p.y*1.8-time*.6)));
        float fresnel=pow(1.-max(dot(view,normal),0.),3.);
        vec3 reflected=reflect(-view,normal);
        vec3 color=mix(vec3(.038,.16,.15),vec3(.31,.50,.62),fresnel*.87);
        float highlight=pow(max(dot(reflected,normalize(vec3(-.6,.28,-.8))),0.),90.);
        float ripple=pow(max(0.,sin(p.y*9.+p.x*2.+waves*.9-time)),16.);
        float lamps=exp(-abs(p.x-13.4)*.75)*pow(max(0.,cos((p.y-15.35)*1.53+waves*.38)),5.);
        color+=vec3(1.,.60,.23)*(highlight*.62+lamps*.24)+vec3(.34,.61,.79)*ripple*.12+waves*.018;
        gl_FragColor=vec4(color,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const water = new THREE.Mesh(waterGeometry, waterMaterial);
  water.rotation.x = -Math.PI / 2;
  water.scale.set(QUAN_POND.radiusX, QUAN_POND.radiusZ, 1);
  water.position.set(QUAN_POND.x, 0.09, QUAN_POND.z);
  scene.add(water);
  for (let i = 0; i < 68; i++) {
    const angle = i * Math.PI * 2 / 68;
    const x = QUAN_POND.x + Math.sin(angle) * (QUAN_POND.radiusX + 0.15);
    const z = QUAN_POND.z + Math.cos(angle) * (QUAN_POND.radiusZ + 0.15);
    object("leaf", [0x9e9c7e, 0xb1aa8d, 0x92957a][i % 3], x, 0.13, z, 0.95 + i % 3 * 0.12, 0.46, 0.95, 0, angle);
  }
  for (let i = 0; i < 25; i++) {
    const angle = i * 2.39996;
    const spread = 0.2 + (i % 7) * 0.095;
    const x = 20 + Math.cos(angle) * spread * 7;
    const z = 18 + Math.sin(angle) * spread * 9;
    drum(0x5f7c4d, x, 0.125, z, 0.7 + i % 3 * 0.16, 0.035, 0.67);
    if (i % 3 === 0) continue;
    for (let j = 0; j < 7; j++) {
      const a = j * Math.PI * 2 / 7;
      object("leaf", j % 2 ? 0xe8a6a0 : 0xca7c85, x + Math.cos(a) * 0.18, 0.29, z + Math.sin(a) * 0.18, 0.29, 0.29, 0.2, 0, -a);
    }
    object("leaf", PALETTE.light, x, 0.38, z, 0.19, 0.13, 0.19);
  }
  // A viewing deck stays on the safe western shore; paths never cross deep water.
  for (let i = 0; i < 19; i++) box(0x8c6746, 11.1, 0.18, 15.2 + i * 0.38, 3.1, 0.16, 0.34);
  for (const z of [15.2, 17.5, 19.8, 22]) {
    drum(PALETTE.wood, 12.55, 0.68, z, 0.13, 1.08);
    drum(PALETTE.gold, 12.55, 1.23, z, 0.2, 0.1);
  }
  box(PALETTE.wood, 12.55, 0.94, 18.6, 0.13, 0.13, 7.1);
  if (ecosystemEnabled) {
    // A roofed honor board before the hall and a small stall on the bamboo path.
    for (const x of [-12.72, -7.28]) {
      drum(PALETTE.stone, x, 0.25, -6.53, .73, .48);
      box(PALETTE.wood, x, 2.2, -6.53, .33, 3.62, .34);
      box(PALETTE.gold, x, .59, -6.53, .38, .1, .39);
      lantern(x, 2.85, -6.21);
    }
    box(PALETTE.stone, -10, .17, -6.53, 6.06, .32, .94);
    box(PALETTE.edge, -10, 2.18, -6.53, 5.35, 2.91, .22);
    box(PALETTE.gold, -10, .68, -6.39, 5.44, .12, .24);
    roof(-10, -6.53, 6.54, 2.28, 4.03);
    for (const x of [-15.1, -12.9]) {
      box(PALETTE.wood, x, 1.43, 12.1, 0.15, 2.65, 0.17);
      box(PALETTE.wood, x, 1.43, 13.1, 0.15, 2.65, 0.17);
    }
    roof(-14, 12.6, 2.85, 1.75, 2.74);
    box(PALETTE.edge, -14, 0.55, 12.65, 2.16, 0.94, 0.62);
    box(PALETTE.wood, -14, 1.01, 12.65, 2.3, 0.12, 0.79);
    for (const x of [-14.69, -14.30, -13.91]) box(PALETTE.plaster, x, 1.087, 12.63, 0.29, 0.035, 0.45);
    lantern(-14, 2.16, 12.2);
    for (const z of [15.35, 19.9, 22.0]) lantern(12.53, 1.54, z);
    for (const z of [-10.2, -3.2, 4.4, 11.8, 28.4]) for (const side of [-1, 1]) {
      const x = side * (z < 8 ? 11.85 : 4.1);
      drum(PALETTE.stone, x, .13, z, .7, .25);
      drum(PALETTE.wood, x, .78, z, .18, 1.12);
      box(PALETTE.edge, x, 1.35, z, .62, .1, .6);
      box(PALETTE.light, x, 1.59, z, .38, .43, .38);
      object("cone", PALETTE.ridge, x, 1.92, z, .68, .23, .68);
    }
    for (let i = 0; i < 56; i++) {
      const a = i * 2.39996;
      const x = 20 + Math.sin(a) * (7.45 + (i % 3) * .23);
      const z = 18 + Math.cos(a) * (9.45 + (i % 3) * .23);
      if (x < 13.4) continue;
      object("leaf", i % 3 ? 0x4f7551 : 0x9ca85d, x, .23, z, .13, .47, .38, .2, a, .32);
      if (i % 5 === 0) object("head", 0xe5a194, x, .45, z, .19, .14, .18);
    }
  }
  // Bamboo grove, flowering trees, rocks and individual flower beds, all instanced.
  for (let i = 0; i < 28; i++) {
    const x = -54 + (i % 4) * 1.06;
    const z = -12 + Math.floor(i / 4) * 3.4;
    const height = 4 + (i * 7 % 10) * 0.23;
    drum(0x637b45, x, height / 2, z, 0.13, height);
    for (let node = 1; node <= 5; node++) {
      drum(0x87945a, x, node * height / 6, z, 0.16, 0.045);
      if (node < 3) continue;
      const a = i + node * 2.3;
      object("leaf", [0x627c46, 0x8b9a57, 0x748d4e][node % 3], x + Math.sin(a) * 0.65, node * height / 6 + 0.3, z + Math.cos(a) * 0.65, 1.9, 0.38, 0.7, 0, a, 0.2);
    }
  }
  for (const [x, z, size, warm] of [
    [-24, -21, 6.4, 0], [24, -24, 7, 0], [-18, -13, 5.6, 1], [18, -13, 6, 1],
    [-17, 22, 5, 1], [-25, 28, 5.5, 0], [-11, 29, 5, 1], [7, 30, 4.6, 1],
    [29, 3, 5.7, 0], [30, 29, 6, 0], [-30, -26, 7, 0], [30, -17, 6, 0],
  ]) tree(x, z, size, !!warm);
  for (let i = 0; i < 120; i++) {
    const patch = i % 6;
    const [cx, cz] = [[-18, -2], [-21, 21], [-8, 20], [7, -5], [27, -6], [-11, -12]][patch];
    const a = i * 2.4;
    const radius = 0.45 + ((i * 7) % 17) * 0.16;
    const x = cx + Math.cos(a) * radius;
    const z = cz + Math.sin(a) * radius;
    object("leaf", [0x7b8f51, 0x637d48, 0x8c9857][i % 3], x, 0.24, z, 0.67, 0.53, 0.65);
    if (i % 2) object("leaf", [0xe2b088, 0xd58d88, 0xebd19a][i % 3], x, 0.54, z, 0.24, 0.21, 0.24);
  }
  for (let i = 0; i < 15; i++) {
    object("leaf", [0x91957b, 0xa6a288, 0x7d876f][i % 3], -53 + i % 3 * 1.4, 0.35, -15 + Math.floor(i / 3) * 1.3,
      1.2 + i % 3 * 0.3, 0.8 + i % 2 * 0.7, 1.4, 0, i * 1.4);
  }
  const groundShadows = new THREE.MeshBasicMaterial({ color: 0x36402d, transparent: true, opacity: 0.19, depthWrite: false });
  const glowCanvas = document.createElement("canvas");
  glowCanvas.width = glowCanvas.height = 64;
  const glowContext = glowCanvas.getContext("2d")!;
  const glow = glowContext.createRadialGradient(32, 32, 0, 32, 32, 32);
  glow.addColorStop(0, "rgba(255,199,115,0.6)");
  glow.addColorStop(0.4, "rgba(255,182,85,0.23)");
  glow.addColorStop(1, "rgba(255,182,85,0)");
  glowContext.fillStyle = glow;
  glowContext.fillRect(0, 0, 64, 64);
  const glowTexture = new THREE.CanvasTexture(glowCanvas);
  glowTexture.colorSpace = THREE.SRGBColorSpace;
  const glowGeometry = new THREE.PlaneGeometry(2, 2);
  const glowMaterial = new THREE.MeshBasicMaterial({ map: glowTexture, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.48 });
  const pools = new THREE.InstancedMesh(glowGeometry, glowMaterial, lanternPools.length);
  lanternPools.forEach((matrix, index) => pools.setMatrixAt(index, matrix));
  scene.add(pools);
  for (const entry of batches.values()) {
    const mesh = new THREE.InstancedMesh(geometry[entry.shape], material(entry.color), entry.matrices.length);
    if (entry.monastery) mesh.layers.set(1);
    entry.matrices.forEach((matrix, index) => mesh.setMatrixAt(index, matrix));
    mesh.castShadow = entry.matrices.some(matrix => matrix.elements[13] > 0.7);
    mesh.receiveShadow = true;
    scene.add(mesh);
  }
  const signs: THREE.Sprite[] = [];
  for (const [title, x, y, z, large] of [
    ["Tử Vi Quán", 0, 4.22, 35.4, true],
    ...QUAN_STATIONS.filter(station => !["greet", "tea", "iching", "incense"].includes(station.id) && (station.id !== "ranking" || !ecosystemEnabled)).map(station =>
      [station.label, station.x, station.id === "teacher" ? 2.75 : 2.55, station.z - 0.8, false] as const),
  ] as const) {
    const sprite = label(title, large);
    sprite.position.set(x, y, z);
    signs.push(sprite);
    scene.add(sprite);
  }

  // Nhân vật khách và động tác, dùng lại lưới và vật liệu.
  const visitors = new Map<string, ReturnType<typeof avatar>>();
  function avatar(color: number, name: string, detailed = false) {
    const group = new THREE.Group();
    const body = new THREE.Group();
    const arms = [new THREE.Group(), new THREE.Group()];
    const robe = new THREE.MeshStandardMaterial({ color, roughness: 0.9, normalMap: detailed ? assets?.cloth : null, normalScale: new THREE.Vector2(0.32, 0.32) });
    function part(parent: THREE.Object3D, shape: Shape, colorValue: number, x: number, y: number, z: number, sx: number, sy: number, sz = sx) {
      const mesh = new THREE.Mesh(geometry[shape], colorValue === color ? robe : material(colorValue));
      mesh.position.set(x, y, z);
      mesh.scale.set(sx, sy, sz);
      parent.add(mesh);
      return mesh;
    }
    if (ecosystemEnabled) {
      part(body, "cone", color, 0, 0.75, 0, 0.68, 0.94, 0.47);
      part(body, "drum", color, 0, 1.1, 0, 0.23, 0.16, 0.24);
      part(body, "box", PALETTE.gold, 0.06, 0.91, 0.225, 0.017, 0.35, 0.014);
    } else part(body, "cone", color, 0, 0.76, 0, 0.58, 0.77, 0.42);
    part(body, "drum", PALETTE.gold, 0, 0.71, 0, 0.52, 0.055, 0.4);
    if (detailed) {
      const hair = name === "Thầy Tử Vi" ? 0x777167 : 0x332321;
      part(body, "drum", 0xc28a60, 0, 1.123, 0, 0.16, 0.19, 0.15);
      part(body, "face", 0xd69d72, 0, 1.355, 0.013, 0.38, 0.44, 0.34);
      part(body, "face", hair, 0, 1.46, -0.065, 0.394, 0.30, 0.325);
      part(body, "face", 0xd69d72, 0, 1.332, 0.184, 0.066, 0.085, 0.076);
      for (const side of [-1, 1]) {
        part(body, "face", 0xc28a60, side * 0.175, 1.349, 0.013, 0.065, 0.109, 0.075);
        part(body, "face", 0x46302c, side * 0.077, 1.38, 0.16, 0.064, 0.024, 0.026);
        part(body, "face", 0x30231d, side * 0.079, 1.382, 0.175, 0.025, 0.023, 0.014);
        part(body, "face", hair, side * 0.078, 1.415, 0.158, 0.075, 0.016, 0.017).rotation.z = side * -0.14;
        part(body, "box", PALETTE.gold, side * 0.071, 1.04, 0.175, 0.024, 0.22, 0.021).rotation.z = side * 0.43;
      }
    } else {
      part(body, "head", 0xe9b180, 0, 1.34, 0, 0.49, 0.51, 0.46);
      part(body, "head", 0x40302a, 0, 1.53, -0.04, 0.53, 0.22, 0.48);
      for (const side of [-1, 1]) part(body, "head", 0x34241d, side * 0.087, 1.35, 0.213, 0.04, 0.045, 0.035);
    }
    const mouth = part(body, "face", 0x743c35, 0, detailed ? 1.278 : 1.235, detailed ? 0.176 : 0.224, 0.074, 0.018, 0.024);
    const legs = [-1, 1].map((side, index) => {
      const leg = new THREE.Group();
      leg.position.set(side * 0.15, 0.34, 0);
      part(leg, "box", 0x43372f, 0, -0.13, 0, 0.16, 0.34, 0.17);
      part(leg, "box", PALETTE.edge, 0, -0.27, 0.04, 0.19, 0.085, 0.25);
      body.add(leg);
      const arm = arms[index];
      arm.position.set(side * 0.245, 1.01, 0);
      part(arm, "drum", color, 0, -0.18, 0, 0.18, 0.36);
      part(arm, "head", 0xe9b180, 0, -0.37, 0, 0.16, 0.17, 0.15);
      body.add(arm);
      return leg;
    });
    const badge = label(name);
    badge.scale.multiplyScalar(0.59);
    badge.position.set(0, 1.98, 0);
    const ground = new THREE.Mesh(geometry.drum, groundShadows);
    ground.scale.set(0.78, 0.005, 0.49);
    ground.position.y = 0.03;
    group.add(body, badge, ground);
    scene.add(group);
    return { group, body, badge, arms, legs, mouth, name, robe };
  }
  function pose(visitor: ReturnType<typeof avatar>, action: string, seconds: number, walking: boolean, reduced: boolean) {
    const stride = walking && !reduced ? Math.sin(seconds * 14) * 0.48 : 0;
    visitor.body.position.y = (action === "meditate" || action === "seated") ? -0.26 : Math.abs(stride) * (ecosystemEnabled ? 0.045 : 0.09) + (!ecosystemEnabled || reduced ? 0 : Math.sin(seconds * 1.6) * 0.008);
    visitor.body.rotation.x = action === "greet" ? 0.15 : 0;
    visitor.badge.position.y = (action === "meditate" || action === "seated") ? 1.73 : 1.98;
    visitor.legs.forEach((leg, i) => {
      leg.rotation.x = (action === "meditate" || action === "seated") ? -Math.PI / 2 : stride * (i === 0 ? 1 : -1);
      leg.rotation.z = (action === "meditate" || action === "seated") ? (i === 0 ? -0.5 : 0.5) : 0;
    });
    visitor.arms.forEach((arm, i) => {
      arm.rotation.x = action === "greet" ? -1.83 : action === "incense" ? -1.3 : (action === "meditate" || action === "seated") ? -0.6 : -stride * (i === 0 ? 1 : -1);
      arm.rotation.z = action === "greet" ? (i === 0 ? 0.52 : -0.52) : 0;
    });
  }
  const self = avatar(0x506f7e, "Bạn", true);
  const templeSash = new THREE.Mesh(geometry.box, material(0xdcb758));
  templeSash.position.set(0, 0.86, 0.28); templeSash.scale.set(0.11, 0.74, 0.045); templeSash.rotation.z = -0.66;
  self.body.add(templeSash);
  const templeBeads = new THREE.Group();
  for (let bead = 0; bead < 18; bead++) {
    const a = bead / 18 * Math.PI * 2;
    const mesh = new THREE.Mesh(geometry.head, material(0xc39143));
    mesh.position.set(Math.cos(a) * 0.26, 1.17 - (Math.sin(a) + 1) * 0.055, Math.sin(a) * 0.23);
    mesh.scale.setScalar(0.065); templeBeads.add(mesh);
  }
  self.body.add(templeBeads);
  self.group.traverse(node => node.layers.enable(1));
  self.badge.visible = false;
  self.body.rotation.y = Math.PI;
  self.group.position.set(latest.current.position.x, 0.054, latest.current.position.z);
  const hostKinds: QuanHost[] = ["tuvi", "tarot", "iching", "tuvi", "tuvi"];
  const teachers = hostKinds.map((kind, index) => {
    const teacher = avatar([0x6f4430, 0x694052, 0x57706b, 0x643743, 0x46566a][index], ["Thầy Tử Vi · Bàn 3", "Cô Tarot", "Thầy Dịch", "Thầy Tử Vi · Bàn 1", "Thầy Tử Vi · Bàn 2"][index], true);
    const locations = [[-30.5, 0.4, -12.45], [-26, 0.31, 13.75], [28, 0.3, -0.8], [-41.5, 0.4, -12.45], [-36, 0.4, -12.45]];
    teacher.group.position.set(locations[index][0], locations[index][1], locations[index][2]);
    teacher.group.userData.host = kind;
    if (kind === "tuvi") teacher.group.userData.desk = index === 0 ? 3 : index - 2;
    pose(teacher, "seated", 0, false, true);
    if (index !== 1) {
      const hat = new THREE.Mesh(geometry.drum, material(0x3c2b27));
      hat.position.set(0, 1.6, -0.02); hat.scale.set(0.43, 0.19, 0.39); teacher.body.add(hat);
      const rim = new THREE.Mesh(geometry.drum, material(PALETTE.gold));
      rim.position.copy(hat.position); rim.position.y -= 0.049; rim.scale.set(0.44, 0.025, 0.40); teacher.body.add(rim);
      for (const side of [-1, 1]) {
        const moustache = new THREE.Mesh(geometry.face, material(index === 0 ? 0xaba397 : 0x594a43));
        moustache.position.set(side * 0.045, 1.268, 0.173); moustache.scale.set(0.087, 0.033, 0.038); moustache.rotation.z = side * -0.33;
        teacher.body.add(moustache);
      }
      const beard = new THREE.Mesh(geometry.face, material(index === 0 ? 0xc0b7a8 : 0x64574d));
      beard.position.set(0, 1.17, 0.146); beard.scale.set(0.14, 0.14, 0.10); teacher.body.add(beard);
    } else {
      const bun = new THREE.Mesh(geometry.face, material(0x2d201c));
      bun.position.set(0, 1.51, -0.22); bun.scale.set(0.25, 0.23, 0.25); teacher.body.add(bun);
    }
    return teacher;
  });
  function ritualPart(shape: Shape, color: number, x: number, y: number, z: number, sx: number, sy: number, sz: number) {
    const mesh = new THREE.Mesh(geometry[shape], material(color)); mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz); scene.add(mesh); return mesh;
  }
  const monasterySeats = QUAN_MONASTERY_SEATS.map(seat => {
    const mesh = ritualPart("drum", 0xf2d17c, templeX + seat.x, 0.422, seat.z, 1.48, 0.025, 1.18);
    mesh.layers.set(1); mesh.userData.seatIndex = seat.index;
    return mesh;
  });
  const seatCushions = teachers.flatMap((teacher, index) => [0, 2.5].map(offset => {
    const seat = ritualPart("drum", index === 1 ? 0x6d466f : 0x617c70, teacher.group.position.x, teacher.group.position.y + 0.11, teacher.group.position.z + offset, 0.85, 0.2, 0.7); return seat;
  }));
  const tableSkins = [-41.5, -36, -30.5].map(x => ritualPart("box", 0x354e67, x, 1.081, -11.5, 3.1, 0.012, 1.25));
  const altarSkin = ritualPart("box", 0xa33d31, -18, 0.72, 23, 2.91, 0.9, 1.51);
  const templeLight = new THREE.PointLight(0xffd49b, 45, 42, 1.4);
  templeLight.layers.set(1);
  templeLight.position.set(templeX, 6.2, -9); scene.add(templeLight);
  const statueLights = [-8, 0, 8].map(offset => {
    const light = new THREE.PointLight(0xffe6b3, 28, 15, 1.3);
    light.position.set(templeX + offset, 6.5, -9.5); light.layers.set(1); scene.add(light); return light;
  });
  const readingDecor: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>[] = [];
  function paintedPanel(width: number, height: number, paint: (ctx: CanvasRenderingContext2D) => void) {
    const surface = document.createElement("canvas"); surface.width = surface.height = 512;
    const ctx = surface.getContext("2d")!; paint(ctx);
    const map = new THREE.CanvasTexture(surface); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4;
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshStandardMaterial({ map, roughness: 0.9 }));
    panel.receiveShadow = true;
    readingDecor.push(panel); scene.add(panel); return panel;
  }
  function paintRanking(ctx: CanvasRenderingContext2D, leaders: NonNullable<SceneProps["leaders"]>) {
    const lacquer = ctx.createLinearGradient(0, 0, 512, 512);
    lacquer.addColorStop(0, "#79362c"); lacquer.addColorStop(1, "#251418");
    ctx.fillStyle = lacquer; ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = "#d7a257"; ctx.lineWidth = 4; ctx.strokeRect(10, 12, 492, 488);
    ctx.lineWidth = 1.5; ctx.strokeRect(18, 22, 476, 468);
    ctx.fillStyle = "#ffe1a2"; ctx.textAlign = "center"; ctx.font = "800 32px 'Quan Sans', sans-serif";
    ctx.fillText("BẢNG VÀNG CÔNG ĐỨC", 256, 72, 430);
    ctx.font = "600 18px 'Quan Sans', sans-serif"; ctx.fillText("VINH DANH ĐIỂM AN NHIÊN", 256, 105);
    for (let index = 0; index < 5; index++) {
      const y = 134 + index * 67, leader = leaders[index];
      ctx.fillStyle = index === 0 ? "#9a5b2e" : "#3f2525";
      ctx.beginPath(); ctx.roundRect(36, y, 440, 53, 8); ctx.fill();
      ctx.fillStyle = index < 3 ? ["#f6ce74", "#d8c4a8", "#d8a06d"][index] : "#8f6043";
      ctx.beginPath(); ctx.arc(66, y + 26, 17, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#2e191a"; ctx.font = "800 19px 'Quan Sans', sans-serif";
      ctx.textAlign = "center"; ctx.fillText(String(index + 1), 66, y + 33);
      ctx.fillStyle = "#ffe9c2"; ctx.font = "650 22px 'Quan Sans', sans-serif";
      ctx.textAlign = "left"; ctx.fillText(leader?.alias ?? "—", 95, y + 34, 245);
      if (leader) { ctx.textAlign = "right"; ctx.fillText(`${leader.points} điểm`, 454, y + 34, 105); }
    }
  }
  const rankingBoard = ecosystemEnabled ? paintedPanel(5.14, 2.75, ctx => paintRanking(ctx, [])) : null;
  rankingBoard?.position.set(-10, 2.18, -6.408);
  function facadePlate(title: string, subtitle: string, color: string, width: number, height: number) {
    const plate = paintedPanel(width, height, ctx => {
      const trim = ctx.createLinearGradient(0, 0, 0, 512);
      trim.addColorStop(0, "#fbe5ad"); trim.addColorStop(.45, "#aa6b3d"); trim.addColorStop(1, "#edbb70");
      ctx.fillStyle = color; ctx.fillRect(0, 0, 512, 512);
      ctx.strokeStyle = trim; ctx.lineWidth = 10; ctx.strokeRect(12, 21, 488, 470);
      ctx.lineWidth = 3; ctx.strokeRect(24, 46, 464, 420);
      ctx.fillStyle = "#ffdc91";
      for (const x of [41, 471]) {
        ctx.beginPath(); ctx.moveTo(x, 213); ctx.lineTo(x + 10, 256); ctx.lineTo(x, 299); ctx.lineTo(x - 10, 256); ctx.fill();
      }
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      const stretch = width / height * .94;
      ctx.scale(1, stretch);
      ctx.font = "800 63px 'Quan Sans', sans-serif";
      ctx.fillText(title, 256, 211 / stretch, 399);
      ctx.font = "650 24px 'Quan Sans', sans-serif";
      ctx.fillText(subtitle, 256, 349 / stretch, 392);
    });
    plate.material.emissive.setHex(0xffe2b7);
    plate.material.emissiveMap = plate.material.map;
    plate.material.emissiveIntensity = width > 6 ? .62 : .35;
    return plate;
  }
  facadePlate("TỬ VI QUÁN", "BA BÀN THẦY · LUẬN LÁ SỐ", "#4d2423", 6.31, 1.46).position.set(-36, 7.5, -10.71);
  facadePlate("TAROT QUÁN", "CÔ TAROT · TRẢI BÀI", "#402743", 3.59, .92).position.set(-26, 2.91, 17.608);
  facadePlate("KINH DỊCH QUÁN", "THẦY DỊCH · GIEO QUẺ", "#214440", 3.59, .92).position.set(28, 2.91, 3.508);
  facadePlate("BÀN THỜ THẦN TÀI", "XIN LỘC ĐẦU NGÀY", "#5a2824", 2.5, 1.43).position.set(-18, 2.2, 22.02);
  facadePlate("TU VIỆN AN NHIÊN", "ĐIỆN PHẬT · THIỀN · TRÀNG HẠT", "#6a2b24", 11.2, 2.4).position.set(0, 10.6, -15.04);
  const templePlaque = facadePlate("TU VIỆN AN NHIÊN", "MỘT KHOẢNG LẶNG CHO MỖI NGÀY", "#6a2b24", 6.1, 1.23);
  templePlaque.position.set(templeX, 7.53, -17.31); templePlaque.layers.set(1);
  let previousLeaders: SceneProps["leaders"];
  if (ecosystemEnabled) {
    const rug = paintedPanel(4.3, 4.4, ctx => {
      ctx.fillStyle = "#4f2525"; ctx.fillRect(0, 0, 512, 512);
      ctx.strokeStyle = "#ac8454";
      for (const edge of [12, 25, 50, 60]) { ctx.lineWidth = edge === 25 ? 3 : 2; ctx.strokeRect(edge, edge, 512 - edge * 2, 512 - edge * 2); }
      ctx.fillStyle = "#9a6244";
      for (let row = 1; row < 8; row++) for (let col = 1; col < 8; col++) {
        ctx.save(); ctx.translate(col * 64, row * 64); ctx.rotate(Math.PI / 4); ctx.fillRect(-7, -7, 14, 14); ctx.restore();
      }
    });
    rug.position.set(-30.5, 0.407, -11.2); rug.rotation.x = -Math.PI / 2;
    const chart = paintedPanel(1.65, 0.97, ctx => {
      ctx.fillStyle = "#b68b55"; ctx.fillRect(0, 0, 512, 512);
      ctx.strokeStyle = "#623821"; ctx.lineWidth = 3; ctx.strokeRect(12, 12, 488, 488); ctx.strokeRect(22, 22, 468, 468);
      ctx.save(); ctx.translate(256, 256); ctx.scale(0.74, 1.19);
      for (const radius of [45, 78, 126, 154, 168]) { ctx.beginPath(); ctx.arc(0, 0, radius, 0, 2 * Math.PI); ctx.stroke(); }
      for (let sector = 0; sector < 12; sector++) {
        ctx.rotate(Math.PI / 6); ctx.beginPath(); ctx.moveTo(0, 77); ctx.lineTo(0, 169); ctx.stroke();
        ctx.fillStyle = "#633820"; ctx.fillRect(12, 135, 22, 3); ctx.fillRect(12, 142, 22, 3);
      }
      ctx.restore(); ctx.font = "700 23px 'Quan Sans', sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#633820"; ctx.fillText("TỬ VI", 256, 264);
    });
    chart.position.set(-30.5, 1.084, -11.5); chart.rotation.x = -Math.PI / 2;
    const plaque = paintedPanel(1.7, 0.58, ctx => {
      ctx.fillStyle = "#4c2521"; ctx.fillRect(0, 0, 512, 512);
      ctx.strokeStyle = "#c18d4d"; ctx.lineWidth = 7; ctx.strokeRect(14, 24, 484, 464); ctx.strokeRect(31, 58, 450, 396);
      ctx.save(); ctx.scale(1, 2.5); ctx.font = "700 79px 'Quan Sans', sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#f2c779"; ctx.fillText("TỬ VI", 256, 133); ctx.restore();
    });
    plaque.position.set(-30.5, 2.97, -13.8);
  }
  const tableLight = new THREE.PointLight(0xffab5e, 0, 7, 2);
  scene.add(tableLight);
  const chartHalo = new THREE.Group(); chartHalo.position.set(-30.5, 1.22, -11.5); chartHalo.visible = false; scene.add(chartHalo);
  const haloGeometry = new THREE.RingGeometry(0.58, 0.596, 48);
  const haloMaterial = new THREE.MeshBasicMaterial({ color: 0xf6c773, transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide });
  const focusMaterial = haloMaterial.clone(); focusMaterial.color.setHex(0xfff2c2);
  const circle = new THREE.Mesh(haloGeometry, haloMaterial); circle.rotation.x = -Math.PI / 2; chartHalo.add(circle);
  const chartStars = Array.from({ length: 12 }, (_, index) => {
    const angle = index * Math.PI / 6;
    const star = new THREE.Mesh(geometry.leaf, haloMaterial);
    star.position.set(Math.sin(angle) * 0.59, 0, Math.cos(angle) * 0.59);
    chartHalo.add(star); return star;
  });
  const incense = [-1, 0, 1].map(side => {
    const stick = ritualPart("box", 0xa13e29, -18 + side * .16, 2.15, 23, .034, .6, .034);
    const ember = ritualPart("head", PALETTE.lantern, -18 + side * .16, 2.46, 23, .07, .07, .07);
    stick.visible = ember.visible = false;
    return { stick, ember };
  });
  function cardFace(title: string, value: number) {
    const surface = document.createElement("canvas"); surface.width = 256; surface.height = 400;
    const ctx = surface.getContext("2d")!;
    ctx.fillStyle = "#ead6ac"; ctx.fillRect(0, 0, 256, 400);
    ctx.strokeStyle = "#775637"; ctx.lineWidth = 7; ctx.strokeRect(10, 10, 236, 380);
    ctx.fillStyle = ["#916444", "#4c647a", "#6a507b", "#556e57"][Math.abs(value) % 4];
    ctx.beginPath(); ctx.arc(128, 165, 68, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#f8e5b7"; ctx.font = "64px 'Quan Sans', sans-serif"; ctx.textAlign = "center"; ctx.fillText(["☀", "☾", "✦", "♧"][Math.abs(value) % 4], 128, 188);
    ctx.fillStyle = "#49372b"; ctx.font = "bold 24px 'Quan Sans', sans-serif";
    const words = title.slice(0, 70).split(" "); let line = ""; let y = 290;
    for (const word of words) { if (ctx.measureText(line + word).width > 215) { ctx.fillText(line, 128, y); line = ""; y += 30; } line += word + " "; }
    ctx.fillText(line, 128, y);
    const map = new THREE.CanvasTexture(surface); map.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshBasicMaterial({map, side: THREE.DoubleSide});
  }
  const tarotCards = [-1, 0, 1].map(side => {
    const back = ritualPart("box", 0x553268, -26 + side * 0.62, 1.065, 15.35, 0.48, 0.025, 0.78);
    const seal = new THREE.Mesh(geometry.box, material(PALETTE.gold));
    seal.position.y = 0.55; seal.scale.set(0.2, 0.16, 0.14); seal.rotation.y = Math.PI / 4; seal.visible = false; back.add(seal);
    const face = new THREE.Mesh(geometry.surface, cardFace("", 0)); face.scale.set(0.46, 0.76, 1); face.position.set(back.position.x, 1.085, back.position.z); face.rotation.x = -Math.PI / 2; face.visible = false; scene.add(face); return {back, face, seal};
  });
  ritualPart("drum", PALETTE.wood, 28, 0.9, 0.45, 2.7, 0.2, 1.6);
  const coins = [-1, 0, 1].map(side => {
    const coin = ritualPart("drum", PALETTE.gold, 28 + side * 0.45, 1.04, 0.7, 0.26, 0.05, 0.26);
    const hole = new THREE.Mesh(geometry.box, material(PALETTE.wood)); hole.position.y = 0.54; hole.scale.set(0.28, 0.08, 0.28); coin.add(hole); return coin;
  });
  const hexagram = Array.from({length: 6}, (_, i) => [-1, 1].map(side => {
    const line = ritualPart("box", PALETTE.gold, 28 + side * 0.17, 1.025, -0.12 + i * 0.12, 0.29, 0.018, 0.055); line.visible = false; return line;
  }));
  let ritualId: number | undefined; let ritualStarted = 0;
  const smoke = Array.from({ length: 7 }, () => {
    const smokeMaterial = new THREE.MeshBasicMaterial({ color: 0xffe7c6, transparent: true, opacity: 0, depthWrite: false });
    const mesh = new THREE.Mesh(geometry.leaf, smokeMaterial);
    scene.add(mesh);
    return mesh;
  });
  const eventLanterns = Array.from({ length: 8 }, (_, index) => {
    const lamp = ritualPart("head", PALETTE.lantern, 15 + index * 0.8, 1.1, 3.1 + (index % 2) * 1.25, 0.29, 0.35, 0.29);
    lamp.visible = false; return lamp;
  });

  const personal = new THREE.Group(); personal.position.set(55, 0, -5); scene.add(personal);
  function privatePart(shape: Shape, color: number, x: number, y: number, z: number, sx: number, sy: number, sz: number) {
    const mesh = new THREE.Mesh(geometry[shape], material(color));
    mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz);
    mesh.castShadow = mesh.receiveShadow = true; personal.add(mesh); return mesh;
  }
  privatePart("box", PALETTE.stone, 0, 0.12, 0, 9, 0.24, 8);
  privatePart("box", PALETTE.plaster, 0, 1.8, -3.8, 9, 3.6, 0.2);
  privatePart("box", PALETTE.wood, -4.4, 1.8, 0, 0.2, 3.6, 8);
  for (let i = 0; i < 9; i++) privatePart("box", PALETTE.wood, -4 + i, 2.6, -3.6, 0.07, 2, 0.08);
  privatePart("box", 0x6b465a, 0, 0.27, 0.5, 3.2, 0.035, 3);
  const lamp = privatePart("head", PALETTE.lantern, 3, 1.9, -2.5, 0.7, 1, 0.7);
  const card = privatePart("box", 0x624171, 0.15, 1.58, -1.4, 0.45, 0.025, 0.73);
  const tableColor = new THREE.Color(0xffffff);
  assets?.model("chinese_tea_table", [
    { x: -28.8, y: 0.31, z: 14, width: 1.9 },
    { x: -23.2, y: 0.31, z: 14, width: 1.9 },
    ...[-41.5, -36, -30.5].map(x => ({ x, y: 0.42, z: -14.8, width: 2.3 })),
    { x: 0, y: 0.26, z: -1.4, width: 2.2, parent: personal, tint: tableColor },
  ]);
  assets?.model("ceramic_pot", [
    { x: -48.7, y: 0.3, z: -10.2, width: 0.8 },
    { x: -23.3, y: 0.3, z: -10.2, width: 0.8 },
    { x: 2.9, y: 0.25, z: -2.5, width: 0.75, parent: personal },
  ]);
  const personalLabel = label("Góc riêng của bạn"); personalLabel.position.set(0, 2.6, -3.4); personal.add(personalLabel);
  const auraMaterial = new THREE.MeshBasicMaterial({ color: 0xe6c57d, transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide });
  const auraGeometry = new THREE.RingGeometry(0.47, 0.62, 40);
  const aura = new THREE.Mesh(auraGeometry, auraMaterial); aura.rotation.x = -Math.PI / 2; aura.position.y = 0.022; self.group.add(aura);
  const cosmeticColors: Record<string, number> = { "robe-jade":0x6c9778,"robe-plum":0x855f88,"robe-gold":0xc5a365,"lantern-amber":0xffc56e,"lantern-lotus":0xeca5b5,"table-walnut":0x694938,"table-jade":0x598374,"card-indigo":0x394f80,"card-sun":0xc39749,"aura-mist":0xb7c9c4,"aura-lotus":0xe8acbc,"aura-gold":0xe7c780 };
  const cosmeticColor = (choice: string | undefined, fallback: number) => choice && /^#[0-9a-f]{6}$/i.test(choice) ? Number.parseInt(choice.slice(1), 16) : cosmeticColors[choice ?? ""] ?? fallback;
  const wishes = new THREE.Group(); scene.add(wishes); let wishKey = "";
  let previousWishes: SceneProps["communityWishes"];
  function updateWishes(items: NonNullable<SceneProps["communityWishes"]>) {
    const bounded = items.slice(0, 24); const key = JSON.stringify(bounded); if (key === wishKey) return; wishKey = key;
    for (const child of [...wishes.children]) { child.traverse(node => { if (node instanceof THREE.Sprite) disposeLabel(node); }); wishes.remove(child); }
    bounded.forEach((wish, index) => {
      const tag = new THREE.Group(); const tree = wish.placement === "tree";
      const plaque = new THREE.Mesh(geometry.box, material(tree ? PALETTE.red : PALETTE.gold));
      plaque.scale.set(0.27, tree ? 0.65 : 0.1, 0.09); tag.add(plaque);
      if (tree) { const angle = index * 2.4; tag.position.set(-17 + Math.sin(angle) * 1.6, 1.9 + index % 3 * 0.4, 22 + Math.cos(angle) * 1.5); }
      else tag.position.set(16 + index % 4 * 1.2, 0.26, 16 + Math.floor(index / 4) * 1.1);
      const text = label(wish.text.slice(0, 24)); text.scale.multiplyScalar(0.38); text.position.y = 0.45; tag.add(text); wishes.add(tag);
    });
  }
  let audio: AudioContext | undefined; let audioGain: GainNode | undefined; const oscillators: OscillatorNode[] = [];
  let audible = false;
  function updateSound() {
    if (!audioGain || !audio) return;
    const next = latest.current.muted === false && !latest.current.encounter && !document.hidden;
    if (audible === next) return;
    audible = next;
    audioGain.gain.setTargetAtTime(next ? 0.008 : 0, audio.currentTime, 0.1);
  }
  function startSound() {
    if (!ecosystemEnabled || latest.current.muted !== false || audio) return;
    try {
      audio = new AudioContext(); audioGain = audio.createGain(); audioGain.gain.value = 0; audioGain.connect(audio.destination);
      for (const frequency of [174.61, 261.63, 349.23]) { const oscillator = audio.createOscillator(); oscillator.frequency.value = frequency; oscillator.connect(audioGain); oscillator.start(); oscillators.push(oscillator); }
      updateSound();
      void audio.resume().catch(() => {});
    } catch { /* Sound is optional and starts only after a gesture. */ }
  }
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const reducedMotion = () => ecosystemEnabled ? latest.current.reducedMotion ?? motion.matches : motion.matches;
  const ray = new THREE.Raycaster();
  const altarHit = new THREE.Box3(new THREE.Vector3(-19.86, .12, 21.63), new THREE.Vector3(-16.14, 3.38, 24.13));
  const pointer = new THREE.Vector2();
  const floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.055);
  const hit = new THREE.Vector3();
  const keys = new Set<string>();
  const steer = new THREE.Vector2();
  const cameraGoal = new THREE.Vector3();
  const cameraTarget = new THREE.Vector3();
  const look = new THREE.Vector3();
  const sparks = new Float32Array(90 * 3);
  const sparkGeometry = new THREE.BufferGeometry();
  sparkGeometry.setAttribute("position", new THREE.BufferAttribute(sparks, 3));
  const sparkMaterial = new THREE.PointsMaterial({ color: 0xffc985, size: 0.095, transparent: true, opacity: 0.7, depthWrite: false });
  const sparkCloud = new THREE.Points(sparkGeometry, sparkMaterial);
  sparkCloud.frustumCulled = false;
  scene.add(sparkCloud);
  const pad = container.querySelector<HTMLDivElement>("[data-joystick]")!;
  const knob = pad.firstElementChild as HTMLSpanElement;
  const movementKeys = new Set(["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowLeft","ArrowDown","ArrowRight"]);
  let yaw = 0;
  let pitch = 0.49;
  let cameraReady = false;
  let framedHost = -1;
  let previousExperience = "courtyard";
  let buddhaRequested = false;
  let thumb: { id: number; x: number; y: number; dragged: boolean } | undefined;
  let press: { id: number; x: number; y: number; lastX: number; lastY: number; dragged: boolean } | undefined;
  let route: Position[] = [];
  let destinationId: number | undefined;
  let controlled: Position | null = null;
  let walked = false;
  let sentAt = 0;
  let nearbySeat: number | null = null;
  let monasteryDestinationId: number | undefined;
  function routeTo(destination: Position) {
    const from = controlled ?? { x: self.group.position.x, z: self.group.position.z };
    route = latest.current.experience === "monastery"
      ? findQuanMonasteryPath({ x: from.x - templeX, z: from.z }, { x: destination.x - templeX, z: destination.z }).map(point => ({ x: templeX + point.x, z: point.z }))
      : findQuanPath(from, destination);
  }
  function pressDown(event: PointerEvent) {
    if (event.button !== 0 || latest.current.encounter || !latest.current.interactive) return;
    const rect = canvas.getBoundingClientRect();
    const leftTouch = event.pointerType === "touch" && event.clientX < rect.left + rect.width / 2;
    if (leftTouch ? thumb : press) return;
    event.preventDefault();
    startSound();
    container.closest("main")?.focus({ preventScroll: true });
    canvas.setPointerCapture(event.pointerId);
    if (leftTouch) {
      thumb = { id: event.pointerId, x: event.clientX, y: event.clientY, dragged: false };
      route = [];
      pad.style.left = `${event.clientX - rect.left}px`;
      pad.style.top = `${event.clientY - rect.top}px`;
      pad.dataset.active = "true";
      return;
    }
    press = { id: event.pointerId, x: event.clientX, y: event.clientY, lastX: event.clientX, lastY: event.clientY, dragged: false };
  }
  function pressMove(event: PointerEvent) {
    if (thumb?.id === event.pointerId) {
      if (!thumb.dragged && Math.hypot(event.clientX - thumb.x, event.clientY - thumb.y) < 7) return;
      thumb.dragged = true;
      steer.set((event.clientX - thumb.x) / 52, (event.clientY - thumb.y) / 52).clampLength(0, 1);
      knob.style.transform = `translate(${steer.x * 23}px, ${steer.y * 23}px)`;
      return;
    }
    if (!press || press.id !== event.pointerId) return;
    if (!press.dragged && Math.hypot(event.clientX - press.x, event.clientY - press.y) < 7) return;
    press.dragged = true;
    yaw -= (event.clientX - press.lastX) * 0.008;
    pitch = THREE.MathUtils.clamp(pitch + (event.clientY - press.lastY) * 0.006, 0.2, 1.02);
    press.lastX = event.clientX;
    press.lastY = event.clientY;
  }
  function pressEnd(event: PointerEvent) {
    const leftTouch = thumb?.id === event.pointerId;
    const start = leftTouch ? thumb : press;
    if (start?.id !== event.pointerId) return;
    if (leftTouch) endMove(); else press = undefined;
    if (start.dragged || !latest.current.interactive) return;
    const rect = canvas.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2);
    ray.setFromCamera(pointer, camera);
    if (latest.current.experience === "monastery") {
      ray.layers.set(1);
      const selected = ray.intersectObjects(monasterySeats, false)[0];
      if (latest.current.monasterySeat != null) return;
      if (selected) {
        const index = selected.object.userData.seatIndex;
        if (latest.current.players.some(player => player.action === "monastery" && player.seatIndex === index)) return;
        const seat = QUAN_MONASTERY_SEATS[index];
        routeTo({ x: templeX + seat.x, z: seat.z + 1.3 });
      } else if (!leftTouch && ray.ray.intersectPlane(floor, hit) && isQuanMonasteryWalkable(hit.x - templeX, hit.z)) routeTo(hit);
      return;
    }
    ray.layers.set(0);
    if (latest.current.onIncense && ray.ray.intersectsBox(altarHit)) { latest.current.onIncense(); return; }
    if (leftTouch) return;
    const selected = ray.intersectObjects(teachers.map(teacher => teacher.group), true)[0];
    if (selected) { let node: THREE.Object3D | null = selected.object; while (node && !node.userData.host) node = node.parent; if (node) latest.current.onHost?.(node.userData.host as QuanHost, node.userData.desk); return; }
    if (event.pointerType === "touch") return;
    if (!ray.ray.intersectPlane(floor, hit)) return;
    route = [];
    if (isQuanWalkable(hit.x, hit.z)) routeTo({ x: hit.x, z: hit.z });
  }
  function cancelPress(event: PointerEvent) {
    if (thumb?.id === event.pointerId) endMove();
    if (press?.id === event.pointerId) press = undefined;
  }
  function keyDown(event: KeyboardEvent) {
    if (latest.current.encounter || !latest.current.interactive || !movementKeys.has(event.code) ||
        (event.target instanceof HTMLElement && event.target.closest("input, textarea, select, [contenteditable]"))) return;
    event.preventDefault();
    startSound();
    route = [];
    keys.add(event.code);
  }
  function keyUp(event: KeyboardEvent) { keys.delete(event.code); }
  function endMove() { thumb = undefined; steer.set(0, 0); knob.style.transform = ""; delete pad.dataset.active; }
  function clearInput() { keys.clear(); route = []; press = undefined; endMove(); }
  function resize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height) return;
    if ((camera.aspect > 1) !== (width > height)) clearInput();
    camera.aspect = width / height;
    camera.fov = camera.aspect < 0.8 ? 65 : 58;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();
  let selectedQuality = ""; let adaptiveLow = false; let slowFrames = 0; let qualityApplied = "";
  let previous = 0;
  let renderedAt = -1000;
  let frame = 0;
  let stopped = false;
  function contextLost(event: Event) {
    event.preventDefault();
    stopped = true;
    cancelAnimationFrame(frame);
    latest.current.onUnavailable();
  }
  function move(visitor: ReturnType<typeof avatar>, position: Position, action: string, time: number, delta: number) {
    const dx = position.x - visitor.group.position.x;
    const dz = position.z - visitor.group.position.z;
    const walking = Math.hypot(dx, dz) > 0.045;
    if (walking) visitor.body.rotation.y = Math.atan2(dx, dz);
    const speed = reducedMotion() ? 1 : 1 - Math.exp(-delta * 6);
    visitor.group.position.x += dx * speed;
    visitor.group.position.z += dz * speed;
    pose(visitor, walking ? "idle" : action, time, walking, reducedMotion());
  }
  const activeVisitors = new Set<string>();
  const colors = [0x5d7b72, 0x7d5c7b, 0x9a703d, 0x43637a, 0x69794c];
  function draw(time: number) {
    if (stopped) return;
    frame = requestAnimationFrame(draw);
    if (document.hidden || time - renderedAt < (qualityApplied === "high" ? 16 : qualityApplied === "low" ? 48 : 32)) return;
    const elapsed = time - renderedAt; renderedAt = time;
    const requestedQuality = latest.current.quality ?? (navigator.hardwareConcurrency <= 4 ? "low" : "medium");
    if (requestedQuality !== selectedQuality) { selectedQuality = requestedQuality; adaptiveLow = false; slowFrames = 0; }
    if (elapsed > 48 && elapsed < 1000) slowFrames++; else slowFrames = Math.max(0, slowFrames - 1);
    if (slowFrames > 45) adaptiveLow = true;
    const quality = adaptiveLow ? "low" : requestedQuality;
    if (ecosystemEnabled && quality !== qualityApplied) {
      qualityApplied = quality;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality === "low" ? 1 : quality === "high" ? 2 : 1.5));
      renderer.shadowMap.enabled = quality !== "low"; sun.shadow.mapSize.setScalar(quality === "high" ? 2048 : 1024);
      sun.shadow.map?.dispose(); sun.shadow.map = null; renderer.shadowMap.needsUpdate = true;
      sparkCloud.visible = quality !== "low"; container.dataset.quality = quality; resize();
    }
    const dt = Math.min((time - (previous || time)) / 1000, 0.07);
    previous = time;
    const current = latest.current;
    const eventVisible = Boolean(current.eventEndsAt && current.eventEndsAt > Date.now());
    eventLanterns.forEach((lamp, index) => {
      lamp.visible = eventVisible;
      if (eventVisible) lamp.position.y = 1.1 + (reducedMotion() ? 0 : Math.sin(time / 1050 + index) * 0.23);
    });
    if (rankingBoard && current.leaders !== previousLeaders) {
      previousLeaders = current.leaders;
      const map = rankingBoard.material.map!;
      const context = map.image instanceof HTMLCanvasElement ? map.image.getContext("2d") : null;
      if (context) { paintRanking(context, current.leaders ?? []); map.needsUpdate = true; }
    }
    if (ecosystemEnabled && current.communityWishes !== previousWishes) {
      previousWishes = current.communityWishes;
      updateWishes(previousWishes ?? []);
    }
    const experience = ecosystemEnabled ? current.experience ?? "courtyard" : "courtyard";
    const monastery = experience === "monastery";
    camera.layers.set(monastery ? 1 : 0);
    if (experience !== previousExperience) {
      if (monastery || previousExperience === "monastery") {
        clearInput(); controlled = null; walked = false;
        const entry = current.monasteryPosition ?? QUAN_MONASTERY_ENTRY;
        self.group.position.set(monastery ? templeX + entry.x : current.position.x, 0.054, monastery ? entry.z : current.position.z); cameraReady = false;
        yaw = 0; pitch = 0.49;
      }
      previousExperience = experience;
    }
    if (monastery && !buddhaRequested && assets) {
      buddhaRequested = true;
      assets.model("buddha-amoghasiddhi", [-8, 0, 8].map(offset => ({ x: templeX + offset, y: 1.24, z: -13.1, height: offset === 0 ? 5.8 : 4.9, layer: 1 })));
    }
    templeLight.visible = monastery;
    statueLights.forEach(light => { light.visible = monastery; });
    monasterySeats.forEach((mesh, index) => {
      const occupied = current.players.some(person => person.action === "monastery" && person.seatIndex === index);
      mesh.material = material(current.monasterySeat === index ? 0x82b9ab : occupied ? 0x795449 : 0xf2d17c);
    });
    templeSash.visible = templeBeads.visible = monastery;
    const seated = current.encounter;
    const selectedHost = !seated ? -1 : seated.kind === "tuvi" ? (seated.desk === 1 ? 3 : seated.desk === 2 ? 4 : 0) : hostKinds.indexOf(seated.kind);
    const hostPosition = teachers[selectedHost]?.group.position;
    if (hostPosition) tableLight.position.set(hostPosition.x + 1.1, hostPosition.y + 2.35, hostPosition.z + 1.2);
    tableLight.intensity = seated ? 27 : 0;
    for (let i = 0; i < seatCushions.length; i++) seatCushions[i].visible = i % 2 === 0 || selectedHost === Math.floor(i / 2);
    if (framedHost !== selectedHost) {
      framedHost = selectedHost; cameraReady = false;
      signs.forEach(sign => { sign.visible = !seated; });
    }
    personal.visible = experience === "personal"; self.group.visible = Boolean(seated) || experience === "courtyard" || experience === "teacher" || monastery;
    updateSound();
    const appearance = ecosystemEnabled ? current.appearance ?? {} : {};
    self.robe.color.set(cosmeticColor(appearance.robe, 0x506f7e));
    aura.visible = Boolean(appearance.aura); auraMaterial.color.set(cosmeticColor(appearance.aura, 0xe6c57d));
    tableColor.set(cosmeticColor(appearance.table, 0xffffff));
    lamp.material = material(cosmeticColor(appearance.lantern, PALETTE.lantern));
    card.material = material(cosmeticColor(appearance.cardBack, 0x624171));
    tarotCards.forEach(({ back, seal }) => {
      back.material = material(cosmeticColor(appearance.cardBack, 0x553268));
      seal.visible = appearance.cardBack === "#4b4d91";
    });
    tableSkins.forEach(skin => {
      skin.visible = Boolean(appearance.table);
      if (skin.visible) skin.material = material(cosmeticColor(appearance.table, 0x815139));
    });
    altarSkin.visible = Boolean(appearance.altar);
    if (altarSkin.visible) altarSkin.material = material(cosmeticColor(appearance.altar, PALETTE.red));
    renderer.toneMappingExposure = monastery ? 1.02 : experience === "teacher" ? 0.96 : experience === "personal" ? 1.04 : 1.18;
    if ((!current.interactive || seated || monastery && current.monasterySeat != null) && (keys.size || route.length || thumb)) clearInput();
    if (!current.destination && destinationId !== undefined) {
      destinationId = undefined;
      route = [];
    }
    if (!monastery && !seated && current.interactive && current.destination && current.destination.requestId !== destinationId) {
      destinationId = current.destination.requestId;
      routeTo(current.destination);
    }
    if (monastery && current.monasterySeat == null && current.monasteryDestination && current.monasteryDestination.requestId !== monasteryDestinationId) {
      monasteryDestinationId = current.monasteryDestination.requestId;
      const seat = QUAN_MONASTERY_SEATS[current.monasteryDestination.index];
      routeTo({ x: templeX + seat.x, z: seat.z + 1.3 });
    }
    const templePosition = current.monasteryPosition ?? QUAN_MONASTERY_ENTRY;
    const walkingPosition = monastery ? { x: templeX + templePosition.x, z: templePosition.z } : current.position;
    let dx = steer.x + Number(keys.has("KeyD") || keys.has("ArrowRight")) - Number(keys.has("KeyA") || keys.has("ArrowLeft"));
    let dz = steer.y + Number(keys.has("KeyS") || keys.has("ArrowDown")) - Number(keys.has("KeyW") || keys.has("ArrowUp"));
    if (Math.hypot(dx, dz) > 0.09) {
      route = [];
      const sideways = dx;
      dx = sideways * Math.cos(yaw) + dz * Math.sin(yaw);
      dz = dz * Math.cos(yaw) - sideways * Math.sin(yaw);
    } else if (route.length) {
      const point = controlled ?? walkingPosition;
      while (route.length && Math.hypot(route[0].x - point.x, route[0].z - point.z) < 0.12) route.shift();
      if (route.length) {
        dx = route[0].x - point.x;
        dz = route[0].z - point.z;
      }
    }
    const magnitude = Math.hypot(dx, dz);
    const reportMove = (position: Position) => monastery ? current.onMonasteryMove?.({ x: position.x - templeX, z: position.z }) : current.onMove(position);
    if ((!monastery || current.monasterySeat == null) && !seated && current.interactive && magnitude > 0.09) {
      walked = true;
      controlled ??= { ...walkingPosition };
      const pace = Math.min(5.8 * dt, route.length ? magnitude : Infinity) / Math.max(route.length ? 0.001 : 1, magnitude);
      const nx = controlled.x + dx * pace;
      const nz = controlled.z + dz * pace;
      const clearX = monastery ? isQuanMonasteryWalkable(nx - templeX, controlled.z) : isQuanWalkable(nx, controlled.z);
      if (clearX) controlled.x = nx;
      const clearZ = monastery ? isQuanMonasteryWalkable(controlled.x - templeX, nz) : isQuanWalkable(controlled.x, nz);
      if (clearZ) controlled.z = nz;
      if (!(clearX && Math.abs(dx) > 0.01) && !(clearZ && Math.abs(dz) > 0.01)) route = [];
      if (time - sentAt >= 80) { reportMove({ ...controlled }); sentAt = time; }
    } else if (controlled) {
      reportMove({ ...controlled });
      controlled = null;
    }
    if (!seated) self.group.position.y = 0.054 + (monastery ? 0 : quanGroundHeight(self.group.position.x, self.group.position.z));
    if (!walked) self.group.position.set(walkingPosition.x, 0.054 + (monastery ? 0 : quanGroundHeight(walkingPosition.x, walkingPosition.z)), walkingPosition.z);
    move(self, controlled ?? walkingPosition, current.action, time / 1000, dt);
    if (current.ritual?.requestId !== ritualId) {
      ritualId = current.ritual?.requestId; ritualStarted = time;
      if (current.ritual?.kind === "chart") chartStars.forEach((star, index) => {
        const highlighted = index === current.ritual?.values?.[0];
        star.material = highlighted ? focusMaterial : haloMaterial;
        star.scale.setScalar(highlighted ? 0.12 : 0.046);
      });
      if (current.ritual?.kind === "incense") incense.forEach(({stick, ember}, i) => { stick.visible = ember.visible = current.ritual?.count === 3 || i === 1; });
      if (current.ritual?.kind === "tarot") tarotCards.forEach(({face}, i) => {
        const value = current.ritual?.values?.[i]; face.material.map?.dispose(); face.material.dispose();
        face.material = cardFace(value === undefined ? "Chưa rút lá" : QUAN_TAROT_CARDS[value]?.title ?? "Lá bài", value ?? 0); face.visible = value !== undefined;
      });
      if (current.ritual?.kind === "iching") hexagram.forEach((line, i) => line.forEach((segment, side) => {
        const value = current.ritual?.values?.[i]; segment.visible = value !== undefined;
        segment.scale.x = value !== undefined && value % 2 ? 0.34 : 0.26;
        segment.position.x = 18 + (side === 0 ? -1 : 1) * (value !== undefined && value % 2 ? 0.17 : 0.21);
      }));
    }
    const ritualActive = current.ritual && time - ritualStarted < (current.ritual.kind === "meditate" ? 20000 : 5000);
    chartHalo.visible = seated?.kind === "tuvi" && current.ritual?.kind === "chart" && Boolean(ritualActive);
    if (chartHalo.visible) {
      chartHalo.position.x = hostPosition?.x ?? 5.5;
      const elapsed = Math.min(1, (time - ritualStarted) / 5000);
      chartHalo.rotation.y = reducedMotion() ? 0 : Math.PI * 2 * (1 - (1 - elapsed) ** 3);
      haloMaterial.opacity = 0.8 * (1 - elapsed ** 3); focusMaterial.opacity = 1 - elapsed ** 3;
    }
    if (!seated && ritualActive) pose(self, current.ritual!.kind, time / 1000, false, reducedMotion());
    teachers.forEach((teacher, index) => {
      const speaking = selectedHost === index && (seated?.state === "speaking" || seated?.state === "greeting");
      const listening = selectedHost === index && seated?.state === "listening";
      const level = speaking ? THREE.MathUtils.clamp(Number.isFinite(seated.audioLevel) ? seated.audioLevel : 0, 0, 1) : 0;
      pose(teacher, "seated", time / 1000, false, reducedMotion());
      teacher.mouth.scale.y = 0.022 + level * 0.12;
      teacher.body.rotation.x = listening ? 0.08 : !reducedMotion() && speaking ? Math.sin(time * 0.004) * 0.025 : 0;
      teacher.arms[0].rotation.x = -0.6 - (reducedMotion() ? 0 : level * 0.55);
      teacher.badge.visible = !seated;
    });
    if (hostPosition) {
      self.group.position.set(hostPosition.x, hostPosition.y, hostPosition.z + 2.5);
      self.body.rotation.y = Math.PI; pose(self, "seated", time / 1000, false, reducedMotion());
    }
    if (monastery) {
      const prayer = current.monasteryPose ?? "idle";
      const seat = current.monasterySeat == null ? null : QUAN_MONASTERY_SEATS[current.monasterySeat];
      if (seat) self.group.position.set(templeX + seat.x, 0.46, seat.z);
      if (seat || prayer !== "idle") { self.body.rotation.y = Math.PI; pose(self, ["greet", "incense"].includes(prayer) ? "greet" : seat || prayer === "bow" ? "seated" : "idle", time / 1000, false, reducedMotion()); }
      const nearest = seat ? null : QUAN_MONASTERY_SEATS.find(candidate => !current.players.some(player => player.action === "monastery" && player.seatIndex === candidate.index) && Math.hypot(self.group.position.x - templeX - candidate.x, self.group.position.z - candidate.z) <= 1.8)?.index ?? null;
      if (nearest !== nearbySeat) { nearbySeat = nearest; current.onMonasteryNearby?.(nearest); }
      if (prayer === "bow") {
        self.arms.forEach((arm, index) => { arm.rotation.x = -1.83; arm.rotation.z = index === 0 ? 0.52 : -0.52; });
        self.body.rotation.x = reducedMotion() ? -0.65 : -0.15 - Math.sin(time / 1100) ** 2 * 0.9;
      }
      if (prayer === "beads") self.arms[0].rotation.x = -1.1;

    }
    tarotCards.forEach(({back, face}, i) => { const lift = ritualActive && current.ritual?.kind === "tarot" && !reducedMotion() ? Math.sin(Math.min(1, (time - ritualStarted) / 1200) * Math.PI) * (0.2 + i * 0.1) : 0; back.position.y = 1.065 + lift; face.position.y = 1.085 + lift; });
    coins.forEach((coin, i) => { const tossing = ritualActive && current.ritual?.kind === "iching" && time - ritualStarted < 1200 && !reducedMotion(); coin.position.y = 1.04 + (tossing ? Math.sin((time - ritualStarted) / 1200 * Math.PI) * 0.7 : 0); coin.rotation.x = tossing ? (time - ritualStarted) * 0.015 + i : 0; });
    const { x, z } = self.group.position;
    const distance = camera.aspect < 0.8 ? 7.8 : 9.3;
    const planar = Math.cos(pitch) * distance;
    cameraGoal.set(x + Math.sin(yaw) * planar, 1.5 + Math.sin(pitch) * distance, z + Math.cos(yaw) * planar);
    cameraTarget.set(x - Math.sin(yaw) * 3.2, 1.7, z - Math.cos(yaw) * 3.2);
    if (experience === "teacher") { cameraGoal.set(-35, 3.5, -5.8); cameraTarget.set(-36, 1.6, -12.5); }
    if (experience === "personal") { cameraGoal.set(58.5, 4.2, 1.2); cameraTarget.set(55, 1.2, -6.4); }
    if (experience === "tarot") { cameraGoal.set(-23, 3.1, 19.5); cameraTarget.set(-26, 1.2, 14.9); }
    if (experience === "iching") { cameraGoal.set(30, 3.2, 6); cameraTarget.set(28, 1, 0.4); }
    if (monastery) {
      cameraGoal.set(x + Math.sin(yaw) * planar, self.group.position.y + 1.5 + Math.sin(pitch) * distance, z + Math.cos(yaw) * planar);
      cameraTarget.set(x - Math.sin(yaw) * 3.2, 1.7, z - Math.cos(yaw) * 3.2);
    }
    if (hostPosition) {
      const host = hostPosition;
      const portrait = camera.aspect < 0.8;
      cameraGoal.set(host.x + (portrait ? 1.45 : 3.65), host.y + (portrait ? 1.48 : 1.72), host.z + (portrait ? 3.35 : 0.32));
      cameraTarget.set(host.x, host.y + (portrait ? 0.87 : 1.08), host.z + (portrait ? 0.38 : 1.24));
    }
    const follow = !cameraReady || reducedMotion() ? 1 : 1 - Math.exp(-dt * 8);
    camera.position.lerp(cameraGoal, follow);
    look.lerp(cameraTarget, follow);
    camera.lookAt(look);
    skyDome.position.copy(camera.position);
    cameraReady = true;
    const active = activeVisitors; active.clear();
    for (const player of current.players) {
      active.add(player.id);
      let visitor = visitors.get(player.id);
      if (visitor && visitor.name !== player.alias) {
        visitor.group.removeFromParent();
        disposeLabel(visitor.badge); visitor.robe.dispose();
        visitor = undefined;
      }
      if (!visitor) {
        const color = colors[Array.from(player.id).reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length];
        visitor = avatar(color, player.alias);
        visitor.group.traverse(node => node.layers.enable(1));
        visitor.group.position.set(player.x, 0.054, player.z);
        visitors.set(player.id, visitor);
      }
      if (monastery && player.action === "monastery") {
        const seat = Number.isInteger(player.seatIndex) ? QUAN_MONASTERY_SEATS[player.seatIndex!] : null;
        const location = seat ?? player.monasteryPosition ?? QUAN_MONASTERY_ENTRY;
        if (!seat) move(visitor, { x: templeX + location.x, z: location.z }, "idle", time / 1000, dt);
        else visitor.group.position.set(templeX + seat.x, 0.46, seat.z);
        visitor.body.rotation.y = Math.PI;
        const prayer = player.monasteryPose ?? "idle";
        if (seat || prayer !== "idle") pose(visitor, ["greet", "incense"].includes(prayer) ? "greet" : seat ? "seated" : "idle", time / 1000, false, reducedMotion());
        if (prayer === "bow") visitor.body.rotation.x = reducedMotion() ? -0.65 : -0.15 - Math.sin(time / 1100) ** 2 * 0.9;
        visitor.group.visible = true;
      } else {
        move(visitor, player, player.action, time / 1000, dt);
        visitor.group.visible = experience === "courtyard" && player.action !== "monastery" && Math.hypot(player.x - x, player.z - z) > 0.5;
      }
    }
    for (const [id, visitor] of visitors) {
      if (active.has(id)) continue;
      visitor.group.removeFromParent();
      disposeLabel(visitor.badge); visitor.robe.dispose();
      visitors.delete(id);
    }
    smoke.forEach((mesh, index) => {
      mesh.layers.enable(1);
      const phase = reducedMotion() ? (index + 1) / 8 : ((time / 4600 + index / smoke.length) % 1);
      mesh.position.set((monastery ? templeX : -18) + phase * 0.76 + Math.sin(phase * 6) * 0.12, (monastery ? 2.7 : 2.46) + phase * 1.73, (monastery ? -9 : 23) + phase * 0.19);
      mesh.scale.setScalar(0.082 + phase * 0.35);
      mesh.material.opacity = (1 - phase) * (monastery ? current.monasteryPose === "incense" ? 0.42 : 0.12 : current.action === "incense" || ritualActive && current.ritual?.kind === "incense" ? 0.42 : incense[1].stick.visible ? 0.22 : 0);
    });
    for (let i = 0; i < 90; i++) {
      const t = reducedMotion() ? 0 : time * 0.00037;
      sparks[i * 3] = Math.sin(i * 16.31) * 29 + Math.sin(i + t) * 0.7;
      sparks[i * 3 + 1] = 0.6 + ((i * 1.39) % 4) + Math.sin(i * 3 + t) * 0.35;
      sparks[i * 3 + 2] = Math.cos(i * 14.17) * 27 + 3 + Math.cos(i - t) * 0.8;
    }
    sparkGeometry.attributes.position.needsUpdate = true;
    waterMaterial.uniforms.time.value = reducedMotion() ? 0 : time / 1000;
    if (scene.userData.assetsChanged) { renderer.shadowMap.needsUpdate = true; scene.userData.assetsChanged = false; }
    renderer.render(scene, camera);
    // Architecture is static; contact blobs follow avatars without rerendering the shadow map.
    renderer.shadowMap.autoUpdate = false;
  }
  canvas.addEventListener("pointerdown", pressDown);
  canvas.addEventListener("pointermove", pressMove);
  canvas.addEventListener("pointerup", pressEnd);
  canvas.addEventListener("pointercancel", cancelPress);
  canvas.addEventListener("lostpointercapture", cancelPress);
  canvas.addEventListener("webglcontextlost", contextLost);
  window.addEventListener("keydown", keyDown);
  window.addEventListener("keyup", keyUp);
  window.addEventListener("blur", clearInput);
  document.addEventListener("visibilitychange", updateSound);
  frame = requestAnimationFrame(draw);

  return () => {
    stopped = true;
    cancelAnimationFrame(frame);
    resizeObserver.disconnect();
    canvas.removeEventListener("pointerdown", pressDown);
    canvas.removeEventListener("pointermove", pressMove);
    canvas.removeEventListener("pointerup", pressEnd);
    canvas.removeEventListener("pointercancel", cancelPress);
    canvas.removeEventListener("lostpointercapture", cancelPress);
    canvas.removeEventListener("webglcontextlost", contextLost);
    window.removeEventListener("keydown", keyDown);
    window.removeEventListener("keyup", keyUp);
    window.removeEventListener("blur", clearInput);
    document.removeEventListener("visibilitychange", updateSound);
    Object.values(geometry).forEach((value) => value.dispose());
    materials.forEach((value) => value.dispose());
    signs.forEach(disposeLabel);
    visitors.forEach((visitor) => { disposeLabel(visitor.badge); visitor.robe.dispose(); });
    disposeLabel(self.badge); self.robe.dispose(); assets?.dispose();
    oscillators.forEach(oscillator => { oscillator.stop(); oscillator.disconnect(); }); audioGain?.disconnect(); if (audio) void audio.close();
    disposeLabel(personalLabel); wishes.traverse(node => { if (node instanceof THREE.Sprite) disposeLabel(node); });
    auraGeometry.dispose(); auraMaterial.dispose();
    tarotCards.forEach(({face}) => { face.material.map?.dispose(); face.material.dispose(); });
    teachers.forEach((teacher) => { disposeLabel(teacher.badge); teacher.robe.dispose(); });
    readingDecor.forEach(({ geometry, material }) => { geometry.dispose(); material.map?.dispose(); material.dispose(); });
    haloGeometry.dispose(); haloMaterial.dispose(); focusMaterial.dispose();
    groundShadows.dispose();
    glowGeometry.dispose();
    glowMaterial.dispose();
    glowTexture.dispose();
    waterGeometry.dispose();
    waterMaterial.dispose();
    smoke.forEach((mesh) => mesh.material.dispose());
    skyDome.geometry.dispose();
    skyDome.material.dispose();
    sparkGeometry.dispose();
    sparkMaterial.dispose();
    scene.traverse((node) => {
      if (node instanceof THREE.InstancedMesh) node.dispose();
    });
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  };
}

export default function TuViQuanScene(props: SceneProps) {
  const container = useRef<HTMLDivElement>(null);
  const latest = useRef(props);
  useEffect(() => { latest.current = props; }, [props]);
  useEffect(() => {
    let cancelled = false;
    let dispose: (() => void) | undefined;
    async function start() {
      await document.fonts.load('700 39px "Quan Sans"', "TỬ VI QUÁN · BẢNG VÀNG CÔNG ĐỨC · BÀN THỜ THẦN TÀI · XIN LỘC ĐẦU NGÀY · Thầy Dịch").catch(() => {});
      if (cancelled || !container.current) return;
      try { dispose = makeScene(container.current, latest); }
      catch (error) { console.error("Không khởi tạo được sân 3D.", error); latest.current.onUnavailable(); }
    }
    void start();
    return () => { cancelled = true; dispose?.(); };
  }, []);
  return (
    <div className={styles.scene} ref={container}>
      {props.showHostControls !== false && !props.encounter && props.onHost && <nav className={styles.hosts} aria-label="Mời người luận chuyện"><button onClick={() => props.onHost?.("tuvi")}>Thầy Tử Vi</button><button onClick={() => props.onHost?.("tarot")}>Cô Tarot</button><button onClick={() => props.onHost?.("iching")}>Thầy Dịch</button></nav>}
      {props.speech?.length ? <div className={styles.publicSpeech} aria-live="polite">{props.speech.slice(-2).map((message, index) => <p key={`${message.id}-${index}`}>{message.text.slice(0, 120)}</p>)}</div> : null}
      <div data-joystick className={props.interactive && !props.encounter ? styles.joystick : styles.hidden} aria-hidden="true"><span /></div>
    </div>
  );
}
