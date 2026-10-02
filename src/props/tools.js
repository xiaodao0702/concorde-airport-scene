// ============================================================
// 地勤工具道具：钢制折叠梯、地勤维修工作台、金属工具箱、
// 机械扳手配件、废旧管线
// ============================================================
import * as THREE from '../../js/three.module.js';
import { CFG, C } from '../config.js';
import { rustTex, paintWearTex } from '../utils/textures.js';
import { toonMap, toon, metal } from '../utils/materials.js';
import { box, cyl, mesh } from '../utils/helpers.js';

export function buildTools(scene) {
  const group = new THREE.Group();
  group.name = 'tools';

  const steelMat = toonMap({ map: rustTex({ tile: 1, base: '#6b5644' }), color: 0xd4cebf, roughness: 0.8, envMapIntensity: 0.4 });
  const darkMat = toon({ color: 0x3a3d42, roughness: 0.7, envMapIntensity: 0.4 });
  const toolMat = metal({ color: 0x7c8087, roughness: 0.4, envMapIntensity: 0.9 });

  // ---------------- 钢制折叠梯（机旁） ----------------
  const ladder = new THREE.Group();
  const L = 1.5;
  for (const s of [-1, 1]) {
    const rail = mesh(box(0.045, L, 0.045), steelMat, s * 0.24, L / 2, 0.05);
    rail.rotation.z = s * 0.06;
    ladder.add(rail);
    const leg = mesh(box(0.04, L * 0.8, 0.04), steelMat, s * 0.24, L * 0.42, 0.22);
    leg.rotation.z = -s * 0.22;
    ladder.add(leg);
  }
  for (let i = 0; i < 6; i++) {
    const rung = mesh(box(0.5, 0.035, 0.035), steelMat, 0, 0.18 + i * 0.22, 0.05);
    ladder.add(rung);
  }
  ladder.position.set(8.2, 0, 15.6);
  ladder.rotation.y = -0.5;
  group.add(ladder);

  // ---------------- 地勤维修工作台（机坪东） ----------------
  const bench = new THREE.Group();
  const top = mesh(box(1.2, 0.08, 0.62), steelMat, 0, 0.55, 0);
  bench.add(top);
  for (const [lx, lz] of [[-0.5, -0.24], [0.5, -0.24], [-0.5, 0.24], [0.5, 0.24]]) {
    const leg = mesh(box(0.06, 0.52, 0.06), darkMat, lx, 0.26, lz);
    bench.add(leg);
  }
  // 台钳
  const vice = mesh(box(0.2, 0.16, 0.1), toolMat, 0.32, 0.69, 0.12);
  bench.add(vice);
  // 工具排
  for (let i = 0; i < 4; i++) {
    const tl = mesh(cyl(0.012, 0.012, 0.2, 6), toolMat, -0.3 + i * 0.16, 0.66, -0.12);
    tl.rotation.x = Math.PI / 2.4;
    bench.add(tl);
  }
  // 底架搁板 + 油桶
  const shelf = mesh(box(1.0, 0.04, 0.5), steelMat, 0, 0.16, 0);
  bench.add(shelf);
  const drum = mesh(cyl(0.16, 0.16, 0.3, 14), toon({ color: 0x5f5a4c, roughness: 0.8, envMapIntensity: 0.3 }), -0.3, 0.33, 0);
  bench.add(drum);
  bench.position.set(23.4, 0, 20.5);
  bench.rotation.y = 0.9;
  group.add(bench);

  // ---------------- 金属工具箱（地勤区） ----------------
  for (const [tx, tz, ry] of [[9.4, 21.6, 1.1], [11.2, 22.2, -0.6]]) {
    const tb = new THREE.Group();
    const body = mesh(box(0.62, 0.3, 0.4), steelMat, 0, 0.15, 0);
    tb.add(body);
    const lid = mesh(box(0.62, 0.04, 0.4), darkMat, 0, 0.32, 0);
    tb.add(lid);
    const handle = mesh(cyl(0.02, 0.02, 0.5, 6), steelMat, 0, 0.4, 0);
    handle.rotation.z = Math.PI / 2;
    tb.add(handle);
    // 内部扳手
    for (let i = 0; i < 3; i++) {
      const wr = mesh(box(0.16, 0.02, 0.03), toolMat, -0.15 + i * 0.14, 0.36, 0.06);
      tb.add(wr);
    }
    tb.position.set(tx, 0, tz);
    tb.rotation.y = ry;
    group.add(tb);
  }

  // ---------------- 机械扳手配件（散落） ----------------
  for (const [wx, wz] of [[8.0, 16.8], [8.7, 16.2], [8.4, 16.5]]) {
    const wr = mesh(box(0.18, 0.02, 0.035), toolMat, wx, 0.02, wz);
    wr.rotation.y = Math.random() * 2;
    wr.rotation.z = 0.1;
    group.add(wr);
  }

  // ---------------- 废旧管线（盘卷 + 直管） ----------------
  const coil = mesh(cyl(0.24, 0.24, 0.2, 16), steelMat, 26.6, 0.1, 24.6);
  coil.rotation.x = Math.PI / 2;
  group.add(coil);
  for (const [px, pz, py, ry] of [[-22.5, 26.8, 0.45, 0.4], [-21.9, 27.3, 0.4, -0.5], [-22.8, 27.5, 0.3, 0.9]]) {
    const pipe = mesh(cyl(0.05, 0.05, 1.4, 10), steelMat, px, py, pz);
    pipe.rotation.z = Math.PI / 2;
    pipe.rotation.y = ry;
    group.add(pipe);
  }

  scene.add(group);
  return group;
}
