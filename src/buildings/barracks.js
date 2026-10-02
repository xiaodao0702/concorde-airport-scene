// ============================================================
// 冷战机场营房 ×2：方正平顶砖混建筑、水泥外墙、狭长通风窗、
// 外置管线、屋顶通风器；室内家具透过窗缝可见
// ============================================================
import * as THREE from '../../js/three.module.js';
import { CFG, C } from '../config.js';
import { brickTex, paintWearTex } from '../utils/textures.js';
import { toonMap, glass, toon, glow } from '../utils/materials.js';
import { box, cyl, mesh } from '../utils/helpers.js';

export function buildBarracks(scene) {
  const group = new THREE.Group();
  group.name = 'barracks';

  const wallMat = toonMap({ map: brickTex({ tile: 3 }), color: 0xf0e8dd, roughness: 1, envMapIntensity: 0.15 });
  const roofMat = toonMap({ map: paintWearTex({ tile: 2, base: '#7d7d75' }), color: 0xd4d2c8, roughness: 0.9, envMapIntensity: 0.25 });
  const glassMat = glass({ color: 0x3f5064, opacity: 0.6, envMapIntensity: 1.1, emissive: 0x0a141e, emissiveIntensity: 0.3 });
  const trimMat = toon({ color: 0x4a4d52, roughness: 0.7, envMapIntensity: 0.4 });
  const pipeMat = toonMap({ map: paintWearTex({ tile: 1, base: '#6b7068' }), color: 0xc8c6bc, roughness: 0.8, envMapIntensity: 0.4 });

  for (const b of CFG.barracks) {
    const [bx, bz] = b.pos;
    const [bw, bd] = b.size;
    const bh = 3.1;
    const bldg = new THREE.Group();

    // 墙体
    const wall = mesh(box(bw, bh, bd), wallMat, 0, bh / 2, 0);
    wall.castShadow = wall.receiveShadow = true;
    bldg.add(wall);
    // 屋顶
    const roof = mesh(box(bw + 0.5, 0.22, bd + 0.5), roofMat, 0, bh + 0.11, 0);
    roof.castShadow = true;
    bldg.add(roof);
    // 檐口压顶
    const cope = mesh(box(bw + 0.62, 0.16, bd + 0.62), trimMat, 0, bh + 0.22, 0);
    bldg.add(cope);

    // 狭长通风窗（正立面 4 扇 + 背立面 4 扇 + 侧墙 2 扇）
    const winN = 4;
    const addWin = (wx, wz, ww, wh) => {
      const w = mesh(box(ww, wh, 0.05), glassMat, wx, bh * 0.52, wz);
      bldg.add(w);
      const f = mesh(box(ww + 0.08, 0.06, 0.08), trimMat, wx, bh * 0.52 + wh / 2 + 0.02, wz);
      bldg.add(f);
      const sill = mesh(box(ww + 0.1, 0.08, 0.1), trimMat, wx, bh * 0.52 - wh / 2 - 0.04, wz);
      bldg.add(sill);
    };
    const wSpan = bw / (winN + 1);
    for (let i = 0; i < winN; i++) {
      const wx = -bw / 2 + wSpan * (i + 1);
      addWin(wx, bd / 2 + 0.03, 0.7, 0.34);
      addWin(wx, -bd / 2 - 0.03, 0.7, 0.34);
    }
    addWin(bw / 2 + 0.03, 0.8, 0.36, 0.5);
    addWin(bw / 2 + 0.03, -0.8, 0.36, 0.5);

    // 入口门
    const door = mesh(box(0.8, 1.8, 0.06), toonMap({ map: paintWearTex({ tile: 1, base: '#5f635c' }), color: 0xcfcdc2, roughness: 0.8, envMapIntensity: 0.3 }), -0.9, 0.9, bd / 2 + 0.03);
    bldg.add(door);
    // 门台阶
    const step = mesh(box(1.1, 0.14, 0.45), trimMat, -0.9, 0.07, bd / 2 + 0.26);
    bldg.add(step);

    // 外置管线（纵向 + 横向）
    const pipe1 = mesh(cyl(0.06, 0.06, bh - 0.4, 10), pipeMat, bw / 2 - 0.35, bh / 2, -bd / 2 + 0.4);
    bldg.add(pipe1);
    const pipe2 = mesh(cyl(0.04, 0.04, bd * 0.6, 8), pipeMat, bw / 2 - 0.35, 0.55, 0);
    pipe2.rotation.z = Math.PI / 2;
    bldg.add(pipe2);

    // 屋顶通风器
    for (const [vx, vz] of [[-1.6, 0], [1.6, 0]]) {
      const v = mesh(box(0.5, 0.3, 0.5), trimMat, vx, bh + 0.42, vz);
      bldg.add(v);
      const vh = mesh(box(0.3, 0.14, 0.3), trimMat, vx, bh + 0.6, vz);
      bldg.add(vh);
    }

    // 室内（窗缝可见：桌、床、日光灯）
    const interior = new THREE.Group();
    interior.position.y = 0.6;
    const floor = mesh(box(bw - 0.4, 0.05, bd - 0.4), toon({ color: 0x55544c }), 0, -0.55, 0);
    interior.add(floor);
    for (const wx of [-2, 0, 2]) {
      const desk = mesh(box(0.5, 0.14, 0.9), toon({ color: 0x5a574b }), wx, -0.42, 0.4);
      interior.add(desk);
      const bunk = mesh(box(0.85, 0.18, 1.9), toon({ color: 0x4c5048 }), wx, -0.38, -1.4);
      interior.add(bunk);
    }
    const lamp = mesh(box(bw - 1, 0.05, 0.14), glow({ color: 0xf2ecd2, intensity: 0.3 }), 0, 1.4, 0);
    interior.add(lamp);
    bldg.add(interior);

    bldg.position.set(bx, 0, bz);
    group.add(bldg);
  }

  scene.add(group);
  return group;
}
