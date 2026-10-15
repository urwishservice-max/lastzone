/**
 * SPARTAN: LAST LINE
 * Model Loader & Pivot Normalization
 * 
 * Strict Uniform Scaling & Centering Rules:
 * - Center geometry at (0, 0, 0): model.position.set(-center.x, -center.y, -center.z).
 *   This ensures the model's center of mass is exactly at the pivot origin,
 *   preventing head/foot clipping when zooming or rotating.
 * - Only setScalar(s) is allowed. Never touch scale.x/y/z separately.
 * - Normalize dimensions to a standardized bounding height of 1.9m for Spartan,
 *   1.2m for Rifle, and 1.4m for Heavy Machine Gun.
 * - Clean procedural fallbacks if any GLB is unavailable or fails.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

const gltfLoader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
gltfLoader.setDRACOLoader(dracoLoader);

/**
 * Normalizes loaded model: centers pivot exactly at center of mass and scales uniformly
 */
function normalizeLoadedModel(scene, targetHeight = 1.9) {
  const pivot = new THREE.Group();
  
  // Strip out any floor, ground, or pedestal meshes/nodes embedded in models (e.g. Spartan's Floor_lambert2_0 disk)
  const toRemove = [];
  scene.traverse((child) => {
    const name = (child.name || '').toLowerCase();
    if (
      name.includes('floor') ||
      name.includes('ground') ||
      name.includes('pedestal') ||
      name.includes('disk') ||
      name.includes('plinth') ||
      name.includes('stand')
    ) {
      toRemove.push(child);
    }
  });
  toRemove.forEach((obj) => {
    if (obj.parent) {
      obj.parent.remove(obj);
    }
  });

  // Compute clean initial bounding box of the actual character/weapon geometry
  const box = new THREE.Box3().setFromObject(scene);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  // Maximum dimension ensures NO stretching
  const maxDim = Math.max(size.x, size.y, size.z) || 1.0;
  const uniformScale = targetHeight / maxDim;

  // Center model inside pivot so (0, 0, 0) is EXACTLY AT CENTER OF MASS
  // Head will be at +targetHeight/2, boots will be at -targetHeight/2
  scene.position.x = -center.x;
  scene.position.y = -center.y;
  scene.position.z = -center.z;

  // Enable shadows and enhance materials with clean culling to prevent shadow flickering
  scene.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      if (child.material) {
        child.material.envMapIntensity = 1.2;
        child.material.roughness = Math.min(child.material.roughness || 0.4, 0.6);
        // Prevent z-fighting and shadow acne flickering
        child.material.shadowSide = THREE.FrontSide;
        child.material.depthTest = true;
        child.material.depthWrite = true;
      }
    }
  });

  pivot.add(scene);
  pivot.scale.setScalar(uniformScale); // STRICT UNIFORM SCALING
  pivot.userData.baseScale = uniformScale;

  return pivot;
}

/**
 * Procedural Spartan Fallback (Hero character silhouette & armor)
 */
function createFallbackSpartan() {
  const group = new THREE.Group();

  const armorMat = new THREE.MeshStandardMaterial({
    color: 0x1A1C1E,
    roughness: 0.35,
    metalness: 0.85,
  });

  const goldVisorMat = new THREE.MeshStandardMaterial({
    color: 0xE6AF2E,
    roughness: 0.15,
    metalness: 0.95,
    emissive: 0x4D3600,
  });

  const capeMat = new THREE.MeshStandardMaterial({
    color: 0xB81424,
    roughness: 0.7,
    metalness: 0.1,
    side: THREE.DoubleSide
  });

  // Body torso
  const torsoGeo = new THREE.CylinderGeometry(0.24, 0.20, 0.65, 16);
  const torso = new THREE.Mesh(torsoGeo, armorMat);
  torso.position.y = 0.15;
  group.add(torso);

  // Spartan Helmet
  const headGeo = new THREE.SphereGeometry(0.16, 24, 24);
  const head = new THREE.Mesh(headGeo, armorMat);
  head.position.y = 0.62;
  group.add(head);

  // Gold T-visor
  const visorGeo = new THREE.BoxGeometry(0.14, 0.05, 0.16);
  const visor = new THREE.Mesh(visorGeo, goldVisorMat);
  visor.position.set(0, 0.60, 0.08);
  group.add(visor);

  // Helmet Crest
  const crestGeo = new THREE.BoxGeometry(0.04, 0.18, 0.34);
  const crest = new THREE.Mesh(crestGeo, capeMat);
  crest.position.set(0, 0.78, -0.02);
  group.add(crest);

  // Legs
  const legGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.8, 12);
  const leftLeg = new THREE.Mesh(legGeo, armorMat);
  leftLeg.position.set(-0.12, -0.55, 0);
  const rightLeg = new THREE.Mesh(legGeo, armorMat);
  rightLeg.position.set(0.12, -0.55, 0);
  group.add(leftLeg, rightLeg);

  // Shield on left arm
  const shieldGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.04, 32);
  shieldGeo.rotateX(Math.PI / 2);
  const shield = new THREE.Mesh(shieldGeo, armorMat);
  shield.position.set(-0.35, 0.15, 0.1);
  group.add(shield);

  // Spear in right hand
  const spearGeo = new THREE.CylinderGeometry(0.02, 0.02, 2.0, 12);
  const spear = new THREE.Mesh(spearGeo, armorMat);
  spear.position.set(0.35, 0.1, 0.1);
  group.add(spear);

  const pivot = new THREE.Group();
  pivot.add(group);
  pivot.scale.setScalar(1.0);
  return pivot;
}

