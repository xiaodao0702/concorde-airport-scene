// ============================================================
// 露天堆放的航空备用零件、金属板材堆、捆绑钢缆、废旧轮胎
// ============================================================
import * as THREE from '../../js/three.module.js';
import { CFG, C } from '../config.js';
import { rustTex, paintWearTex } from '../utils/textures.js';
import { toonMap, toon, metal } from '../utils/materials.js';
import { box, cyl, sph, mesh } from '../utils/helpers.js';

export function buildParts(scene) {
  const group = new THREE.Group();
  group.name = 'parts';

  const steelMat = toonMap({ map: rustTex({ tile: 1, base: '#6b5644' }), color: 0xd4cebf, roughness: 0.8, envMapIntensity: 0.4 });
  const darkMat = toon({ color: 0x3a3d42, roughness: 0.7, envMapIntensity: 0.4 });
  const rubberMat = toon({ color: 0x232428, roughness: 0.85, envMapIntensity: 0.3 });
  const plateMat = toonMap({ map: rustTex({ tile: 1, base: '#7a6a55' }), color: 0xd0cab9, roughness: 0.7, envMapIntensity: 0.5 });

  // ---------------- 备件堆放区（机坪西侧空地） ----------------
  const yard = new THREE.Group();

  // 机身段备件（蒙皮壳 + 肋框）
  const fus = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.3, 20, 1, true), toonMap({
    map: paintWearTex({ tile: 1, base: '#aeb2ae', chip: '#6b5644' }), color: 0xe4e2d8, roughness: 0.5, envMapIntensity: 0.6, side: THREE.DoubleSide,
  }));
  shell.rotation.z = Math.PI / 2;
  fus.add(shell);
  for (let i = 0; i < 4; i++) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.025, 6, 20), steelMat);
    rib.rotation.y = Math.PI / 2;
    rib.position.x = -0.55 + i * 0.37;
    fus.add(rib);
  }
  fus.rotation.z = 0.12;
  fus.position.set(-1.1, 0.46, 0);
  yard.add(fus);

  // 发动机风扇盘 + 压气机盘
  for (const [dx, dz, r] of [[0.2, -0.5, 0.24], [0.6, 0.35, 0.2], [-0.4, 0.6, 0.27]]) {
    const disc = mesh(cyl(r, r, 0.07, 16), metal({ color: 0x6e7278, roughness: 0.4, envMapIntensity: 0.9 }), dx, 0.18, dz);
    disc.rotation.x = Math.PI / 2;
    yard.add(disc);
  }

  // 机翼前缘件
  const wingPart = mesh(box(1.2, 0.14, 0.5), plateMat, 0.8, 0.1, -1.0);
  wingPart.rotation.y = 0.5;
  wingPart.rotation.x = 0.12;
  yard.add(wingPart);

  yard.position.set(10.2, 0, 14.6);
  group.add(yard);

  // ---------------- 金属板材堆（库房外） ----------------
  const platePile = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const pl = mesh(box(1.6 - i * 0.1, 0.045, 1.1 - i * 0.07), plateMat, 0, 0.045 * (i + 0.5), 0);
    pl.rotation.y = i * 0.06;
    platePile.add(pl);
  }
  platePile.position.set(19.4, 0, 27.6);
  platePile.rotation.y = 0.6;
  group.add(platePile);

  // ---------------- 捆绑钢缆（成卷 + 平放） ----------------
  for (const [cx, cz, ry] of [[-19.8, 27.8, 0.5], [-17.9, 27.2, -0.7]]) {
    const coil = mesh(cyl(0.3, 0.3, 0.14, 18), steelMat, cx, 0.07, cz);
    coil.rotation.x = Math.PI / 2;
    group.add(coil);
  }
  const cable = mesh(cyl(0.03, 0.03, 2.2, 8), steelMat, -18.6, 0.04, 26.4);
  cable.rotation.z = Math.PI / 2;
  cable.rotation.y = 0.8;
  group.add(cable);

  // ---------------- 废旧轮胎（散置） ----------------
  for (const [tx, tz, ry, r] of [[12.6, 16.8, 0.3, 0.32], [13.3, 17.5, -0.9, 0.34], [12.1, 17.9, 1.4, 0.3]]) {
    const tire = mesh(cyl(r, r, 0.2, 16), rubberMat, tx, 0.1, tz);
    tire.rotation.x = Math.PI / 2;
    tire.rotation.y = ry;
    group.add(tire);
    const rim = mesh(cyl(r * 0.55, r * 0.55, 0.22, 12), steelMat, tx, 0.1, tz);
    rim.rotation.x = Math.PI / 2;
    rim.rotation.y = ry;
    group.add(rim);
  }

  // ---------------- 机头雷达罩备件（塔台旁） ----------------
  const nose = new THREE.Group();
  const radome = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.7, 16), toonMap({
    map: paintWearTex({ tile: 1, base: '#9aa2a0' }), color: 0xe6e4da, roughness: 0.5, envMapIntensity: 0.6,
  }));
  radome.rotation.z = Math.PI / 2;
  radome.rotation.y = Math.PI / 2;
  nose.add(radome);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.02, 6, 18), steelMat);
  ring.rotation.z = Math.PI / 2;
  nose.add(ring);
  nose.position.set(15.2, 0.3, 12.4);
  nose.rotation.y = 1.8;
  nose.rotation.z = -0.08;
  group.add(nose);

  scene.add(group);
  return group;
}
