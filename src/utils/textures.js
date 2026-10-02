// ============================================================
// 程序化 Canvas 纹理工厂：混凝土/沥青/戈壁土/锈蚀金属/砖墙/
// 铁丝网/跑道标线/机身涂装/警示标牌 —— 全部离线自包含
// ============================================================
import * as THREE from '../../js/three.module.js';
import { fbm, mulberry32 } from './noise.js';

const _cache = new Map();
function get(key, make) {
  if (_cache.has(key)) return _cache.get(key);
  const t = make();
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  _cache.set(key, t);
  return t;
}

function cv(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}
function ctx2(c) { return c.getContext('2d'); }

function speckle(g, w, h, n, colors, alphaMax = 0.5) {
  for (let i = 0; i < n; i++) {
    const x = Math.random() * w, y = Math.random() * h, r = 0.5 + Math.random() * 2.2;
    g.fillStyle = colors[(Math.random() * colors.length) | 0];
    g.globalAlpha = alphaMax * (0.3 + Math.random() * 0.7);
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  g.globalAlpha = 1;
}

function cracks(g, w, h, n, color, alphaMax = 0.35) {
  for (let i = 0; i < n; i++) {
    let x = Math.random() * w, y = Math.random() * h;
    g.strokeStyle = color; g.lineWidth = 0.6 + Math.random() * 1.1;
    g.globalAlpha = alphaMax * (0.4 + Math.random() * 0.6);
    g.beginPath(); g.moveTo(x, y);
    const segs = 3 + (Math.random() * 5) | 0;
    for (let s = 0; s < segs; s++) {
      x += (Math.random() - 0.5) * 22;
      y += (Math.random() - 0.5) * 22;
      g.lineTo(x, y);
    }
    g.stroke();
  }
  g.globalAlpha = 1;
}

function stains(g, w, h, n, color, alphaMax = 0.28) {
  for (let i = 0; i < n; i++) {
    const x = Math.random() * w, y = Math.random() * h, r = 6 + Math.random() * 26;
    const grad = g.createRadialGradient(x, y, r * 0.15, x, y, r);
    grad.addColorStop(0, color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = alphaMax * (0.3 + Math.random() * 0.7);
    g.fillStyle = grad;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  g.globalAlpha = 1;
}

// ---- 混凝土（通用，可平铺）----
export function concreteTex({ tile = 4, base = '#98988f', light = '#aaa89e', dark = '#7b7b73', joint = false, jointColor = 'rgba(70,70,66,0.8)' } = {}) {
  const key = `concrete|${tile}|${base}|${light}|${dark}|${joint}`;
  return get(key, () => {
    const c = cv(512, 512), g = ctx2(c);
    g.fillStyle = base; g.fillRect(0, 0, 512, 512);
    g.globalAlpha = 1;
    // 大块色斑
    for (let i = 0; i < 26; i++) {
      const x = Math.random() * 512, y = Math.random() * 512, r = 24 + Math.random() * 70;
      const grad = g.createRadialGradient(x, y, 2, x, y, r);
      const col = Math.random() < 0.5 ? light : dark;
      grad.addColorStop(0, col);
      grad.addColorStop(1, base);
      g.globalAlpha = 0.16;
      g.fillStyle = grad; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    g.globalAlpha = 1;
    speckle(g, 512, 512, 4200, ['#8b8b82', '#a3a399', '#6f6f67', '#b6b4a9'], 0.4);
    cracks(g, 512, 512, 10, 'rgba(72,72,68,0.9)', 0.42);
    stains(g, 512, 512, 9, 'rgba(90,84,72,0.9)', 0.3);
    if (joint) {
      g.strokeStyle = jointColor; g.lineWidth = 3;
      g.strokeRect(2, 2, 508, 508);
      g.lineWidth = 1.4;
      g.strokeRect(8, 8, 496, 496);
    }
    const t = new THREE.CanvasTexture(c);
    t.repeat.set(tile, tile);
    return t;
  });
}

// ---- 沥青 ----
export function asphaltTex({ tile = 4 } = {}) {
  const key = `asphalt|${tile}`;
  return get(key, () => {
    const c = cv(512, 512), g = ctx2(c);
    g.fillStyle = '#585650'; g.fillRect(0, 0, 512, 512);
    speckle(g, 512, 512, 5200, ['#4e4c46', '#63615a', '#46443e', '#6e6b63'], 0.5);
    cracks(g, 512, 512, 14, 'rgba(40,40,37,0.95)', 0.5);
    stains(g, 512, 512, 8, 'rgba(55,52,44,0.9)', 0.35);
    const t = new THREE.CanvasTexture(c);
    t.repeat.set(tile, tile);
    return t;
  });
}

// ---- 戈壁荒原土（大面积，带干裂与枯草色斑）----
export function gobiTex({ tile = 12, base = '#8b7f66', dry = '#9a8c6f', dark = '#5f5645' } = {}) {
  const key = `gobi|${tile}|${base}|${dry}|${dark}`;
  return get(key, () => {
    const c = cv(1024, 1024), g = ctx2(c);
    g.fillStyle = base; g.fillRect(0, 0, 1024, 1024);
    // fbm 大尺度色带
    for (let y = 0; y < 1024; y += 4) {
      for (let x = 0; x < 1024; x += 4) {
        const n = fbm(x / 90, y / 90, 4, 7);
        const m = fbm(x / 26, y / 26, 3, 3);
        let col = base;
        if (n > 0.56) col = dry;
        else if (n < 0.42) col = dark;
        const mix = m * 0.5 + 0.5;
        g.fillStyle = blendHex(col, base, 0.45 + 0.55 * mix);
        g.globalAlpha = 0.5;
        g.fillRect(x, y, 4, 4);
      }
    }
    g.globalAlpha = 1;
    speckle(g, 1024, 1024, 9000, ['#756b55', '#a49a7d', '#544c3e', '#b3a887', '#6b6250'], 0.5);
    // 干裂
    for (let i = 0; i < 34; i++) {
      let x = Math.random() * 1024, y = Math.random() * 1024;
      g.strokeStyle = 'rgba(70,62,48,0.9)';
      g.lineWidth = 1 + Math.random() * 2.4;
      g.globalAlpha = 0.5;
      g.beginPath(); g.moveTo(x, y);
      const segs = 4 + (Math.random() * 8) | 0;
      for (let s = 0; s < segs; s++) {
        x += (Math.random() - 0.5) * 46;
        y += (Math.random() - 0.5) * 46;
        g.lineTo(x, y);
      }
      g.stroke();
    }
    g.globalAlpha = 1;
    const t = new THREE.CanvasTexture(c);
    t.repeat.set(tile, tile);
    return t;
  });
}

// ---- 干裂地皮贴片（跑道边干裂硬化土）----
export function crackedPatchTex() {
  return get('crackedPatch', () => {
    const c = cv(256, 256), g = ctx2(c);
    g.fillStyle = '#8d8269'; g.fillRect(0, 0, 256, 256);
    g.globalAlpha = 1;
    for (let i = 0; i < 22; i++) {
      let x = Math.random() * 256, y = Math.random() * 256;
      g.strokeStyle = 'rgba(72,63,48,0.95)';
      g.lineWidth = 1.5 + Math.random() * 2.2;
      g.globalAlpha = 0.7;
      g.beginPath(); g.moveTo(x, y);
      const segs = 5 + (Math.random() * 7) | 0;
      for (let s = 0; s < segs; s++) {
        x += (Math.random() - 0.5) * 52;
        y += (Math.random() - 0.5) * 52;
        g.lineTo(x, y);
      }
      g.stroke();
    }
    g.globalAlpha = 0.85;
    speckle(g, 256, 256, 900, ['#6d6350', '#a59a7e', '#57503f'], 0.4);
    g.globalAlpha = 1;
    return new THREE.CanvasTexture(c);
  });
}

// ---- 锈蚀金属板 ----
export function rustTex({ tile = 3, base = '#6b5644', dark = '#453a2e', light = '#8a7055' } = {}) {
  const key = `rust|${tile}`;
  return get(key, () => {
    const c = cv(512, 512), g = ctx2(c);
    g.fillStyle = base; g.fillRect(0, 0, 512, 512);
    speckle(g, 512, 512, 3600, [dark, light, '#7d6751', '#4f4133'], 0.6);
    // 锈蚀纵向流痕
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * 512;
      const y0 = Math.random() * 200;
      const hgt = 100 + Math.random() * 350;
      const grad = g.createLinearGradient(0, y0, 0, y0 + hgt);
      grad.addColorStop(0, dark);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      g.globalAlpha = 0.35;
      g.fillStyle = grad;
      g.fillRect(x, y0, 2.5 + Math.random() * 5, hgt);
    }
    g.globalAlpha = 1;
    cracks(g, 512, 512, 8, 'rgba(38,30,24,0.95)', 0.5);
    const t = new THREE.CanvasTexture(c);
    t.repeat.set(tile, tile);
    return t;
  });
}

// ---- 褪色油漆金属（库门/设备）----
export function paintWearTex({ tile = 3, base = '#8f8a80', chip = '#6b5644', dark = '#5c5a52' } = {}) {
  const key = `paintWear|${tile}|${base}`;
  return get(key, () => {
    const c = cv(512, 512), g = ctx2(c);
    g.fillStyle = base; g.fillRect(0, 0, 512, 512);
    speckle(g, 512, 512, 2600, [dark, '#a5a096', '#78756c'], 0.4);
    // 掉漆
    for (let i = 0; i < 90; i++) {
      const x = Math.random() * 512, y = Math.random() * 512, r = 2 + Math.random() * 9;
      g.globalAlpha = 0.5;
      g.fillStyle = chip;
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
      if (Math.random() < 0.5) {
        g.fillStyle = dark;
        g.beginPath(); g.arc(x + r * 0.4, y + r * 0.4, r * 0.55, 0, Math.PI * 2); g.fill();
      }
    }
    g.globalAlpha = 1;
    stains(g, 512, 512, 10, 'rgba(70,60,45,0.9)', 0.3);
    const t = new THREE.CanvasTexture(c);
    t.repeat.set(tile, tile);
    return t;
  });
}

// ---- 砖墙 ----
export function brickTex({ tile = 3, base = '#8f6a52' } = {}) {
  const key = `brick|${tile}|${base}`;
  return get(key, () => {
    const c = cv(512, 512), g = ctx2(c);
    g.fillStyle = base; g.fillRect(0, 0, 512, 512);
    // 砖块网格
    const bw = 32, bh = 16;
    for (let row = 0; row < 16; row++) {
      const off = (row % 2) * (bw / 2);
      for (let col = -1; col < 17; col++) {
        const x = col * bw + off, y = row * bh;
        const shade = 0.82 + fbm(col * 0.6, row * 0.8, 2, 11) * 0.36;
        g.fillStyle = blendHex(base, row % 3 === 0 ? '#7c5c46' : '#9a755c', shade);
        g.fillRect(x + 1, y + 1, bw - 2, bh - 2);
      }
    }
    speckle(g, 512, 512, 1400, ['#5f4636', '#a9886c'], 0.25);
    stains(g, 512, 512, 8, 'rgba(60,50,40,0.9)', 0.32);
    const t = new THREE.CanvasTexture(c);
    t.repeat.set(tile, tile);
    return t;
  });
}

// ---- 铁丝网（透明链式网纹）----
export function fenceMeshTex() {
  return get('fenceMesh', () => {
    const c = cv(64, 64), g = ctx2(c);
    g.clearRect(0, 0, 64, 64);
    g.strokeStyle = '#3f4246';
    g.lineWidth = 1.6;
    const step = 16;
    for (let i = 0; i < 5; i++) {
      const x = i * step;
      g.beginPath();
      for (let y = 0; y <= 64; y += 4) {
        const xx = x + (y % 16 < 8 ? 4 : -4);
        if (y === 0) g.moveTo(xx, y); else g.lineTo(xx, y);
      }
      g.stroke();
      g.beginPath();
      for (let y = 0; y <= 64; y += 4) {
        const xx = x + 8 + (y % 16 < 8 ? -4 : 4);
        if (y === 0) g.moveTo(xx, y); else g.lineTo(xx, y);
      }
      g.stroke();
    }
    for (let y = 0; y < 64; y += 16) {
      g.beginPath(); g.moveTo(0, y); g.lineTo(64, y); g.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  });
}

// ---- 主跑道整幅道面（标线 + 接缝 + 磨损 + 烧痕 + 褪色）----
export function runwaySurfaceTex({ len = 66, wid = 6.4 } = {}) {
  const key = `runway|${len}|${wid}`;
  return get(key, () => {
    const W = 4096, H = 512;
    const c = cv(W, H), g = ctx2(c);
    const x0 = 64, x1 = W - 64;              // 跑道起止（留边供路肩贴图区）
    const y0 = 10, y1 = H - 10;              // 道面宽度范围（对应 6.4m）
    const dX = (x1 - x0) / len;              // 每米像素

    // 基面：混凝土
    g.fillStyle = '#9c9c93'; g.fillRect(x0, y0, x1 - x0, y1 - y0);
    // 道面噪点与色斑
    for (let i = 0; i < 9000; i++) {
      const x = x0 + Math.random() * (x1 - x0), y = y0 + Math.random() * (y1 - y0);
      const r = 1 + Math.random() * 3;
      g.globalAlpha = 0.12 + Math.random() * 0.2;
      g.fillStyle = Math.random() < 0.5 ? '#aaa99f' : '#8b8b82';
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
    g.globalAlpha = 1;

    // 分块接缝：每 5m 一道横缝 + 每 1.6m 竖缝
    g.strokeStyle = 'rgba(70,70,66,0.9)'; g.lineWidth = 3;
    for (let m = 0; m <= len; m += 5) {
      const x = x0 + m * dX;
      g.beginPath(); g.moveTo(x, y0 + 2); g.lineTo(x, y1 - 2); g.stroke();
    }
    g.lineWidth = 2; g.strokeStyle = 'rgba(84,84,79,0.75)';
    for (let w = 0.8; w < wid; w += 1.6) {
      const y = y0 + (w / wid) * (y1 - y0);
      g.beginPath(); g.moveTo(x0 + 4, y); g.lineTo(x1 - 4, y); g.stroke();
    }

    // 中心线：白色虚线（每 4m 实 1m）
    g.fillStyle = 'rgba(240,240,238,0.92)';
    for (let m = 0; m < len; m += 5) {
      const x = x0 + m * dX;
      g.fillRect(x, y0 + (y1 - y0) * 0.47, 1.1 * dX, (y1 - y0) * 0.06);
    }

    // 边界白线
    g.fillStyle = 'rgba(238,238,234,0.9)';
    g.fillRect(x0, y0 + 1.5, x1 - x0, 5);
    g.fillRect(x0, y1 - 6.5, x1 - x0, 5);

    // 端头：东端（x1）加粗白色横线 + 红色警示块
    g.fillStyle = '#e8e8e4';
    g.fillRect(x1 - 2.4 * dX, y0, 2.4 * dX, y1 - y0);
    g.fillStyle = '#a63a32';
    for (let k = 0; k < 5; k++) {
      const y = y0 + k * (y1 - y0) / 5;
      g.fillRect(x1 - 5.2 * dX, y, 0.9 * dX, (y1 - y0) / 5);
    }
    // 西端同样处理
    g.fillStyle = '#e8e8e4';
    g.fillRect(x0, y0, 2.4 * dX, y1 - y0);
    g.fillStyle = '#a63a32';
    for (let k = 0; k < 5; k++) {
      const y = y0 + k * (y1 - y0) / 5;
      g.fillRect(x0, y, 0.9 * dX, (y1 - y0) / 5);
    }

    // 距离标记（每 200m 一个 → 微缩为每 10m 一个数字块）
    g.fillStyle = 'rgba(235,235,230,0.85)';
    for (let m = 10; m < len; m += 10) {
      const x = x0 + m * dX;
      g.fillRect(x - 1.1 * dX, y0 + (y1 - y0) * 0.4, 0.5 * dX, (y1 - y0) * 0.2);
      g.fillRect(x + 0.6 * dX, y0 + (y1 - y0) * 0.4, 0.5 * dX, (y1 - y0) * 0.2);
    }

    // 轮胎摩擦痕（中心线两侧暗带）
    for (let pass = 0; pass < 2; pass++) {
      const cy = y0 + (y1 - y0) * (0.42 + pass * 0.16);
      for (let m = 0; m < len; m += 0.8) {
        const x = x0 + m * dX;
        const a = 0.10 + Math.random() * 0.16;
        g.globalAlpha = a;
        g.fillStyle = '#3e3d3a';
        g.fillRect(x, cy - 2.2, 0.75 * dX, 4.4);
      }
      g.globalAlpha = 1;
    }

    // 橡胶灼烧印记（起飞区东侧更重）
    for (let i = 0; i < 42; i++) {
      const x = x0 + (len * 0.15 + Math.random() * len * 0.85) * dX;
      const y = y0 + (y1 - y0) * (0.25 + Math.random() * 0.5);
      const r = 8 + Math.random() * 22;
      const grad = g.createRadialGradient(x, y, 1, x, y, r);
      grad.addColorStop(0, 'rgba(28,27,26,0.5)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grad; g.fillRect(x - r, y - r, r * 2, r * 2);
    }

    // 起飞高温褪色区（中段偏东）
    for (let i = 0; i < 16; i++) {
      const x = x0 + (len * 0.30 + Math.random() * len * 0.55) * dX;
      const y = y0 + Math.random() * (y1 - y0);
      const r = 18 + Math.random() * 34;
      const grad = g.createRadialGradient(x, y, 2, x, y, r);
      grad.addColorStop(0, 'rgba(226,224,214,0.4)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grad; g.fillRect(x - r, y - r, r * 2, r * 2);
    }

    // 砂尘堆积（道边）
    g.globalAlpha = 0.35;
    for (let i = 0; i < 40; i++) {
      const x = x0 + Math.random() * (x1 - x0);
      const y = Math.random() < 0.5 ? y0 + 2 : y1 - 8;
      const r = 6 + Math.random() * 16;
      const grad = g.createRadialGradient(x, y, 1, x, y, r);
      grad.addColorStop(0, 'rgba(139,128,100,0.9)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grad; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    g.globalAlpha = 1;

    // 龟裂细纹（整体）
    g.strokeStyle = 'rgba(74,74,70,0.55)'; g.lineWidth = 1;
    for (let i = 0; i < 30; i++) {
      let x = x0 + Math.random() * (x1 - x0), y = y0 + Math.random() * (y1 - y0);
      g.beginPath(); g.moveTo(x, y);
      const segs = 4 + (Math.random() * 6) | 0;
      for (let s = 0; s < segs; s++) {
        x += (Math.random() - 0.5) * 70; y += (Math.random() - 0.5) * 14;
        g.lineTo(x, y);
      }
      g.stroke();
    }

    const t = new THREE.CanvasTexture(c);
    return t;
  });
}

// ---- 停机坪/滑行道硬化地面（带中心线/停机位线）----
export function pavedTex({ line = 'rgba(235,235,230,0.85)', hazard = true } = {}) {
  const key = `paved|${line}|${hazard}`;
  return get(key, () => {
    const c = cv(1024, 1024), g = ctx2(c);
    g.fillStyle = '#94948b'; g.fillRect(0, 0, 1024, 1024);
    speckle(g, 1024, 1024, 7000, ['#a5a49a', '#83837a', '#b0afa5'], 0.35);
    cracks(g, 1024, 1024, 12, 'rgba(70,70,66,0.8)', 0.4);
    stains(g, 1024, 1024, 10, 'rgba(80,74,60,0.9)', 0.3);
    // 中心线（纵向，可平铺）
    g.fillStyle = line;
    g.fillRect(0, 500, 1024, 24);
    if (hazard) {
      // 警戒黄黑斜纹（横向带）
      g.save();
      g.translate(0, 0);
      for (let y = 60; y < 210; y += 30) {
        g.fillStyle = y % 60 === 0 ? 'rgba(190,150,40,0.85)' : 'rgba(30,30,28,0.8)';
        g.beginPath();
        g.moveTo(0, y); g.lineTo(1024, y - 30); g.lineTo(1024, y); g.lineTo(0, y + 30);
        g.fill();
      }
      g.restore();
    }
    const t = new THREE.CanvasTexture(c);
    t.repeat.set(6, 6);
    return t;
  });
}

// ---- 机身涂装（苏联风格白/蓝/红 + 舷窗带 + 编号）
// 圆柱展开：纹理 u=环绕方向(0=顶,0.25=右舷,0.5=腹,0.75=左舷)，
//          v=轴向(0=机尾,1=机头)，故沿机身排布的条带在画布上是竖条
export function liveryTex() {
  return get('livery', () => {
    const W = 2048, H = 512;
    const c = cv(W, H), g = ctx2(c);
    // 底色：白
    g.fillStyle = '#e9eae6'; g.fillRect(0, 0, W, H);

    // 蒙皮分块接缝（两个方向细线）
    g.strokeStyle = 'rgba(120,124,126,0.5)'; g.lineWidth = 1;
    for (let x = 0; x < W; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
    for (let y = 0; y < H; y += 42) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }

    // 腹部浅灰蓝（u∈[0.42,0.58]，全长度）
    g.fillStyle = '#b9c2c8';
    g.fillRect(W * 0.42, 0, W * 0.16, H);
    g.fillStyle = 'rgba(148,156,162,0.7)';
    for (let y = 0; y < H; y += 5) { g.fillRect(W * 0.43, y, W * 0.01, 1); }

    // 蓝色腰线（舷窗下沿，两侧竖条）
    g.fillStyle = '#2c4a78';
    g.fillRect(W * 0.36, 0, W * 0.045, H);
    g.fillRect(W * 0.595, 0, W * 0.045, H);
    // 红色细条（腰线下方）
    g.fillStyle = '#a33b33';
    g.fillRect(W * 0.325, 0, W * 0.028, H);
    g.fillRect(W * 0.647, 0, W * 0.028, H);

    // 舷窗阵列（右舷 u≈0.21，左舷 u≈0.79，v 0.55→0.93 即画布 y 0.07H→0.45H）
    const winX = [W * 0.21, W * 0.79];
    for (const wx of winX) {
      for (let y = H * 0.07; y < H * 0.45; y += 13) {
        g.fillStyle = '#dfe3e4';
        g.fillRect(wx - 5, y, 10, 7);
        g.fillStyle = '#3c4752';
        g.fillRect(wx - 3, y + 2, 6, 3);
      }
    }

    // 驾驶舱风挡（机头两侧，v 0.92→0.99 即画布 y 0.01H→0.08H）
    g.fillStyle = '#39444f';
    g.fillRect(W * 0.18, H * 0.005, W * 0.05, H * 0.075);
    g.fillRect(W * 0.77, H * 0.005, W * 0.05, H * 0.075);

    // 机尾编号（旋转90°，沿机身方向排布，两侧各一，位于后机身）
    g.save();
    g.font = 'bold 34px Arial';
    g.textAlign = 'center';
    g.fillStyle = '#262c32';
    const reg = 'СССР-75401';
    for (const ux of [W * 0.215, W * 0.785]) {
      g.save();
      g.translate(ux, H * 0.80);
      g.rotate(-Math.PI / 2);
      g.fillText(reg, 0, 0);
      g.restore();
    }
    // 小号机型字样
    g.font = '17px Arial';
    g.fillStyle = '#545a60';
    for (const ux of [W * 0.215, W * 0.785]) {
      g.save();
      g.translate(ux, H * 0.90);
      g.rotate(-Math.PI / 2);
      g.fillText('ТУ-144C', 0, 0);
      g.restore();
    }
    g.restore();

    // 磨损/刮痕/尘土/油污
    for (let i = 0; i < 90; i++) {
      const x = Math.random() * W, y = Math.random() * H;
      g.strokeStyle = Math.random() < 0.5 ? 'rgba(120,116,106,0.45)' : 'rgba(200,202,198,0.55)';
      g.lineWidth = 0.6 + Math.random() * 1.2;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + 8 + Math.random() * 22, y + (Math.random() - 0.5) * 6);
      g.stroke();
    }
    for (let i = 0; i < 26; i++) {
      const x = Math.random() * W, y = Math.random() * H;
      const r = 6 + Math.random() * 22;
      const grad = g.createRadialGradient(x, y, 1, x, y, r);
      grad.addColorStop(0, Math.random() < 0.5 ? 'rgba(90,86,74,0.32)' : 'rgba(120,128,132,0.28)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grad; g.fillRect(x - r, y - r, r * 2, r * 2);
    }

    const t = new THREE.CanvasTexture(c);
    return t;
  });
}

// ---- 机翼蒙皮（白底 + 面板线 + 红星 + 翼缘蓝条）----
export function wingTex() {
  return get('wing', () => {
    const W = 1024, H = 512;
    const c = cv(W, H), g = ctx2(c);
    g.fillStyle = '#e8e9e5'; g.fillRect(0, 0, W, H);
    // 面板网格
    g.strokeStyle = 'rgba(120,124,126,0.5)'; g.lineWidth = 1.4;
    for (let x = 0; x < W; x += 58) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
    for (let y = 0; y < H; y += 44) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    // 翼缘蓝条（后缘方向）
    g.fillStyle = '#2c4a78';
    g.fillRect(W - 22, 0, 22, H);
    // 红星（翼根区）
    g.save();
    g.translate(150, 100);
    g.fillStyle = '#b03a30';
    g.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * 4 * Math.PI) / 5;
      const a2 = a + Math.PI / 5;
      g.lineTo(Math.cos(a) * 46, Math.sin(a) * 46);
      g.lineTo(Math.cos(a2) * 18, Math.sin(a2) * 18);
    }
    g.closePath(); g.fill();
    g.restore();
    // 油污 / 划痕
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * W, y = Math.random() * H;
      g.strokeStyle = 'rgba(110,108,100,0.4)';
      g.lineWidth = 0.7 + Math.random();
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + 6 + Math.random() * 16, y + (Math.random() - 0.5) * 5); g.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    return t;
  });
}

// ---- 尾翼涂装（红星 + 编号）----
export function finTex() {
  return get('fin', () => {
    const c = cv(256, 256), g = ctx2(c);
    g.fillStyle = '#e9eae6'; g.fillRect(0, 0, 256, 256);
    // 蓝底
    g.fillStyle = '#2c4a78';
    g.fillRect(40, 20, 176, 236);
    // 红星
    g.save();
    g.translate(128, 90);
    g.fillStyle = '#b03a30';
    g.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * 4 * Math.PI) / 5;
      const a2 = a + Math.PI / 5;
      g.lineTo(Math.cos(a) * 34, Math.sin(a) * 34);
      g.lineTo(Math.cos(a2) * 14, Math.sin(a2) * 14);
    }
    g.closePath(); g.fill();
    g.restore();
    g.font = 'bold 22px Arial'; g.textAlign = 'center';
    g.fillStyle = '#2c3238';
    g.fillText('75401', 128, 200);
    const t = new THREE.CanvasTexture(c);
    return t;
  });
}

// ---- 警示标牌（俄文）----
export function signTex(text, sub = '') {
  const key = `sign|${text}|${sub}`;
  return get(key, () => {
    const c = cv(256, 128), g = ctx2(c);
    g.fillStyle = '#8d8b82'; g.fillRect(0, 0, 256, 128);
    g.strokeStyle = '#4d4b45'; g.lineWidth = 6; g.strokeRect(4, 4, 248, 120);
    // 锈迹
    for (let i = 0; i < 40; i++) {
      g.globalAlpha = 0.3;
      g.fillStyle = '#6b5644';
      g.beginPath();
      g.arc(Math.random() * 256, Math.random() * 128, 2 + Math.random() * 8, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
    g.font = 'bold 30px Arial'; g.textAlign = 'center';
    g.fillStyle = '#2a2b2e';
    g.fillText(text, 128, sub ? 48 : 72);
    if (sub) {
      g.font = '20px Arial';
      g.fillText(sub, 128, 86);
    }
    const t = new THREE.CanvasTexture(c);
    return t;
  });
}

// 颜色混合工具
function blendHex(a, b, t) {
  const ca = hexRgb(a), cb = hexRgb(b);
  const r = Math.round(ca[0] + (cb[0] - ca[0]) * t);
  const g = Math.round(ca[1] + (cb[1] - ca[1]) * t);
  const bl = Math.round(ca[2] + (cb[2] - ca[2]) * t);
  return `rgb(${r},${g},${bl})`;
}
function hexRgb(h) {
  if (typeof h === 'string') {
    h = h.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  return [(h >> 16) & 255, (h >> 8) & 255, h & 255];
}

export { blendHex, hexRgb };
