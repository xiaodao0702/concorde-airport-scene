// ============================================================
// 场区边界：混凝土围墙（南/西）+ 防爆隔离墩 + 防撞水泥桩 +
// 机场界碑 + 铁丝网围栏（北/东，金属立柱 + 拉紧钢丝网 + 顶部刺线）
// + 大门门柱 —— 全部独立物件
// ============================================================
import * as THREE from '../../js/three.module.js';
import { CFG, C } from '../config.js';
import { concreteTex, fenceMeshTex, rustTex } from '../utils/textures.js';
import { toonMap, toon, glass } from '../utils/materials.js';
import { box, cyl, mesh } from '../utils/helpers.js';
import { mulberry32 } from '../utils/noise.js';

const F = CFG.fence;

export function buildPerimeter(scene) {
  const group = new THREE.Group();
  group.name = 'perimeter';

  const concMat = toonMap({ map: concreteTex({ tile: 4 }), color: 0xe4e2d8, roughness: 1, envMapIntensity: 0.16 });
  const concDark = toonMap({ map: concreteTex({ tile: 2, base: '#8b8b83', dark: '#71716a' }), color: 0xd8d6cc, roughness: 1, envMapIntensity: 0.14 });
  const postMat = toon({ color: 0x5b5e64, roughness: 0.5, envMapIntensity: 0.7 });
  const meshMat = new THREE.MeshBasicMaterial({
    map: fenceMeshTex(), transparent: true, opacity: 0.85,
    side: THREE.DoubleSide, depthWrite: false, alphaTest: 0.35,
    color: 0xa8b0b8,
  });
  const wireMat = toon({ color: 0x3f4348, roughness: 0.7, envMapIntensity: 0.4 });

  // ---------------- 混凝土围墙（南 + 西） ----------------
  function wallSegment(x, z, w, rotY) {
    const seg = new THREE.Group();
    const body = mesh(box(w, 1.85, 0.4), concMat, 0, 0.925, 0);
    body.castShadow = body.receiveShadow = true;
    seg.add(body);
    const cope = mesh(box(w + 0.08, 0.16, 0.52), concDark, 0, 1.93, 0);
    seg.add(cope);
    // 伸缩缝竖线（贴面细柱）
    for (let i = 1; i < w / 4; i++) {
      const j = mesh(box(0.02, 1.85, 0.42), concDark, -w / 2 + i * 4, 0.925, 0);
      seg.add(j);
    }
    seg.position.set(x, 0, z);
    seg.rotation.y = rotY;
    group.add(seg);
    return seg;
  }

  // 南墙：左右两段（中间留车辆大门）
  const segL = wallSegment((F.x0 + (-3)) / 2, F.z0, (-3) - F.x0, 0);
  const segR = wallSegment((3 + F.x1) / 2, F.z0, F.x1 - 3, 0);
  // 西墙（全线）
  for (let i = 0; i < 5; i++) {
    wallSegment(F.x0, F.z0 + 6 + i * 10, 9, Math.PI / 2).position.z = F.z0 + 6 + i * 10;
  }

  // ---------------- 铁丝网围栏（北 + 东） ----------------
  const postH = 1.95;
  function fenceRun(x0, z0, x1, z1, every = 4) {
    const dx = x1 - x0, dz = z1 - z0;
    const total = Math.hypot(dx, dz);
    const n = Math.max(1, Math.round(total / every));
    const ux = dx / total, uz = dz / total;
    const ux2 = -uz, uz2 = ux;         // 垂直方向
    const h = postH;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const px = x0 + dx * t, pz = z0 + dz * t;
      // 立柱
      const post = mesh(cyl(0.035, 0.045, h, 8), postMat, px, h / 2, pz);
      post.castShadow = true;
      group.add(post);
      const pad = mesh(box(0.3, 0.06, 0.3), concDark, px, 0.03, pz);
      group.add(pad);
      if (i === n) continue;
      // 网片
      const midX = (px + x0 + dx * (i + 1) / n) / 2;
      const midZ = (pz + z0 + dz * (i + 1) / n) / 2;
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(total / n, h - 0.2), meshMat);
      panel.position.set(midX, h / 2 + 0.1, midZ);
      panel.rotation.y = Math.atan2(dz, dx) - Math.PI / 2;
      panel.rotation.x = -Math.PI / 2;
      group.add(panel);
      // 顶横梁 + 拉紧钢丝（3 道）
      const rail = mesh(box(total / n, 0.03, 0.03), wireMat, midX, h + 0.02, midZ);
      rail.rotation.y = Math.atan2(dz, dx);
      group.add(rail);
      for (let wi = 0; wi < 3; wi++) {
        const wy = 0.45 + wi * 0.45;
        const w0 = mesh(cyl(0.008, 0.008, total / n, 4), wireMat, midX, wy, midZ);
        w0.rotation.z = Math.PI / 2;
        w0.rotation.y = Math.atan2(dz, dx) + Math.PI / 2;
        group.add(w0);
      }
      // 顶部刺线（斜向小锥）
      for (let s = 0; s < 2; s++) {
        const barb = mesh(cyl(0.008, 0.008, 0.5, 4), wireMat, midX + ux * total / n * (0.2 + s * 0.6) - ux * total / n * 0.5, h + 0.06, midZ);
        barb.rotation.z = Math.PI / 2 + (s ? 0.5 : -0.5);
        barb.rotation.y = Math.atan2(dz, dx);
        group.add(barb);
      }
    }
  }

  // 北线（z1）：从 x0 到 x1，但给北门留缝（x≈-2）
  fenceRun(F.x0, F.z1, -4.5, F.z1, 4);
  fenceRun(0.5, F.z1, F.x1, F.z1, 4);
  // 东线
  fenceRun(F.x1, F.z1, F.x1, F.z0 + 8, 4);
  fenceRun(F.x1, F.z0 + 2.5, F.x1, F.z0, 4);

  // ---------------- 大门（南车辆门 + 北便门） ----------------
  // 南门双柱
  for (const gx of [-4, 4]) {
    const pillar = mesh(box(0.55, 2.1, 0.55), concDark, gx, 1.05, F.z0 + 0.4);
    pillar.castShadow = true;
    group.add(pillar);
    const cap = mesh(box(0.7, 0.14, 0.7), concMat, gx, 2.16, F.z0 + 0.4);
    group.add(cap);
  }
  // 南门扇（两扇铁栅门，微开）
  for (const g of [-1, 1]) {
    const wing = new THREE.Group();
    const leaf = mesh(box(0.06, 1.9, 3.9), postMat, 0, 0.95, 0);
    wing.add(leaf);
    for (let i = 0; i < 4; i++) {
      const bar = mesh(box(0.03, 0.03, 3.7), postMat, 0, 0.3 + i * 0.5, 0);
      wing.add(bar);
    }
    wing.position.set(g * 4.6, 0, F.z0 + 1.9);
    wing.rotation.y = g * 0.5;
    group.add(wing);
  }
  // 北便门（两小柱 + 空隙）
  for (const gx of [-2.2, -1.3]) {
    const pillar = mesh(box(0.3, 2.0, 0.3), postMat, gx, 1.0, F.z1);
    group.add(pillar);
  }

  // ---------------- 防爆隔离墩（沿南墙外） ----------------
  const blockMat = concDark;
  for (let x = F.x0 + 2; x < F.x1; x += 4.6) {
    if (Math.abs(x) < 5.5) continue; // 门区留空
    const b = mesh(box(0.85, 0.85, 0.85), blockMat, x, 0.425, F.z0 - 0.8);
    b.castShadow = b.receiveShadow = true;
    group.add(b);
    const top = mesh(box(0.85, 0.08, 0.85), concMat, x, 0.88, F.z0 - 0.8);
    group.add(top);
  }
  // 西墙外隔离墩
  for (let z = F.z0 + 4; z < F.z1 - 4; z += 4.6) {
    const b = mesh(box(0.85, 0.85, 0.85), blockMat, F.x0 - 0.8, 0.425, z);
    b.castShadow = b.receiveShadow = true;
    group.add(b);
  }

  // ---------------- 防撞水泥桩（大门两侧） ----------------
  for (const gx of [-6, -5.2, 5.2, 6]) {
    const p = mesh(cyl(0.28, 0.4, 1.1, 10), concDark, gx, 0.55, F.z0 + 0.9);
    p.castShadow = true;
    group.add(p);
  }

  // ---------------- 机场界碑（四角 + 南门两侧） ----------------
  const stoneMat = concDark;
  const starMat = toon({ color: 0xa63a32, roughness: 0.7, envMapIntensity: 0.4 });
  function boundaryStone(x, z, ry) {
    const s = new THREE.Group();
    const body = mesh(box(0.38, 0.95, 0.38), stoneMat, 0, 0.475, 0);
    s.add(body);
    const cap = mesh(box(0.5, 0.1, 0.5), concMat, 0, 1.0, 0);
    s.add(cap);
    // 红星铭牌
    const star = new THREE.Mesh(new THREE.ShapeGeometry(starShape(0.11)), starMat);
    star.position.set(0, 0.62, 0.195);
    s.add(star);
    s.position.set(x, 0, z);
    s.rotation.y = ry;
    group.add(s);
  }
  boundaryStone(F.x0, F.z0, 0.6);
  boundaryStone(F.x1, F.z0, -0.6);
  boundaryStone(F.x1, F.z1, Math.PI - 0.5);
  boundaryStone(F.x0, F.z1, Math.PI + 0.5);
  boundaryStone(-4.8, F.z0 + 0.4, 0);
  boundaryStone(4.8, F.z0 + 0.4, 0);

  scene.add(group);
  return group;
}

// 红星 Shape
function starShape(r) {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.42;
    const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
    if (i === 0) s.moveTo(x, y); else s.lineTo(x, y);
  }
  s.closePath();
  return s;
}
