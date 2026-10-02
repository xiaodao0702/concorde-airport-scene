// ============================================================
// 协和号超音速客机（苏联航空涂装）—— 起飞离地瞬间姿态
// 完全模块化：机身(回转体)/三角翼/升降副翼/垂直尾翼/4发双喷口发动机/
// 起落架/舷窗阵列/铆钉/皮托管/航行灯，全部独立建模
// ============================================================
import * as THREE from '../../js/three.module.js';
import { CFG, C } from '../config.js';
import { revolveAroundX, sampleProfile } from '../utils/revolve.js';
import { liveryTex, wingTex, finTex } from '../utils/textures.js';
import { toon, toonMap, glass, glow, metal } from '../utils/materials.js';
import { cyl, box, sph, mesh } from '../utils/helpers.js';

const L = 7.4, HALF = 3.7;

export function buildConcorde(scene) {
  const group = new THREE.Group();
  group.name = 'concorde';

  // ================= 机身 =================
  const profile = [
    [-HALF, 0.02], [-3.62, 0.14], [-3.45, 0.26], [-3.1, 0.36], [-2.7, 0.44],
    [-2.0, 0.52], [-1.0, 0.56], [0.0, 0.575], [1.0, 0.57], [1.8, 0.545],
    [2.5, 0.50], [3.0, 0.42], [3.35, 0.32], [3.6, 0.18], [HALF, 0.01],
  ];
  const { xs, rs } = sampleProfile(profile, 120, 1);
  const fusGeo = revolveAroundX(xs, rs, 120, 56, { elliptical: [0.94, 1.06] });
  const skinMat = toonMap({
    map: liveryTex(), color: 0xffffff, roughness: 0.32, metalness: 0.35,
    envMapIntensity: 0.85, side: THREE.DoubleSide,
  });
  const fuselage = new THREE.Mesh(fusGeo, skinMat);
  fuselage.castShadow = true;
  fuselage.receiveShadow = true;
  group.add(fuselage);

  // ================= 三角翼（左/右独立） =================
  const wingTopMat = toonMap({
    map: wingTex(), color: 0xffffff, roughness: 0.35, metalness: 0.3,
    envMapIntensity: 0.7, side: THREE.FrontSide,
  });
  const wingEdgeMat = toon({ color: 0x9aa0a6, roughness: 0.4, envMapIntensity: 0.8 });

  function buildWing(sign) {
    const sh = new THREE.Shape();
    sh.moveTo(0.9, 0.6 * sign);
    sh.quadraticCurveTo(-0.5, 2.85 * sign, -2.42, 3.14 * sign);
    sh.lineTo(-2.85, 3.14 * sign);
    sh.lineTo(-2.35, 0.46 * sign);
    sh.closePath();
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.06, bevelEnabled: false, steps: 1 });
    geo.translate(0, 0, 0.02);   // 翼面上抬，贴合机身侧壁
    geo.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(geo, [wingTopMat, wingEdgeMat]);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    // 翼根整流罩（填补机身侧壁与翼根间隙）
    const fairMat = toonMap({
      map: wingTex(), color: 0xdadbd6, roughness: 0.4, metalness: 0.3,
      envMapIntensity: 0.5, side: THREE.DoubleSide,
    });
    const f1 = mesh(box(1.9, 0.22, 0.12), fairMat, -0.05, 0.06, 0.52 * sign);
    f1.rotation.y = -0.32 * sign;
    group.add(f1);
    const f2 = mesh(box(1.05, 0.16, 0.1), fairMat, -1.95, 0.04, 0.45 * sign);
    f2.rotation.y = 0.3 * sign;
    group.add(f2);
    return m;
  }
  buildWing(1);
  buildWing(-1);

  // 升降副翼（每翼内外两段，下偏）
  function buildElevon(sign, s0, s1) {
    const sh = new THREE.Shape();
    sh.moveTo(-2.35, s0 * sign);
    sh.lineTo(-2.35, s1 * sign);
    sh.lineTo(-2.72, s1 * sign);
    sh.lineTo(-2.72, s0 * sign);
    sh.closePath();
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.035, bevelEnabled: false, steps: 1 });
    geo.rotateX(-Math.PI / 2);
    const mat = toonMap({
      map: wingTex(), color: 0xf4f4f0, roughness: 0.35, metalness: 0.3,
      envMapIntensity: 0.7, side: THREE.DoubleSide,
    });
    const m = new THREE.Mesh(geo, mat);
    m.rotation.x = -0.14 * sign;   // 下偏
    m.castShadow = true;
    group.add(m);
  }
  buildElevon(1, 0.55, 1.7);
  buildElevon(1, 1.7, 3.0);
  buildElevon(-1, 0.55, 1.7);
  buildElevon(-1, 1.7, 3.0);

  // ================= 垂直尾翼 =================
  const finShape = new THREE.Shape();
  finShape.moveTo(-1.78, 0.34);
  finShape.lineTo(-2.52, 1.18);
  finShape.lineTo(-3.05, 0.34);
  finShape.closePath();
  const finGeo = new THREE.ExtrudeGeometry(finShape, { depth: 0.14, bevelEnabled: false, steps: 1 });
  finGeo.translate(0, 0, -0.07);
  const finMat = toonMap({
    map: finTex(), color: 0xf4f4f0, roughness: 0.35, metalness: 0.3,
    envMapIntensity: 0.7, side: THREE.DoubleSide,
  });
  const fin = new THREE.Mesh(finGeo, finMat);
  fin.castShadow = true;
  group.add(fin);
  // 尾翼顶天线
  const finAnt = mesh(box(0.02, 0.16, 0.02), metal({ color: 0x4a4d52 }), -2.4, 1.26, 0);
  group.add(finAnt);

  // ================= 发动机（4 台，双喷口） =================
  const nacMat = metal({ color: 0x8a8f96, roughness: 0.32, envMapIntensity: 1.2 });
  const nacDark = metal({ color: 0x3c4046, roughness: 0.5, envMapIntensity: 0.7 });
  const nacInner = toon({ color: 0x22252a, roughness: 1, envMapIntensity: 0.2 });
  const nozzleRefs = [];

  function buildEngine(x, z, cant) {
    const eng = new THREE.Group();
    // 进气道唇口
    const lip = mesh(cyl(0.172, 0.158, 0.08, 28), nacMat, 0, 0, 0);
    eng.add(lip);
    // 进气锥（内部深色）
    const intake = new THREE.Mesh(new THREE.CircleGeometry(0.148, 24), nacInner);
    intake.rotation.y = -Math.PI / 2;
    intake.position.x = -0.05;
    eng.add(intake);
    // 机身短舱
    const body = mesh(cyl(0.156, 0.15, 1.28, 28), nacMat, -0.55, 0, 0);
    body.rotation.z = Math.PI / 2;
    eng.add(body);
    // 收敛喷管
    const noz = mesh(cyl(0.15, 0.115, 0.52, 24), nacDark, -1.28, 0, 0);
    noz.rotation.z = Math.PI / 2;
    eng.add(noz);
    // 双喷口出口（两个并列圆口）
    for (const sy of [-1, 1]) {
      const port = mesh(cyl(0.052, 0.05, 0.1, 16), nacDark, -1.54, 0.045 * sy, 0);
      port.rotation.z = Math.PI / 2;
      eng.add(port);
      const portInner = new THREE.Mesh(new THREE.CircleGeometry(0.045, 14), nacInner);
      portInner.rotation.y = -Math.PI / 2;
      portInner.position.set(-1.595, 0.045 * sy, 0);
      eng.add(portInner);
    }
    // 吊架
    const pylon = mesh(box(0.62, 0.14, 0.26), nacDark, -0.55, 0.13, 0);
    eng.add(pylon);

    eng.position.set(x, -0.5, z);
    eng.rotation.z = cant;
    group.add(eng);
    nozzleRefs.push(new THREE.Vector3(x - 1.57, -0.47, z));
  }
  buildEngine(-1.25, 0.92, 0.035);
  buildEngine(-1.6, 1.62, 0.02);
  buildEngine(-1.25, -0.92, -0.035);
  buildEngine(-1.6, -1.62, -0.02);

  // ================= 起落架 =================
  const strutMat = metal({ color: 0x7c8087, roughness: 0.4, envMapIntensity: 1.1 });
  const wheelMat = toon({ color: 0x26272b, roughness: 0.85, envMapIntensity: 0.3 });
  const hubMat = metal({ color: 0x9aa0a8, roughness: 0.4, envMapIntensity: 1.0 });

  function wheel(x, y, z, r = 0.145, w = 0.065) {
    const wh = mesh(cyl(r, r, w, 22), wheelMat, x, y, z);
    wh.rotation.x = Math.PI / 2;
    wh.castShadow = true;
    group.add(wh);
    const hub = mesh(cyl(r * 0.45, r * 0.45, w + 0.006, 12), hubMat, x, y, z);
    hub.rotation.x = Math.PI / 2;
    group.add(hub);
  }

  // 前起落架
  const noseStrut = mesh(box(0.06, 0.36, 0.07), strutMat, 2.55, -0.62, 0);
  group.add(noseStrut);
  wheel(2.55, -0.8, 0, 0.115, 0.06);
  // 前起落架舱门（微开）
  const ndoor = mesh(box(0.06, 0.22, 0.03), skinMat, 2.5, -0.42, 0.16);
  ndoor.rotation.x = -0.35;
  group.add(ndoor);

  // 主起落架（双支柱 × 双轮小车，4 轮/侧）
  for (const s of [-1, 1]) {
    const strut = mesh(box(0.075, 0.46, 0.08), strutMat, -0.5, -0.68, 0.62 * s);
    group.add(strut);
    const bogie = mesh(box(0.52, 0.07, 0.1), strutMat, -0.5, -0.92, 0.62 * s);
    group.add(bogie);
    for (const ax of [-0.21, 0.21]) {
      for (const wz of [-0.07, 0.07]) {
        wheel(-0.5 + ax, -0.945, 0.62 * s + wz, 0.135, 0.055);
      }
    }
    // 舱门（张开）
    const door = mesh(box(0.5, 0.16, 0.03), skinMat, -0.35, -0.4, 0.62 * s + 0.22);
    door.rotation.x = 0.5 * s * s;
    door.rotation.z = -0.22;
    group.add(door);
    // 液压管线
    const hyd = mesh(cyl(0.015, 0.015, 0.42, 8), nacDark, -0.5, -0.66, 0.62 * s - 0.05);
    hyd.rotation.z = Math.PI / 2;
    group.add(hyd);
  }

  // ================= 实体舷窗（捕光） =================
  const winMat = glass({ color: 0x31404e, opacity: 0.75, envMapIntensity: 1.4, emissive: 0x0e1720, emissiveIntensity: 0.5 });
  const winGeo = new THREE.PlaneGeometry(0.085, 0.07, 1, 1);
  const winPos = [];
  for (const u of [0.21, 0.79]) {
    const theta = u * Math.PI * 2;
    for (let v = 0.56; v <= 0.92; v += 0.024) {
      const idx = Math.round(v * 120);
      const x = xs[idx], r = rs[idx];
      const y = r * Math.cos(theta) * 0.94;
      const z = r * Math.sin(theta) * 1.06;
      winPos.push({ x, y, z, theta });
    }
  }
  for (const w of winPos) {
    const m = new THREE.Mesh(winGeo, winMat);
    m.position.set(w.x, w.y, w.z);
    m.rotation.y = w.theta > Math.PI ? Math.PI / 2 + 0.28 : Math.PI / 2 - 0.28;
    m.rotation.x = -0.22;
    m.scale.set(1, 1, 1);
    group.add(m);
  }

  // 驾驶舱风挡（实体玻璃）
  const windMat = glass({ color: 0x26333f, opacity: 0.82, envMapIntensity: 1.6, emissive: 0x0a1219, emissiveIntensity: 0.6 });
  for (const s of [-1, 1]) {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.14), windMat);
    w.position.set(3.32, 0.24 * s + 0.05, 0.10 * s);
    w.rotation.y = 0.5 * s;
    w.rotation.x = -0.5;
    group.add(w);
  }

  // ================= 铆钉（接缝环） =================
  const rivetMat = toon({ color: 0x8c929a, roughness: 0.5, envMapIntensity: 0.9 });
  const rivetGeo = sph(0.007, 6);
  const seams = [-3.15, -2.2, -1.2, -0.2, 0.8, 1.8, 2.7, 3.38];
  const rivets = [];
  for (const sx of seams) {
    const t = (sx + HALF) / L;
    const idx = Math.round(t * 120);
    const r = rs[idx];
    const n = 26;
    for (let k = 0; k < n; k++) {
      const th = (k / n) * Math.PI * 2;
      if (th > 0.55 && th < 2.6) continue; // 腹底部留空（被起落架/机身遮挡）
      rivets.push({
        x: sx,
        y: r * Math.cos(th) * 0.94,
        z: r * Math.sin(th) * 1.06,
        s: 1,
      });
    }
  }
  const rivInst = new THREE.InstancedMesh(rivetGeo, rivetMat, rivets.length);
  const m4 = new THREE.Matrix4();
  const p = new THREE.Vector3();
  for (let i = 0; i < rivets.length; i++) {
    const rv = rivets[i];
    m4.compose(p.set(rv.x, rv.y, rv.z), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1));
    rivInst.setMatrixAt(i, m4);
  }
  rivInst.instanceMatrix.needsUpdate = true;
  rivInst.castShadow = false;
  group.add(rivInst);

  // ================= 皮托管 / 航行灯 =================
  const pitot = mesh(cyl(0.008, 0.008, 0.16, 8), nacDark, HALF + 0.02, -0.06, 0.05);
  pitot.rotation.z = Math.PI / 2;
  group.add(pitot);
  // 翼尖航行灯
  for (const [sx, sz, col] of [[-2.6, 3.1, 0xd0453a], [-2.6, -3.1, 0x3a8f45], [-3.0, 0.5, 0xf0e0c0]]) {
    const nav = mesh(sph(0.02, 8), glow({ color: col, intensity: 1.0 }), sx, 0.06, sz);
    group.add(nav);
  }

  // ================= 姿态与位置 =================
  const cfg = CFG.concorde;
  group.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
  group.rotation.z = cfg.pitch;

  scene.add(group);
  return {
    group,
    refs: {
      nozzles: nozzleRefs,
      nose: new THREE.Vector3(HALF, 0.1, 0),
      mainGear: [new THREE.Vector3(-0.5, -1.0, 0.62), new THREE.Vector3(-0.5, -1.0, -0.62)],
      noseGear: new THREE.Vector3(2.55, -0.92, 0),
      wingtips: [new THREE.Vector3(-2.6, 0.06, 3.1), new THREE.Vector3(-2.6, 0.06, -3.1)],
    },
  };
}
