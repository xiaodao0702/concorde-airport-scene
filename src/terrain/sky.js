// ============================================================
// 天空：高远晴空渐变穹顶 + 太阳 + 柔和光晕（万里无云）
// ============================================================
import * as THREE from '../../js/three.module.js';
import { CFG } from '../config.js';

export function buildSky(scene) {
  const group = new THREE.Group();
  group.name = 'sky';

  // 渐变穹顶
  const c = document.createElement('canvas');
  c.width = 4; c.height = 1024;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 1024);
  grad.addColorStop(0.0, '#173e77');          // 天顶深蓝
  grad.addColorStop(0.35, '#2f5d9c');
  grad.addColorStop(0.62, '#7ba6cf');
  grad.addColorStop(0.82, '#cfe0ec');         // 近地平
  grad.addColorStop(1.0, '#e6eef4');          // 地平线亮带
  g.fillStyle = grad;
  g.fillRect(0, 0, 4, 1024);
  const skyTex = new THREE.CanvasTexture(c);
  skyTex.colorSpace = THREE.SRGBColorSpace;

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(430, 48, 32),
    new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false, depthWrite: false })
  );
  group.add(sky);

  // 太阳（billboard 光斑 + 光晕）
  const sunPos = new THREE.Vector3(...CFG.sky.sunPos).normalize().multiplyScalar(400);
  const sc = document.createElement('canvas');
  sc.width = 128; sc.height = 128;
  const sg = sc.getContext('2d');
  const sgrad = sg.createRadialGradient(64, 64, 2, 64, 64, 64);
  sgrad.addColorStop(0, 'rgba(255,250,235,1)');
  sgrad.addColorStop(0.12, 'rgba(255,246,224,0.95)');
  sgrad.addColorStop(0.35, 'rgba(255,238,205,0.35)');
  sgrad.addColorStop(1, 'rgba(255,238,205,0)');
  sg.fillStyle = sgrad;
  sg.fillRect(0, 0, 128, 128);
  const sunTex = new THREE.CanvasTexture(sc);
  sunTex.colorSpace = THREE.SRGBColorSpace;
  const sun = new THREE.Mesh(
    new THREE.PlaneGeometry(46, 46),
    new THREE.MeshBasicMaterial({ map: sunTex, transparent: true, fog: false, depthWrite: false, toneMapped: false })
  );
  sun.position.copy(sunPos);
  sun.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), sunPos.clone().normalize());
  group.add(sun);

  scene.add(group);
  return { group, sunPos: sunPos.clone().normalize() };
}
