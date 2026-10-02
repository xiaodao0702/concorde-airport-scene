// ============================================================
// 地形地貌：纯色正方形底座 + 戈壁荒原地表（fbm 起伏 + 顶点色 + 机场区压平）
// ============================================================
import * as THREE from '../../js/three.module.js';
import { CFG, C } from '../config.js';
import { gobiTex } from '../utils/textures.js';
import { fbm } from '../utils/noise.js';
import { toonMap, plain } from '../utils/materials.js';

export function buildTerrain(scene) {
  const group = new THREE.Group();
  group.name = 'terrain';

  // ---- 纯色底座（正方形，四周留边，微缩沙盘感）----
  const baseSize = CFG.base.size, th = CFG.base.thickness;
  const baseGeo = new THREE.BoxGeometry(baseSize, th, baseSize, 1, 1, 1);
  const baseMat = plain({ color: 0x2e3036 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = -th / 2;
  base.receiveShadow = true;
  base.castShadow = false;
  group.add(base);
  // 底座顶面留边环（纯色）
  const ringGeo = new THREE.BoxGeometry(baseSize, 0.05, baseSize);
  const ring = new THREE.Mesh(ringGeo, plain({ color: 0x33353b }));
  ring.position.y = 0.022;
  ring.receiveShadow = true;
  group.add(ring);

  // ---- 戈壁地表 ----
  const tSize = CFG.terrain.size;
  const seg = 220;
  const surfGeo = new THREE.PlaneGeometry(tSize, tSize, seg, seg);
  surfGeo.rotateX(-Math.PI / 2);
  const pos = surfGeo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const half = tSize / 2;

  // 机场压平区（含过渡带）
  const flatX0 = CFG.fence.x0 - 7, flatX1 = CFG.fence.x1 + 7;
  const flatZ0 = CFG.fence.z0 - 7, flatZ1 = CFG.fence.z1 + 7;
  const smooth01 = (v, a, b) => {
    if (v <= a) return 0;
    if (v >= b) return 1;
    const t = (v - a) / (b - a);
    return t * t * (3 - 2 * t);
  };

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    // 边缘压平（与底座留边平滑相接）
    const edgeA = smooth01(Math.abs(x), half - 5, half - 0.6);
    const edgeZ = smooth01(Math.abs(z), half - 5, half - 0.6);
    const edge = Math.max(edgeA, edgeZ);
    // 机场区压平
    const inX = smooth01(x, flatX0, flatX0 + 8) * smooth01(flatX1 - 8, flatX1, x);
    const inZ = smooth01(z, flatZ0, flatZ0 + 8) * smooth01(flatZ1 - 8, flatZ1, z);
    const flat = Math.max(inX * inZ, edge);
    // 高度：fbm 起伏
    const h = (fbm(x * 0.045, z * 0.045, 5, 13) - 0.5) * 1.7 +
              (fbm(x * 0.13, z * 0.13, 3, 5) - 0.5) * 0.55;
    pos.setY(i, 0.03 + h * (1 - flat) * 0.55);

    // 顶点色：戈壁干湿斑块 + 枯草色
    const n1 = fbm(x * 0.05, z * 0.05, 4, 21);
    const n2 = fbm(x * 0.16, z * 0.16, 3, 33);
    let r = 0.545, g = 0.498, b = 0.40;            // #8b7f66
    if (n1 > 0.56) { r = 0.60; g = 0.55; b = 0.435; }       // 干枯亮区
    else if (n1 < 0.42) { r = 0.37; g = 0.34; b = 0.27; }   // 阴影暗区
    const mixT = 0.5 + n2 * 0.5;
    r = r * (0.75 + 0.5 * mixT);
    g = g * (0.75 + 0.5 * mixT);
    b = b * (0.78 + 0.45 * mixT);
    // 机场硬化区微调（稍平整偏灰）
    const flatT = Math.min(flat, 1);
    r = r * (1 - flatT * 0.12) + 0.60 * flatT;
    g = g * (1 - flatT * 0.12) + 0.60 * flatT;
    b = b * (1 - flatT * 0.12) + 0.58 * flatT;
    colors[i * 3] = r; colors[i * 3 + 1] = g; colors[i * 3 + 2] = b;
  }
  surfGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  surfGeo.computeVertexNormals();

  const surface = new THREE.Mesh(surfGeo, toonMap({
    map: gobiTex({ tile: 16 }),
    color: 0xf5f3ea,
    roughness: 1.0,
    envMapIntensity: 0.15,
    side: THREE.DoubleSide,
    vertexColors: true,
  }));
  surface.position.y = 0.01;
  surface.receiveShadow = true;
  surface.castShadow = false;
  group.add(surface);

  scene.add(group);
  return { group, surface };
}
