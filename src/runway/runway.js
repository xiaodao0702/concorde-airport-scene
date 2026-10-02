// ============================================================
// 跑道基建：超长加厚军用混凝土主跑道（标线/接缝/磨损/烧痕/褪色）、
// 路肩、排水沟、嵌边石条、道边积灰碎石 —— 全部独立物件
// ============================================================
import * as THREE from '../../js/three.module.js';
import { CFG, C } from '../config.js';
import { concreteTex, runwaySurfaceTex } from '../utils/textures.js';
import { toonMap, toon } from '../utils/materials.js';
import { box, mesh } from '../utils/helpers.js';

export function buildRunway(scene) {
  const group = new THREE.Group();
  group.name = 'runway';
  const { len, wid, y, x0 } = CFG.runway;

  const concMat = toonMap({ map: concreteTex({ tile: 4 }), color: 0xe8e6dc, roughness: 0.98, envMapIntensity: 0.18 });
  const topMat = toonMap({ map: runwaySurfaceTex({ len, wid }), color: 0xf2f0e6, roughness: 1, envMapIntensity: 0.12 });

  // ---- 道面体积 ----
  const slab = mesh(box(len, y, wid), concMat, 0, y / 2, 0);
  slab.receiveShadow = true;
  slab.castShadow = false;
  group.add(slab);
  // 道面顶（整幅贴图：标线/磨损/烧痕/褪色/接缝）
  const top = new THREE.Mesh(new THREE.PlaneGeometry(len, wid), topMat);
  top.rotation.x = -Math.PI / 2;
  top.position.y = y + 0.004;
  top.receiveShadow = true;
  group.add(top);

  // ---- 横向伸缩缝（实体细槽，捕光）----
  const jointMat = toon({ color: 0x4a4a46, roughness: 1, envMapIntensity: 0.1 });
  for (let m = 0; m <= len; m += 5) {
    const j = mesh(box(0.03, y + 0.02, wid), jointMat, x0 + m, y + 0.008, 0);
    group.add(j);
  }

  // ---- 路肩（两侧）----
  const shW = (CFG.shoulder.wid - wid) / 2;
  for (const s of [-1, 1]) {
    const sh = mesh(box(len, CFG.shoulder.y, shW), concMat, 0, CFG.shoulder.y / 2, s * (wid / 2 + shW / 2));
    sh.receiveShadow = true;
    group.add(sh);
  }

  // ---- 排水沟（路肩外侧暗渠 + 盖板）----
  const gutterMat = toonMap({ map: concreteTex({ tile: 2, base: '#7d7d75', dark: '#6b6b64' }), color: 0xd0cec4, roughness: 1, envMapIntensity: 0.1 });
  for (const s of [-1, 1]) {
    const gz = s * (wid / 2 + shW + 0.45);
    const gut = mesh(box(len, 0.05, 0.7), gutterMat, 0, 0.028, gz);
    gut.receiveShadow = true;
    group.add(gut);
    // 盖板（间隔）
    for (let m = 0; m <= len; m += 2) {
      const cover = mesh(box(0.55, 0.03, 0.62), gutterMat, x0 + m, 0.055, gz);
      group.add(cover);
    }
  }

  // ---- 嵌边石条（跑道两缘，逐块）----
  const curbMat = toon({ color: 0x8a8a82, roughness: 0.95, envMapIntensity: 0.2 });
  for (const s of [-1, 1]) {
    for (let m = 0; m < len; m += 0.66) {
      const curb = mesh(box(0.66, 0.09, 0.12), curbMat, x0 + m + 0.33, y + 0.02, s * (wid / 2 + 0.06));
      curb.castShadow = true;
      curb.receiveShadow = true;
      group.add(curb);
    }
  }

  scene.add(group);
  return group;
}
