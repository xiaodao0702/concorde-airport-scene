// ============================================================
// 主入口：场景 / 相机 / 光照 / 阴影 / 控制器 / 动画循环
// index.html 仅挂载本模块；全部模型逻辑在 src/ 各模块中
// ============================================================
import * as THREE from '../js/three.module.js';
import { OrbitControls } from '../js/addons/controls/OrbitControls.js';
import { CFG, C } from './config.js';
import { setupEnvironment, updateCelSpec } from './utils/materials.js';
import { buildScene } from './layout.js';
import { setupPost } from './post/outline.js';

// ---------------- 渲染器 ----------------
const container = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.domElement.style.cssText = 'width:100vw;height:100vh;display:block;';
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

// ---------------- 场景 ----------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(CFG.sky.horizon);
scene.fog = new THREE.Fog(CFG.fog.color, CFG.fog.near, CFG.fog.far);

// ---------------- 光照（电影级硬光） ----------------
const sun = new THREE.DirectionalLight(CFG.sun.color, CFG.sun.intensity);
sun.position.set(...CFG.sky.sunPos);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
sun.shadow.camera.left = -70;
sun.shadow.camera.right = 70;
sun.shadow.camera.top = 70;
sun.shadow.camera.bottom = -70;
sun.shadow.camera.near = 10;
sun.shadow.camera.far = 320;
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.02;
scene.add(sun);

const hemi = new THREE.HemisphereLight(CFG.hemi.sky, CFG.hemi.ground, CFG.hemi.intensity);
scene.add(hemi);

const fill = new THREE.DirectionalLight(CFG.fill.color, CFG.fill.intensity);
fill.position.set(...CFG.fill.pos);
scene.add(fill);

const rim = new THREE.DirectionalLight(CFG.rim.color, CFG.rim.intensity);
rim.position.set(...CFG.rim.pos);
scene.add(rim);

// 环境贴图（金属/玻璃高光）
scene.environment = setupEnvironment(renderer).texture;

// ---------------- 相机 ----------------
const camera = new THREE.PerspectiveCamera(
  CFG.camera.fov, window.innerWidth / window.innerHeight,
  CFG.camera.near, CFG.camera.far
);
camera.position.set(...CFG.camera.pos);

// 调试：URL 相机预设（无 UI，仅无头截图验收用；?cam=a~f 或 ?pos=&tgt=&fov=）
const _QP = new URLSearchParams(location.search);
const CAM_PRESETS = {
  a: { pos: CFG.camera.pos, tgt: CFG.camera.target, fov: CFG.camera.fov },
  b: { pos: [14, 2.4, 7.6], tgt: [5, 1.1, 0], fov: 45 },        // 协和号侧前方低角度
  c: { pos: [-24, 1.3, 0], tgt: [16, 1.3, 0], fov: 48 },        // 沿跑道透视
  d: { pos: [2, 46, 0.01], tgt: [2, 0, 0], fov: 42 },           // 俯视
  e: { pos: [-13, 3.6, 19], tgt: [-3, 2.2, 12], fov: 45 },      // 塔台/营房区
  f: { pos: [10.4, 2.1, 2.4], tgt: [7, 0.8, 0], fov: 38 },      // 机头特写
};
const _camName = _QP.get('cam') || 'a';
const _preset = CAM_PRESETS[_camName] || CAM_PRESETS.a;
camera.position.set(..._preset.pos);
camera.fov = _preset.fov;
camera.updateProjectionMatrix();
const _pp = _QP.get('pos'), _tp = _QP.get('tgt'), _fv = _QP.get('fov');
if (_pp) camera.position.set(..._pp.split(',').map(Number));

// ---------------- 控制器（第三人称自由观景：拖拽旋转 + 无极缩放，无任何 UI） ----------------
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(...CFG.camera.target);
if (_tp) controls.target.set(..._tp.split(',').map(Number));
if (_fv) { camera.fov = parseFloat(_fv); camera.updateProjectionMatrix(); }
controls.update();
controls.enableDamping = CFG.controls.damping > 0;
controls.dampingFactor = CFG.controls.damping;
controls.enablePan = CFG.controls.pan;
controls.minDistance = CFG.controls.minDist;
controls.maxDistance = CFG.controls.maxDist;
controls.rotateSpeed = 0.9;
controls.zoomSpeed = 1.1;

// ---------------- 组装场景 ----------------
const { updaters, concorde } = buildScene(scene);

// ---------------- 后期描边 ----------------
const post = setupPost(renderer, scene, camera);

// ---------------- 动画循环 ----------------
const clock = new THREE.Clock();
const sunDirWorld = new THREE.Vector3(...CFG.sky.sunPos).normalize();
const upWorld = new THREE.Vector3(0, 1, 0);
function animate() {
  const t = clock.getElapsedTime();
  const dt = Math.min(clock.getDelta(), 0.05);

  // 更新 cel 高光方向（视空间）
  updateCelSpec(camera, sunDirWorld, upWorld);

  for (const u of updaters) u(t, dt);

  controls.update();
  post.composer.render();
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

// ---------------- 自适应 ----------------
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  post.resize(window.innerWidth, window.innerHeight);
});

// 导出供调试（无 UI 前提下保持控制台可检视）
window.__SCENE__ = { scene, camera, renderer, controls, concorde: concorde.group };
