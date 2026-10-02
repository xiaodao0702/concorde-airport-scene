// ============================================================
// 材质工厂：三渲二 Toon 材质（3 档渐变 + cel 镜面高光 + 环境渐变）、
// 玻璃、发光、金属（toon 金属）—— 按参数缓存共享
// 说明：r160 MeshToonMaterial 为纯 Lambert，通过 onBeforeCompile
//       注入 cel 高光与环境色，保留阴影/雾/渐变图全部机制
// ============================================================
import * as THREE from '../../js/three.module.js';

let _gradientMap = null;
export function getGradientMap() {
  if (_gradientMap) return _gradientMap;
  const c = document.createElement('canvas');
  c.width = 4; c.height = 1;
  const g = c.getContext('2d');
  const stops = ['#191c21', '#4c515a', '#aeb3ba', '#f4f6f7'];
  stops.forEach((s, i) => {
    g.fillStyle = s;
    g.fillRect(i, 0, 1, 1);
  });
  const t = new THREE.CanvasTexture(c);
  t.minFilter = THREE.NearestFilter;
  t.magFilter = THREE.NearestFilter;
  _gradientMap = t;
  return t;
}

// ---- cel 高光注册表（每帧更新视空间光照方向） ----
const _celRegistry = [];
export function getCelSpecRegistry() { return _celRegistry; }
export function updateCelSpec(camera, sunDirWorld, upWorld) {
  const ci = camera.matrixWorldInverse;
  for (const item of _celRegistry) {
    const u = item.m.userData.celUniforms;
    if (!u) continue;
    u.uSpecLightDir.value.copy(sunDirWorld).transformDirection(ci);
    u.uEnvUp.value.copy(upWorld).transformDirection(ci);
  }
}

function clamp01(v) { return Math.max(0, Math.min(1, v)); }

function attachCelSpec(m, { specStrength = 0, specPow = 60, envStrength = 0, specColor = 0xfff4d8, envTop = 0xbcd4ea, envBot = 0x6b6f78 }) {
  if (specStrength < 0.02 && envStrength < 0.02) return;
  const p = { specStrength, specPow, envStrength, specColor, envTop, envBot };
  m.onBeforeCompile = (shader) => {
    if (m.userData.celUniforms) return;             // 幂等
    const u = {
      uSpecLightDir: { value: new THREE.Vector3(0, 1, 0) },
      uEnvUp: { value: new THREE.Vector3(0, 1, 0) },
      uSpecColor: { value: new THREE.Color(p.specColor) },
      uSpecPow: { value: p.specPow },
      uSpecStrength: { value: p.specStrength },
      uEnvTop: { value: new THREE.Color(p.envTop) },
      uEnvBot: { value: new THREE.Color(p.envBot) },
      uEnvStrength: { value: p.envStrength },
    };
    for (const k in u) shader.uniforms[k] = u[k];
    // 自定义 uniform 需在全局作用域手动声明
    shader.fragmentShader =
      'uniform vec3 uSpecLightDir;\n' +
      'uniform vec3 uEnvUp;\n' +
      'uniform vec3 uSpecColor;\n' +
      'uniform vec3 uEnvTop;\n' +
      'uniform vec3 uEnvBot;\n' +
      'uniform float uSpecPow;\n' +
      'uniform float uSpecStrength;\n' +
      'uniform float uEnvStrength;\n' +
      shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      'vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;',
      `vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
      {
        vec3 cN = normalize( vNormal );
        vec3 cV = normalize( vViewPosition );
        vec3 cL = normalize( uSpecLightDir );
        vec3 cH = normalize( cV + cL );
        float cSpec = pow( max( dot( cN, cH ), 0.0 ), uSpecPow );
        cSpec = smoothstep( 0.80, 0.97, cSpec ) * uSpecStrength;
        float cEnvW = clamp( dot( cN, normalize( uEnvUp ) ) * 0.5 + 0.5, 0.0, 1.0 );
        vec3 cEnv = mix( uEnvBot, uEnvTop, cEnvW ) * uEnvStrength;
        outgoingLight += cSpec * uSpecColor + cEnv * ( 1.0 - cSpec * 0.5 );
      }`
    );
    m.userData.celUniforms = u;
    _celRegistry.push({ m });
  };
}

const _matCache = new Map();
function cache(key, make) {
  if (_matCache.has(key)) return _matCache.get(key);
  const m = make();
  _matCache.set(key, m);
  return m;
}

/**
 * 三渲二 Toon 材质
 * opts: { color, metalness, roughness, envMapIntensity, emissive, emissiveIntensity,
 *         transparent, opacity, side, flat }
 * metalness/roughness/envMapIntensity 用于推导 cel 高光与环境强度
 */
