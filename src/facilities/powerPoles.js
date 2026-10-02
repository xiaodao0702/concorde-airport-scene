// ============================================================
// 老式高压电线杆 ×7：加粗钢架电杆 + 横担绝缘子 + 架空高压线
// （悬链线弧垂）+ 横竖交错工业线缆 + 分支线
// ============================================================
import * as THREE from '../../js/three.module.js';
import { CFG, C } from '../config.js';
import { rustTex } from '../utils/textures.js';
import { toonMap, toon } from '../utils/materials.js';
import { box, cyl, mesh } from '../utils/helpers.js';

export function buildPowerPoles(scene) {
  const group = new THREE.Group();
  group.name = 'powerPoles';
  const Z = -8.2;
  const TOPY = 4.35;

  const poleMat = toonMap({ map: rustTex({ tile: 1, base: '#4e4236' }), color: 0xc0bcaa, roughness: 0.75, envMapIntensity: 0.5 });
  const crossMat = toon({ color: 0x4a4d52, roughness: 0.6, envMapIntensity: 0.5 });
  const wireMat = toon({ color: 0x2e3238, roughness: 0.8, envMapIntensity: 0.5 });

  const poles = [];
  for (const px of CFG.powerPolesX) {
    // 主杆（上细下粗）
    const body = mesh(cyl(0.055, 0.13, TOPY + 0.6, 10), poleMat, px, (TOPY + 0.6) / 2, Z);
    group.add(body);
    // 横担（双层）
    for (const [ly, w] of [[TOPY - 0.15, 1.9], [TOPY - 0.75, 1.3]]) {
      const arm = mesh(box(w, 0.07, 0.07), crossMat, px, ly, Z);
      group.add(arm);
      for (const zo of [-w / 2, w / 2]) {
        // 绝缘子
        const ins = mesh(cyl(0.035, 0.05, 0.1, 8), toon({ color: 0x9a9a92, roughness: 0.9, envMapIntensity: 0.2 }), px, ly + 0.05, Z + zo);
        group.add(ins);
      }
    }
    // 斜拉臂
    const k1 = mesh(box(0.5, 0.05, 0.05), crossMat, px - 0.4, TOPY - 0.4, Z - 0.45);
    k1.rotation.z = 0.7;
    group.add(k1);
    poles.push(px);
  }

  // 高压线（三相，悬链线弧垂）
  function wire(p1, p2, zOff, sag = 0.5, n = 10) {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = p1 + (p2 - p1) * t;
      const y = TOPY - 0.15 - sag * Math.sin(Math.PI * t);
      pts.push(new THREE.Vector3(x, y, Z + zOff));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const tube = new THREE.TubeGeometry(curve, n * 2, 0.012, 5, false);
    const wm = new THREE.Mesh(tube, wireMat);
    group.add(wm);
  }
  for (let i = 0; i < poles.length - 1; i++) {
    wire(poles[i], poles[i + 1], -0.55, 0.62);
    wire(poles[i], poles[i + 1], 0, 0.5);
    wire(poles[i], poles[i + 1], 0.55, 0.62);
  }
  // 低压线（较低，横竖交错）
  function lowWire(p1, p2, y0, zOff, sag = 0.3) {
    const pts = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      pts.push(new THREE.Vector3(p1 + (p2 - p1) * t, y0 - sag * Math.sin(Math.PI * t), Z + zOff));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const wm = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.008, 4, false), wireMat);
    group.add(wm);
  }
  for (let i = 0; i < poles.length - 1; i++) {
    lowWire(poles[i], poles[i + 1], 2.6, -1.0, 0.3);
    lowWire(poles[i], poles[i + 1], 2.4, 1.0, 0.32);
  }

  // 分支线：末端杆 → 营房区小杆（横向线缆）
  const lastPole = poles[poles.length - 1];
  const branchPole = mesh(cyl(0.04, 0.09, 3.6, 8), poleMat, lastPole + 1.5, 1.8, Z - 8);
  group.add(branchPole);
  for (const zOff of [-0.8, 0.8]) {
    const pts = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      pts.push(new THREE.Vector3(
        lastPole + t * 1.5,
        3.9 - 0.25 * Math.sin(Math.PI * t),
        Z + zOff + t * -8
      ));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.008, 4, false), wireMat));
  }

  scene.add(group);
  return group;
}