/**
 * Procedural Assault Rifle Fallback
 */
function createFallbackRifle() {
  const pivot = new THREE.Group();
  const gunMat = new THREE.MeshStandardMaterial({
    color: 0x222428,
    roughness: 0.4,
    metalness: 0.85
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0xD7263D,
    roughness: 0.3,
    metalness: 0.6
  });

  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.12, 0.06), gunMat);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.55, 12), gunMat);
  barrel.rotation.z = Math.PI / 2;
  barrel.position.x = 0.55;

  const mag = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.22, 0.05), gunMat);
  mag.position.set(0.1, -0.14, 0);
  mag.rotation.z = 0.2;

  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.1, 0.05), gunMat);
  stock.position.set(-0.42, -0.02, 0);

  const optic = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.05), accentMat);
  optic.position.set(0, 0.09, 0);

  const group = new THREE.Group();
  group.add(receiver, barrel, mag, stock, optic);

  pivot.add(group);
  pivot.scale.setScalar(1.0);
  pivot.userData.baseScale = 1.0;
  return pivot;
}

/**
 * Procedural Heavy Machine Gun Fallback
 */
function createFallbackMachinegun() {
  const pivot = new THREE.Group();
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x181A1C,
    roughness: 0.3,
    metalness: 0.9
  });
  const drumMat = new THREE.MeshStandardMaterial({
    color: 0x2E3033,
    roughness: 0.5,
    metalness: 0.7
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0xD7263D,
    roughness: 0.2,
    metalness: 0.8
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.16, 0.12), steelMat);
  
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.85, 16), steelMat);
  barrel.rotation.z = Math.PI / 2;
  barrel.position.x = 0.85;

  const muzzleBrake = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 16), accentMat);
  muzzleBrake.rotation.z = Math.PI / 2;
  muzzleBrake.position.x = 1.3;

  const ammoDrum = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.15, 24), drumMat);
  ammoDrum.position.set(-0.05, -0.16, 0.12);

  const group = new THREE.Group();
  group.add(body, barrel, muzzleBrake, ammoDrum);

  pivot.add(group);
  pivot.scale.setScalar(1.0);
  pivot.userData.baseScale = 1.0;
  return pivot;
}

/**
 * Master Normalized Model Loader with fallback
 */
export async function loadNormalizedModel(type) {
  const modelPaths = {
    spartan: ['/models/spartan.glb', '/model/spartan.glb'],
    rifle: ['/models/rifle.glb', '/model/gun.glb', '/models/gun.glb'],
    machinegun: ['/models/machinegun.glb', '/model/m2_browning_machine_gun.glb', '/models/m2_browning_machine_gun.glb']
  };

  const targetHeights = {
    spartan: 1.9,
    rifle: 1.55,
    machinegun: 1.85
  };

  const paths = modelPaths[type] || [];
  
  for (const path of paths) {
    try {
      const gltf = await new Promise((resolve, reject) => {
        gltfLoader.load(
          path,
          (loaded) => resolve(loaded),
          undefined,
          (err) => reject(err)
        );
      });

      if (gltf && gltf.scene) {
        return normalizeLoadedModel(gltf.scene, targetHeights[type]);
      }
    } catch (e) {
      // Try next path
    }
  }

  // Fallbacks if not found
  if (type === 'spartan') return createFallbackSpartan();
  if (type === 'rifle') return createFallbackRifle();
  if (type === 'machinegun') return createFallbackMachinegun();

  const empty = new THREE.Group();
  return empty;
}
