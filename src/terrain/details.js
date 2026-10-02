// ============================================================
// 地表细节：荒草（风动 Shader 实例）、碎石、砾石、干裂地皮贴片、
// 机场边界荒草隔离带 —— 全部独立建模 + 实例化
// ============================================================
import * as THREE from '../../js/three.module.js';
import { CFG, C } from '../config.js';
import { mulberry32, fbm } from '../utils/noise.js';
import { crackedPatchTex } from '../utils/textures.js';
import { toon, toonMap } from '../utils/materials.js';
import { getGradientMap } from '../utils/materials.js';

// ---------------- 荒草叶片几何（细长锥形） ----------------
function makeBladeGeo(h) {
  const w = 0.05 * (h / 0.7);
  const geo = new THREE.BufferGeometry();
  const p = [
    -w / 2, 0, 0,  0, 0, 1,
     w / 2, 0, 0,  0, 0, 1,
    -w / 3, h * 0.62, 0,  0, 0.62, 1,
     w / 3, h * 0.62, 0,  0, 0.62, 1,
     0, h, 0,  0, 1, 0,
  ];
  const pos = [], nor = [], uv = [];
  for (let i = 0; i < 5; i++) {
    pos.push(p[i * 6], p[i * 6 + 1], p[i * 6 + 2]);
    nor.push(p[i * 6 + 3], p[i * 6 + 4], p[i * 6 + 5]);
    uv.push(p[i * 6 + 1] / h, 0);
  }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex([0, 1, 2, 1, 3, 2, 2, 3, 4]);
  geo.computeBoundingSphere();
  return geo;
}

