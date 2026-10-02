// ============================================================
// 老式露天油罐区：立式油罐 ×3（穹顶/环带/爬梯）、输油管道、
// 加压阀门、油表仪表、防腐外壳锈斑、围堰堤 —— 全部独立物件
// ============================================================
import * as THREE from '../../js/three.module.js';
import { CFG, C } from '../config.js';
import { rustTex, paintWearTex } from '../utils/textures.js';
import { toonMap, toon, metal, glow } from '../utils/materials.js';
import { box, cyl, sph, mesh } from '../utils/helpers.js';

export function buildFuelTanks(scene) {
  const group = new THREE.Group();
  group.name = 'fuelTanks';
  const [fx, fz] = CFG.fuel.pos;

  const tankMat = toonMap({ map: paintWearTex({ tile: 2, base: '#9a8f7d', chip: '#6b5644' }), color: 0xe0dcd0, roughness: 0.6, envMapIntensity: 0.45 });
  const strapMat = toonMap({ map: rustTex({ tile: 1, base: '#6b5644' }), color: 0xd6cfc0, roughness: 0.8, envMapIntensity: 0.4 });
  const pipeMat = metal({ color: 0x6e7278, roughness: 0.4, envMapIntensity: 0.9 });
  const darkMat = toon({ color: 0x3a3d42, roughness: 0.7, envMapIntensity: 0.4 });

  function tank(x, z, r, h) {
    const t = new THREE.Group();
    const body = mesh(cyl(r, r, h, 26), tankMat, 0, h / 2, 0);
    body.castShadow = body.receiveShadow = true;
    t.add(body);
    // 穹顶
    const dome = mesh(sph(r * 1.02, 18), tankMat, 0, h, 0);
    dome.scale.y = 0.55;
    dome.castShadow = true;
    t.add(dome);
    // 环带加强箍
    for (let i = 0; i < 4; i++) {
      const strap = mesh(cyl(r + 0.015, r + 0.015, 0.05, 26), strapMat, 0, h * 0.2 + i * h * 0.2, 0);
      t.add(strap);
    }
    // 爬梯
    for (let i = 0; i < 9; i++) {
      const rung = mesh(box(0.34, 0.03, 0.03), strapMat, 0.14, 0.3 + i * (h - 0.5) / 8, r + 0.05);
      t.add(rung);
    }
    // 顶部护栏 + 呼吸阀
    const rail = mesh(cyl(r + 0.06, r + 0.06, 0.03, 22, true), strapMat, 0, h + 0.5, 0);
    t.add(rail);
    const vent = mesh(cyl(0.07, 0.1, 0.3, 10), strapMat, 0, h + 0.4, r * 0.4);
    t.add(vent);
    // 油位计管
    const gauge = mesh(cyl(0.03, 0.03, h * 0.55, 8), pipeMat, r * 0.72, h * 0.55, 0);
    t.add(gauge);
    // 底部法兰
    const base = mesh(cyl(r + 0.08, r + 0.1, 0.15, 24), darkMat, 0, 0.075, 0);
    t.add(base);

    t.position.set(x, 0, z);
    group.add(t);
    return t;
  }

  // 三罐布置
  tank(fx - 0.4, fz, 1.45, 3.1);
  tank(fx + 2.0, fz + 0.6, 1.15, 2.7);
  tank(fx - 2.2, fz + 0.9, 1.3, 2.9);

  // ---------------- 输油管道（罐区 → 停机坪方向） ----------------
  const pipePts = [
    [fx - 0.4, 0.5, fz + 1.45],
    [fx - 0.4, 0.5, fz + 3.6],
    [fx - 4.4, 0.5, fz + 3.6],
    [fx - 6.8, 0.5, fz + 1.2],
  ];
  function pipeSeg(a, b) {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    const m = mesh(cyl(0.055, 0.055, len, 12), pipeMat, mid[0], mid[1], mid[2]);
    m.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize()
    );
    group.add(m);
    // 法兰
    const fl = mesh(cyl(0.085, 0.085, 0.03, 14), darkMat, a[0], a[1], a[2]);
    fl.quaternion.copy(m.quaternion);
    group.add(fl);
  }
  for (let i = 0; i < pipePts.length - 1; i++) pipeSeg(pipePts[i], pipePts[i + 1]);
  // 阀门（带手轮）
  for (const [vx, vy, vz] of [[fx - 4.4, 0.62, fz + 3.6], [fx - 0.4, 0.62, fz + 1.6]]) {
    const vbody = mesh(sph(0.1, 12), pipeMat, vx, vy, vz);
    group.add(vbody);
    const wheel = mesh(cyl(0.03, 0.03, 0.34, 10), strapMat, vx, vy + 0.2, vz);
    wheel.rotation.x = Math.PI / 2;
    group.add(wheel);
    // 油表
    const gauge = mesh(box(0.12, 0.18, 0.06), darkMat, vx - 0.12, vy + 0.12, vz);
    group.add(gauge);
    const dial = mesh(box(0.09, 0.13, 0.02), glow({ color: 0xd8e8c8, intensity: 0.4 }), vx - 0.12, vy + 0.12, vz + 0.035);
    group.add(dial);
  }
  // 落地支墩
  for (const [px, pz] of [[fx - 4.4, fz + 3.2], [fx - 6.8, fz + 1.0], [fx - 0.4, fz + 3.2]]) {
    const ped = mesh(box(0.3, 0.3, 0.3), darkMat, px, 0.15, pz);
    group.add(ped);
  }

  // ---------------- 围堰堤（防泄漏） ----------------
  const dikeW = CFG.fuel.bund[0], dikeD = CFG.fuel.bund[1];
  const dikeMat = toonMap({ map: paintWearTex({ tile: 1, base: '#8d8d85' }), color: 0xdcdad0, roughness: 0.95, envMapIntensity: 0.2 });
  const dikeH = 0.75;
  for (const [dx, dz, w, d] of [
    [0, dikeD / 2 - 0.15, dikeW, 0.3],
    [0, -(dikeD / 2 - 0.15), dikeW, 0.3],
    [dikeW / 2 - 0.15, 0, 0.3, dikeD],
    [-(dikeW / 2 - 0.15), 0, 0.3, dikeD],
  ]) {
    const seg = mesh(box(w, dikeH, d), dikeMat, fx + dx, dikeH / 2, fz + dz);
    seg.castShadow = seg.receiveShadow = true;
    group.add(seg);
  }
  // 罐区警示围栏（低矮金属）
  for (const [rx, rz] of [[fx + dikeW / 2 - 0.35, fz], [fx - dikeW / 2 + 0.35, fz]]) {
    for (let i = 0; i < 2; i++) {
      const post = mesh(cyl(0.025, 0.03, 0.7, 8), strapMat, rx, 0.35, fz - 1.6 + i * 3.2);
      group.add(post);
      const rail = mesh(box(3.4, 0.04, 0.04), strapMat, rx, 0.5, fz - 1.6 + i * 3.2);
      group.add(rail);
    }
  }

  group.position.set(0, 0, 0);
  scene.add(group);
  return group;
}
