// 外部模块加载 + 异步导出测试
import * as THREE from '../js/three.module.js';
import { GLTFExporter } from '../js/addons/exporters/GLTFExporter.js';
const out = document.getElementById('out');
out.textContent = 'M1_LOADED';
try {
  const c = document.createElement('canvas'); c.width = 8; c.height = 8;
  const ctx = c.getContext('2d'); ctx.fillStyle = '#00ff00'; ctx.fillRect(0, 0, 8, 8);
  const tex = new THREE.CanvasTexture(c);
  const scene = new THREE.Scene();
  scene.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ map: tex })));
  const ex = new GLTFExporter();
  ex.parse(scene, (glb) => {
    const b = new Uint8Array(glb);
    out.textContent = 'M2_DONE:' + b.length;
  }, (e) => { out.textContent = 'M2_ERR:' + (e && (e.message || e)); }, { binary: true, trs: true });
  out.textContent = 'M1_EXPORT_STARTED';
} catch (e) { out.textContent = 'M1_EX:' + e.message; }
