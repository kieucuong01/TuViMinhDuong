"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import styles from "./tu-vi-quan-scene.module.css";

type Position = { x: number; z: number };
type Player = Position & { id: string; alias: string; action: string };
type SceneProps = {
  position: Position;
  action: string;
  players: Player[];
  onMove: (position: Position) => void;
  onUnavailable: () => void;
  interactive: boolean;
};

const PALETTE = {
  wood: 0x683629, edge: 0x482b26, red: 0x934434, gold: 0xd5a366,
  roof: 0x9a4b38, ridge: 0x63362e, plaster: 0xefcea1,
  stone: 0xba9d82, moss: 0x798554, lantern: 0xf08344, light: 0xffc27a,
};
const FRONT_COLUMNS = [-6.1, -3.1, 0, 3.1, 6.1];

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
  renderer.setClearColor(0x95717b);
  renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio));
  const canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true");
  container.append(canvas);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xa87979, 23, 69);
  const camera = new THREE.PerspectiveCamera(54, 1, 0.08, 140);
  const sky = new THREE.HemisphereLight(0xffe6d4, 0x74687f, 1.65);
  const sun = new THREE.DirectionalLight(0xffc185, 2);
  sun.position.set(-7, 14, 4);
  scene.add(sky, sun);
  const skyDome = new THREE.Mesh(
    new THREE.SphereGeometry(100, 24, 12),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      vertexShader: "varying vec3 v; void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
      fragmentShader: `varying vec3 v; void main(){
        vec3 dir=normalize(v); float h=smoothstep(-.14,.57,dir.y);
        vec3 color=mix(vec3(.83,.48,.35),vec3(.16,.17,.32),h);
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
  const materials = new Map<number, THREE.MeshLambertMaterial>();
  function material(color: number) {
    let entry = materials.get(color);
    if (!entry) {
      entry = new THREE.MeshLambertMaterial({ color });
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

  // Nền, gạch sân và vườn bao quanh.
  box(0x776e52, 0, -0.22, 0, 150, 0.4, 150);
  for (let i = 0; i < 15; i++) {
    const angle = i * Math.PI * 2 / 15;
    const distance = 26 + (i % 3) * 5;
    object("leaf", i % 2 ? 0x655565 : 0x6f6371, Math.sin(angle) * distance, -0.7, Math.cos(angle) * distance, 20, 7 + (i % 4) * 2.2, 15, 0, angle);
  }
  box(PALETTE.moss, 0, -0.12, 0, 25.4, 0.24, 25);
  box(0x8d765f, 0, -0.1, 0, 19.6, 0.26, 22.6);
  const tileColors = [0xc6a68a, 0xc2a085, 0xd0b397, 0xd5b69a, 0xb99a80];
  for (let x = -7; x <= 7; x += 1) {
    for (let z = -8; z <= 8; z += 1) {
      box(tileColors[(x * x + z * z * 2 + (x + 7) * (z + 9)) % 5], x * 1.29, 0.012, z * 1.29, 1.27, 0.08, 1.27);
    }
  }
  for (const x of [-10.15, 10.15]) {
    box(PALETTE.stone, x, 0.25, -0.45, 0.56, 0.5, 22);
    box(PALETTE.edge, x, 0.54, -0.45, 0.7, 0.12, 22.2);
    for (let z = -10; z <= 10; z += 3.3) {
      box(PALETTE.stone, x, 0.55, z, 0.9, 1.1, 0.88);
      box(PALETTE.plaster, x, 1.13, z, 0.97, 0.12, 0.97);
    }
  }
  box(PALETTE.stone, 0, 0.39, -11.2, 20.8, 0.78, 0.59);
  box(PALETTE.edge, 0, 0.85, -11.2, 21.1, 0.16, 0.73);
  for (const [x, z, size] of [
    [-11.3, -8, 4.5], [10.9, -10, 4.1], [-10.95, 4.8, 4.1],
    [10.9, 5.7, 4.8], [-13, -2, 3.6], [13.1, 0, 3.3], [-5.3, -12, 4.3],
    [4, -12.8, 4.2], [-15, -14, 5.3], [13.5, -14, 5.9],
  ]) tree(x, z, size, x === 10.9 || z === 4.8);
  for (let i = 0; i < 16; i += 1) {
    const x = (i % 2 ? 1 : -1) * (10.85 + (i % 3) * 0.2);
    const z = -10 + i * 1.31;
    object("leaf", [0x82884f, 0xa0a258, 0x71834d][i % 3], x, 0.26, z, 0.85, 0.77, 1);
  }

  // Nhà gỗ, cửa song và mái ngói có độ võng ở hai đầu.
  box(PALETTE.stone, 0, 0.2, -7.65, 13.7, 0.39, 5.7);
  box(0xd6b99a, 0, 0.43, -7.66, 13.4, 0.13, 5.53);
  box(PALETTE.stone, 0, 0.12, -4.32, 7.4, 0.23, 1);
  box(0xe2c6a3, 0, 0.28, -4.63, 7.4, 0.15, 0.63);
  box(PALETTE.plaster, 0, 1.75, -10.17, 12.8, 2.55, 0.2);
  for (const x of FRONT_COLUMNS) {
    for (const z of [-9.93, -5.4]) {
      box(PALETTE.stone, x, 0.59, z, 0.59, 0.24, 0.59);
      drum(PALETTE.wood, x, 1.98, z, 0.43, 2.78);
      drum(PALETTE.red, x, 3.25, z, 0.58, 0.28);
    }
  }
  for (const z of [-9.94, -5.43]) {
    box(PALETTE.wood, 0, 3.12, z, 13.65, 0.34, 0.41);
    box(PALETTE.gold, 0, 3.0, z, 13.4, 0.055, 0.45);
  }
  for (const x of [-4.55, 0, 4.55]) {
    box(PALETTE.edge, x, 1.73, -10.03, 2.3, 2.4, 0.16);
    box(PALETTE.red, x, 2.12, -9.93, 2.12, 1.56, 0.09);
    for (let i = -4; i <= 4; i += 1) box(PALETTE.gold, x + i * 0.22, 2.13, -9.85, 0.044, 1.46, 0.057);
    for (const y of [1.65, 2.13, 2.6]) box(PALETTE.wood, x, y, -9.81, 2.13, 0.064, 0.1);
  }
  box(PALETTE.wood, 0, 3.47, -7.72, 14.55, 0.27, 6.1);
  const roofZ = -7.73;
  const roofWidth = 14.9;
  for (let i = 0; i < 34; i += 1) {
    const x = -roofWidth / 2 + (i + 0.5) * roofWidth / 34;
    const tip = Math.pow(Math.abs(x) / (roofWidth / 2), 8) * 0.4;
    for (const side of [-1, 1]) {
      for (let row = 0; row < 6; row += 1) {
        const depth = (row + 0.5) * 0.52;
        const y = 5.05 - depth * 0.67 + depth * depth * 0.055 + tip;
        const color = [0xa6533e, 0xad5e46, PALETTE.roof, 0x974832][(i + row * 3) % 4];
        box(color, x, y, roofZ + side * depth, 0.455, 0.13, 0.65, side * (0.58 - depth * 0.13));
        box(PALETTE.ridge, x, y + 0.065, roofZ + side * (depth + 0.28), 0.447, 0.06, 0.083);
      }
      box(PALETTE.ridge, x, 3.48 + tip, roofZ + side * 3.19, 0.455, 0.24, 0.23);
    }
    box(PALETTE.ridge, x, 5.13 + tip, roofZ, 0.46, 0.27, 0.39);
    box(PALETTE.gold, x, 5.27 + tip, roofZ, 0.46, 0.062, 0.26);
  }
  for (const x of [-7.37, 7.37]) {
    for (const side of [-1, 1]) {
      box(PALETTE.ridge, x, 3.98, roofZ + side * 3.29, 0.37, 0.24, 0.84, side * -0.34);
      object("leaf", PALETTE.gold, x, 4.22, roofZ + side * 3.58, 0.27, 0.37, 0.24);
    }
    object("leaf", PALETTE.gold, x, 5.62, roofZ, 0.4, 0.39, 0.32);
  }
  function lantern(x: number, y: number, z: number) {
    drum(PALETTE.wood, x, y + 0.47, z, 0.06, 0.56);
    object("head", PALETTE.lantern, x, y, z, 0.57, 0.7, 0.56);
    drum(PALETTE.light, x, y + 0.3, z, 0.37, 0.09);
    drum(PALETTE.gold, x, y - 0.31, z, 0.33, 0.085);
    drum(PALETTE.red, x, y - 0.47, z, 0.06, 0.26);
  }
  for (const x of [-5.25, -2.9, 2.9, 5.25]) lantern(x, 2.43, -5.05);

  // Ba bàn thầy, án hương, sàn thiền, hồ sen và hòm gỗ.
  for (const x of [-4.3, 0, 4.3]) {
    box(0x754531, x, 0.89, -7.3, 2.6, 0.18, 1.1);
    box(0x926047, x, 0.63, -7.52, 2.43, 0.48, 0.16);
    for (const side of [-1, 1]) {
      box(PALETTE.edge, x + side * 1.03, 0.61, -7.3, 0.16, 0.52, 0.9);
      box(0x86604b, x + side * 1.58, 1.14, -7.62, 0.12, 1.48, 1.65);
      box(PALETTE.plaster, x + side * 1.57, 1.19, -7.61, 0.13, 1.11, 1.38);
    }
    box(PALETTE.plaster, x - 0.26, 1.0, -7.37, 0.73, 0.04, 0.52, 0, -0.09);
    for (let i = 0; i < 4; i += 1) box(PALETTE.wood, x - 0.28, 1.023, -7.55 + i * 0.1, 0.54, 0.006, 0.024);
    drum(0x688477, x + 0.65, 1.09, -7.4, 0.17, 0.19);
  }
  box(PALETTE.stone, -5, 0.14, -0.75, 3.2, 0.23, 1.9);
  box(PALETTE.red, -5, 0.65, -0.75, 2.42, 0.86, 0.91);
  box(PALETTE.wood, -5, 1.1, -0.75, 2.75, 0.18, 1.2);
  box(PALETTE.gold, -5, 0.72, -0.27, 1.94, 0.06, 0.035);
  drum(0x80623d, -5, 1.25, -0.75, 0.45, 0.19);
  object("head", 0xa77a3e, -5, 1.48, -0.75, 0.81, 0.48, 0.64);
  drum(PALETTE.gold, -5, 1.66, -0.75, 0.7, 0.16, 0.55);
  for (const [x, tilt] of [[-5.15, 0.17], [-5, 0], [-4.84, -0.19]]) {
    object("box", 0xa13e29, x, 1.91, -0.75, 0.03, 0.54, 0.03, 0, 0, tilt);
    object("head", 0xff7a47, x - tilt * 0.22, 2.18, -0.75, 0.066, 0.066, 0.066);
  }
  for (const x of [-5.89, -4.11]) {
    drum(0xe2bf85, x, 1.36, -0.74, 0.1, 0.34);
    object("leaf", 0xffb55d, x, 1.58, -0.74, 0.09, 0.17, 0.09);
  }
  drum(0xb99a78, 5, 0.12, 0.3, 4.5, 0.25, 3.8);
  drum(0xd0a773, 5, 0.26, 0.3, 4.13, 0.08, 3.45);
  for (const x of [3.7, 5, 6.3]) {
    drum(PALETTE.red, x, 0.36, 0.52, 0.89, 0.19, 0.7);
    drum(PALETTE.gold, x, 0.405, 0.52, 0.79, 0.04, 0.62);
  }
  drum(PALETTE.stone, 7.8, 0.1, 2.72, 2.4, 0.23, 4.5);
  drum(0x63867c, 7.8, 0.23, 2.72, 2.09, 0.08, 4.08);
  for (const [x, z] of [[7.3, 2.14], [8.15, 3.3], [7.7, 3.98], [8.2, 1.77]]) {
    drum(0x718955, x, 0.28, z, 0.49, 0.035);
    for (let i = 0; i < 5; i += 1) {
      const angle = i * (Math.PI * 2 / 5);
      object("leaf", i % 2 ? 0xe49191 : 0xd27778, x + Math.cos(angle) * 0.13, 0.39, z + Math.sin(angle) * 0.13, 0.21, 0.18, 0.19);
    }
    object("leaf", PALETTE.light, x, 0.45, z, 0.16, 0.12, 0.16);
  }
  box(PALETTE.wood, 6.4, 0.58, -4.11, 1.13, 1.1, 0.86);
  box(PALETTE.red, 6.4, 1.17, -4.11, 1.24, 0.18, 0.96);
  box(PALETTE.gold, 6.4, 0.79, -3.673, 0.45, 0.31, 0.035);
  box(PALETTE.edge, 6.4, 1.266, -4.11, 0.56, 0.017, 0.074);
  for (const x of [-5.15, 5.15]) {
    drum(PALETTE.stone, x, 0.16, 8.5, 0.55, 0.32);
    drum(PALETTE.wood, x, 1.22, 8.5, 0.2, 2.26);
    box(PALETTE.wood, x + (x < 0 ? 0.36 : -0.36), 2.34, 8.5, 0.87, 0.13, 0.15);
    lantern(x + (x < 0 ? 0.72 : -0.72), 1.57, 8.5);
  }
  for (const [x, z] of [[-6.3, 5.65], [6.5, 6.6]]) {
    box(PALETTE.wood, x, 0.53, z, 2.6, 0.15, 0.59);
    for (const side of [-1, 1]) box(PALETTE.edge, x + side * 0.91, 0.28, z, 0.18, 0.49, 0.4);
  }
  box(0x937052, 0, 0.058, 2, 1.43, 0.011, 1.43, 0, Math.PI / 4);
  box(0xc49a67, 0, 0.066, 2, 1.25, 0.01, 1.25, 0, Math.PI / 4);
  drum(0xb1855b, 0, 0.074, 2, 1.07, 0.009);
  drum(0xcda471, 0, 0.082, 2, 0.73, 0.009);
  const groundShadows = new THREE.MeshBasicMaterial({ color: 0x554332, transparent: true, opacity: 0.14, depthWrite: false });
  function shadow(x: number, z: number, width: number, depth: number) {
    const mesh = new THREE.Mesh(geometry.drum, groundShadows);
    mesh.position.set(x, 0.066, z);
    mesh.scale.set(width, 0.006, depth);
    scene.add(mesh);
  }
  shadow(-4.83, -0.5, 3.53, 1.5);
  shadow(6.55, -3.98, 1.74, 1.12);
  shadow(0.38, -6.3, 14.7, 5.2);
  for (const entry of batches.values()) {
    const mesh = new THREE.InstancedMesh(geometry[entry.shape], material(entry.color), entry.matrices.length);
    entry.matrices.forEach((matrix, index) => mesh.setMatrixAt(index, matrix));
    scene.add(mesh);
  }

  const signs: THREE.Sprite[] = [];
  for (const [title, x, y, z, large] of [
    ["Tử Vi Quán", 0, 3.64, -3.85, true],
    ["Bàn hương", -5, 2.65, -0.55, false],
    ["Góc ngồi thiền", 5, 2.22, -0.62, false],
    ["Hòm công đức", 6.38, 2.06, -4.04, false],
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
    function part(parent: THREE.Object3D, shape: Shape, colorValue: number, x: number, y: number, z: number, sx: number, sy: number, sz = sx) {
      const mesh = new THREE.Mesh(geometry[shape], material(colorValue));
      mesh.position.set(x, y, z);
      mesh.scale.set(sx, sy, sz);
      parent.add(mesh);
    }
    part(body, "cone", color, 0, 0.76, 0, 0.58, 0.77, 0.42);
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
    return { group, body, badge, arms, legs, name };
  }
  function pose(visitor: ReturnType<typeof avatar>, action: string, seconds: number, walking: boolean, reduced: boolean) {
    const stride = walking && !reduced ? Math.sin(seconds * 14) * 0.48 : 0;
    visitor.body.position.y = action === "meditate" ? -0.26 : Math.abs(stride) * 0.09;
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
  const teachers = [-4.3, 0, 4.3].map((x, index) => {
    const teacher = avatar(0x465a55, "Thầy AI · Bàn " + (index + 1));
    teacher.group.position.set(x, 0.49, -8.28);
    pose(teacher, "meditate", 0, false, true);
    return teacher;
  });
  const smoke = Array.from({ length: 7 }, () => {
    const smokeMaterial = new THREE.MeshBasicMaterial({ color: 0xffe7c6, transparent: true, opacity: 0, depthWrite: false });
    const mesh = new THREE.Mesh(geometry.leaf, smokeMaterial);
    scene.add(mesh);
    return mesh;
  });

  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const ray = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.055);
  const hit = new THREE.Vector3();
  const keys = new Set<string>();
  const steer = new THREE.Vector2();
  const cameraGoal = new THREE.Vector3();
  const cameraTarget = new THREE.Vector3();
  const look = new THREE.Vector3();
  const sparks = new Float32Array(54 * 3);
  const sparkGeometry = new THREE.BufferGeometry();
  sparkGeometry.setAttribute("position", new THREE.BufferAttribute(sparks, 3));
  const sparkMaterial = new THREE.PointsMaterial({ color: 0xffc985, size: 0.085, transparent: true, opacity: 0.7, depthWrite: false });
  const sparkCloud = new THREE.Points(sparkGeometry, sparkMaterial);
  sparkCloud.frustumCulled = false;
  scene.add(sparkCloud);
  const pad = container.querySelector<HTMLDivElement>("[data-joystick]")!;
  const knob = pad.firstElementChild as HTMLSpanElement;
  const movementKeys = new Set(["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowLeft","ArrowDown","ArrowRight"]);
  let yaw = 0;
  let pitch = 0.42;
  let cameraReady = false;
  let padId: number | undefined;
  let press: { id: number; x: number; y: number; lastX: number; lastY: number; dragged: boolean } | undefined;
  let walkTo: Position | null = null;
  let controlled: Position | null = null;
  let walked = false;
  let sentAt = 0;
  function isClear(x: number, z: number) {
    if (Math.abs(x) > 9.45 || z < -6.15 || z > 10.35) return false;
    if (((x - 7.8) / 1.55) ** 2 + ((z - 2.72) / 2.53) ** 2 < 1) return false;
    if (Math.abs(x + 5) < 1.86 && Math.abs(z + 0.75) < 1.25) return false;
    if (Math.abs(x - 6.38) < 0.73 && Math.abs(z + 4.04) < 0.75) return false;
    return !FRONT_COLUMNS.some(column => Math.abs(x - column) < 0.48 && Math.abs(z + 5.4) < 0.48);
  }
  function pressDown(event: PointerEvent) {
    if (event.button !== 0 || press || !latest.current.interactive) return;
    event.preventDefault();
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
    if (isClear(hit.x, hit.z)) walkTo = { x: hit.x, z: hit.z };
  }
  function cancelPress() { press = undefined; }
  function keyDown(event: KeyboardEvent) {
    if (!latest.current.interactive || !movementKeys.has(event.code) ||
        (event.target instanceof HTMLElement && event.target.closest("input, textarea, select, [contenteditable]"))) return;
    event.preventDefault();
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
    padId = event.pointerId;
    pad.setPointerCapture(padId);
    padMove(event);
  }
  function padEnd() { padId = undefined; steer.set(0, 0); knob.style.transform = ""; }
  function clearInput() { keys.clear(); walkTo = null; press = undefined; padEnd(); }
  function resize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.fov = camera.aspect < 0.8 ? 62 : 52;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();
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
    const speed = motion.matches ? 1 : 1 - Math.exp(-delta * 6);
    visitor.group.position.x += dx * speed;
    visitor.group.position.z += dz * speed;
    pose(visitor, walking ? "idle" : action, time, walking, motion.matches);
  }
  const colors = [0x5d7b72, 0x7d5c7b, 0x9a703d, 0x43637a, 0x69794c];
  function draw(time: number) {
    if (stopped) return;
    frame = requestAnimationFrame(draw);
    if (document.hidden || time - renderedAt < 32) return;
    renderedAt = time;
    const dt = Math.min((time - (previous || time)) / 1000, 0.07);
    previous = time;
    const current = latest.current;
    if (!current.interactive && (keys.size || walkTo || padId !== undefined)) clearInput();
    let dx = steer.x + Number(keys.has("KeyD") || keys.has("ArrowRight")) - Number(keys.has("KeyA") || keys.has("ArrowLeft"));
    let dz = steer.y + Number(keys.has("KeyS") || keys.has("ArrowDown")) - Number(keys.has("KeyW") || keys.has("ArrowUp"));
    if (Math.hypot(dx, dz) > 0.09) {
      walkTo = null;
      const sideways = dx;
      dx = sideways * Math.cos(yaw) + dz * Math.sin(yaw);
      dz = dz * Math.cos(yaw) - sideways * Math.sin(yaw);
    } else if (walkTo) {
      const point = controlled ?? current.position;
      dx = walkTo.x - point.x;
      dz = walkTo.z - point.z;
      if (Math.hypot(dx, dz) < 0.17) { walkTo = null; dx = 0; dz = 0; }
    }
    const magnitude = Math.hypot(dx, dz);
    if (current.interactive && magnitude > 0.09) {
      walked = true;
      controlled ??= { ...current.position };
      const pace = 4.25 * dt / Math.max(walkTo ? 0.25 : 1, magnitude);
      const nx = controlled.x + dx * pace;
      const nz = controlled.z + dz * pace;
      const clearX = isClear(nx, controlled.z);
      if (clearX) controlled.x = nx;
      const clearZ = isClear(controlled.x, nz);
      if (clearZ) controlled.z = nz;
      if (!(clearX && Math.abs(dx) > 0.01) && !(clearZ && Math.abs(dz) > 0.01)) walkTo = null;
      if (time - sentAt >= 80) { current.onMove({ ...controlled }); sentAt = time; }
    } else if (controlled) {
      current.onMove({ ...controlled });
      controlled = null;
    }
    if (!walked) self.group.position.set(current.position.x, 0.054, current.position.z);
    move(self, controlled ?? current.position, current.action, time / 1000, dt);
    const { x, z } = self.group.position;
    const distance = camera.aspect < 0.8 ? 4.9 : 4.55;
    const planar = Math.cos(pitch) * distance;
    cameraGoal.set(x + Math.sin(yaw) * planar, 1.18 + Math.sin(pitch) * distance, z + Math.cos(yaw) * planar);
    cameraTarget.set(x - Math.sin(yaw) * 2.1, 1.45, z - Math.cos(yaw) * 2.1);
    const follow = !cameraReady || motion.matches ? 1 : 1 - Math.exp(-dt * 8);
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
        disposeLabel(visitor.badge);
        visitor = undefined;
      }
      if (!visitor) {
        const color = colors[Array.from(player.id).reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length];
        visitor = avatar(color, player.alias);
        visitor.group.position.set(player.x, 0.054, player.z);
        visitors.set(player.id, visitor);
      }
      move(visitor, player, player.action, time / 1000, dt);
      visitor.group.visible = Math.hypot(player.x - x, player.z - z) > 0.5;
    }
    for (const [id, visitor] of visitors) {
      if (active.has(id)) continue;
      visitor.group.removeFromParent();
      disposeLabel(visitor.badge);
      visitors.delete(id);
    }
    smoke.forEach((mesh, index) => {
      const phase = motion.matches ? (index + 1) / 8 : ((time / 4600 + index / smoke.length) % 1);
      mesh.position.set(-5 + phase * 0.76 + Math.sin(phase * 6) * 0.12, 2.17 + phase * 1.73, -0.75 + phase * 0.19);
      mesh.scale.setScalar(0.082 + phase * 0.35);
      mesh.material.opacity = (1 - phase) * (current.action === "incense" ? 0.42 : 0.25);
    });
    for (let i = 0; i < 54; i++) {
      const t = motion.matches ? 0 : time * 0.00037;
      sparks[i * 3] = Math.sin(i * 16.31) * 10 + Math.sin(i + t) * 0.7;
      sparks[i * 3 + 1] = 0.6 + ((i * 1.39) % 4) + Math.sin(i * 3 + t) * 0.35;
      sparks[i * 3 + 2] = Math.cos(i * 14.17) * 10 + Math.cos(i - t) * 0.8;
    }
    sparkGeometry.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
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
    Object.values(geometry).forEach((value) => value.dispose());
    materials.forEach((value) => value.dispose());
    signs.forEach(disposeLabel);
    visitors.forEach((visitor) => disposeLabel(visitor.badge));
    disposeLabel(self.badge);
    teachers.forEach((teacher) => disposeLabel(teacher.badge));
    groundShadows.dispose();
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
    } catch {
      latest.current.onUnavailable();
    }
  }, []);
  return (
    <div className={styles.scene} ref={container}>
      <div data-joystick className={props.interactive ? styles.joystick : styles.hidden} aria-hidden="true"><span /></div>
    </div>
  );
}
