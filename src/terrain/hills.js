// ============================================================
// 远景：连绵荒原土坡 + 荒原防护林 + 地平线雾带（景深层次）
// ============================================================
import * as THREE from '../../js/three.module.js';
import { CFG, C } from '../config.js';
import { fbm, mulberry32 } from '../utils/noise.js';
import { gobiTex } from '../utils/textures.js';
import { toon, toonMap } from '../utils/materials.js';

// ---- 远山土坡 ----
export function buildHills(scene) {
  const group = new THREE.Group();
  group.name = 'hills';

  const mat = toonMap({
    map: gobiTex({ tile: 10 }),
    color: 0xf0ecdf,
    roughness: 1,
    envMapIntensity: 0.12,
    vertexColors: true,
  });

  const hillDefs = [
    // 连绵主山带：南侧远端
    { x: -20, z: -45, rx: 26, rz: 13, h: 2.6, seed: 41 },
    { x: 2, z: -45.5, rx: 24, rz: 12, h: 2.2, seed: 57 },
    { x: 26, z: -44.5, rx: 22, rz: 12, h: 2.0, seed: 89 },
    // 西侧远端
    { x: -45.5, z: 6, rx: 14, rz: 30, h: 2.2, seed: 71 },
    { x: -44.5, z: -18, rx: 13, rz: 24, h: 1.8, seed: 13 },
    // 北侧建筑后方
    { x: -14, z: 45, rx: 20, rz: 9, h: 1.7, seed: 23 },
    { x: 12, z: 45.3, rx: 24, rz: 9, h: 1.9, seed: 67 },
    // 东侧
    { x: 45, z: -14, rx: 12, rz: 22, h: 1.6, seed: 97 },
    { x: 45.2, z: 16, rx: 11, rz: 18, h: 1.4, seed: 19 },
  ];

  for (const d of hillDefs) {
    const seg = 64;
    const geo = new THREE.PlaneGeometry(d.rx * 2, d.rz * 2, seg, seg);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const lx = pos.getX(i), lz = pos.getZ(i);
      const nx = lx / d.rx, nz = lz / d.rz;
      const d2 = Math.min(1, nx * nx + nz * nz);
      const fall = 1 - d2 * d2;
      const n = fbm(lx * 0.06 + d.seed, lz * 0.06, 4, d.seed);
      const hgt = d.h * fall * (0.65 + n * 0.7);
      pos.setY(i, hgt);
      const colN = fbm(lx * 0.08, lz * 0.08, 3, d.seed + 5);
      let r = 0.52 + colN * 0.14, g = 0.48 + colN * 0.14, b = 0.39 + colN * 0.1;
      const shade = fall * 0.7 + 0.3;
      colors[i * 3] = r * shade; colors[i * 3 + 1] = g * shade; colors[i * 3 + 2] = b * shade;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mat);
    m.position.set(d.x, 0.04, d.z);
    m.receiveShadow = true;
    group.add(m);
  }

  scene.add(group);
  return group;
}

// ---- 荒原防护林 ----
export function buildForest(scene) {
  const group = new THREE.Group();
  group.name = 'forest';

  const trunkGeo = new THREE.CylinderGeometry(0.07, 0.11, 0.6, 6);
  const cone1Geo = new THREE.ConeGeometry(0.48, 0.95, 8);
  const cone2Geo = new THREE.ConeGeometry(0.34, 0.72, 8);
  const trunkMat = toon({ color: 0x4b4036, roughness: 1, envMapIntensity: 0.1 });
  const leafMat = toon({ color: 0x43522f, roughness: 0.95, envMapIntensity: 0.15 });
  const leafMat2 = toon({ color: 0x33411f, roughness: 0.95, envMapIntensity: 0.15 });

  // 树位：北侧防护林 + 南侧远带 + 西侧一片
  const rng = mulberry32(555);
  const spots = [];
  const band = (x0, x1, z0, z1, n, allow) => {
    let guard = 0;
    while (spots.length < n && guard < n * 20) {
      guard++;
      const x = x0 + rng() * (x1 - x0);
      const z = z0 + rng() * (z1 - z0);
      if (!allow(x, z)) continue;
      spots.push({ x, z, s: 0.8 + rng() * 0.9, r: rng() * Math.PI * 2 });
    }
  };
  const outside = (x, z) => !(x > CFG.fence.x0 && x < CFG.fence.x1 && z > CFG.fence.z0 && z < CFG.fence.z1);
  band(-16, 16, 42, 45, 34, outside);
  band(-34, -8, -46.5, -43.5, 26, outside);
  band(-46.5, -43.5, -22, -6, 14, outside);
  band(38, 45.5, 18, 30, 12, outside);
  band(-45, -38, 30, 43, 16, outside);

  const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, spots.length);
  const c1Inst = new THREE.InstancedMesh(cone1Geo, leafMat, spots.length);
  const c2Inst = new THREE.InstancedMesh(cone2Geo, leafMat2, spots.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  const p = new THREE.Vector3();
  for (let i = 0; i < spots.length; i++) {
    const d = spots[i];
    e.set(0, d.r, 0);
    q.setFromEuler(e);
    m4.compose(p.set(d.x, 0, d.z), q, new THREE.Vector3(d.s, d.s, d.s));
    trunkInst.setMatrixAt(i, m4);
    m4.compose(p.set(d.x, 0.85 * d.s, d.z), q, new THREE.Vector3(d.s, d.s, d.s));
    c1Inst.setMatrixAt(i, m4);
    m4.compose(p.set(d.x, 1.5 * d.s, d.z), q, new THREE.Vector3(d.s * 0.9, d.s * 0.85, d.s));
    c2Inst.setMatrixAt(i, m4);
  }
  trunkInst.instanceMatrix.needsUpdate = true;
  c1Inst.instanceMatrix.needsUpdate = true;
  c2Inst.instanceMatrix.needsUpdate = true;
  trunkInst.castShadow = true;
  c1Inst.castShadow = true;
  c2Inst.castShadow = true;
  group.add(trunkInst, c1Inst, c2Inst);

  scene.add(group);
  return group;
}

// ---- 地平线雾带（空气层次）----
export function buildHaze(scene) {
  const group = new THREE.Group();
  group.name = 'haze';
  // 渐变纹理：左透明 → 右雾色
  const c = document.createElement('canvas');
  c.width = 512; c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 512, 0);
  grad.addColorStop(0, 'rgba(217,230,239,0.42)');
  grad.addColorStop(0.55, 'rgba(217,230,239,0.20)');
  grad.addColorStop(1, 'rgba(217,230,239,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 512, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;

  const mat = new THREE.MeshBasicMaterial({
    map: tex, transparent: true, depthWrite: false,
    side: THREE.DoubleSide, fog: false,
  });

  const edges = [
    { x: -46.5, z: -10, ry: -Math.PI / 2, w: 58, h: 6, y: 1.3 },
    { x: 46.5, z: -6, ry: Math.PI / 2, w: 58, h: 6, y: 1.2 },
    { x: 0, z: -47, ry: 0, w: 88, h: 5, y: 1.4 },
    { x: 6, z: 47, ry: Math.PI, w: 88, h: 5, y: 1.5 },
  ];
  for (const ed of edges) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(ed.w, ed.h), mat);
    m.position.set(ed.x, ed.y, ed.z);
    m.rotation.y = ed.ry;
    group.add(m);
  }
  scene.add(group);
  return group;
}
