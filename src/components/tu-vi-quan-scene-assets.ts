import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// All runtime URLs are local; provenance and SHA-256 are in assets/manifest.json.
export function courtyardAssets(scene: THREE.Scene) {
  let disposed = false;
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  const roots: THREE.Object3D[] = [];
  const loader = new THREE.TextureLoader();
  function texture(file: string, color = false) {
    const value = loader.load(`/tu-vi-quan/assets/${file}.jpg`, loaded => {
      if (disposed) loaded.dispose();
    });
    value.wrapS = value.wrapT = THREE.RepeatWrapping;
    value.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    value.anisotropy = 4;
    textures.add(value);
    return value;
  }
  const stone = { map: texture("stone_floor_diff", true), normalMap: texture("stone_floor_normal"), roughnessMap: texture("stone_floor_rough") };
  const wood = { map: texture("wood_planks_diff", true), normalMap: texture("wood_planks_normal"), roughnessMap: texture("wood_planks_rough") };
  const cloth = texture("terlenka_normal");
  const grass = texture("leafy_grass_diff", true);
  grass.repeat.set(18, 17);
  const paving = texture("grassy_cobblestone_diff", true);
  const gltfLoader = new GLTFLoader().register(parser => {
    // Embedded images use img-src blob: without relaxing the site's connect-src policy.
    parser.textureLoader = new THREE.TextureLoader(parser.options.manager);
    return { name: "QuanEmbeddedImages" };
  });
  function collect(root: THREE.Object3D) {
    root.traverse(node => {
      if (!(node instanceof THREE.Mesh)) return;
      geometries.add(node.geometry);
      for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
        materials.add(material);
        for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
      }
      node.castShadow = node.receiveShadow = true;
    });
  }
  function model(file: string, placements: { x: number; y: number; z: number; width: number; rotation?: number; parent?: THREE.Object3D; tint?: THREE.Color }[]) {
    gltfLoader.load(`/tu-vi-quan/assets/${file}.glb`, gltf => {
      collect(gltf.scene);
      if (disposed) { disposeResources(); return; }
      scene.userData.assetsChanged = true;
      const bounds = new THREE.Box3().setFromObject(gltf.scene);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      for (const placement of placements) {
        const pivot = new THREE.Group();
        const model = gltf.scene.clone(true);
        const tint = placement.tint;
        if (tint) model.traverse(node => {
          if (node instanceof THREE.Mesh && node.material instanceof THREE.MeshStandardMaterial) {
            const material = node.material.clone();
            material.color = tint;
            node.material = material;
            materials.add(material);
          }
        });
        model.position.set(-center.x, -bounds.min.y, -center.z);
        pivot.add(model);
        pivot.scale.setScalar(placement.width / Math.max(size.x, size.z));
        pivot.position.set(placement.x, placement.y, placement.z);
        pivot.rotation.y = placement.rotation ?? 0;
        (placement.parent ?? scene).add(pivot);
        roots.push(pivot);
      }
    }, undefined, () => { /* The courtyard's timber geometry remains usable if a model cannot load. */ });
  }
  function disposeResources() {
    geometries.forEach(value => value.dispose());
    materials.forEach(value => value.dispose());
    textures.forEach(value => value.dispose());
  }
  return { stone, wood, cloth, grass, paving, model, dispose() {
    disposed = true;
    roots.forEach(root => root.removeFromParent());
    disposeResources();
  } };
}
