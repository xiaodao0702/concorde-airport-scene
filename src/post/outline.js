// ============================================================
// 后期：三渲二动漫轮廓描边（OutlinePass）+ 输出合成
// 收集全部需要描边的 Mesh（排除地表/底座/天空/雾/草/热浪/粒子）
// ============================================================
import * as THREE from '../../js/three.module.js';
import { EffectComposer } from '../../js/addons/postprocessing/EffectComposer.js';
import { RenderPass } from '../../js/addons/postprocessing/RenderPass.js';
import { OutputPass } from '../../js/addons/postprocessing/OutputPass.js';
import { OutlinePass } from '../../js/addons/postprocessing/OutlinePass.js';
import { CFG } from '../config.js';

export function setupPost(renderer, scene, camera) {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const outlinePass = new OutlinePass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    scene, camera
  );
  const o = CFG.outline;
  outlinePass.edgeStrength = o.edgeStrength;
  outlinePass.edgeThickness = o.edgeThickness;
  outlinePass.edgeGlow = o.edgeGlow;
  outlinePass.pulsePeriod = o.pulse;
  outlinePass.visibleEdgeColor.set(o.color);
  outlinePass.hiddenEdgeColor.set(0x0c0d10);
  composer.addPass(outlinePass);

  composer.addPass(new OutputPass());

  // 收集描边对象
  const targets = [];
  scene.traverse((obj) => {
    if (obj.isMesh && !obj.userData.noOutline) {
      targets.push(obj);
    }
  });
  outlinePass.selectedObjects = targets;

  return {
    composer,
    outlinePass,
    resize(w, h) {
      composer.setSize(w, h);
      outlinePass.setSize(w, h);
      outlinePass.resolution.set(w, h);
    },
  };
}