export function toon(opts = {}) {
  const color = opts.color ?? 0x9a9a93;
  const metalness = opts.metalness ?? 0.0;
  const roughness = opts.roughness ?? 0.9;
  const envI = opts.envMapIntensity ?? 0.35;
  const emissive = opts.emissive ?? 0x000000;
  const emissiveI = opts.emissiveIntensity ?? 1.0;
  const transparent = !!opts.transparent;
  const opacity = opts.opacity ?? 1.0;
  const side = opts.side ?? THREE.FrontSide;
  const key = `toon|${color}|${metalness}|${roughness}|${envI}|${emissive}|${emissiveI}|${transparent}|${opacity}|${side}|${opts.flat ? 'f' : 'n'}`;
  return cache(key, () => {
    const m = new THREE.MeshToonMaterial({
      color,
      gradientMap: getGradientMap(),
      emissive,
      emissiveIntensity: emissiveI,
      transparent,
      opacity,
      side,
      flatShading: !!opts.flat,
    });
    m.name = opts.name || 'toon';
    const spec = clamp01((1 - roughness) * 1.15 + metalness * 0.3);
    const pow = 30 + (1 - roughness) * 150 + metalness * 40;
    const envS = clamp01(envI * (0.2 + metalness * 0.4));
    attachCelSpec(m, { specStrength: spec, specPow: pow, envStrength: envS });
    return m;
  });
}

// 带贴图的 toon（混凝土/锈蚀/砖墙/涂装等）
export function toonMap({ map, color = 0xffffff, metalness = 0, roughness = 0.95, envMapIntensity = 0.4, emissive, emissiveIntensity, transparent, opacity, side, repeat, vertexColors }) {
  const e = emissive ?? 0x000000;
  const ei = emissiveIntensity ?? 1;
  const tr = !!transparent, op = opacity ?? 1;
  const key = `toonMap|${map?.uuid}|${color}|${metalness}|${roughness}|${envMapIntensity}|${e}|${ei}|${tr}|${op}|${side ?? 0}|${repeat ?? 0}|${vertexColors ? 'v' : 'n'}`;
  return cache(key, () => {
    const m = new THREE.MeshToonMaterial({
      map, color, gradientMap: getGradientMap(),
      emissive: e, emissiveIntensity: ei,
      transparent: tr, opacity: op,
      side: side ?? THREE.FrontSide,
      vertexColors: !!vertexColors,
    });
    if (repeat) { map.repeat.set(repeat, repeat); }
    const spec = clamp01((1 - roughness) * 1.15 + metalness * 0.3);
    const pow = 30 + (1 - roughness) * 150 + metalness * 40;
    const envS = clamp01(envMapIntensity * (0.2 + metalness * 0.4));
    attachCelSpec(m, { specStrength: spec, specPow: pow, envStrength: envS });
    return m;
  });
}

// 玻璃（高透反射）
export function glass({ color = 0x6d8296, opacity = 0.5, emissive, emissiveIntensity = 1, envMapIntensity = 1.2 } = {}) {
  const key = `glass|${color}|${opacity}|${emissive ?? 0}|${emissiveIntensity}|${envMapIntensity}`;
  return cache(key, () => {
    const m = new THREE.MeshPhysicalMaterial({
      color, transparent: true, opacity,
      metalness: 0.0, roughness: 0.06,
      envMapIntensity,
      emissive: emissive ?? 0x000000,
      emissiveIntensity,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    return m;
  });
}

// 发光灯源材质
export function glow({ color = 0xfff3d6, intensity = 1.4 } = {}) {
  const key = `glow|${color}|${intensity}`;
  return cache(key, () => {
    const m = new THREE.MeshBasicMaterial({
      color, toneMapped: false,
    });
    m.name = 'glow';
    m._glowIntensity = intensity;
    return m;
  });
}

// 金属（toon 金属：cel 高光 + 环境渐变，保证三渲二一致）
export function metal({ color = 0x55575c, roughness = 0.35, envMapIntensity = 1.1, metalness = 0.9 } = {}) {
  return toon({ color, metalness, roughness, envMapIntensity });
}

// 纯色（底座侧壁等）
export function plain({ color = 0x3a3a40, transparent, opacity } = {}) {
  const key = `plain|${color}|${transparent}|${opacity}`;
  return cache(key, () => {
    const m = new THREE.MeshBasicMaterial({
      color, transparent: !!transparent, opacity: opacity ?? 1,
    });
    return m;
  });
}

// ---------------- 环境贴图（玻璃反射用） ----------------
let _envRT = null;
export function setupEnvironment(renderer) {
  if (_envRT) return _envRT;
  const scene = new THREE.Scene();
  const skyGeo = new THREE.SphereGeometry(8, 24, 16);
  const sky = new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.BackSide }));
  const pos = skyGeo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / 8;
    const t = Math.max(0, y) ** 1.2;
    const r = 0.35 + t * 0.55, g = 0.42 + t * 0.5, b = 0.62 + t * 0.3;
    colors[i * 3] = r; colors[i * 3 + 1] = g; colors[i * 3 + 2] = b;
  }
  skyGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  sky.material.vertexColors = true;
  scene.add(sky);
  const sun = new THREE.Mesh(
    new THREE.PlaneGeometry(5, 5),
    new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })
  );
  sun.position.set(30, 30, 0);
  sun.lookAt(0, 0, 0);
  scene.add(sun);
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 16),
    new THREE.MeshBasicMaterial({ color: 0x8a7f6a })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -4;
  scene.add(ground);

  const pmrem = new THREE.PMREMGenerator(renderer);
  _envRT = pmrem.fromScene(scene, 0.04);
  pmrem.dispose();
  return _envRT;
}
