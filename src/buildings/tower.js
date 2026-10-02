// ============================================================
// 苏式机场塔台：方正粗粝混凝土、多层收进、观景玻璃窗带、
// 顶层指挥平台、外置爬梯、信号天线组；内部指挥台/仪表屏/电台透过玻璃可见
// ============================================================
import * as THREE from '../../js/three.module.js';
import { CFG, C } from '../config.js';
import { concreteTex, rustTex } from '../utils/textures.js';
import { toonMap, glass, glow, toon } from '../utils/materials.js';
import { box, cyl, sph, mesh } from '../utils/helpers.js';

export function buildTower(scene) {
  const group = new THREE.Group();
  group.name = 'tower';
  const [px, pz] = CFG.tower.pos;

  const concMat = toonMap({ map: concreteTex({ tile: 2 }), color: 0xe2e0d6, roughness: 0.98, envMapIntensity: 0.18 });
  const concDark = toonMap({ map: concreteTex({ tile: 2, base: '#8d8d85', dark: '#74746d' }), color: 0xd8d6cc, roughness: 0.98, envMapIntensity: 0.15 });
  const glassMat = glass({ color: 0x5a7188, opacity: 0.52, envMapIntensity: 1.3, emissive: 0x101c28, emissiveIntensity: 0.35 });
  const frameMat = toon({ color: 0x3c3f45, roughness: 0.6, envMapIntensity: 0.5 });
  const steelMat = toonMap({ map: rustTex({ tile: 2, base: '#6b5644' }), color: 0xccccbb, roughness: 0.8, envMapIntensity: 0.4 });

  // ---- 基层 ----
  const base = mesh(box(4.4, 3.4, 4.4), concMat, 0, 1.7, 0);
  base.castShadow = base.receiveShadow = true;
  group.add(base);
  // 入口门
  const door = mesh(box(0.9, 1.9, 0.08), steelMat, 0.9, 0.95, 2.21);
  group.add(door);
  // 基座台阶
  for (let i = 0; i < 3; i++) {
    const s = mesh(box(1.3 - i * 0.22, 0.14, 0.5), concDark, 0.95, 0.07 + i * 0.14, 2.35 + i * 0.12);
    group.add(s);
  }

  // ---- 二层 ----
  const mid = mesh(box(3.4, 2.7, 3.4), concMat, 0, 4.75, 0);
  mid.castShadow = mid.receiveShadow = true;
  group.add(mid);
  // 二层小窗
  for (const [wx, wz] of [[1.72, 0], [-1.72, 0], [0, 1.72], [0, -1.72]]) {
    const w = mesh(box(0.5, 0.5, 0.06), glassMat, wx * 0.6, 4.75, wz * 0.6);
    w.position.x = wx; w.position.z = wz;
    group.add(w);
    const f = mesh(box(0.56, 0.06, 0.09), frameMat, wx, 5.06, wz);
    group.add(f);
  }

  // ---- 指挥层（观景玻璃窗带）----
  const cab = mesh(box(3.8, 1.9, 3.8), concMat, 0, 7.05, 0);
  cab.castShadow = cab.receiveShadow = true;
  group.add(cab);
  // 玻璃窗带（四围）
  const glassH = 1.15, glassY = 7.0;
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const g = mesh(box(3.5, glassH, 0.06), glassMat, dx * 1.92, glassY, dz * 1.92);
    group.add(g);
    // 窗棂
    for (let i = -1; i <= 1; i++) {
      const mull = mesh(box(0.05, glassH + 0.06, 0.1), frameMat, dx * 1.92 + (dx === 0 ? 0 : i * 0.55), glassY, dz * 1.92 + (dz === 0 ? i * 0.55 : 0));
      group.add(mull);
    }
  }
  // 窗台
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const sill = mesh(box(3.6, 0.12, 0.16), concDark, dx * 1.92, 6.36, dz * 1.92);
    group.add(sill);
  }

  // ---- 顶层指挥平台（屋顶 + 围栏）----
  const roof = mesh(box(4.2, 0.28, 4.2), concMat, 0, 8.24, 0);
  roof.castShadow = true;
  group.add(roof);
  const parapet = mesh(box(4.4, 0.5, 0.18), concDark, 0, 8.6, 2.11);
  group.add(parapet);
  const parapet2 = mesh(box(0.18, 0.5, 4.4), concDark, 2.11, 8.6, 0);
  group.add(parapet2);
  const parapet3 = mesh(box(0.18, 0.5, 4.4), concDark, -2.11, 8.6, 0);
  group.add(parapet3);
  const parapet4 = mesh(box(4.4, 0.5, 0.18), concDark, 0, 8.6, -2.11);
  group.add(parapet4);

  // ---- 外置爬梯（西侧）----
  for (let i = 0; i < 5; i++) {
    const rung = mesh(box(0.5, 0.05, 0.05), steelMat, -2.35, 1.6 + i * 1.3, -0.5);
    group.add(rung);
  }
  const rail1 = mesh(box(0.06, 6.4, 0.06), steelMat, -2.1, 3.6, -0.55);
  const rail2 = mesh(box(0.06, 6.4, 0.06), steelMat, -2.6, 3.6, -0.55);
  group.add(rail1, rail2);

  // ---- 信号天线组 ----
  const mast = mesh(cyl(0.06, 0.09, 2.6, 10), steelMat, 0, 9.8, 0);
  group.add(mast);
  const boom = mesh(box(0.05, 0.05, 1.5), steelMat, 0, 10.7, 0);
  group.add(boom);
  // 横梁振子
  for (const [dx, dz] of [[0.6, 0], [-0.6, 0], [0, 0.5], [0, -0.5]]) {
    const el = mesh(cyl(0.012, 0.012, 0.5, 6), steelMat, dx, 10.75, dz);
    el.rotation.z = Math.PI / 2;
    group.add(el);
  }
  // 顶部鞭状天线
  const whip = mesh(cyl(0.008, 0.012, 0.8, 6), steelMat, 0.25, 11.2, 0.1);
  whip.rotation.z = -0.18;
  group.add(whip);
  // 航标灯（频闪）
  const beacon = mesh(sph(0.09, 10), glow({ color: 0xff3b2f, intensity: 1.6 }), 0, 10.95, 0);
  beacon.userData.flash = { phase: 0, speed: 1.7, min: 0.25, max: 1.0 };
  group.add(beacon);
  const beacon2 = mesh(sph(0.06, 8), glow({ color: 0xffd9a0, intensity: 1.1 }), -0.4, 11.0, 0.15);
  beacon2.userData.flash = { phase: 1.3, speed: 1.7, min: 0.4, max: 1.0 };
  group.add(beacon2);

  // ---- 指挥室内部（透过玻璃可见）----
  const interior = new THREE.Group();
  interior.position.y = 6.15;
  // 指挥台
  const desk = mesh(box(1.7, 0.16, 0.9), concDark, 0, 0.32, -0.55);
  interior.add(desk);
  // 仪表屏幕（发光）
  for (const [dx, dz] of [[-0.5, -0.95], [0, -0.95], [0.5, -0.95]]) {
    const scr = mesh(box(0.42, 0.3, 0.04), glow({ color: 0x7fc4e8, intensity: 0.9 }), dx, 0.55, dz);
    interior.add(scr);
  }
  // 机械按键面板
  const panel = mesh(box(1.5, 0.5, 0.06), toon({ color: 0x2e3238 }), 0, 0.34, -1.0);
  interior.add(panel);
  // 通讯电台柜
  const radio = mesh(box(0.5, 0.75, 0.35), toon({ color: 0x4b5147 }), -1.0, 0.5, -1.0);
  interior.add(radio);
  const radioBtn = mesh(box(0.3, 0.2, 0.03), glow({ color: 0xa8e08a, intensity: 0.5 }), -1.0, 0.66, -1.18);
  interior.add(radioBtn);
  // 座椅 ×2
  for (const [sx, sr] of [[-0.45, 0], [0.45, Math.PI]]) {
    const seat = mesh(box(0.34, 0.12, 0.34), toon({ color: 0x3a4038 }), sx, 0.24, -0.1);
    const back = mesh(box(0.34, 0.42, 0.08), toon({ color: 0x33382f }), sx, 0.5, -0.24);
    interior.add(seat, back);
  }
  // 图纸文件架
  const shelf = mesh(box(0.8, 0.9, 0.3), toon({ color: 0x5a5a50 }), 1.1, 0.55, -0.9);
  interior.add(shelf);
  for (let i = 0; i < 4; i++) {
    const doc = mesh(box(0.72, 0.02, 0.24), toon({ color: i % 2 ? 0x8f8a7a : 0x6e6a5c }), 1.1, 0.22 + i * 0.16, -0.9);
    interior.add(doc);
  }
  // 顶部日光灯
  const lamp = mesh(box(2.2, 0.05, 0.16), glow({ color: 0xf4efd8, intensity: 0.55 }), 0, 1.28, 0);
  interior.add(lamp);
  // 地板与内墙
  const floor = mesh(box(3.6, 0.04, 3.6), toon({ color: 0x5f5d55 }), 0, 0.02, 0);
  interior.add(floor);
  group.add(interior);

  // ---- 外挂管线 ----
  const pipe = mesh(cyl(0.05, 0.05, 3.6, 10), steelMat, 1.7, 3.6, -1.4);
  group.add(pipe);

  group.position.set(px, 0, pz);
  scene.add(group);
  return {
    group,
    update(t) {
      // 航标灯频闪
      for (const b of [beacon, beacon2]) {
        const f = b.userData.flash;
        const v = 0.5 + 0.5 * Math.sin(t * f.speed * Math.PI * 2 + f.phase);
        const iv = f.min + (f.max - f.min) * (v * v);
        b.material.color.setHex(f.phase ? 0xffd9a0 : 0xff3b2f);
        b.material.opacity = 1;
        b.material._glowIntensity = iv;
        b.scale.setScalar(0.7 + iv * 0.5);
      }
    },
  };
}
