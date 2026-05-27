# BioMentor Agent 进度日志

## 当前版本（commit `df0cacc`）

### 状态
- **构建**: ✅ Next.js 14.2.35, 15 页 0 错误
- **部署**: ✅ https://frontend-eta-nine-7rvsekcz80.vercel.app
- **动画**: 纯 CSS keyframes，无 GSAP 依赖
- **后端**: 无后端代码（此版本为纯前端静态展示）

### 前端结构
```
frontend/
  app/
    page.tsx                    — 首页
    layout.tsx                  — 根布局
    globals.css                 — 全局样式 + 玻璃设计系统
    explore/page.tsx            — 知识探索中心
    research/page.tsx           — 科研实战训练营
    cases/page.tsx              — 产业案例库
    knowledge-map/page.tsx      — 知识图谱浏览
    seminar/page.tsx            — 学术研讨
    assessment/page.tsx         — 智能测评中心
    diagnosis/page.tsx          — 学习诊断仪表盘
    timeline/page.tsx           — 学习轨迹时间线
    wrong-questions/page.tsx    — 错题本
    tools/page.tsx              — 生物工具箱入口
    tools/protein/page.tsx      — 蛋白结构 3D 查看
    tools/plasmid/page.tsx      — 质粒图谱绘制
    tools/sequence/page.tsx     — 序列分析工具
    tools/pathway/page.tsx      — 通路图谱浏览
  components/
    Navbar.tsx                  — 顶栏毛玻璃导航
    HeroCanvas.tsx              — Canvas 2D 粒子背景
    CountUp.tsx                 — 数字滚动计数器
```

### 设计系统
- **色彩**: 流光玻璃 — surface/canvas 渐变背景, brand-ink/muted/faint 文字, accent-electric/cyan/amber/rose 强调
- **组件类**: glass-card, glass-nav, glass-card-iridescent, btn-hero, btn-hero-secondary, badge-*
- **字体**: Plus Jakarta Sans (font-body), Orbitron/Clash Display 变体 (font-display), JetBrains Mono (font-mono)
- **动画**: animate-reveal-up (淡入上移), animate-scale-in (缩放淡入), animate-float (漂浮)

### 已知问题
- HeroCanvas Canvas 2D 粒子在快速滚动时偶尔出现 negative radius 错误（浏览器处理 `Math.random()` 边界情况），不影响功能
- 工具页面为静态展示，未接入后端 API

---

## 2026-05-26 会话

### 完成的工作
- 已将源项目 12 个文件从 `D:\anti2sys\ppiflow_project\biomentor-agent-trae-handoff` 复制到 `D:\BioMentor Agent`
- 已完整阅读所有项目交接文档，深入理解项目需求
- 已深度研读 25单元调研报告 PDF（22页），掌握完整25个功能单元细节
- 已创建规划三件套 (task_plan.md, findings.md, progress.md)，含5阶段路线图
- 已创建 frontend/ Next.js 项目骨架（31个文件：7教师页+6学生页+5组件+配置）
- 已创建 backend/ FastAPI 项目骨架（33个文件：9模型+9路由+7 schema+配置）
- 后续完成全站重构为统一 14 页 BioMentor Agent，流光玻璃视觉

## 2026-05-27 会话：任务 1-2 清单整理

- 新增 `docs/10_TOOLBOX_MINDMAP_CHECKLIST.md`。
- 汇总任务 1「四个工具确认完善好」验收清单。
- 汇总任务 2「思维导图模块」设计与验收清单。
- 下一步进入任务 3「整体前端美化」方案讨论。

## 2026-05-28 会话：三个任务详细总清单

- 新增 `docs/11_THREE_TASKS_DETAILED_PLAN.md`。
- 汇总任务 1「四个生物工具确认完善」：蛋白搜索、质粒图谱、序列分析、通路图谱。
- 汇总任务 2「思维导图模块」：归入知识图谱模块，渐进展开式 BioMind Map，与四个工具联动。
- 汇总任务 3「首页与整体前端视觉升级」：浅色液态玻璃风格、首页 Hero、六宫格入口、知识点展开示例、产品价值区、导航去掉开始测评。
- 明确全局原则：不改变 6 个主功能模块，不把四个工具作为全站主线，不展示开发者/API/fallback 信息。

## 2026-05-28 会话：三个任务实施完成

- 已同步远端 `origin/master` 到 `0cdf8db`，包含合作者产业案例模块提交。
- 任务 1：四个生物工具完成前端增强：
  - 蛋白结构查看器支持候选搜索、PDB/UniProt/精选示例选择、用户化结构解释。
  - 质粒图谱支持经典质粒、GenBank/FASTA 上传、元件点击高亮与教学解释。
  - 序列分析支持类型识别、DNA→RNA、反向互补、翻译、ORF、酶切位点高亮、引物检查。
  - 通路图谱支持节点/边点击解释、上下游高亮、推荐学习路径与思维导图入口。
- 任务 2：新增 `frontend/app/knowledge-map/mindmap/page.tsx` 和 `frontend/lib/mindmap-data.ts`，实现渐进展开式 BioMind Map，并从知识图谱页提供入口。
- 任务 3：重做首页为浅色液态玻璃风格；导航改为左 Logo + 中间 6 导航 + 右侧留空，并移除“开始测评”。
- 验证：`node --test frontend/lib/biotools.test.mjs` 通过 11/11；`npm run build` 通过；本地生产服务 smoke 检查 `/`、四个工具页、`/knowledge-map/mindmap` 均返回 200 且 H1 正常。
