// ============================================================
// 全局配置：坐标、尺寸、配色 —— 全项目唯一权威数据源
// 坐标系：X 沿跑道方向（东），Z 横向（北为 +Z），Y 向上
// 场景为微缩沙盘：底座 94×94，跑道全长 66
// ============================================================

export const CFG = {
  // ---- 底座 / 地形 ----
  base: { size: 94, thickness: 1.7, topY: 0, border: 1.1 }, // 纯色底座，四周留边
  terrain: { size: 91.8 },                                   // 底座上戈壁地貌
  horizonY: 0.05,

  // ---- 跑道体系（起飞方向 +X）----
  runway: { len: 66, wid: 6.4, y: 0.13, x0: -33, x1: 33 },
  shoulder: { wid: 9.6, y: 0.105 },                          // 含路肩总宽
  taxiway: { z: 9.8, wid: 3.4, y: 0.105, x0: -33, x1: 33 },  // 平行滑行道
  highSpeed: { x0: 17, x1: 27, z0: 0, z1: 9.8 },             // 快速脱离道
  apron: { x0: 8, x1: 31, z0: 9.8, z1: 25, y: 0.105 },       // 停机坪
  warmZone: { x0: 31, x1: 33.6, z0: 9.8, z1: 25 },            // 警戒硬化带

  // ---- 场区边界（铁丝网 + 围墙 + 警戒带）----
  fence: { x0: -35.5, x1: 35.5, z0: -18.5, z1: 34.5, h: 1.95 },

  // ---- 主要建筑 ----
  tower: { pos: [20, 26.5] },
  barracks: [
    { pos: [-25.5, 30.5], size: [13, 6.2] },
    { pos: [-8.5, 30.5], size: [13, 6.2] },
  ],
  warehouse: { pos: [26.5, 30.5], size: [15, 9] },
  fuel: { pos: [-31.5, 23.5], bund: [9.6, 6.4] },

  // ---- 场区设施 ----
  searchlights: [
    [29, 13], [-29, 13], [29, -13.5], [-29, -13.5],
  ],
  powerPolesX: [-31, -21, -11, -1, 9, 19, 29], // 南侧高压线排（z = -8.2）
  windsock: { pos: [-30.5, -9.5] },
  approachLightsX: [35.5, 38, 40.5, 43, 45.5], // 进近灯（主跑道东端外）
  beacon: { pos: [22, 30.2] },                  // 塔台顶航标由塔台模块内置

  // ---- 协和号（起飞离地瞬间）----
  concorde: {
    pos: [5.0, 0.56, 0.0],      // 机鼻中心位置，主轮即将离地
    pitch: 0.065,                // 机头微抬（弧度）
    heading: 0,                  // 朝向 +X
    scale: 1.0,                  // 微缩比例（整机长 ≈ 7.4）
  },

  // ---- 天空与光照 ----
  sky: { zenith: 0x1e4e8c, mid: 0x5b8ec4, horizon: 0xd9e6ef, sunPos: [70, 95, -55] },
  sun: { intensity: 3.1, color: 0xfff2dd },
  hemi: { intensity: 0.38, sky: 0x9db8d8, ground: 0x8a7f6a },
  fill: { intensity: 0.55, color: 0xcfe0ec, pos: [-55, 30, 40] },
  rim: { intensity: 0.9, color: 0xfff6e0, pos: [20, 12, -60] },

  // ---- 相机（第三人称自由观景）----
  camera: { pos: [30, 13.5, 33], target: [1.5, 1.6, 0], fov: 40, near: 0.1, far: 900 },
  controls: { minDist: 2.5, maxDist: 130, damping: 0.06, pan: false },

  // ---- 后处理 ----
  outline: { edgeStrength: 3.0, edgeThickness: 1.2, edgeGlow: 0, pulse: 0, color: 0x16181d },

  // ---- 雾 / 大气 ----
  fog: { color: 0xcbd9e4, near: 70, far: 260 },
};

// 低饱和冷调复古苏联工业配色
export const C = {
  skyZenith: 0x1e4e8c, skyMid: 0x5b8ec4, skyHorizon: 0xd9e6ef,
  sun: 0xfff2dd,
  gobi: 0x8b7f66, gobiDry: 0x9a8c6f, gobiDark: 0x5f5645, gobiLine: 0x4d4638,
  grassDry: 0xa4945c, grassDark: 0x7d6f42,
  concrete: 0x9a9a93, concreteLight: 0xb0b0a8, concreteDark: 0x70706a,
  asphalt: 0x57554f,
  rust: 0x6b5644, rustDark: 0x453a2e, steel: 0x55575c, steelDark: 0x36383d,
  white: 0xe8e9e5, belly: 0xb9c2c8, cheatline: 0x2c4a78, red: 0xa33b33,
  glass: 0x6d8296, glassBright: 0xa8c2d4,
  brick: 0x8f6a52, tree: 0x43522f, treeDark: 0x33411f,
  fenceGray: 0x4a4d52,
};
