"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { courtyardAssets } from "./tu-vi-quan-scene-assets";
import styles from "./tu-vi-quan-scene.module.css";
import { findQuanPath, isQuanWalkable, QUAN_BOUNDS, QUAN_POND, QUAN_STATIONS } from "@/lib/tu-vi-quan-world.mjs";

type Position = { x: number; z: number };
type Player = Position & { id: string; alias: string; action: string };
type SceneProps = {
  ecosystemEnabled?: boolean;
  quality?: "low" | "medium" | "high";
  reducedMotion?: boolean;
  muted?: boolean;
  appearance?: Record<string, string>;
  experience?: "courtyard" | "teacher" | "tarot" | "iching" | "personal";
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
  ctx.font = `700 ${large ? 49 : 39}px Georgia, serif`;
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
  scene.fog = new THREE.Fog(0xb99b97, 62, 158);
  const camera = new THREE.PerspectiveCamera(56, 1, 0.1, 260);
  const sky = new THREE.HemisphereLight(0xffe9ce, 0x496354, 1.9);
  const sun = new THREE.DirectionalLight(0xffc185, 2);
  sun.position.set(-24, 35, -21);
  sun.intensity = 3.1;
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
        vec3 color=mix(vec3(.94,.65,.45),vec3(.22,.32,.46),h);
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
    head: new THREE.SphereGeometry(0.5, 12, 8),
  };
  type Shape = keyof typeof geometry;
  const materials = new Map<number, THREE.MeshStandardMaterial>();
  function material(color: number) {
    let entry = materials.get(color);
    if (!entry) {
      const surface = [PALETTE.wood, PALETTE.edge, PALETTE.ridge].includes(color) ? assets?.wood
        : [PALETTE.stone, 0xc7b194, 0xcdb89c, 0xc3aa8c, 0xd0bba0, 0xbda58a].includes(color) ? assets?.stone : {};
      entry = new THREE.MeshStandardMaterial({ ...surface, color, roughness: 0.84,
        emissive: color === PALETTE.lantern || color === PALETTE.light ? color : 0x000000,
        emissiveIntensity: color === PALETTE.lantern ? 0.75 : color === PALETTE.light ? 0.45 : 0,
      });
      materials.set(color, entry);
    }
    return entry;
  }
  const batches = new Map<string, { shape: Shape; color: number; matrices: THREE.Matrix4[] }>();
  const placement = new THREE.Object3D();
  function object(
    shape: Shape, color: number, x: number, y: number, z: number,
    sx: number, sy: number, sz: number, rx = 0, ry = 0, rz = 0,
  ) {
    const key = `${shape}:${color}`;
    let entry = batches.get(key);
    if (!entry) {
      entry = { shape, color, matrices: [] };
      batches.set(key, entry);
    }
    placement.position.set(x, y, z);
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
  box(0x7b8a54, 0, -0.09, 3, QUAN_BOUNDS.maxX - QUAN_BOUNDS.minX + 4, 0.16, QUAN_BOUNDS.maxZ - QUAN_BOUNDS.minZ + 4);
  const tileColors = [0xc7b194, 0xcdb89c, 0xc3aa8c, 0xd0bba0, 0xbda58a];
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
  // Layers of distant hills keep the estate open without an enclosing wall of trees.
  for (let layer = 0; layer < 3; layer++) for (let i = 0; i < 16; i++) {
    const angle = i * Math.PI * 2 / 16;
    const distance = 76 + layer * 24;
    object("leaf", [0x73857c, 0x89968e, 0xa5a49a][layer], Math.sin(angle) * distance,
      2 + Math.sin(i * 3.4) * 2, Math.cos(angle) * distance, 32 + i % 4 * 6,
      22 + (i * 7) % 21 + layer * 6, 31, 0, angle);
  }
  // Low plaster walls frame the garden; the southern gate stays open.
  for (const x of [-33.5, 33.5]) {
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
    object("head", PALETTE.lantern, x, y, z, 0.64, 0.83, 0.64);
    for (const offset of [-0.25, 0, 0.25]) drum(PALETTE.red, x, y + offset, z, offset === 0 ? 0.66 : 0.52, 0.035);
    drum(PALETTE.gold, x, y + 0.38, z, 0.42, 0.1);
    drum(PALETTE.light, x, y - 0.38, z, 0.36, 0.1);
    drum(PALETTE.red, x, y - 0.62, z, 0.06, 0.35);
    placement.position.set(x, 0.083, z);
    placement.scale.set(2.25, 2.25, 1);
    placement.rotation.set(-Math.PI / 2, 0, 0);
    placement.updateMatrix();
    lanternPools.push(placement.matrix.clone());
  }
  function roof(cx: number, cz: number, width: number, depth: number, eaves: number) {
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
        box([0x9d503a, 0xad6147, 0xb56e50, 0x99503c][(row * 3 + col) % 4], cx + x, y, cz + side * d,
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
  box(PALETTE.stone, 0, 0.15, -22, 26, 0.3, 10);
  box(0xe0c6a0, 0, 0.34, -22, 25.6, 0.12, 9.6);
  box(PALETTE.plaster, 0, 2.2, -26.3, 24.6, 3.7, 0.32);
  for (const x of [-12, -8, -4, 0, 4, 8, 12]) {
    column(x, -18.15, 4.1);
    column(x, -25.8, 4.1);
  }
  for (const z of [-25.9, -18.15]) {
    box(PALETTE.wood, 0, 4.15, z, 26.3, 0.4, 0.5);
    box(PALETTE.gold, 0, 3.92, z, 25.5, 0.06, 0.52);
  }
  for (const x of [-10, -6, -2, 2, 6, 10]) {
    box(PALETTE.edge, x, 2.05, -26.05, 3.1, 3.1, 0.14);
    box(PALETTE.red, x, 2.18, -25.94, 2.9, 2.6, 0.11);
    for (let i = -5; i <= 5; i++) box(PALETTE.gold, x + i * 0.25, 2.24, -25.84, 0.05, 2.28, 0.065);
    for (const y of [1.42, 2.2, 2.98]) box(PALETTE.wood, x, y, -25.8, 2.9, 0.07, 0.09);
  }
  roof(0, -22, 28, 11.6, 4.6);
  for (const x of [-10, -6, -2, 2, 6, 10]) lantern(x, 3.2, -17.8);
  for (let i = 0; i < 3; i++) box(PALETTE.stone, 0, 0.04 + i * 0.06, -16.8 - i * 0.25, 11 - i * 0.4, 0.12, 0.5);
  for (const x of [-5.5, 0, 5.5]) {
    box(0x815139, x, 0.98, -19.5, 3.1, 0.2, 1.25);
    for (const side of [-1, 1]) box(PALETTE.wood, x + side * 1.2, 0.65, -19.5, 0.2, 0.62, 0.95);
    box(PALETTE.plaster, x - 0.2, 1.1, -19.4, 1.1, 0.035, 0.65, 0, -0.12);
    for (let i = 0; i < 5; i++) box(PALETTE.wood, x - 0.22, 1.123, -19.64 + i * 0.1, 0.8, 0.006, 0.02);
    drum(0x6e9485, x + 1, 1.2, -19.5, 0.24, 0.24);
  }
  // Gate and lantern avenue.
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
  box(PALETTE.stone, -10, 0.16, -5.5, 3.8, 0.3, 3);
  box(PALETTE.red, -10, 0.72, -5.5, 2.9, 0.9, 1.5);
  box(PALETTE.wood, -10, 1.21, -5.5, 3.3, 0.2, 1.9);
  box(PALETTE.gold, -10, 0.8, -4.73, 2.3, 0.07, 0.035);
  drum(0x80623d, -10, 1.4, -5.5, 0.5, 0.25);
  object("head", 0xa77a3e, -10, 1.65, -5.5, 0.9, 0.55, 0.75);
  drum(PALETTE.gold, -10, 1.87, -5.5, 0.85, 0.14);
  for (const [x, tilt] of [[-10.18, 0.14], [-10, 0], [-9.82, -0.14]]) {
    box(0xa13e29, x, 2.15, -5.5, 0.034, 0.6, 0.034, 0, 0, tilt);
    object("head", PALETTE.lantern, x - tilt * 0.25, 2.46, -5.5, 0.07, 0.07, 0.07);
  }
  for (const x of [-11.15, -8.85]) {
    drum(PALETTE.gold, x, 1.53, -5.5, 0.14, 0.5);
    object("leaf", PALETTE.light, x, 1.88, -5.5, 0.11, 0.22, 0.11);
  }
  box(PALETTE.wood, 9, 0.65, -15.7, 1.5, 1.25, 1.05);
  box(PALETTE.red, 9, 1.32, -15.7, 1.66, 0.18, 1.2);
  box(PALETTE.gold, 9, 0.83, -15.15, 0.7, 0.4, 0.035);
  box(PALETTE.edge, 9, 1.42, -15.7, 0.7, 0.018, 0.08);
  // Open tea and meditation pavilions share the hall's roof and timber language.
  function pavilion(cx: number, cz: number, width: number, depth: number) {
    box(PALETTE.stone, cx, 0.13, cz, width, 0.25, depth);
    box(0xbba17a, cx, 0.28, cz, width - 0.25, 0.06, depth - 0.25);
    for (const side of [-1, 1]) for (const end of [-1, 1]) column(cx + side * (width / 2 - 0.5), cz + end * (depth / 2 - 0.5), 3.15);
    box(PALETTE.wood, cx, 3.25, cz, width + 0.2, 0.25, depth);
    roof(cx, cz, width + 1.8, depth + 1.8, 3.55);
    for (const side of [-1, 1]) lantern(cx + side * width * 0.31, 2.55, cz + depth / 2 - 0.25);
  }
  pavilion(-20, 8.5, 10, 5);
  drum(PALETTE.wood, -20, 0.93, 8.4, 3.4, 0.22, 1.75);
  for (const x of [-22.2, -20, -17.8]) {
    drum(0x70553d, x, 0.51, 10.1, 0.7, 0.42);
    drum(0x617c70, x, 0.77, 10.1, 0.74, 0.13);
  }
  object("head", 0x789d87, -20, 1.18, 8.4, 0.55, 0.44, 0.5);
  drum(0x789d87, -20, 1.4, 8.4, 0.28, 0.07);
  object("box", 0x789d87, -19.65, 1.19, 8.4, 0.4, 0.17, 0.17, 0, 0, 0.35);
  for (const x of [-20.8, -19.25]) drum(0xe5d6b2, x, 1.12, 8.7, 0.2, 0.18);
  pavilion(18, 0.4, 8, 6);
  for (const x of [15.7, 18, 20.3]) {
    drum(0x9d4e3e, x, 0.43, 2, 1.25, 0.24, 1);
    drum(PALETTE.gold, x, 0.56, 2, 1.1, 0.035, 0.87);
  }
  // Round welcome medallion and benches around the central garden.
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
        vec3 color=mix(vec3(.075,.24,.22),vec3(.69,.49,.34),fresnel*.8);
        float highlight=pow(max(dot(reflected,normalize(vec3(-.6,.28,-.8))),0.),90.);
        float ripple=pow(max(0.,sin(p.y*9.+p.x*2.+waves*.9-time)),16.);
        color+=vec3(1.,.75,.36)*(highlight*.8+ripple*.08)+waves*.018;
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
  // Bamboo grove, flowering trees, rocks and individual flower beds, all instanced.
  for (let i = 0; i < 28; i++) {
    const x = -30 + (i % 4) * 1.06;
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
    object("leaf", [0x91957b, 0xa6a288, 0x7d876f][i % 3], -26 + i % 3 * 1.4, 0.35, -15 + Math.floor(i / 3) * 1.3,
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
    entry.matrices.forEach((matrix, index) => mesh.setMatrixAt(index, matrix));
    mesh.castShadow = entry.matrices.some(matrix => matrix.elements[13] > 0.7);
    mesh.receiveShadow = true;
    scene.add(mesh);
  }
  const signs: THREE.Sprite[] = [];
  for (const [title, x, y, z, large] of [
    ["Tử Vi Quán", 0, 4.6, -17.45, true],
    ["Tử Vi Quán", 0, 4.22, 35.4, true],
    ...QUAN_STATIONS.filter(station => station.id !== "greet").map(station =>
      [station.label, station.x, station.id === "teacher" ? 2.75 : 2.55, station.z - 0.8, false] as const),
  ] as const) {
    const sprite = label(title, large);
    sprite.position.set(x, y, z);
    signs.push(sprite);
    scene.add(sprite);
  }

  // Nhân vật khách và động tác, dùng lại lưới và vật liệu.
  const visitors = new Map<string, ReturnType<typeof avatar>>();
  function avatar(color: number, name: string) {
    const group = new THREE.Group();
    const body = new THREE.Group();
    const arms = [new THREE.Group(), new THREE.Group()];
    const robe = new THREE.MeshStandardMaterial({ color, roughness: 0.94 });
    function part(parent: THREE.Object3D, shape: Shape, colorValue: number, x: number, y: number, z: number, sx: number, sy: number, sz = sx) {
      const mesh = new THREE.Mesh(geometry[shape], colorValue === color ? robe : material(colorValue));
      mesh.position.set(x, y, z);
      mesh.scale.set(sx, sy, sz);
      parent.add(mesh);
    }
    if (ecosystemEnabled) {
      part(body, "cone", color, 0, 0.75, 0, 0.68, 0.94, 0.47);
      part(body, "drum", color, 0, 1.1, 0, 0.23, 0.16, 0.24);
      part(body, "box", PALETTE.gold, 0.06, 0.91, 0.225, 0.017, 0.35, 0.014);
    } else part(body, "cone", color, 0, 0.76, 0, 0.58, 0.77, 0.42);
    part(body, "drum", PALETTE.gold, 0, 0.71, 0, 0.52, 0.055, 0.4);
    part(body, "head", 0xe9b180, 0, 1.34, 0, 0.49, 0.51, 0.46);
    part(body, "head", 0x40302a, 0, 1.53, -0.04, 0.53, 0.22, 0.48);
    part(body, "head", 0x34241d, -0.087, 1.35, 0.213, 0.04, 0.045, 0.035);
    part(body, "head", 0x34241d, 0.087, 1.35, 0.213, 0.04, 0.045, 0.035);
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
    return { group, body, badge, arms, legs, name, robe };
  }
  function pose(visitor: ReturnType<typeof avatar>, action: string, seconds: number, walking: boolean, reduced: boolean) {
    const stride = walking && !reduced ? Math.sin(seconds * 14) * 0.48 : 0;
    visitor.body.position.y = action === "meditate" ? -0.26 : Math.abs(stride) * (ecosystemEnabled ? 0.045 : 0.09) + (!ecosystemEnabled || reduced ? 0 : Math.sin(seconds * 1.6) * 0.008);
    visitor.body.rotation.x = action === "greet" ? 0.15 : 0;
    visitor.badge.position.y = action === "meditate" ? 1.73 : 1.98;
    visitor.legs.forEach((leg, i) => {
      leg.rotation.x = action === "meditate" ? -Math.PI / 2 : stride * (i === 0 ? 1 : -1);
      leg.rotation.z = action === "meditate" ? (i === 0 ? -0.5 : 0.5) : 0;
    });
    visitor.arms.forEach((arm, i) => {
      arm.rotation.x = action === "greet" ? -1.83 : action === "incense" ? -1.3 : action === "meditate" ? -0.6 : -stride * (i === 0 ? 1 : -1);
      arm.rotation.z = action === "greet" ? (i === 0 ? 0.52 : -0.52) : 0;
    });
  }
  const self = avatar(0x506f7e, "Bạn");
  self.badge.visible = false;
  self.body.rotation.y = Math.PI;
  self.group.position.set(latest.current.position.x, 0.054, latest.current.position.z);
  const teachers = [-5.5, 0, 5.5].map((x, index) => {
    const teacher = avatar(0x465a55, "Thầy AI · Bàn " + (index + 1));
    teacher.group.position.set(x, 0.4, -20.45);
    pose(teacher, "meditate", 0, false, true);
    return teacher;
  });
  const smoke = Array.from({ length: 7 }, () => {
    const smokeMaterial = new THREE.MeshBasicMaterial({ color: 0xffe7c6, transparent: true, opacity: 0, depthWrite: false });
    const mesh = new THREE.Mesh(geometry.leaf, smokeMaterial);
    scene.add(mesh);
    return mesh;
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
    { x: -22.8, y: 0.31, z: 7.5, width: 1.9 },
    { x: -17.2, y: 0.31, z: 7.5, width: 1.9 },
    ...[-5.5, 0, 5.5].map(x => ({ x, y: 0.42, z: -22.8, width: 2.3 })),
    { x: 0, y: 0.26, z: -1.4, width: 2.2, parent: personal, tint: tableColor },
  ]);
  assets?.model("ceramic_pot", [
    { x: -12.7, y: 0.3, z: -18.2, width: 0.8 },
    { x: 12.7, y: 0.3, z: -18.2, width: 0.8 },
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
    const next = latest.current.muted === false && !document.hidden;
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
  let padId: number | undefined;
  let press: { id: number; x: number; y: number; lastX: number; lastY: number; dragged: boolean } | undefined;
  let route: Position[] = [];
  let destinationId: number | undefined;
  let controlled: Position | null = null;
  let walked = false;
  let sentAt = 0;
  function routeTo(destination: Position) {
    route = findQuanPath(controlled ?? { x: self.group.position.x, z: self.group.position.z }, destination);
  }
  function pressDown(event: PointerEvent) {
    if (event.button !== 0 || press || !latest.current.interactive) return;
    event.preventDefault();
    startSound();
    container.closest("main")?.focus({ preventScroll: true });
    canvas.setPointerCapture(event.pointerId);
    press = { id: event.pointerId, x: event.clientX, y: event.clientY, lastX: event.clientX, lastY: event.clientY, dragged: false };
  }
  function pressMove(event: PointerEvent) {
    if (!press || press.id !== event.pointerId) return;
    if (!press.dragged && Math.hypot(event.clientX - press.x, event.clientY - press.y) < 7) return;
    press.dragged = true;
    yaw -= (event.clientX - press.lastX) * 0.008;
    pitch = THREE.MathUtils.clamp(pitch + (event.clientY - press.lastY) * 0.006, 0.2, 1.02);
    press.lastX = event.clientX;
    press.lastY = event.clientY;
  }
  function pressEnd(event: PointerEvent) {
    const start = press;
    if (start?.id !== event.pointerId) return;
    press = undefined;
    if (start.dragged || !latest.current.interactive) return;
    const rect = canvas.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2);
    ray.setFromCamera(pointer, camera);
    if (!ray.ray.intersectPlane(floor, hit)) return;
    route = [];
    if (isQuanWalkable(hit.x, hit.z)) routeTo({ x: hit.x, z: hit.z });
  }
  function cancelPress() { press = undefined; }
  function keyDown(event: KeyboardEvent) {
    if (!latest.current.interactive || !movementKeys.has(event.code) ||
        (event.target instanceof HTMLElement && event.target.closest("input, textarea, select, [contenteditable]"))) return;
    event.preventDefault();
    startSound();
    route = [];
    keys.add(event.code);
  }
  function keyUp(event: KeyboardEvent) { keys.delete(event.code); }
  function padMove(event: PointerEvent) {
    if (padId !== event.pointerId) return;
    const rect = pad.getBoundingClientRect();
    steer.set((event.clientX - rect.left - rect.width / 2) / 31, (event.clientY - rect.top - rect.height / 2) / 31).clampLength(0, 1);
    knob.style.transform = `translate(${steer.x * 28}px, ${steer.y * 28}px)`;
  }
  function padDown(event: PointerEvent) {
    if (!latest.current.interactive || padId !== undefined) return;
    startSound();
    route = [];
    padId = event.pointerId;
    pad.setPointerCapture(padId);
    padMove(event);
  }
  function padEnd() { padId = undefined; steer.set(0, 0); knob.style.transform = ""; }
  function clearInput() { keys.clear(); route = []; press = undefined; padEnd(); }
  function resize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height) return;
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
    if (ecosystemEnabled && current.communityWishes !== previousWishes) {
      previousWishes = current.communityWishes;
      updateWishes(previousWishes ?? []);
    }
    const experience = ecosystemEnabled ? current.experience ?? "courtyard" : "courtyard";
    personal.visible = experience === "personal"; self.group.visible = experience === "courtyard" || experience === "teacher";
    updateSound();
    const appearance = ecosystemEnabled ? current.appearance ?? {} : {};
    self.robe.color.set(cosmeticColor(appearance.robe, 0x506f7e));
    aura.visible = Boolean(appearance.aura); auraMaterial.color.set(cosmeticColor(appearance.aura, 0xe6c57d));
    tableColor.set(cosmeticColor(appearance.table, 0xffffff));
    lamp.material = material(cosmeticColor(appearance.lantern, PALETTE.lantern));
    card.material = material(cosmeticColor(appearance.cardBack, 0x624171));
    renderer.toneMappingExposure = experience === "teacher" ? 0.96 : experience === "personal" ? 1.04 : 1.18;
    if (!current.interactive && (keys.size || route.length || padId !== undefined)) clearInput();
    if (!current.destination && destinationId !== undefined) {
      destinationId = undefined;
      route = [];
    }
    if (current.interactive && current.destination && current.destination.requestId !== destinationId) {
      destinationId = current.destination.requestId;
      routeTo(current.destination);
    }
    let dx = steer.x + Number(keys.has("KeyD") || keys.has("ArrowRight")) - Number(keys.has("KeyA") || keys.has("ArrowLeft"));
    let dz = steer.y + Number(keys.has("KeyS") || keys.has("ArrowDown")) - Number(keys.has("KeyW") || keys.has("ArrowUp"));
    if (Math.hypot(dx, dz) > 0.09) {
      route = [];
      const sideways = dx;
      dx = sideways * Math.cos(yaw) + dz * Math.sin(yaw);
      dz = dz * Math.cos(yaw) - sideways * Math.sin(yaw);
    } else if (route.length) {
      const point = controlled ?? current.position;
      while (route.length && Math.hypot(route[0].x - point.x, route[0].z - point.z) < 0.12) route.shift();
      if (route.length) {
        dx = route[0].x - point.x;
        dz = route[0].z - point.z;
      }
    }
    const magnitude = Math.hypot(dx, dz);
    if (current.interactive && magnitude > 0.09) {
      walked = true;
      controlled ??= { ...current.position };
      const pace = Math.min(5.8 * dt, route.length ? magnitude : Infinity) / Math.max(route.length ? 0.001 : 1, magnitude);
      const nx = controlled.x + dx * pace;
      const nz = controlled.z + dz * pace;
      const clearX = isQuanWalkable(nx, controlled.z);
      if (clearX) controlled.x = nx;
      const clearZ = isQuanWalkable(controlled.x, nz);
      if (clearZ) controlled.z = nz;
      if (!(clearX && Math.abs(dx) > 0.01) && !(clearZ && Math.abs(dz) > 0.01)) route = [];
      if (time - sentAt >= 80) { current.onMove({ ...controlled }); sentAt = time; }
    } else if (controlled) {
      current.onMove({ ...controlled });
      controlled = null;
    }
    if (!walked) self.group.position.set(current.position.x, 0.054, current.position.z);
    move(self, controlled ?? current.position, current.action, time / 1000, dt);
    const { x, z } = self.group.position;
    const distance = camera.aspect < 0.8 ? 7.8 : 9.3;
    const planar = Math.cos(pitch) * distance;
    cameraGoal.set(x + Math.sin(yaw) * planar, 1.5 + Math.sin(pitch) * distance, z + Math.cos(yaw) * planar);
    cameraTarget.set(x - Math.sin(yaw) * 3.2, 1.7, z - Math.cos(yaw) * 3.2);
    if (experience === "teacher") { cameraGoal.set(1, 3.5, -13.8); cameraTarget.set(0, 1.6, -20.5); }
    if (experience === "personal") { cameraGoal.set(58.5, 4.2, 1.2); cameraTarget.set(55, 1.2, -6.4); }
    if (experience === "tarot") { cameraGoal.set(-17, 3.1, 13); cameraTarget.set(-20, 1.2, 8.4); }
    if (experience === "iching") { cameraGoal.set(20, 3.2, 6); cameraTarget.set(18, 1, 0.4); }
    const follow = !cameraReady || reducedMotion() ? 1 : 1 - Math.exp(-dt * 8);
    camera.position.lerp(cameraGoal, follow);
    look.lerp(cameraTarget, follow);
    camera.lookAt(look);
    skyDome.position.copy(camera.position);
    cameraReady = true;
    const active = new Set<string>();
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
        visitor.group.position.set(player.x, 0.054, player.z);
        visitors.set(player.id, visitor);
      }
      move(visitor, player, player.action, time / 1000, dt);
      visitor.group.visible = experience === "courtyard" && Math.hypot(player.x - x, player.z - z) > 0.5;
    }
    for (const [id, visitor] of visitors) {
      if (active.has(id)) continue;
      visitor.group.removeFromParent();
      disposeLabel(visitor.badge); visitor.robe.dispose();
      visitors.delete(id);
    }
    smoke.forEach((mesh, index) => {
      const phase = reducedMotion() ? (index + 1) / 8 : ((time / 4600 + index / smoke.length) % 1);
      mesh.position.set(-10 + phase * 0.76 + Math.sin(phase * 6) * 0.12, 2.46 + phase * 1.73, -5.5 + phase * 0.19);
      mesh.scale.setScalar(0.082 + phase * 0.35);
      mesh.material.opacity = (1 - phase) * (current.action === "incense" ? 0.42 : 0.25);
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
  canvas.addEventListener("webglcontextlost", contextLost);
  pad.addEventListener("pointerdown", padDown);
  pad.addEventListener("pointermove", padMove);
  pad.addEventListener("pointerup", padEnd);
  pad.addEventListener("pointercancel", padEnd);
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
    canvas.removeEventListener("webglcontextlost", contextLost);
    pad.removeEventListener("pointerdown", padDown);
    pad.removeEventListener("pointermove", padMove);
    pad.removeEventListener("pointerup", padEnd);
    pad.removeEventListener("pointercancel", padEnd);
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
    teachers.forEach((teacher) => { disposeLabel(teacher.badge); teacher.robe.dispose(); });
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
    if (!container.current) return;
    try {
      return makeScene(container.current, latest);
    } catch (error) {
      console.error("Không khởi tạo được sân 3D.", error);
      latest.current.onUnavailable();
    }
  }, []);
  return (
    <div className={styles.scene} ref={container}>
      <div data-joystick className={props.interactive ? styles.joystick : styles.hidden} aria-hidden="true"><span /></div>
    </div>
  );
}
