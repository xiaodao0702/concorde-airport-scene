// ============================================================
// 苏式高杆探照灯塔 ×4：桁架式钢塔、灯架阵列、多组探照灯、
// 金属锈蚀纹理、拉线缆
// ============================================================
import * as THREE from '../../js/three.module.js';
import { CFG, C } from '../config.js';
import { rustTex } from '../utils/textures.js';
import { toonMap, toon, glow, metal } from '../utils/materials.js';
import { box, cyl, mesh } from '../utils/helpers.js';

export function buildSearchlights(scene) {
  const group = new THREE.Group();
  group.name = 'searchlights';

  const steelMat = toonMap({ map: rustTex({ tile: 1, base: '#5a4c3e' }), color: 0xc8c4b4, roughness: 0.7, envMapIntensity: 0.6 });
  const darkMat = toon({ color: 0x36383d, roughness: 0.6, envMapIntensity: 0.5 });

  function tower(x, z) {
    const t = new THREE.Group();
    const H = 6.2;
    // 四主柱
    for (const [dx, dz] of [[0.55, 0.55], [-0.55, 0.55], [0.55, -0.55], [-0.55, -0.55]]) {
      const leg = mesh(cyl(0.045, 0.07, H, 8), steelMat, dx, H / 2, dz);
      t.add(leg);
    }
    // 横撑（多层）
    for (let i = 0; i < 6; i++) {
      const y = 0.9 + i * 1.0;
      for (const [dx, dz] of [[0.55, 0.55], [-0.55, 0.55], [0.55, -0.55], [-0.55, -0.55]]) {
        const brace = mesh(box(1.06, 0.045, 0.045), steelMat, 0, y, dz);
        brace.position.x = 0;
        t.add(brace);
        const brace2 = mesh(box(0.045, 0.045, 1.06), steelMat, dx, y, 0);
        t.add(brace2);
      }
      // 对角斜撑
      const diag = mesh(box(1.5, 0.035, 0.035), steelMat, 0, y + 0.45, 0.55);
      diag.rotation.y = 0.2;
      t.add(diag);
      const diag2 = mesh(box(1.5, 0.035, 0.035), steelMat, 0, y + 0.45, -0.55);
      diag2.rotation.y = -0.2;
      t.add(diag2);
    }
    // 灯架平台
    const plat = mesh(box(1.7, 0.12, 1.7), darkMat, 0, H + 0.1, 0);
    t.add(plat);
    // 灯架（中心柱 + 环向灯组）
    const mast = mesh(cyl(0.07, 0.09, 0.9, 10), steelMat, 0, H + 0.55, 0);
    t.add(mast);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const arm = mesh(box(0.7, 0.06, 0.12), steelMat, Math.cos(a) * 0.35, H + 0.62, Math.sin(a) * 0.35);
      arm.rotation.y = -a;
      t.add(arm);
      // 探照灯头
      const lamp = new THREE.Group();
      const body = mesh(cyl(0.16, 0.2, 0.34, 16), darkMat, 0, 0, 0);
      lamp.add(body);
      const lens = new THREE.Mesh(new THREE.CircleGeometry(0.15, 18), glow({ color: 0xfff6df, intensity: 1.0 }));
      lens.rotation.y = -Math.PI / 2;
      lens.position.x = -0.18;
      lamp.add(lens);
      const rim = mesh(cyl(0.17, 0.17, 0.06, 18), steelMat, -0.18, 0, 0);
      rim.rotation.y = Math.PI / 2;
      rim.rotation.z = Math.PI / 2;
      lamp.add(rim);
      lamp.position.set(Math.cos(a) * 0.42, H + 0.55, Math.sin(a) * 0.42);
      lamp.rotation.z = -0.35;
      lamp.rotation.y = a + Math.PI;
      t.add(lamp);
    }
    // 基座
    const foot = mesh(box(1.5, 0.5, 1.5), darkMat, 0, 0.25, 0);
    t.add(foot);

    t.position.set(x, 0, z);
    group.add(t);
  }

  for (const [x, z] of CFG.searchlights) tower(x, z);

  scene.add(group);
  return group;
}
