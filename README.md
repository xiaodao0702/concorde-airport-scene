# 协和号起飞 · 苏联重工业军用机场微缩景观（Three.js）

纯正苏式重工业二次元三渲二微缩三维场景：白日高远晴空下，协和号超音速客机在冷战风格军用干线机场跑道上起飞离地。

## 特性
- 第三人称自由观景：拖拽旋转、360° 环绕、无极缩放，无任何 UI/弹窗干扰
- 三渲二卡通渲染 + 硬朗轮廓描边 + 电影级硬光
- 完整模块化架构：飞机、跑道、建筑、机电设施、地勤道具、地形地貌独立模块
- 协和号起飞动态：引擎热浪、地面扬尘、荒草倒伏、航灯频闪、高空光效
- 微缩军事模型收藏质感，低饱和冷调复古配色

## 运行
本地 HTTP 服务打开 index.html（模块化 ES Modules，需 http 环境）：

    npx serve .
    # 或 python -m http.server

## 目录结构
- src/ — 场景模块（aircraft / runway / buildings / facilities / props / terrain / effects / post / utils）
- js/ — three.js 本地依赖
- previews/ — 渲染预览图
- docs/ — 布局方案文档

## 输出约束
全部模型独立建模、独立渲染，不合并网格、不简化细节；材质为 MeshToonMaterial / MeshPhysicalMaterial / MeshBasicMaterial。
