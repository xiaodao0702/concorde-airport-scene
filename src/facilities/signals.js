// ============================================================
// 导航信号设施：军用风向袋（含旋转动画）、风速风向标、
// 跑道进近指示灯组、地面嵌入式航灯（频闪）—— 全部独立物件
// ============================================================
import * as THREE from '../../js/three.module.js';
import { CFG, C } from '../config.js';
import { toon, glow, metal } from '../utils/materials.js';
import { box, cyl, sph, mesh } from '../utils/helpers.js';

export function buildSignals(scene) {
  const group = new THREE.Group();
  group.name = 'signals';
  const updaters = [];

  // ---------------- 风向袋 ----------------
  const [wx, wz] = CFG.windsock.pos;
  const sock = new THREE.Group();
  const pole = mesh(cyl(0.045, 0.06, 4.2, 10), metal({ color: 0x7c7f85, roughness: 0.5, envMapIntensity: 0.9 }), 0, 2.1, 0);
  sock.add(pole);
  // 风向袋（红白条纹锥 + 收口环）
  const sockBody = new THREE.Group();
  const segs = 6;
  for (let i = 0; i < segs; i++) {
    const r0 = 0.34 - i * 0.05;
    const cone = new THREE.Mesh(
      new THREE.CylinderGeometry(r0 * 0.75, r0, 0.62, 14, 1, true),
      toon({ color: i % 2 ? 0xc33a30 : 0xe8e6e0, roughness: 0.8, envMapIntensity: 0.3, side: THREE.DoubleSide })
    );
    cone.position.y = i * 0.62;
    sockBody.add(cone);
  }
  // 袋口硬环
  const ring = mesh(cyl(0.36, 0.36, 0.06, 14), metal({ color: 0x5a5d62 }), 0, -0.1, 0);
  ring.rotation.x = Math.PI / 2;
  sockBody.add(ring);
  sockBody.position.y = 3.9;
  sockBody.rotation.z = -0.32; // 袋下垂
  sock.add(sockBody);
  // 挂点转轴
  const pivot = mesh(sph(0.06, 10), metal({ color: 0x55575c }), 0, 3.95, 0);
  sock.add(pivot);
  // 风速风向标（顶部）
  const vane = new THREE.Group();
  const vshaft = mesh(cyl(0.015, 0.015, 0.5, 6), metal({ color: 0x666a70 }), 0, 0.28, 0);
  vane.add(vshaft);
  const vtail = mesh(box(0.32, 0.05, 0.05), metal({ color: 0x9aa0a8 }), -0.16, 0.3, 0);
  vane.add(vtail);
  const varrow = mesh(box(0.05, 0.05, 0.3), metal({ color: 0x9aa0a8 }), 0.16, 0.3, 0);
  vane.add(varrow);
  vane.position.y = 4.5;
  sock.add(vane);
  sock.position.set(wx, 0, wz);
  group.add(sock);
  updaters.push((t) => {
    sockBody.rotation.x = -0.32 + Math.sin(t * 0.5) * 0.18;   // 袋体随风摆动
    vane.rotation.y = t * 0.2;                                // 风向标缓转
  });

  // ---------------- 跑道进近灯（东端外侧，绿色/白色） ----------------
  const approach = new THREE.Group();
  CFG.approachLightsX.forEach((x, i) => {
    const post = mesh(cyl(0.02, 0.03, 0.55, 8), metal({ color: 0x4d5055 }), x, 0.275, 0);
    approach.add(post);
    const col = i % 3 === 2 ? 0xf5f0dd : 0x9fd8a0;
    const lamp = mesh(sph(0.045, 10), glow({ color: col, intensity: 1.2 }), x, 0.56, 0);
    lamp.userData.flash = { phase: i * 0.6, speed: 1.2, min: 0.5, max: 1.0 };
    approach.add(lamp);
    updaters.push((t) => {
      const f = lamp.userData.flash;
      const v = 0.5 + 0.5 * Math.sin(t * f.speed * Math.PI * 2 + f.phase);
      lamp.scale.setScalar(0.75 + v * 0.5);
    });
  });
  group.add(approach);

  // 主跑道西端进近灯横排（6 盏）
  for (let i = 0; i < 6; i++) {
    const z = -2.4 + i * 0.96;
    const post = mesh(cyl(0.02, 0.03, 0.5, 8), metal({ color: 0x4d5055 }), -33.6, 0.25, z);
    group.add(post);
    const lamp = mesh(sph(0.04, 8), glow({ color: 0xf5f0dd, intensity: 1.0 }), -33.6, 0.52, z);
    lamp.userData.flash = { phase: i * 0.4, speed: 1.1, min: 0.55, max: 1.0 };
    group.add(lamp);
    updaters.push((t) => {
      const f = lamp.userData.flash;
      const v = 0.5 + 0.5 * Math.sin(t * f.speed * Math.PI * 2 + f.phase);
      lamp.scale.setScalar(0.75 + v * 0.5);
    });
  }

  // ---------------- 地面嵌入式航灯（跑道两侧，频闪） ----------------
  const edgeMat = glow({ color: 0xf0a44a, intensity: 1.0 });
  const edges = [];
  for (let m = 0; m <= CFG.runway.len; m += 5.5) {
    for (const s of [-1, 1]) {
      edges.push({
        x: CFG.runway.x0 + m,
        z: s * (CFG.runway.wid / 2 + 0.45),
        phase: (m / 5.5 + s) * 0.7,
      });
    }
  }
  const edgeGeo = sph(0.03, 8);
  const edgeInst = new THREE.InstancedMesh(edgeGeo, edgeMat, edges.length);
  const m4 = new THREE.Matrix4(), p = new THREE.Vector3();
  edges.forEach((e, i) => {
    m4.compose(p.set(e.x, 0.03, e.z), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1));
    edgeInst.setMatrixAt(i, m4);
  });
  edgeInst.instanceMatrix.needsUpdate = true;
  group.add(edgeInst);
  updaters.push((t) => {
    // 嵌入式灯整体缓慢明暗呼吸
    const v = 0.6 + 0.4 * Math.sin(t * 1.3);
    edgeMat.color.setRGB(1, 0.68, 0.3);
    edgeInst.scale.setScalar(0.8 + v * 0.35);
  });

  scene.add(group);
  return {
    group,
    update(t) { for (const u of updaters) u(t); },
  };
}
