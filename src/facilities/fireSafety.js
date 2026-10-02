// ============================================================
// 消防与安全设施：防爆消防沙箱、军用灭火器柜、地面工具收纳箱、
// 金属护栏（停机坪边）、警戒铁马（黄黑 A 字架）—— 全部独立物件
// ============================================================
import * as THREE from '../../js/three.module.js';
import { CFG, C } from '../config.js';
import { rustTex, paintWearTex } from '../utils/textures.js';
import { toonMap, toon, metal, glow } from '../utils/materials.js';
import { box, cyl, mesh } from '../utils/helpers.js';

export function buildFireSafety(scene) {
  const group = new THREE.Group();
  group.name = 'fireSafety';

  const steelMat = toonMap({ map: rustTex({ tile: 1, base: '#6b5644' }), color: 0xd4cebf, roughness: 0.8, envMapIntensity: 0.4 });
  const redMat = toonMap({ map: paintWearTex({ tile: 1, base: '#8a2f28', chip: '#6b5644' }), color: 0xe8dcd2, roughness: 0.6, envMapIntensity: 0.45 });
  const concMat = toonMap({ map: paintWearTex({ tile: 1, base: '#8d8d85' }), color: 0xdcdad0, roughness: 0.95, envMapIntensity: 0.2 });
  const warnMat = toon({ color: 0xd8b040, roughness: 0.7, envMapIntensity: 0.4 });
  const darkMat = toon({ color: 0x3a3d42, roughness: 0.7, envMapIntensity: 0.4 });

  // ---------------- 防爆消防沙箱（停机坪东侧） ----------------
  const sandBox = new THREE.Group();
  const body = mesh(box(0.9, 0.5, 0.55), redMat, 0, 0.25, 0);
  sandBox.add(body);
  // 内沙
  const sand = mesh(box(0.78, 0.06, 0.43), toon({ color: 0xc2a86a, roughness: 1, envMapIntensity: 0.1 }), 0, 0.51, 0);
  sandBox.add(sand);
  // 盖板（斜立）
  const lid = mesh(box(0.82, 0.04, 0.5), redMat, 0.02, 0.58, 0.18);
  lid.rotation.x = 0.5;
  sandBox.add(lid);
  // 铁锹
  const shovel = mesh(cyl(0.015, 0.015, 0.75, 8), steelMat, 0.42, 0.55, 0.12);
  shovel.rotation.z = 0.3;
  sandBox.add(shovel);
  sandBox.position.set(30.2, 0, 10.6);
  group.add(sandBox);

  // ---------------- 军用灭火器柜（机坪北侧） ----------------
  const extCab = new THREE.Group();
  const cab = mesh(box(0.6, 0.95, 0.28), redMat, 0, 0.475, 0);
  extCab.add(cab);
  const door = mesh(box(0.56, 0.88, 0.03), toon({ color: 0x7e2a24, roughness: 0.6, envMapIntensity: 0.4 }), 0, 0.46, 0.155);
  door.rotation.y = 0.32;
  extCab.add(door);
  // 内部灭火器
  const ext = mesh(cyl(0.06, 0.06, 0.4, 12), redMat, 0.05, 0.4, 0.02);
  extCab.add(ext);
  const extHead = mesh(cyl(0.03, 0.03, 0.1, 8), darkMat, 0.05, 0.63, 0.02);
  extCab.add(extHead);
  extCab.position.set(20.6, 0, 24.2);
  group.add(extCab);

  // ---------------- 地面工具收纳箱 ----------------
  const toolBox = new THREE.Group();
  const tb = mesh(box(0.75, 0.4, 0.5), steelMat, 0, 0.2, 0);
  toolBox.add(tb);
  const tbLid = mesh(box(0.75, 0.04, 0.5), darkMat, 0, 0.42, 0);
  toolBox.add(tbLid);
  toolBox.position.set(24.5, 0, 11.8);
  toolBox.rotation.y = 0.4;
  group.add(toolBox);

  // ---------------- 金属护栏（停机坪南缘 + 警戒带） ----------------
  function railRun(x0, z0, x1, z1, n) {
    const dx = x1 - x0, dz = z1 - z0;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const post = mesh(cyl(0.022, 0.028, 0.62, 8), steelMat, x0 + dx * t, 0.31, z0 + dz * t);
      group.add(post);
    }
    for (let r = 0; r < 2; r++) {
      const len = Math.hypot(dx, dz);
      const rail = mesh(box(len, 0.035, 0.035), steelMat, (x0 + x1) / 2, 0.42 + r * 0.18, (z0 + z1) / 2);
      rail.rotation.y = Math.atan2(dz, dx);
      group.add(rail);
    }
  }
  railRun(9.0, 9.85, 16.0, 9.85, 4);
  railRun(24.0, 9.85, 31.0, 9.85, 4);

  // ---------------- 警戒铁马（黄黑 A 字架，停机坪入口） ----------------
  for (const [hx, hz, ry] of [[17.6, 10.2, 0.5], [18.4, 10.2, -0.5]]) {
    const horse = new THREE.Group();
    // A 字两斜腿
    for (const s of [-1, 1]) {
      const leg = mesh(box(0.06, 0.9, 0.06), darkMat, s * 0.22, 0.45, 0);
      leg.rotation.z = s * 0.42;
      horse.add(leg);
    }
    // 横梁（黄黑警示）
    for (let i = 0; i < 6; i++) {
      const strip = mesh(box(0.5, 0.12, 0.04), i % 2 ? warnMat : darkMat, 0, 0.72 + i * 0.0, 0);
      strip.position.set(0, 0.78 - i * 0.0, 0);
      horse.add(strip);
    }
    const bar = mesh(box(0.52, 0.72, 0.05), darkMat, 0, 0.66, 0);
    horse.add(bar);
    for (let i = 0; i < 4; i++) {
      const s = mesh(box(0.14, 0.72, 0.06), i % 2 ? warnMat : darkMat, 0, 0.66, 0);
      s.position.x = -0.19 + i * 0.126;
      horse.add(s);
    }
    horse.position.set(hx, 0, hz);
    horse.rotation.y = ry;
    group.add(horse);
  }

  scene.add(group);
  return group;
}
