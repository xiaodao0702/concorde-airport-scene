// ============================================================
// 起飞动态效果：引擎高温炽热气流（焰心 + 热浪扭曲）、机底扬尘、
// 地面热气蒸腾、机翼边缘微流光 —— 全部独立粒子/着色器资产
// ============================================================
import * as THREE from '../../js/three.module.js';
import { CFG, C } from '../config.js';
import { mulberry32 } from '../utils/noise.js';

function heatGlowTexture() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 2, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,246,220,0.95)');
  grad.addColorStop(0.25, 'rgba(255,190,120,0.55)');
  grad.addColorStop(0.6, 'rgba(220,140,80,0.18)');
  grad.addColorStop(1, 'rgba(180,100,60,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function dustTexture() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 2, 32, 32, 30);
  grad.addColorStop(0, 'rgba(196,178,138,0.9)');
  grad.addColorStop(0.5, 'rgba(176,158,120,0.45)');
  grad.addColorStop(1, 'rgba(160,140,100,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

// ---------------- 引擎热浪 + 焰心 ----------------
export function buildEngineHeat(scene, concordeRefs) {
  const group = new THREE.Group();
  group.name = 'heat';
  const glowTex = heatGlowTexture();
  const dustTex = dustTexture();

  const mat = new THREE.MeshBasicMaterial({
    map: glowTex, transparent: true, opacity: 0.8,
    blending: THREE.AdditiveBlending, depthWrite: false,
    toneMapped: false, side: THREE.DoubleSide,
  });
  const plumes = [];

  for (const nz of concordeRefs.nozzles) {
    // 焰心锥（沿 -X 向后喷射）
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.1, 1.6, 14, 1, true), mat.clone());
    cone.rotation.z = Math.PI / 2;            // 尖朝 -X
    cone.position.copy(nz).add(new THREE.Vector3(-0.7, 0, 0));
    cone.scale.set(1, 1, 1);
    group.add(cone);
    plumes.push({
      cone,
      baseOpacity: 0.35 + Math.random() * 0.2,
      flicker: 0.6 + Math.random() * 0.9,
      phase: Math.random() * 10,
      dir: 0.7 + Math.random() * 0.5,
    });
    // 热浪扭曲层（半透白色，顶点噪声摆动）
    const heatMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0.16 },
      },
      vertexShader: `
        uniform float uTime;
        varying float vH;
        void main() {
          vH = position.y;
          vec3 p = position;
          float n = sin(p.x * 6.0 + uTime * 9.0) * 0.16 +
                    sin(p.z * 5.0 + uTime * 7.3) * 0.12;
          p.x += n * (0.4 + p.y * 0.8);
          p.y += sin(p.x * 4.0 + uTime * 6.0) * 0.08;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uOpacity;
        varying float vH;
        void main() {
          float a = uOpacity * smoothstep(0.0, 1.6, vH + 0.8);
          gl_FragColor = vec4(0.95, 0.98, 1.0, a * 0.5);
        }
      `,
    });
    const haze = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.34, 2.4, 12, 1, true), heatMat);
    haze.position.copy(nz).add(new THREE.Vector3(-1.3, -0.05, 0));
    haze.rotation.z = Math.PI / 2;
    haze.rotation.y = Math.random() * 3;
    group.add(haze);
    plumes.push({ haze, mat: heatMat, baseOpacity: 0.16, flicker: 1.0, phase: Math.random() * 6, dir: 1 });
  }

  // 机翼边缘微流光（翼尖两道细长光带）
  const streakMat = new THREE.MeshBasicMaterial({
    map: glowTex, transparent: true, opacity: 0.25,
    blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
  });
  for (const wt of concordeRefs.wingtips) {
    const streak = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 1.4), streakMat.clone());
    streak.position.copy(wt).add(new THREE.Vector3(0.4, 0.05, 0));
    streak.rotation.y = Math.PI / 2;
    streak.rotation.z = -0.5;
    group.add(streak);
    plumes.push({ cone: streak, baseOpacity: 0.2, flicker: 2.2, phase: Math.random() * 8, dir: 1 });
  }

  scene.add(group);
  return {
    group,
    update(t) {
      for (const p of plumes) {
        if (p.mat) { p.mat.uniforms.uTime.value = t; p.mat.uniforms.uOpacity.value = p.baseOpacity * (0.7 + 0.3 * Math.sin(t * p.flicker + p.phase)); continue; }
        const v = 0.75 + 0.25 * Math.sin(t * p.flicker * 2 + p.phase);
        p.cone.material.opacity = p.baseOpacity * v;
        const s = 1 + 0.06 * Math.sin(t * p.flicker + p.phase);
        p.cone.scale.set(s, s * (1 + 0.12 * v), s);
      }
    },
  };
}