function makeGrassMaterial(color) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uColorB: { value: new THREE.Color(0x8b7a45) },
      uSunDir: { value: new THREE.Vector3(0.45, 0.85, -0.30).normalize() },
      uSunColor: { value: new THREE.Color(0xfff2dd) },
      uFillDir: { value: new THREE.Vector3(-0.3, 0.7, 0.4).normalize() },
      uFillColor: { value: new THREE.Color(0xcfe0ec) },
      uFogColor: { value: new THREE.Color(0xcbd9e4) },
      uFogNear: { value: 70 }, uFogFar: { value: 260 },
      uGradient: { value: getGradientMap() },
      uAmp: { value: 0.14 },
      uWind: { value: new THREE.Vector2(1, 0.6) },
    },
    vertexShader: `
      uniform float uTime;
      uniform float uAmp;
      uniform vec2 uWind;
      varying vec3 vCol;
      varying float vFog;
      void main() {
        vec4 ip = instanceMatrix * vec4(position, 1.0);
        float h01 = uv.x;
        float ph = ip.x * 1.9 + ip.z * 2.3 + uTime * 1.1;
        float phase = fract(sin(dot(ip.xyz, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
        float bend = sin(ph + phase * 6.283) * uAmp * h01 * h01;
        vec3 p = ip.xyz;
        p.x += bend * uWind.x;
        p.z += cos(ph * 1.31 + phase) * uAmp * 0.7 * uWind.y * h01 * h01;
        vec4 mv = viewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        vCol = vec3(1.0);
        vFog = smoothstep(70.0, 260.0, -mv.z);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor, uColorB, uSunDir, uSunColor, uFillDir, uFillColor, uFogColor;
      uniform sampler2D uGradient;
      varying vec3 vCol;
      varying float vFog;
      void main() {
        vec3 n = normalize(vec3(0.2, 1.0, 0.1));
        float d1 = clamp(dot(n, uSunDir), 0.0, 1.0);
        float d2 = clamp(dot(n, uFillDir), 0.0, 0.7);
        float ramp = clamp(d1 * 0.82 + d2 * 0.18, 0.0, 1.0);
        vec3 col = texture2D(uGradient, vec2(ramp, 0.5)).rgb;
        float mixB = clamp(0.3 + vCol.x * 0.4, 0.0, 1.0);
        col *= mix(uColor, uColorB, mixB * 0.5);
        col *= uSunColor;
        col = mix(col, uFogColor, vFog);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
    side: THREE.DoubleSide,
  });
}

// ---------------- 荒草实例化（含风动更新） ----------------
export function buildGrass(scene) {
  const group = new THREE.Group();
  group.name = 'grass';

  const bladeGeos = [
    makeBladeGeo(0.62),
    makeBladeGeo(0.85),
  ];
  const mats = [
    makeGrassMaterial(0xa4945c),
    makeGrassMaterial(0x8b7a45),
    makeGrassMaterial(0xb2a264),
  ];

  // 旷野随机荒草
  const rng = mulberry32(2024);
  const instances = [];
  let guard = 0;
  while (instances.length < 2600 && guard < 20000) {
    guard++;
    const x = (rng() * 2 - 1) * 44;
    const z = (rng() * 2 - 1) * 44;
    // 机场硬化区外
    const inFence = x > CFG.fence.x0 && x < CFG.fence.x1 && z > CFG.fence.z0 && z < CFG.fence.z1;
    if (inFence) continue;
    // 疏密控制：越远越密，近处稀疏
    const dist = Math.hypot(x, z);
    const dens = dist > 34 ? 1.0 : dist > 22 ? 0.5 : 0.18;
    if (rng() > dens) continue;
    instances.push({ x, z, s: 0.55 + rng() * 1.1, r: rng() * Math.PI * 2 });
  }
  // 机场边界荒草隔离带（铁丝网外一圈更密）
  const beltInst = [];
  guard = 0;
  while (beltInst.length < 1400 && guard < 9000) {
    guard++;
    const side = (rng() * 4) | 0;
    let x, z;
    if (side === 0) { x = CFG.fence.x0 - 2 - rng() * 4; z = CFG.fence.z0 - 2 + rng() * (CFG.fence.z1 - CFG.fence.z0 + 4); }
    else if (side === 1) { x = CFG.fence.x1 + 2 + rng() * 4; z = CFG.fence.z0 - 2 + rng() * (CFG.fence.z1 - CFG.fence.z0 + 4); }
    else if (side === 2) { z = CFG.fence.z0 - 2 - rng() * 4; x = CFG.fence.x0 - 2 + rng() * (CFG.fence.x1 - CFG.fence.x0 + 4); }
    else { z = CFG.fence.z1 + 2 + rng() * 4; x = CFG.fence.x0 - 2 + rng() * (CFG.fence.x1 - CFG.fence.x0 + 4); }
    if (Math.abs(x) > 45 || Math.abs(z) > 45) continue;
    beltInst.push({ x, z, s: 0.6 + rng() * 1.0, r: rng() * Math.PI * 2 });
  }

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  const p = new THREE.Vector3();

  // 旷野：按材质分成 3 组
  const per = Math.ceil(instances.length / 3);
  for (let mi = 0; mi < 3; mi++) {
    const slice = instances.slice(mi * per, mi * per + per);
    const im = new THREE.InstancedMesh(bladeGeos[mi % 2], mats[mi], slice.length);
    for (let i = 0; i < slice.length; i++) {
      const d = slice[i];
      e.set(0, d.r, 0);
      q.setFromEuler(e);
      p.set(d.x, 0, d.z);
      m4.compose(p, q, new THREE.Vector3(d.s, d.s, d.s));
      im.setMatrixAt(i, m4);
    }
    im.instanceMatrix.needsUpdate = true;
    im.castShadow = false;
    im.receiveShadow = false;
    group.add(im);
  }

  // 隔离带（两套材质，更高更密）
  const half = Math.ceil(beltInst.length / 2);
  for (let mi = 0; mi < 2; mi++) {
    const slice = beltInst.slice(mi * half, mi * half + half);
    const im = new THREE.InstancedMesh(bladeGeos[1], mats[mi * 2], slice.length);
    for (let i = 0; i < slice.length; i++) {
      const d = slice[i];
      e.set(0, d.r, 0);
      q.setFromEuler(e);
      p.set(d.x, 0, d.z);
      m4.compose(p, q, new THREE.Vector3(d.s * 1.05, d.s * 1.2, d.s));
      im.setMatrixAt(i, m4);
    }
    im.instanceMatrix.needsUpdate = true;
    group.add(im);
  }

  scene.add(group);
  return {
    group,
    update(t) {
      for (const m of mats) m.uniforms.uTime.value = t;
    },
  };
}

// ---------------- 碎石 / 砾石 ----------------
export function buildRocks(scene) {
  const group = new THREE.Group();
  group.name = 'rocks';

  const rockGeo = new THREE.IcosahedronGeometry(1, 0);
  const rockMat = toon({ color: 0x6e6453, roughness: 1, envMapIntensity: 0.2, flat: true });
  const rng = mulberry32(77);
  const N = 320;
  const im = new THREE.InstancedMesh(rockGeo, rockMat, N);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  for (let i = 0; i < N; i++) {
    let x = 0, z = 0, guard = 0;
    do {
      x = (rng() * 2 - 1) * 45; z = (rng() * 2 - 1) * 45;
      guard++;
    } while (guard < 50 && (x > CFG.fence.x0 && x < CFG.fence.x1 && z > CFG.fence.z0 && z < CFG.fence.z1));
    const sc = 0.08 + rng() * 0.5;
    const squash = 0.45 + rng() * 0.35;
    e.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI);
    q.setFromEuler(e);
    m4.compose(
      new THREE.Vector3(x, sc * squash * 0.4, z),
      q,
      new THREE.Vector3(sc, sc * squash, sc * (0.7 + rng() * 0.6))
    );
    im.setMatrixAt(i, m4);
  }
  im.instanceMatrix.needsUpdate = true;
  im.castShadow = true;
  im.receiveShadow = true;
  group.add(im);

  // 砾石（跑道道边 + 旷野）
  const pebGeo = new THREE.OctahedronGeometry(1, 0);
  const pebMat = toon({ color: 0x7d7261, roughness: 1, envMapIntensity: 0.15 });
  const PN = 1500;
  const pm = new THREE.InstancedMesh(pebGeo, pebMat, PN);
  for (let i = 0; i < PN; i++) {
    const x = (rng() * 2 - 1) * 45.5;
    const z = (rng() * 2 - 1) * 45.5;
    const inAirport = x > CFG.fence.x0 + 1 && x < CFG.fence.x1 - 1 && z > CFG.fence.z0 + 1 && z < CFG.fence.z1 - 1;
    const runwayBand = Math.abs(z) < 3.3 && x > -33.5 && x < 33.5;
    const ok = inAirport ? runwayBand : true;
    if (!ok) { pm.setMatrixAt(i, new THREE.Matrix4().makeScale(0, 0, 0)); continue; }
    const sc = 0.02 + rng() * 0.06;
    e.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI);
    q.setFromEuler(e);
    m4.compose(new THREE.Vector3(x, sc * 0.5, z), q, new THREE.Vector3(sc, sc * 0.6, sc));
    pm.setMatrixAt(i, m4);
  }
  pm.instanceMatrix.needsUpdate = true;
  pm.castShadow = false; pm.receiveShadow = false;
  group.add(pm);

  scene.add(group);
  return group;
}

// ---------------- 干裂地皮贴片 ----------------
export function buildCrackedPatches(scene) {
  const group = new THREE.Group();
  group.name = 'crackedPatches';
  const mat = toonMap({
    map: crackedPatchTex(),
    color: 0xe8e2d2,
    roughness: 1,
    envMapIntensity: 0.1,
  });
  const rng = mulberry32(31);
  const spots = [
    [8, 4.2], [16, 3.6], [24, 5.0], [-14, 3.9], [-22, 4.6], [10, 7.4],
    [28, 11.2], [-6, 8.6], [20, 15.0], [-18, 12.5], [30, -4.5], [-25, -5.2],
    [0, -8.5], [14, -6.8], [-30, 20.2], [6, 25.0], [-12, 22.4], [24, 22.8],
    [35.4, 5.0], [-35.4, 6.2], [0, 34.6], [-20, 34.8], [20, 34.6], [0, -18.6],
    [33.2, 20.5], [-33.2, 25.6],
  ];
  for (const [x, z] of spots) {
    const r = 0.7 + rng() * 1.5;
    const g = new THREE.CylinderGeometry(r, r * 1.12, 0.045, 22, 1);
    const m = new THREE.Mesh(g, mat);
    m.position.set(x + (rng() - 0.5) * 0.6, 0.025, z + (rng() - 0.5) * 0.6);
    m.rotation.y = rng() * Math.PI;
    m.receiveShadow = true;
    m.castShadow = false;
    group.add(m);
  }
  scene.add(group);
  return group;
}
