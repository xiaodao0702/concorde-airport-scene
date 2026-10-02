// ============================================================
// 标牌设施：机场公告牌、警示铁板、俄文警示标语（褪色喷漆）、
// 界区标识柱 —— 全部独立物件
// ============================================================
import * as THREE from '../../js/three.module.js';
import { CFG, C } from '../config.js';
import { signTex, rustTex } from '../utils/textures.js';
import { toonMap, toon } from '../utils/materials.js';
import { box, cyl, mesh } from '../utils/helpers.js';

export function buildSignage(scene) {
  const group = new THREE.Group();
  group.name = 'signage';

  const postMat = toonMap({ map: rustTex({ tile: 1, base: '#5a4c3e' }), color: 0xc8c4b4, roughness: 0.8, envMapIntensity: 0.5 });
  const frameMat = toon({ color: 0x4a4d52, roughness: 0.6, envMapIntensity: 0.5 });

  function signboard(x, z, ry, text, sub, w = 1.5, h = 0.8, ph = 1.3) {
    const s = new THREE.Group();
    const p1 = mesh(cyl(0.035, 0.045, ph, 8), postMat, -w / 2 + 0.12, ph / 2, 0);
    const p2 = mesh(cyl(0.035, 0.045, ph, 8), postMat, w / 2 - 0.12, ph / 2, 0);
    s.add(p1, p2);
    const board = mesh(box(w, h, 0.05), toonMap({
      map: signTex(text, sub), color: 0xe0ded4, roughness: 0.9, envMapIntensity: 0.2,
    }), 0, ph, 0);
    s.add(board);
    const frame = mesh(box(w + 0.06, h + 0.06, 0.02), frameMat, 0, ph, 0.035);
    s.add(frame);
    s.position.set(x, 0, z);
    s.rotation.y = ry;
    group.add(s);
  }

  // 大门公告牌（俄文："ВОЕННЫЙ ОБЪЕКТ — 军事禁区"）
  signboard(-8.6, CFG.fence.z0 - 1.6, 0.15, 'ВОЕННЫЙ ОБЪЕКТ', 'СТРОГО ЗАПРЕЩЕНО', 2.2, 0.9, 1.6);
  signboard(8.6, CFG.fence.z0 - 1.6, -0.15, 'ОПАСНАЯ ЗОНА', 'ПРОХОД ЗАКРЫТ', 1.6, 0.8, 1.4);

  // 警戒区铁牌（油罐区 / 库房）
  for (const [x, z, ry] of [[-25.6, 20.6, 0.4], [21.4, 27.4, -0.3]]) {
    signboard(x, z, ry, 'ОГНЕОПАСНО', '', 1.0, 0.55, 1.1);
  }
  // 塔台旁
  signboard(16.6, 24.8, 0.8, 'КПП', 'КОНТРОЛЬ', 0.9, 0.55, 1.2);
  // 滑行道口警示
  signboard(-28.5, 12.6, -0.5, 'ВНИМАНИЕ', 'САМОЛЁТ', 1.2, 0.6, 1.3);
  // 跑道端警示牌
  signboard(31.6, 8.4, -1.1, 'СТОЙ!', '', 0.9, 0.8, 1.4);
  signboard(-31.6, -7.2, 1.1, 'СТОЙ!', '', 0.9, 0.8, 1.4);

  // 界区标识柱（沿铁丝网）
  const pillarMat = toon({ color: 0x9a9a92, roughness: 0.9, envMapIntensity: 0.2 });
  for (let x = CFG.fence.x0 + 8; x < CFG.fence.x1; x += 12) {
    const p = mesh(cyl(0.03, 0.04, 0.8, 8), pillarMat, x, 0.4, CFG.fence.z1 + 0.6);
    group.add(p);
    const cap = mesh(box(0.16, 0.06, 0.16), pillarMat, x, 0.8, CFG.fence.z1 + 0.6);
    group.add(cap);
  }
  for (let z = CFG.fence.z0 + 8; z < CFG.fence.z1; z += 12) {
    const p = mesh(cyl(0.03, 0.04, 0.8, 8), pillarMat, CFG.fence.x1 + 0.6, 0.4, z);
    group.add(p);
    const cap = mesh(box(0.16, 0.06, 0.16), pillarMat, CFG.fence.x1 + 0.6, 0.8, z);
    group.add(cap);
  }

  scene.add(group);
  return group;
}
