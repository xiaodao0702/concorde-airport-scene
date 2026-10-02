// ============================================================
// 重型机场地勤拖车、钢制行李托盘、老式液压千斤顶、防滑三角木
// ============================================================
import * as THREE from '../../js/three.module.js';
import { CFG, C } from '../config.js';
import { paintWearTex, rustTex } from '../utils/textures.js';
import { toonMap, toon, metal, glow } from '../utils/materials.js';
import { box, cyl, sph, mesh } from '../utils/helpers.js';

export function buildVehicles(scene) {
  const group = new THREE.Group();
  group.name = 'vehicles';

  const bodyMat = toonMap({ map: paintWearTex({ tile: 1, base: '#5f6b5a' }), color: 0xd8d8cc, roughness: 0.6, envMapIntensity: 0.5 });
  const cabMat = toonMap({ map: paintWearTex({ tile: 1, base: '#6d7a66' }), color: 0xe0ded2, roughness: 0.6, envMapIntensity: 0.5 });
  const darkMat = toon({ color: 0x3a3d42, roughness: 0.7, envMapIntensity: 0.4 });
  const rubberMat = toon({ color: 0x26272b, roughness: 0.85, envMapIntensity: 0.3 });
  const steelMat = toonMap({ map: rustTex({ tile: 1, base: '#6b5644' }), color: 0xd4cebf, roughness: 0.8, envMapIntensity: 0.4 });

  // ---------------- 重型地勤拖车（机坪东北） ----------------
  const tractor = new THREE.Group();
  // 底盘
  const chassis = mesh(box(2.6, 0.5, 1.5), darkMat, 0, 0.55, 0);
  tractor.add(chassis);
  // 车头（前罩 + 驾驶室）
  const hood = mesh(box(1.0, 0.7, 1.4), bodyMat, 0.85, 0.9, 0);
  tractor.add(hood);
  const cab = mesh(box(1.0, 0.9, 1.5), cabMat, -0.55, 1.35, 0);
  tractor.add(cab);
  // 驾驶室玻璃
  const gl = mesh(box(0.9, 0.55, 0.04), toonMap({ map: paintWearTex({ tile: 1, base: '#4a5a68' }), color: 0xcfdde6, roughness: 0.2, envMapIntensity: 1.0 }), -0.55, 1.55, 0.76);
  tractor.add(gl);
  // 牵引钩
  const hook = mesh(box(0.3, 0.12, 0.3), steelMat, -1.32, 0.42, 0);
  tractor.add(hook);
  // 排气管
  const ex = mesh(cyl(0.06, 0.07, 0.7, 8), steelMat, 0.9, 1.5, -0.5);
  tractor.add(ex);
  // 车轮（大后轮 + 小前轮）
  function wheel(x, y, z, r, w) {
    const wh = mesh(cyl(r, r, w, 18), rubberMat, x, y, z);
    wh.rotation.x = Math.PI / 2;
    tractor.add(wh);
    const hub = mesh(cyl(r * 0.5, r * 0.5, w + 0.02, 12), metal({ color: 0x8a8f96, roughness: 0.4, envMapIntensity: 1.0 }), x, y, z);
    hub.rotation.x = Math.PI / 2;
    tractor.add(hub);
  }
  wheel(0.8, 0.42, 0.82, 0.42, 0.24);
  wheel(0.8, 0.42, -0.82, 0.42, 0.24);
  wheel(-0.9, 0.4, 0.85, 0.34, 0.2);
  wheel(-0.9, 0.4, -0.85, 0.34, 0.2);
  // 车灯
  const lamp = mesh(sph(0.05, 8), glow({ color: 0xf5efd8, intensity: 0.5 }), 1.36, 0.85, 0.45);
  tractor.add(lamp);
  tractor.position.set(28.2, 0, 13.5);
  tractor.rotation.y = 1.9;
  group.add(tractor);

  // ---------------- 钢制行李托盘 ×2 ----------------
  function pallet(x, z, ry, n) {
    const p = new THREE.Group();
    const deck = mesh(box(1.7, 0.08, 1.3), steelMat, 0, 0.12, 0);
    p.add(deck);
    for (let i = 0; i < 3; i++) {
      const rail = mesh(box(1.7, 0.05, 0.05), steelMat, 0, 0.2, -0.6 + i * 0.6);
      p.add(rail);
    }
    // 叠放货物
    for (let i = 0; i < n; i++) {
      const c = mesh(box(0.5, 0.34, 0.4), toon({ color: [0x8a8a78, 0x6e6e60, 0x9a8a70, 0x757568][i % 4], roughness: 0.9, envMapIntensity: 0.2 }), -0.3 + (i % 2) * 0.6, 0.34, (i % 3) - 0.4);
      p.add(c);
    }
    p.position.set(x, 0, z);
    p.rotation.y = ry;
    group.add(p);
  }
  pallet(25.6, 22.4, 0.3, 5);
  pallet(27.4, 21.8, -0.4, 4);

  // ---------------- 老式液压千斤顶 ----------------
  const jack = new THREE.Group();
  const base = mesh(box(0.5, 0.08, 0.4), steelMat, 0, 0.04, 0);
  jack.add(base);
  const ram = mesh(cyl(0.05, 0.07, 0.34, 10), metal({ color: 0x7c8087, roughness: 0.4, envMapIntensity: 0.9 }), 0, 0.3, 0);
  jack.add(ram);
  const head = mesh(box(0.22, 0.05, 0.18), darkMat, 0, 0.5, 0);
  jack.add(head);
  const arm = mesh(box(0.4, 0.04, 0.05), steelMat, 0.32, 0.16, 0);
  arm.rotation.z = 0.3;
  jack.add(arm);
  jack.position.set(4.2, 0, 17.2);
  jack.rotation.y = -0.7;
  group.add(jack);

  // ---------------- 防滑三角木（主轮前） ----------------
  function chock(x, z, ry) {
    const c = new THREE.Group();
    const wedge = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.14, 10, 1, false), rubberMat);
    wedge.scale.set(0.5, 0.55, 1);
    wedge.rotation.z = 0.35;
    c.add(wedge);
    c.position.set(x, 0, z);
    c.rotation.y = ry;
    group.add(c);
  }
  chock(1.8, 0.62, -0.15);
  chock(1.8, -0.62, 0.15);

  scene.add(group);
  return group;
}
