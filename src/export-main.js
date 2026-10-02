// ============================================================
// GLB 导出入口（仅供 Unity 导入管线使用，不影响原场景）
// 装配全部静态资产 → 剔除动效/天空/粒子 → 归一化材质 →
// 烘焙 InstancedMesh → GLTFExporter 输出二进制 GLB(base64)
// 结果写入 #out 节点，供 headless 浏览器 dump-dom 抓取
// ============================================================
import * as THREE from '../js/three.module.js';
import { GLTFExporter } from '../js/addons/exporters/GLTFExporter.js';
import { buildScene } from './layout.js';

const out = document.getElementById('out');
function fail(msg) {
  out.textContent = 'EXPORT_ERROR:' + msg;
  console.error(msg);
}

// ---------------- 1. 装配全场景 ----------------
const scene = new THREE.Scene();
try {
  buildScene(scene);
} catch (e) { fail('buildScene: ' + (e && e.message || e)); }

// ---------------- 2. 剔除动效/天空/粒子/自写着色器 ----------------
try {
  const remove = new Set();
  scene.traverse((obj) => {
    // 粒子系统（扬尘/浮尘）
    if (obj.isPoints) { remove.add(obj); return; }
    // 自写 ShaderMaterial 透明面（热浪/地热）
    if (obj.isMesh) {
      const m = obj.material;
      const list = Array.isArray(m) ? m : [m];
      if (list.some(x => x && x.isShaderMaterial)) { remove.add(obj); return; }
    }
    // 命名组：天空/雾带/热浪/大气
    if (obj.isGroup && ['sky', 'haze', 'heat', 'atmosphere'].includes(obj.name)) { remove.add(obj); }
  });
  for (const o of remove) o.removeFromParent();
} catch (e) { fail('cleanup: ' + (e && e.message || e)); }

// ---------------- 3. 归一化材质：Toon→Standard ----------------
try {
  scene.traverse((obj) => {
    if (!obj.isMesh) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    const norm = mats.map((m) => {
      if (m && m.isMeshToonMaterial) {
        const nm = new THREE.MeshStandardMaterial({
          map: m.map,
          color: m.color.clone(),
          emissive: m.emissive.clone(),
          emissiveIntensity: m.emissiveIntensity,
          transparent: m.transparent,
          opacity: m.opacity,
          side: m.side,
          flatShading: m.flatShading,
          roughness: 1.0,
          metalness: 0.0,
        });
        nm.name = m.name || 'toon-std';
        return nm;
      }
      return m;
    });
    obj.material = Array.isArray(obj.material) ? norm : norm[0];
  });
} catch (e) { fail('normalize: ' + (e && e.message || e)); }

// ---------------- 4. 烘焙 InstancedMesh → 独立网格 ----------------
try {
  const instances = [];
  scene.traverse((obj) => { if (obj.isInstancedMesh) instances.push(obj); });
  for (const inst of instances) {
    const parent = inst.parent;
    if (!parent) continue;
    const mats = Array.isArray(inst.material) ? inst.material : [inst.material];
    for (let i = 0; i < inst.count; i++) {
      const m = new THREE.Mesh(inst.geometry, mats[0].clone());
      inst.getMatrixAt(i, m.matrix);
      m.matrix.decompose(m.position, m.quaternion, m.scale);
      m.castShadow = inst.castShadow;
      m.receiveShadow = inst.receiveShadow;
      m.name = (inst.name || 'instance') + '_' + i;
      parent.add(m);
    }
    parent.remove(inst);
    inst.geometry.dispose();
  }
} catch (e) { fail('bakeInstances: ' + (e && e.message || e)); }

// ---------------- 5. 导出 GLB ----------------
try {
  const exporter = new GLTFExporter();
  const done = async (glb) => {
    try {
      const bytes = glb instanceof ArrayBuffer ? new Uint8Array(glb) : glb;
      if (typeof process !== 'undefined' && process.versions && process.versions.node) {
        const { writeFileSync } = await import('node:fs');
        writeFileSync('F:/VR design/tmp/xiehehao-convert/scene.glb', Buffer.from(bytes));
        console.log('NODE_EXPORT_OK:' + bytes.length);
        return;
      }
      let bin = '';
      const CH = 0x8000;
      for (let i = 0; i < bytes.length; i += CH) {
        bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
      }
      out.textContent = 'EXPORT_OK:' + btoa(bin);
    } catch (e2) { fail('encode: ' + (e2 && e2.message || e2)); }
  };
  const errCb = (err) => fail('gltf: ' + (err && (err.message || err)));
  exporter.parse(scene, done, errCb, { binary: true, trs: true, onlyVisible: false });
} catch (e) { fail('export: ' + (e && e.message || e)); }
