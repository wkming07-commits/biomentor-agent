# 12 — 知识库数据层集成文档

## 1. 知识库目标

BioMentor Agent 知识库是一个**展示型本地知识库**，目标是：

- 为知识探索、知识图谱、渐进式思维导图、科研实战、产业案例五个核心模块提供统一的数据支撑
- 以 12 篇前沿生命科学/AI 交叉文献为锚点，构建概念-文献-工具-任务四位一体的知识网络
- 支撑展示级交互链路：搜索 → 查阅 → 加入工作台 → 生成学习路径/答辩提纲/科研任务
- **本版本不是完整生产级 RAG**，但它已经能支撑知识探索、知识图谱、科研任务和产业案例联动演示

## 2. 数据结构

### 核心类型定义 (`lib/knowledgeTypes.ts`)

| 类型 | 说明 | 关键字段 |
|------|------|----------|
| `KnowledgePaper` | 科研文献 | id, title, titleZh, venue, year, coreProblem, methodSummary, keyFinding, teachingValue, selectable, recommendedFor, defenseValue, experimentLearningValue 等 |
| `KnowledgeConcept` | 知识概念 | id, name, nameEn, category, shortDefinition, longExplanation, learningPath, commonMisunderstandings 等 |
| `KnowledgeTool` | 生物工具 | id, name, description, category, relatedConceptIds |
| `KnowledgeResearchTask` | 科研任务 | id, title, difficulty, scenario, steps, evaluationRubric 等 |
| `KnowledgeRelation` | 知识关系 | fromId, toId, type (属于/依赖/改进/应用于/解释/验证/关联文献等) |
| `KnowledgeGraphNode/Edge` | 图谱可视化 | 用于 SVG 图谱渲染 |
| `KnowledgeSearchResult` | 搜索结果 | concepts, papers, tasks, suggestionTopics |
| `SelectedPaperItem` | 已选文献 | paperId, selectedFor, note, selectedAt |
| `PaperLearningPlan` | 文献学习计划 | learningGoal, readingSteps, experimentThinking, defenseTalkingPoints |

### 数据文件

| 文件 | 内容 | 数量 |
|------|------|------|
| `data/knowledgeBase.ts` | 文献、概念、工具、任务 | 12 papers, 15 concepts, 4 tools, 8 tasks |
| `data/knowledgeRelations.ts` | 知识关系 | 45 条关系 |
| `lib/selectedPapers.ts` | 文献选择池 (localStorage) | 完整 workflow |

## 3. 文献如何入库

1. 文献以**结构化元数据**的形式存储在 `data/knowledgeBase.ts` 中
2. 每条文献包含：
   - 标准引用信息（标题、期刊、年份、方向）
   - 教学摘要（核心问题、方法概述、关键发现、教学价值、研究价值）
   - 演示支持（demoScenario, demoQuestions, discussionPrompts）
   - 选择推荐（selectable, recommendedFor, experimentLearningValue, defenseValue, readingDifficulty）
3. **不存储 PDF 全文**，不存储受版权保护的内容
4. 所有文献的 `copyrightNote` 统一标注：「仅存储元数据、教学摘要和引用信息，不在仓库中存放受版权保护的全文 PDF」

## 4. 页面如何读取知识库

| 页面 | 接入方式 | 核心功能 |
|------|----------|----------|
| `/explore` | `searchKnowledge()` | 搜索概念/文献/任务，知识卡片展示，文献选择，学习路径生成 |
| `/knowledge-map` | `buildKnowledgeGraph()` | SVG 图谱可视化，节点筛选，文献加入工作台 |
| `/knowledge-map/mindmap` | `getNodeRecommendations()` | 节点关联文献和任务推荐 |
| `/research` | `knowledgeResearchTasks`, `buildResearchTasksFromSelectedPapers()` | 预设任务卡 + 基于已选文献的自动任务生成 |
| `/cases` | `searchKnowledge()` 概念链接 | 产业案例关联知识库概念，一键跳转探索 |
| `/paper-workbench` | `selectedPapers.ts` 全部功能 | 文献管理、学习路径、答辩提纲、科研任务生成 |

## 5. 为什么不上传 PDF 全文

- 版权合规：学术论文全文受版权保护，未经授权不得分发
- 展示定位：本知识库定位为教学展示和概念验证，元数据和摘要足以支撑演示
- 轻量化：避免仓库膨胀和合规风险，保持代码仓库干净

## 6. 如何扩展到后端 RAG

当前版本为纯前端本地知识库，后续扩展路径：

1. **实时文献检索**：接入 PubMed / Semantic Scholar API，动态获取最新文献
2. **向量数据库**：将文献摘要和概念解释向量化存入 Milvus/Pinecone，实现语义检索
3. **LLM 集成**：接入 Claude/GPT，实现智能问答、文献摘要和个性化学习路径生成
4. **知识图谱扩展**：对接更多的生物医学本体（Gene Ontology, Reactome, STRING 等）
5. **用户系统**：支持多人协作、文献笔记、学习进度追踪

## 7. 如何复现

```bash
# 1. 进入前端目录
cd frontend

# 2. 安装依赖（如已安装则跳过）
npm install

# 3. 构建项目
npm run build

# 4. 启动开发服务器
npm run dev

# 5. 运行数据验证测试
node --test frontend/lib/knowledgeValidation.test.mjs
```

## 8. 演示讲解路径

### 路径 A：知识探索 + 文献工作台（推荐）

1. 打开首页 → 点击「知识探索中心」
2. 在搜索框输入「Prime editing」
3. 看到相关概念（Prime Editing、逆转录酶改造、RNA稳定元件）和相关文献（paper-002, paper-003）
4. 在「科研前沿」Tab 中，点击文献卡片上的「加入实验学习」和「加入答辩材料」
5. 切换到「课程基础」Tab，查看概念定义、学习路径、常见误区
6. 切换到「产业应用」Tab，查看演示场景和研究价值
7. 点击「已选文献」区域的「生成学习路径」和「生成答辩提纲」
8. 点击「文献工作台」链接进入 `/paper-workbench`
9. 在文献工作台中查看按用途分组的文献
10. 点击「生成实验学习路径」查看详细研读指南
11. 点击「生成答辩提纲」获得结构化答辩框架
12. 点击「生成科研任务」获得基于文献的实践训练

### 路径 B：知识图谱浏览

1. 打开「知识图谱浏览」
2. 使用筛选按钮切换：全部 / 前沿技术 / AI模型 / 实验方法 / 文献 / 应用
3. 点击节点查看详情
4. 点击 paper 类型节点，加入实验学习/答辩材料/研读清单
5. 打开「渐进式思维导图」，查看节点详情中的前沿文献推荐

### 路径 C：科研实战

1. 打开「科研实战训练营」
2. 浏览 8 个知识库驱动科研任务卡
3. 如已在知识探索中选择文献，点击「基于已选文献生成科研任务」
4. 查看自动匹配的科研任务

### 演示要点（适合老师现场看）

- **搜索验证**：分别搜索「Prime editing」「CRISPR-Cas12」「单细胞基础模型」「LNP」「TxPert」，验证返回正确结果
- **文献选择**：展示从搜索到选择到工作台的完整链路
- **学习路径**：展示基于文献自动生成的结构化学习指南
- **答辩提纲**：展示自动生成的8段式答辩框架
- **图谱可视化**：展示知识网络的全景和局部视图
