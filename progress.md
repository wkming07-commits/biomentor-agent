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

## 2026-05-29 会话：工具箱 AI 与知识图谱工作台集成

- 已保留 DeepSeek 本地工具箱分支 `feature/toolbox-ai-deepseek`，从其提交 `acdc273` 新建集成分支 `codex/knowledge-map-toolbox-integration`。
- 已合并最新 `origin/master`，包含合作者上传的知识探索相关页面与 API。
- 已重做 `/knowledge-map`：
  - 首屏为浅色液态玻璃风格的 12 学科生命科学知识星图。
  - 点击学科后平滑进入三栏工作台：左侧学科导航、中间渐进展开图谱、右侧 BioMentor AI 对话栏。
  - 5 个重点学科深做：分子生物学、细胞生物学、结构生物学、合成生物学、生物信息学。
  - 其他 7 个学科保持中等完整度，不做空壳。
  - 节点支持六维展开：生物大类、基础知识、科研前沿、产业应用、代表文献、学习任务。
  - 右侧 AI 支持教学导师 / 科研助手双模式，点击节点自动生成解释，模式切换自动重生成。
- 新增 `/api/ai/knowledge-chat`，使用 `DEEPSEEK_API_KEY` 与 `DEEPSEEK_MODEL=deepseek-v4-flash`，未写入真实 key。
- 修复远端合作者代码的构建问题：
  - TypeScript target 从 ES2017 调整到 ES2018，支持现有正则 dotAll flag。
  - `explore/page.tsx` 中 `new Image()` 改为 `new window.Image()`，避免 lucide `Image` 命名冲突。
- 验证：
  - `node --test frontend/lib/*.test.mjs` 通过 22/22。
  - `npm run build` 通过。
  - 本地生产服务 smoke 检查 `/`、`/knowledge-map`、四个工具页、`/explore` 均返回 200。
  - 浏览器验证 `/knowledge-map`：可进入结构生物学工作台、展开科研前沿、选择 AlphaFold、右栏 AI 显示解释和蛋白结构工具入口；控制台错误 0。

## 2026-05-29 会话：累积修改清单记录

- 新增 `docs/13_ACCUMULATED_FIXES_AND_DISCUSSION_QUEUE.md`。
- 记录当前反馈中的两类核心问题：
  - 工具箱与知识图谱 AI 可能未真实调用 DeepSeek，或失败后被本地 fallback 掩盖，导致追问答非所问。
  - 知识图谱首屏视觉仍不合格：图谱与文字重叠、节点排布缺少构图、虚线/直线过多且不高级。
- 明确后续先继续讨论，不立即开发；待所有任务讨论完成后统一实现、测试、提交和部署。
- 追加低优先级问题：知识图谱页面当前有一定卡顿，后续重做视觉时若成本低则顺手优化，重点关注 SVG 线条、大面积 blur/backdrop-blur、GSAP/ScrollTrigger 重复刷新等渲染开销。
- 追加模拟学术答辩模块设计草案：
  - 方向确定为科研开题 / 论文答辩训练器。
  - 核心对象为 `Defense Brief` 答辩资料包。
  - 支持站内模块导入与 PDF/DOCX/PPT/PPTX 上传。
  - 第一版不长期保存原文件，只保存资料包、答辩过程和报告。
  - 答辩前用户可编辑 AI 生成的资料包。
  - 默认 5 轮、标准难度；支持 3/5/8 轮与基础/标准/挑战难度。
- 答辩过程反馈策略确定为 B：
  - 答辩过程中只显示评委追问，不显示详细评分与缺失点。
  - 每轮内部仍保存结构化评价，用于最终闭环报告。
  - 最终报告走闭环报告：六维评分、评委反馈、知识盲区、模块联动推荐、下一轮主题。
- 答辩提问风格确定与难度绑定：
  - 基础 = 温和导师型。
  - 标准 = 标准答辩型。
  - 挑战 = 严格评审型。
- 范围控制更新：
  - 不做单独“答辩准备阶段”。
  - 用户确认 `Defense Brief` 后直接开始答辩。
  - 答辩模块保持为六大模块之一，不扩展成过重的独立答辩平台。
- 已在 `docs/13_ACCUMULATED_FIXES_AND_DISCUSSION_QUEUE.md` 中新增“统一开发任务清单（待讨论完成后执行）”，详细拆分：
  - 真实 AI 接入与追问逻辑。
  - 四个工具 AI 面板统一。
  - 蛋白搜索增强。
  - 知识图谱首屏视觉重做。
  - 知识图谱性能优化。
  - 知识图谱三栏工作台优化。
  - 模拟学术答辩模块。
  - 站内模块接入答辩入口。
  - 最终测试与部署流程。

## 2026-05-29 会话：AI、知识图谱与答辩模块系统开发完成

- 修复工具箱与知识图谱 AI 追问逻辑：
  - 工具箱 AI 请求携带最近对话历史。
  - DeepSeek 正常响应标记为 `deepseek`，本地兜底标记为 `local_fallback`，前端不展示开发者术语。
  - 本地兜底不再重复初始模板，针对胃蛋白酶活性 pH 等追问可直接回答关键事实。
  - 知识图谱 chat prompt 明确优先回答最新用户问题，再结合节点上下文解释。
- 增强蛋白搜索：
  - 直接输入 curated UniProt accession（如 P00790）时保留实验结构 PDB 信息。
  - “胃蛋白酶”等中文查询可返回 Pepsin A、P00790、1PSO，并避免退回无关演示。
- 重做知识图谱体验：
  - 首屏图谱限定在右侧沉浸主视觉区，避免与标题文案重叠。
  - 默认减少常驻线条噪声，改为柔和曲线光轨，hover/选中时突出相关关系。
  - 移除知识图谱页 GSAP/ScrollTrigger 运行依赖，构建包从约 64.9 kB 降至约 20.5 kB。
  - 三栏工作台保留渐进展开、AI 对话和“带入答辩”入口。
- 实现 `/seminar` 科研开题 / 论文答辩训练器：
  - 支持手动粘贴与 PDF/DOCX/PPT/PPTX/TXT/MD 导入。
  - 新增 `Defense Brief` 生成、编辑、确认流程。
  - 支持基础/标准/挑战难度与 3/5/8 轮文字答辩。
  - 答辩中只显示评委问题与用户回答，最终生成六维评分、薄弱点、模块推荐和下一轮主题。
  - 新增 `/api/ai/defense/brief`、`/next-question`、`/report`，统一 DeepSeek + 本地兜底路径。
- 完成主要模块入口联动：
  - 知识图谱、科研实战、产业案例、蛋白/质粒/序列/通路工具均可带入模拟答辩。
- 验证：
  - `node --test frontend/lib/*.test.mjs` 通过 33/33。
  - `npm run build` 通过，生成 32 个静态/动态页面。
  - 本地生产服务检查 `/knowledge-map`、`/tools/protein`、`/tools/plasmid`、`/tools/sequence`、`/tools/pathway`、`/seminar` 均返回 200。
  - 浏览器验证上述 6 页 H1 正常、控制台错误 0；知识图谱可进入工作台；答辩页可生成 Defense Brief。