// ---------------- 机底扬尘（粒子） ----------------
export function buildWheelDust(scene, concordeRefs) {
  const sources = [...concordeRefs.mainGear, concordeRefs.noseGear];
  const N = 160;
  const pos = new Float32Array(N * 3);
  const vel = new Float32Array(N * 3);
  const life = new Float32Array(N);
  const seed = mulberry32(99);
  for (let i = 0; i < N; i++) {
    const src = sources[i % sources.length];
    pos[i * 3] = src.x + (seed() - 0.5) * 0.4;
    pos[i * 3 + 1] = 0.02 + seed() * 0.1;
    pos[i * 3 + 2] = src.z + (seed() - 0.5) * 0.4;
    vel[i * 3] = -0.6 - seed() * 1.2;
    vel[i * 3 + 1] = 0.2 + seed() * 0.9;
    vel[i * 3 + 2] = (seed() - 0.5) * 1.2;
    life[i] = seed() * 2.2;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(geo, new THREE.PointsMaterial({
    map: dustTexture(), size: 0.16, transparent: true, opacity: 0.5,
    depthWrite: false, color: 0xcbb892,
  }));
  scene.add(dust);

  return {
    dust,
    update(t, dt) {
      const p = geo.attributes.position.array;
      for (let i = 0; i < N; i++) {
        life[i] -= dt;
        if (life[i] <= 0) {
          const src = sources[i % sources.length];
          p[i * 3] = src.x + (Math.random() - 0.5) * 0.5;
          p[i * 3 + 1] = 0.02;
          p[i * 3 + 2] = src.z + (Math.random() - 0.5) * 0.5;
          vel[i * 3] = -0.6 - Math.random() * 1.2;
          vel[i * 3 + 1] = 0.2 + Math.random() * 0.8;
          vel[i * 3 + 2] = (Math.random() - 0.5) * 1.2;
          life[i] = 1.4 + Math.random() * 2.2;
        }
        p[i * 3] += vel[i * 3] * dt;
        p[i * 3 + 1] += vel[i * 3 + 1] * dt;
        p[i * 3 + 2] += vel[i * 3 + 2] * dt;
        if (p[i * 3 + 1] > 1.6) { vel[i * 3 + 1] = -0.4; }
      }
      geo.attributes.position.needsUpdate = true;
    },
  };
}

// ---------------- 地面热气蒸腾（跑道起飞区上空，透明波纹带） ----------------
export function buildGroundHeat(scene) {
  const group = new THREE.Group();
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uOpacity: { value: 0.12 } },
    vertexShader: `
      uniform float uTime;
      varying float vY;
      void main() {
        vY = position.y;
        vec3 p = position;
        p.x += sin(p.z * 3.0 + uTime * 2.6) * 0.3;
        p.z += cos(p.x * 2.4 + uTime * 2.2) * 0.3;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uOpacity;
      varying float vY;
      void main() {
        gl_FragColor = vec4(0.88, 0.92, 0.96, uOpacity * 0.4);
      }
    `,
  });
  const band = new THREE.Mesh(new THREE.PlaneGeometry(10, 2.6), mat);
  band.rotation.x = -Math.PI / 2;
  band.position.set(3, 0.16, 0);   // 协和号起飞区
  group.add(band);
  scene.add(group);
  return {
    group,
    update(t) {
      mat.uniforms.uTime.value = t;
      mat.uniforms.uOpacity.value = 0.10 + 0.05 * Math.sin(t * 1.4);
    },
  };
}
