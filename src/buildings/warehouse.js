// ============================================================
// 机场设备库房：防爆墙体、厚重金属库门（微开）、外墙斑驳漆面、
// 钢架货架/维修工具/备用线缆等内部透过门窗可见
// ============================================================
import * as THREE from '../../js/three.module.js';
import { CFG, C } from '../config.js';
import { concreteTex, paintWearTex, rustTex } from '../utils/textures.js';
import { toonMap, toon, glass, glow, metal } from '../utils/materials.js';
import { box, cyl, mesh } from '../utils/helpers.js';

export function buildWarehouse(scene) {
  const group = new THREE.Group();
  group.name = 'warehouse';
  const [px, pz] = CFG.warehouse.pos;
  const [bw, bd] = CFG.warehouse.size;
  const bh = 4.0;

  const wallMat = toonMap({ map: concreteTex({ tile: 3, base: '#9c9c93', dark: '#7c7c74' }), color: 0xe8e6dc, roughness: 1, envMapIntensity: 0.15 });
  const wallStain = toonMap({ map: concreteTex({ tile: 3, base: '#8f8f87', dark: '#6f6f68' }), color: 0xdcdad0, roughness: 1, envMapIntensity: 0.12 });
  const doorMat = toonMap({ map: paintWearTex({ tile: 2, base: '#7d8278', chip: '#6b5644' }), color: 0xd8d6ca, roughness: 0.55, envMapIntensity: 0.5 });
  const roofMat = toonMap({ map: paintWearTex({ tile: 3, base: '#6e6e66' }), color: 0xcfcdc2, roughness: 0.9, envMapIntensity: 0.25 });
  const trimMat = toon({ color: 0x3c3f45, roughness: 0.6, envMapIntensity: 0.5 });
  const glassMat = glass({ color: 0x44576c, opacity: 0.5, envMapIntensity: 1.1, emissive: 0x0b1620, emissiveIntensity: 0.3 });

  // ---- 主库 ----
  const wall = mesh(box(bw, bh, bd), wallMat, 0, bh / 2, 0);
  wall.castShadow = wall.receiveShadow = true;
  group.add(wall);
  const roof = mesh(box(bw + 0.6, 0.24, bd + 0.6), roofMat, 0, bh + 0.12, 0);
  roof.castShadow = true;
  group.add(roof);
  const cope = mesh(box(bw + 0.74, 0.18, bd + 0.74), trimMat, 0, bh + 0.24, 0);
  group.add(cope);

  // 防爆扶壁柱（沿长墙）
  for (const [dx, dz] of [[1, 0], [-1, 0]]) {
    for (let i = 0; i < 5; i++) {
      const bx0 = -bw / 2 + 1.2 + i * (bw - 2.4) / 4;
      const bt = mesh(box(0.5, bh, 0.45), wallStain, dx * (bw / 2 - 0.2), bh / 2, dz * (bd / 2 - 0.2) + bx0 * 0);
      bt.position.x = bx0; bt.position.z = dz * (bd / 2 - 0.22);
      group.add(bt);
    }
  }

  // 高窗（两侧长墙）
  for (const dz of [1, -1]) {
    for (let i = 0; i < 4; i++) {
      const wx = -bw / 2 + 2.2 + i * (bw - 4.4) / 3;
      const w = mesh(box(1.1, 0.5, 0.06), glassMat, wx, bh * 0.68, dz * (bd / 2 + 0.03));
      group.add(w);
      const f = mesh(box(1.18, 0.07, 0.1), trimMat, wx, bh * 0.68 + 0.28, dz * (bd / 2 + 0.03));
      group.add(f);
    }
  }

  // ---- 厚重金属库门（微开）----
  const doorW = 3.4, doorH = 3.0;
  const door = mesh(box(0.14, doorH, doorW), doorMat, 0, doorH / 2, bd / 2 + 0.05);
  group.add(door);
  // 门面横筋 + 铆钉行
  for (let i = 0; i < 4; i++) {
    const rib = mesh(box(0.1, 0.06, doorW - 0.2), trimMat, 0, 0.5 + i * (doorH - 1) / 3, bd / 2 + 0.1);
    group.add(rib);
  }
  // 门旁警示竖纹
  for (let i = 0; i < 4; i++) {
    const strip = mesh(box(0.03, 0.5, 0.4), glow({ color: 0xd8d8cc, intensity: 0.4 }), 0, 0.9 + i * 0.6, bd / 2 + 0.14);
    group.add(strip);
  }
  // 门框
  const frame = mesh(box(0.5, doorH + 0.3, doorW + 0.5), trimMat, 0, doorH / 2 + 0.15, bd / 2 + 0.03);
  frame.material = trimMat;
  group.add(frame);

  // ---- 内部（透过门缝/高窗可见）----
  const interior = new THREE.Group();
  interior.position.set(0, 0, bd / 2 - 1.2);
  const floor = mesh(box(bw - 0.6, 0.06, bd - 1), toon({ color: 0x56564e }), 0, 0.03, 0);
  interior.add(floor);
  // 钢架货架（两排）
  for (const [rx, rz] of [[-2.2, 0.8], [2.4, 0.8]]) {
    const rack = mesh(box(1.6, 1.9, 0.6), metal({ color: 0x60646b, roughness: 0.5, envMapIntensity: 0.8 }), rx, 1.05, rz);
    interior.add(rack);
    for (let i = 0; i < 3; i++) {
      const shelf = mesh(box(1.5, 0.05, 0.55), trimMat, rx, 0.25 + i * 0.55, rz);
      interior.add(shelf);
      // 架上的备件箱
      for (let j = 0; j < 4; j++) {
        const cbox = mesh(box(0.3, 0.16, 0.4), toon({ color: j % 2 ? 0x6a6a5c : 0x55554a }), rx - 0.55 + j * 0.37, 0.42 + i * 0.55, rz);
        interior.add(cbox);
      }
    }
  }
  // 备用线缆卷
  for (const [cx, cz] of [[-3.6, -0.4], [3.8, -1.0]]) {
    const coil = mesh(cyl(0.28, 0.28, 0.26, 14), toon({ color: 0x2e3238 }), cx, 0.13, cz);
    coil.rotation.x = Math.PI / 2;
    interior.add(coil);
  }
  // 维修工具台
  const bench = mesh(box(1.3, 0.14, 0.7), toon({ color: 0x6a6555 }), 0.4, 0.48, -1.8);
  interior.add(bench);
  for (let i = 0; i < 4; i++) {
    const leg = mesh(box(0.06, 0.45, 0.06), trimMat, 0.4 - 0.55 + i * 0.36, 0.24, -1.8);
    interior.add(leg);
  }
  // 落地灯具（点亮）
  const floorLamp = mesh(cyl(0.03, 0.05, 1.1, 8), trimMat, 2.8, 0.55, -1.6);
  const lampHead = mesh(cyl(0.12, 0.12, 0.1, 10), glow({ color: 0xf2ecd2, intensity: 0.9 }), 2.8, 1.13, -1.6);
  lampHead.rotation.x = Math.PI / 2;
  interior.add(floorLamp, lampHead);
  // 顶部灯管
  for (const lx of [-2.5, 0, 2.5]) {
    const tube = mesh(box(1.6, 0.05, 0.1), glow({ color: 0xf4efd8, intensity: 0.5 }), lx, 2.4, 0);
    interior.add(tube);
  }
  group.add(interior);

  group.position.set(px, 0, pz);
  scene.add(group);
  return group;
}
