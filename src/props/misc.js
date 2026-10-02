// ============================================================
// 场地细节道具：户外水泥花台 + 耐旱戈壁植被、风化石雕底座、
// 老旧金属座椅、地面金属井盖/盖板/排水篦 —— 全部独立物件
// ============================================================
import * as THREE from '../../js/three.module.js';
import { CFG, C } from '../config.js';
import { rustTex, concreteTex } from '../utils/textures.js';
import { toonMap, toon, metal } from '../utils/materials.js';
import { box, cyl, sph, mesh } from '../utils/helpers.js';

export function buildMisc(scene) {
  const group = new THREE.Group();
  group.name = 'misc';

  const concMat = toonMap({ map: concreteTex({ tile: 2 }), color: 0xe0ded4, roughness: 0.98, envMapIntensity: 0.16 });
  const steelMat = toonMap({ map: rustTex({ tile: 1, base: '#6b5644' }), color: 0xd4cebf, roughness: 0.8, envMapIntensity: 0.4 });
  const darkMat = toon({ color: 0x3a3d42, roughness: 0.7, envMapIntensity: 0.4 });

  // ---------------- 户外水泥花台（营房前，含耐旱植被） ----------------
  function planter(x, z, ry, w = 1.2, d = 0.6) {
    const pl = new THREE.Group();
    const boxBody = mesh(box(w, 0.42, d), concMat, 0, 0.21, 0);
    pl.add(boxBody);
    const soil = mesh(box(w - 0.08, 0.04, d - 0.08), toon({ color: 0x6a604c, roughness: 1, envMapIntensity: 0.1 }), 0, 0.43, 0);
    pl.add(soil);
    // 戈壁耐旱植被（干枝灌木）
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const bush = new THREE.Group();
      for (let b = 0; b < 3; b++) {
        const twig = mesh(cyl(0.008, 0.014, 0.26 + b * 0.08, 6), toon({ color: 0x4d5236, roughness: 1, envMapIntensity: 0.1 }), (b - 1) * 0.07, 0.2, (b % 2) * 0.05);
        twig.rotation.z = (b - 1) * 0.4;
        bush.add(twig);
      }
      bush.position.set(Math.cos(a) * (w / 2 - 0.22), 0.45, Math.sin(a) * (d / 2 - 0.2));
      pl.add(bush);
    }
    pl.position.set(x, 0, z);
    pl.rotation.y = ry;
    group.add(pl);
  }
  planter(-26.5, 34.2, 0.1);
  planter(-24.8, 34.2, -0.2, 1.0, 0.5);
  planter(-9.8, 34.4, 0.3);
  planter(28.2, 34.2, -0.4, 1.3, 0.6);

  // ---------------- 风化石雕底座（塔台入口旁） ----------------
  const stone = new THREE.Group();
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.38, 0.55, 12), toonMap({
    map: concreteTex({ tile: 1, base: '#8f8d84', dark: '#737169' }), color: 0xdedcd2, roughness: 1, envMapIntensity: 0.15,
  }));
  stone.add(ped);
  // 风化侵蚀缺口（贴附小块）
  for (let i = 0; i < 3; i++) {
    const chip = mesh(box(0.08, 0.1, 0.08), darkMat, 0, 0.1 + i * 0.14, 0.2);
    chip.rotation.z = 0.4;
    stone.add(chip);
  }
  const slab = mesh(box(0.62, 0.06, 0.62), concMat, 0, 0.6, 0);
  stone.add(slab);
  stone.position.set(17.6, 0, 27.6);
  stone.rotation.y = 0.7;
  group.add(stone);

  // ---------------- 老旧金属座椅（营房前） ----------------
  function bench(x, z, ry) {
    const b = new THREE.Group();
    const seat = mesh(box(1.2, 0.045, 0.34), steelMat, 0, 0.42, 0);
    b.add(seat);
    const back = mesh(box(1.2, 0.36, 0.03), steelMat, 0, 0.62, -0.16);
    back.rotation.x = 0.12;
    b.add(back);
    for (const lx of [-0.5, 0.5]) {
      const leg = mesh(box(0.06, 0.42, 0.26), steelMat, lx, 0.21, 0);
      b.add(leg);
    }
    b.position.set(x, 0, z);
    b.rotation.y = ry;
    group.add(b);
  }
  bench(-27.8, 28.2, 0.2);
  bench(-9.2, 27.4, -0.5);

  // ---------------- 地面金属井盖 / 盖板 / 排水篦 ----------------
  const coverMat = toonMap({ map: rustTex({ tile: 1, base: '#5a544a' }), color: 0xc4c0b2, roughness: 0.7, envMapIntensity: 0.5 });
  function manhole(x, z, ry, r = 0.28) {
    const c = mesh(cyl(r, r, 0.035, 14), coverMat, x, 0.02, z);
    c.rotation.z = ry;
    c.rotation.x = Math.PI / 2;
    group.add(c);
    // 井盖纹（十字）
    const bar1 = mesh(box(r * 1.7, 0.015, 0.03), darkMat, x, 0.045, z);
    bar1.rotation.y = ry;
    group.add(bar1);
    const bar2 = mesh(box(0.03, 0.015, r * 1.7), darkMat, x, 0.045, z);
    bar2.rotation.y = ry;
    group.add(bar2);
  }
  manhole(2.5, 8.4, 0.3);
  manhole(-6.5, 8.8, -0.2, 0.24);
  manhole(16.8, 26.2, 0.5, 0.24);
  manhole(-24.6, 10.4, 0.1, 0.2);

  // 预埋管线盖板（沿滑行道）
  for (let x = -30; x <= 30; x += 6) {
    if (Math.abs(x) < 3) continue;
    const plate = mesh(box(1.1, 0.02, 0.5), coverMat, x, 0.012, 8.2);
    group.add(plate);
  }

  // 混凝土排水篦（停机坪边缘）
  for (const [gx, gz] of [[9.6, 25.4], [16.4, 25.4], [23.2, 25.4], [9.6, 9.9], [23.2, 9.9]]) {
    const grate = new THREE.Group();
    const frame = mesh(box(0.8, 0.06, 0.36), concMat, 0, 0.03, 0);
    grate.add(frame);
    for (let i = -2; i <= 2; i++) {
      const bar = mesh(box(0.02, 0.05, 0.3), darkMat, i * 0.15, 0.045, 0);
      grate.add(bar);
    }
    grate.position.set(gx, 0, gz);
    grate.rotation.y = (gx % 2) ? 0 : 1.2;
    group.add(grate);
  }

  scene.add(group);
  return group;
}
