// ============================================================
// 几何工厂：共享基础几何 + 实例化散射助手（保持逐物件独立建模）
// ============================================================
import * as THREE from '../../js/three.module.js';
import { mulberry32 } from './noise.js';

const _geo = new Map();
function g(key, make) {
  if (_geo.has(key)) return _geo.get(key);
  const geom = make();
  _geo.set(key, geom);
  return geom;
}

export function box(w, h, d, seg = 1) {
  return g(`box|${w}|${h}|${d}|${seg}`, () => new THREE.BoxGeometry(w, h, d, seg, seg, seg));
}
export function cyl(rt, rb, h, seg = 18, open = false) {
  return g(`cyl|${rt}|${rb}|${h}|${seg}|${open}`, () => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open));
}
export function sph(r, seg = 14) {
  return g(`sph|${r}|${seg}`, () => new THREE.SphereGeometry(r, seg, seg));
}
export function cone(r, h, seg = 16) {
  return g(`cone|${r}|${h}|${seg}`, () => new THREE.ConeGeometry(r, h, seg));
}
export function plane(w, h, seg = 1) {
  return g(`plane|${w}|${h}|${seg}`, () => new THREE.PlaneGeometry(w, h, seg, seg));
}

export function mesh(geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  return m;
}

// 实例化散射：builder(count, rng) 返回 { pos, rot, scale, offsetY }
export function scatterInstanced(geometry, material, count, builder, seed = 1, castShadow = true, receiveShadow = true) {
  const rng = mulberry32(seed);
  const inst = new THREE.InstancedMesh(geometry, material, count);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    const d = builder(i, rng);
    p.set(d.x, d.y ?? 0, d.z);
    e.set(d.rx ?? 0, d.ry ?? 0, d.rz ?? 0);
    q.setFromEuler(e);
    const sc = d.s ?? 1;
    s.set(sc, sc, sc);
    m4.compose(p, q, s);
    inst.setMatrixAt(i, m4);
  }
  inst.instanceMatrix.needsUpdate = true;
  inst.castShadow = castShadow;
  inst.receiveShadow = receiveShadow;
  return inst;
}
