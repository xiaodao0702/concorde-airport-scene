// ============================================================
// 滑行道 / 停机坪 / 警戒硬化带 / 停机位标线 / 防滑积灰道面
// ============================================================
import * as THREE from '../../js/three.module.js';
import { CFG, C } from '../config.js';
import { pavedTex, concreteTex } from '../utils/textures.js';
import { toonMap, toon } from '../utils/materials.js';
import { box, mesh } from '../utils/helpers.js';

export function buildTaxiwayApron(scene) {
  const group = new THREE.Group();
  group.name = 'taxiwayApron';
  const yTop = CFG.taxiway.y;

  const taxiMat = toonMap({ map: pavedTex({ line: 'rgba(232,232,226,0.9)', hazard: false }), color: 0xeae8de, roughness: 1, envMapIntensity: 0.15 });
  const apronMat = toonMap({ map: pavedTex({ hazard: true }), color: 0xe6e4d9, roughness: 1, envMapIntensity: 0.15 });

  // ---- 平行滑行道 ----
  const tw = mesh(box(CFG.taxiway.x1 - CFG.taxiway.x0, yTop, CFG.taxiway.wid), taxiMat, 0, yTop / 2, CFG.taxiway.z);
  tw.receiveShadow = true;
  group.add(tw);

  // ---- 快速脱离道（斜向连接主跑道→滑行道）----
  const exitMat = toonMap({ map: pavedTex({ line: 'rgba(232,232,226,0.8)', hazard: false }), color: 0xe8e6dc, roughness: 1, envMapIntensity: 0.15 });
  const ex = new THREE.Mesh(new THREE.PlaneGeometry(12.5, 6.6), exitMat);
  ex.rotation.x = -Math.PI / 2;
  ex.rotation.z = -0.62;
  ex.position.set(22, yTop + 0.002, 4.6);
  ex.receiveShadow = true;
  group.add(ex);

  // ---- 停机坪 ----
  const { x0, x1, z0, z1 } = CFG.apron;
  const apW = x1 - x0, apD = z1 - z0;
  const ap = mesh(box(apW, yTop, apD), apronMat, (x0 + x1) / 2, yTop / 2, (z0 + z1) / 2);
  ap.receiveShadow = true;
  group.add(ap);

  // ---- 警戒硬化带（东端，黄黑警戒）----
  const wz = CFG.warmZone;
  const wzW = wz.x1 - wz.x0, wzD = wz.z1 - wz.z0;
  const warm = mesh(box(wzW, 0.11, wzD), apronMat, (wz.x0 + wz.x1) / 2, 0.055, (wz.z0 + wz.z1) / 2);
  warm.receiveShadow = true;
  group.add(warm);

  // ---- 停机位标线（3 个停机位：白框 + 中心线 + 轮挡点）----
  const markMat = toon({ color: 0xe8e8e2, roughness: 1, envMapIntensity: 0.1, side: THREE.DoubleSide });
  const standX = [13, 20, 27];
  for (const sx of standX) {
    // 停机位框
    const frame = mesh(box(4.4, 0.012, 7.6), markMat, sx, yTop + 0.01, 17.5);
    group.add(frame);
    // 中心线
    const cl = mesh(box(3.6, 0.012, 0.14), markMat, sx, yTop + 0.012, 17.5);
    group.add(cl);
    // 前轮停止点
    const stop = mesh(box(0.6, 0.012, 0.9), markMat, sx + 1.7, yTop + 0.012, 14.4);
    group.add(stop);
    // 系留地锚（4 点）
    for (const [dx, dz] of [[-1.8, -3.4], [1.8, -3.4], [-1.8, 3.4], [1.8, 3.4]]) {
      const anchor = mesh(box(0.16, 0.05, 0.16), markMat, sx + dx, yTop + 0.03, 17.5 + dz);
      group.add(anchor);
    }
  }

  // ---- 滑行道口禁入警示带（与跑道交汇处）----
  const warnMat = toon({ color: 0xb34a40, roughness: 0.9, envMapIntensity: 0.2 });
  for (const z of [CFG.taxiway.z - 1.5, CFG.taxiway.z + 1.5]) {
    const wm = mesh(box(0.3, 0.012, 0.8), warnMat, -32.5, yTop + 0.01, z);
    group.add(wm);
  }

  scene.add(group);
  return group;
}
