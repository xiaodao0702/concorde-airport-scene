// ============================================================
// 全局大气：旷野细沙尘土缓慢飘动粒子、工业尘埃悬浮、
// 高空风场微流动 —— 帧级动画
// ============================================================
import * as THREE from '../../js/three.module.js';
import { CFG, C } from '../config.js';
import { mulberry32 } from '../utils/noise.js';

function dustPointTexture() {
  const c = document.createElement('canvas');
  c.width = 32; c.height = 32;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(16, 16, 1, 16, 16, 16);
  grad.addColorStop(0, 'rgba(220,210,190,0.85)');
  grad.addColorStop(0.5, 'rgba(205,195,170,0.35)');
  grad.addColorStop(1, 'rgba(200,190,165,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(c);
}

export function buildAtmosphere(scene) {
  const group = new THREE.Group();
  group.name = 'atmosphere';
  const tex = dustPointTexture();

  // ---- 旷野细沙（低空飘动） ----
  const N = 700;
  const rng = mulberry32(321);
  const pos = new Float32Array(N * 3);
  const spd = new Float32Array(N);
  const amp = new Float32Array(N);
  const ph = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (rng() * 2 - 1) * 46;
    pos[i * 3 + 1] = rng() * 3.2;
    pos[i * 3 + 2] = (rng() * 2 - 1) * 46;
    spd[i] = 0.3 + rng() * 0.8;
    amp[i] = 0.2 + rng() * 0.8;
    ph[i] = rng() * 10;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({
    map: tex, size: 0.14, transparent: true, opacity: 0.34,
    depthWrite: false, color: 0xd8d0ba, sizeAttenuation: true,
  }));
  group.add(pts);

  // ---- 工业尘埃（机场区低空悬浮，偏灰） ----
  const M = 260;
  const pos2 = new Float32Array(M * 3);
  for (let i = 0; i < M; i++) {
    pos2[i * 3] = CFG.fence.x0 + rng() * (CFG.fence.x1 - CFG.fence.x0);
    pos2[i * 3 + 1] = rng() * 5.5;
    pos2[i * 3 + 2] = CFG.fence.z0 + rng() * (CFG.fence.z1 - CFG.fence.z0);
  }
  const geo2 = new THREE.BufferGeometry();
  geo2.setAttribute('position', new THREE.BufferAttribute(pos2, 3));
  const pts2 = new THREE.Points(geo2, new THREE.PointsMaterial({
    map: tex, size: 0.1, transparent: true, opacity: 0.22,
    depthWrite: false, color: 0xb8b2a2, sizeAttenuation: true,
  }));
  group.add(pts2);

  scene.add(group);
  return {
    group,
    update(t, dt) {
      // 旷野细沙缓慢顺风飘动（东向 + 纵向漂移），回绕
      const p = geo.attributes.position.array;
      for (let i = 0; i < N; i++) {
        p[i * 3] += dt * spd[i];
        p[i * 3 + 1] += Math.sin(t * 0.9 + ph[i]) * amp[i] * dt * 0.25;
        if (p[i * 3] > 47) p[i * 3] = -47;
      }
      geo.attributes.position.needsUpdate = true;
      // 工业尘埃缓慢上下悬浮
      const q = geo2.attributes.position.array;
      for (let i = 0; i < M; i++) {
        q[i * 3 + 1] += Math.sin(t * 0.5 + i * 0.31) * 0.004;
        if (q[i * 3 + 1] > 6) q[i * 3 + 1] = 0.2;
      }
      geo2.attributes.position.needsUpdate = true;
    },
  };
}
