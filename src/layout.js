// ============================================================
// 布局组装器：按序构建全部模块（布局坐标见 config.js）
// 并统一设置描边排除标记，汇总动画更新器
// ============================================================
import { buildTerrain } from './terrain/terrain.js';
import { buildSky } from './terrain/sky.js';
import { buildHills, buildForest, buildHaze } from './terrain/hills.js';
import { buildGrass, buildRocks, buildCrackedPatches } from './terrain/details.js';
import { buildRunway } from './runway/runway.js';
import { buildTaxiwayApron } from './runway/taxiway.js';
import { buildConcorde } from './aircraft/concorde.js';
import { buildTower } from './buildings/tower.js';
import { buildBarracks } from './buildings/barracks.js';
import { buildWarehouse } from './buildings/warehouse.js';
import { buildPerimeter } from './buildings/perimeter.js';
import { buildSearchlights } from './facilities/lightTower.js';
import { buildPowerPoles } from './facilities/powerPoles.js';
import { buildSignals } from './facilities/signals.js';
import { buildFuelTanks } from './facilities/fuelTanks.js';
import { buildFireSafety } from './facilities/fireSafety.js';
import { buildSignage } from './facilities/signage.js';
import { buildVehicles } from './props/vehicles.js';
import { buildTools } from './props/tools.js';
import { buildParts } from './props/parts.js';
import { buildMisc } from './props/misc.js';
import { buildEngineHeat, buildWheelDust, buildGroundHeat } from './effects/heat.js';
import { buildAtmosphere } from './effects/atmosphere.js';

export function buildScene(scene) {
  const updaters = [];

  // ============ 1. 地形地貌 / 天空 ============
  const terrain = buildTerrain(scene);
  tagNoOutline(terrain.group);                       // 地表/底座不描边

  const sky = buildSky(scene);
  tagNoOutline(sky.group);                           // 天空穹顶/太阳不描边

  buildHills(scene);
  buildForest(scene);
  const haze = buildHaze(scene);
  tagNoOutline(haze);                                  // 雾带不描边

  const grass = buildGrass(scene);
  tagNoOutline(grass.group);                         // 荒草不描边（避免噪点）
  updaters.push(grass.update);

  buildRocks(scene);
  buildCrackedPatches(scene);

  // ============ 2. 跑道基建 ============
  buildRunway(scene);
  buildTaxiwayApron(scene);

  // ============ 3. 飞行主体：协和号 ============
  const concorde = buildConcorde(scene);

  // ============ 4. 建筑楼宇 ============
  const tower = buildTower(scene);
  updaters.push(tower.update);
  buildBarracks(scene);
  buildWarehouse(scene);
  buildPerimeter(scene);

  // ============ 5. 机电设施 ============
  buildSearchlights(scene);
  buildPowerPoles(scene);
  const signals = buildSignals(scene);
  updaters.push(signals.update);
  buildFuelTanks(scene);
  buildFireSafety(scene);
  buildSignage(scene);

  // ============ 6. 地勤道具 ============
  buildVehicles(scene);
  buildTools(scene);
  buildParts(scene);
  buildMisc(scene);

  // ============ 7. 动态效果 ============
  const heat = buildEngineHeat(scene, concorde.refs);
  tagNoOutline(heat.group);                          // 热浪/焰心不描边
  updaters.push(heat.update);

  const wheelDust = buildWheelDust(scene, concorde.refs);
  updaters.push((t, dt) => wheelDust.update(t, dt));

  const groundHeat = buildGroundHeat(scene);
  tagNoOutline(groundHeat.group);
  updaters.push(groundHeat.update);

  const atmosphere = buildAtmosphere(scene);
  updaters.push((t, dt) => atmosphere.update(t, dt));

  return { updaters, concorde };
}

// 递归标记不参与描边的网格
function tagNoOutline(group) {
  group.traverse((obj) => {
    if (obj.isMesh || obj.isPoints) obj.userData.noOutline = true;
  });
}
