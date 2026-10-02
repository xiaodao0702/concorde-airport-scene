// ============================================================
// revolveAroundX：绕 X 轴回转体（机身等），可控 UV（u 环绕 / v 轴向）
// 生成带法线的非索引 BufferGeometry
// ============================================================
import * as THREE from '../../js/three.module.js';

/**
 * @param {number[]} xs      轴向采样点（x 坐标，升序）
 * @param {number[]} rs      对应半径
 * @param {number} nSeg      轴向分段
 * @param {number} nAround   环绕分段
 * @param {{elliptical?: [number,number], cap?: boolean}} opts
 * @returns {THREE.BufferGeometry}
 */
export function revolveAroundX(xs, rs, nSeg = 96, nAround = 48, opts = {}) {
  const [ey, ez] = opts.elliptical ?? [1, 1];
  const positions = [], normals = [], uvs = [], idx = [];

  // 半径导数（中心差分）用于法线
  const dr = (i) => {
    const i0 = Math.max(0, i - 1), i1 = Math.min(xs.length - 1, i + 1);
    if (i1 === i0) return 0;
    return (rs[i1] - rs[i0]) / (xs[i1] - xs[i0]);
  };

  const nX = nSeg + 1;
  const nA = nAround + 1; // 末段重复顶点以闭合 u

  for (let i = 0; i < nX; i++) {
    const x = xs[i], r = rs[i];
    const dx = dr(i);
    for (let j = 0; j < nA; j++) {
      const th = (j / nAround) * Math.PI * 2;
      const ct = Math.cos(th), st = Math.sin(th);
      const y = r * ct * ey, z = r * st * ez;
      positions.push(x, y, z);
      // 法线：曲面法向 = (法向X, ct*ey, st*ez) 归一化
      const nxp = dx, nyp = ct * ey, nzp = st * ez;
      const len = Math.hypot(nxp, nyp, nzp) || 1;
      normals.push(nxp / len, nyp / len, nzp / len);
      uvs.push(j / nAround, i / nSeg);
    }
  }

  for (let i = 0; i < nSeg; i++) {
    for (let j = 0; j < nAround; j++) {
      const a = i * nA + j, b = (i + 1) * nA + j;
      const c = b + 1, d = a + 1;
      idx.push(a, b, d, b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(idx);
  geo.computeBoundingSphere();
  return geo;
}

// 按点位数组平滑插值出等距采样（Catmull-Rom）
export function sampleProfile(points, n, yCompress = 1) {
  // points: [x, r][]
  const raw = points.map(([x, r]) => new THREE.Vector3(x, r, 0));
  const curve = new THREE.CatmullRomCurve3(raw, false, 'catmullrom', 0.5);
  const out = curve.getPoints(n + 1);
  const xs = [], rs = [];
  for (const v of out) { xs.push(v.x); rs.push(v.y * yCompress); }
  return { xs, rs };
}
