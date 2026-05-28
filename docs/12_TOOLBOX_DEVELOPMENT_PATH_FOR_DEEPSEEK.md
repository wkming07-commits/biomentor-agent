# 工具箱真实接入与 AI 对话开发路径（给 DeepSeek / Trae 执行）

> 执行要求：按本文档顺序开发；不要自由发挥；不要改首页；不要改知识图谱 / 思维导图；不要提交真实 API Key；每完成一个阶段都运行测试并 commit。

## 0. 当前代码状态

- 已拉取远端 `master`，当前最新提交：`e8e9b20`。
- 当前项目是 Next.js 14 App Router 前端，部署在 Vercel。
- 已有产业案例 AI route：`frontend/app/api/industry/answer/route.ts`，可作为服务端调用 DeepSeek 的参考。
- 已有 DeepSeek 环境变量模板：`frontend/.env.example`。

重点现状：

| 文件 | 现状 | 本次目标 |
|---|---|---|
| `frontend/app/tools/protein/page.tsx` | 本地精选蛋白搜索，自动选首项，右侧静态解释 | 任意蛋白搜索，候选手动选择，右侧 AI 对话 |
| `frontend/app/tools/plasmid/page.tsx` | 经典质粒和上传已有雏形，右侧静态解释 | 保留图谱，强化上传状态，右侧 AI 对话 |
| `frontend/app/tools/sequence/page.tsx` | DNA 分析为主，右侧静态解释 | 支持上传和蛋白分析，右侧 AI 对话 |
| `frontend/app/tools/pathway/page.tsx` | 本地通路下拉筛选，右侧静态解释 | 本地教学通路 + Reactome 候选搜索，右侧 AI 对话 |
| `frontend/lib/biotools.mjs` | 工具纯函数和示例数据 | 扩展序列、质粒、通路、搜索辅助函数 |
| `frontend/lib/biotools.test.mjs` | 现有纯函数测试 | 先补测试，再实现 |

## 1. 绝对禁止事项

1. 不准把真实 DeepSeek API Key 写入代码、文档、commit、GitHub。
2. 前端页面不准直接请求 DeepSeek；必须走 Next.js 服务端 route。
3. 公共页面不准显示：`API`、`fallback`、`backend`、`后端`、`route`、`key`、`环境变量`、`DEEPSEEK`、`stack trace` 等开发者信息。
4. 不准删除现有可用工具功能。
5. 不准新增大型依赖；优先使用现有 React / Next.js / Tailwind / 3Dmol CDN / Cytoscape CDN。
6. AI 不准输出医疗建议、临床建议、未经验证的湿实验 SOP。
7. AI 不准编造当前工具结果里不存在的结构、元件、位点、ORF、通路关系。

## 2. 环境变量

本地只放在 `frontend/.env.local`：

```env
DEEPSEEK_API_KEY=<真实 key>
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
```

Vercel Project Settings 里也配置同样变量。`.env.example` 只能保留 placeholder。

## 3. 新增文件

必须新增：

1. `frontend/lib/tool-ai-types.ts`  
   四个工具通用 AI 请求、响应、上下文和消息类型。

2. `frontend/components/BioMentorToolChat.tsx`  
   四个工具右侧复用的 BioMentor AI 对话框。

3. `frontend/app/api/ai/tool-chat/route.ts`  
   DeepSeek 服务端代理，保护 API Key。

4. `frontend/app/api/bio-tools/protein/search/route.ts`  
   蛋白真实搜索和候选归一化。

5. `frontend/app/api/bio-tools/pathway/search/route.ts`  
   通路候选搜索和归一化。

## 4. 开始前检查

```powershell
& 'C:\Users\M\AppData\Local\Programs\Git\cmd\git.exe' pull --rebase --autostash origin master
cd frontend
npm install
node --test .\lib\biotools.test.mjs
npm run build
```

基线失败就先修基线。建议新建分支：

```powershell
& 'C:\Users\M\AppData\Local\Programs\Git\cmd\git.exe' checkout -b codex/toolbox-real-ai-integration
```

## 5. 阶段一：先补纯函数测试

修改 `frontend/lib/biotools.test.mjs`，先写失败测试：

1. `sanitizeSequence(">seq1\n1 atg gcc 2\nGAATTC")` 应得到 `ATGGCCGAATTC`。
2. `findRestrictionSites("GCGGCCGCGTCGACGAATTC")` 应检测：
   - NotI 位置 1
   - SalI 位置 9
   - EcoRI 位置 15
3. 新增 `calculateProteinStats` 测试：
   - 输入 `MKWVTFISLLFLFSSAYSRGVFRRDTHKSEIAHRFKDLGE`
   - `length === 42`
   - `molecularWeight > 4000`
   - `hydrophobicPercent > 0`
   - `invalidCount === 0`
4. 新增 `detectPlasmidInputKind` 测试：
   - `LOCUS + FEATURES` -> `genbank`
   - `>seq\nATGC` -> `fasta`
   - `ATGCATGC` -> `raw-sequence`
5. 新增 `matchLocalPathway` 测试：
   - `MAPK` -> `mapk`
   - `glycolysis` -> `glycolysis`
   - `EGFR` -> `mapk`

运行：

```powershell
cd frontend
node --test .\lib\biotools.test.mjs
```

此时应失败，证明先写测试。

## 6. 阶段二：实现 biotools 纯函数

修改 `frontend/lib/biotools.mjs`：

1. 更新 `sanitizeSequence`：
   - 删除 FASTA header 行；
   - 转大写；
   - 删除空格、换行、数字；
   - 删除非字母和 `*` 字符。

2. 新增 `calculateProteinStats(input)`：
   - 返回 `sequence`、`length`、`invalidCount`、`composition`、`molecularWeight`、`hydrophobicPercent`；
   - 只统计 20 种标准氨基酸；
   - 疏水氨基酸集合：`A,V,I,L,M,F,W,Y,P`；
   - 粗略分子量即可，不做结构预测。

3. 扩展 `findRestrictionSites` 酶列表：
   - EcoRI `GAATTC`
   - BamHI `GGATCC`
   - HindIII `AAGCTT`
   - XhoI `CTCGAG`
   - NdeI `CATATG`
   - NotI `GCGGCCGC`
   - SalI `GTCGAC`

4. 新增 `detectPlasmidInputKind(text)`：
   - `empty`
   - `genbank`
   - `fasta`
   - `raw-sequence`
   - `unknown`

5. 改进 `parseGenBankFeatures`：
   - qualifier 支持未加引号；
   - 保持 `label/gene/product/note`；
   - 没解析到 feature 时仍返回 `uploaded sequence`。

6. 新增 `matchLocalPathway(query)`，别名表：
   - `cell-cycle`：cell cycle、细胞周期、p53、p21、cdk、cyclin
   - `apoptosis`：apoptosis、凋亡、bax、bcl2、caspase
   - `mapk`：mapk、egfr、erk、mek、ras、raf、rtk
   - `glycolysis`：glycolysis、糖酵解、glucose、pyruvate、atp
   - `dna-repair`：dna repair、dna修复、dna 修复、brca、atm、atr、chk

同步更新 `frontend/lib/biotools.mjs.d.ts`。

验证：

```powershell
cd frontend
node --test .\lib\biotools.test.mjs
```

通过后 commit：

```powershell
& 'C:\Users\M\AppData\Local\Programs\Git\cmd\git.exe' add frontend/lib/biotools.mjs frontend/lib/biotools.mjs.d.ts frontend/lib/biotools.test.mjs
& 'C:\Users\M\AppData\Local\Programs\Git\cmd\git.exe' commit -m "test: extend toolbox utility coverage"
```

## 7. 阶段三：统一 AI 类型与服务端 route

### 7.1 创建 `frontend/lib/tool-ai-types.ts`

导出：

- `BioToolName = "protein" | "plasmid" | "sequence" | "pathway"`
- `ToolAiMode = "initial" | "question"`
- `ToolChatMessage`
- `ToolContextSummary`
- `ToolAiRequest`
- `ToolAiResponse`

`ToolContextSummary` 必须包含：

- `title`
- `subtitle?`
- `sourceLabel?`
- `selectedItemLabel?`
- `facts: {label,value}[]`
- `highlights: string[]`
- `warnings?: string[]`

### 7.2 创建 `frontend/app/api/ai/tool-chat/route.ts`

要求：

1. 只接受 POST。
2. 校验 `tool`、`mode`、`context.title`。
3. `mode === "question"` 时 question 必填。
4. 读取 `DEEPSEEK_API_KEY`、`DEEPSEEK_BASE_URL`、`DEEPSEEK_MODEL`。
5. 没有 key 时返回 HTTP 200 和友好回答：  
   “我暂时无法生成智能讲解。你仍然可以先查看左侧的结构化分析结果。”
6. 调用 DeepSeek 时使用服务端 fetch。
7. 参考 `frontend/app/api/industry/answer/route.ts` 的 JSON 提取方式。
8. 返回前端的 JSON 固定为：

```json
{
  "answer": "中文回答",
  "quickQuestions": ["问题1", "问题2"],
  "disclaimer": "本回答用于课程学习和科研训练，不构成医疗、临床或未经验证的实验操作建议。"
}
```

System prompt 必须约束：

- 使用中文；
- 面向学生解释；
- 只基于当前工具上下文；
- 不确定就说明不确定；
- 不输出医疗建议和未经验证的湿实验 SOP；
- 不暴露 API、模型、环境变量、服务器、fallback、调试日志；
- 输出纯 JSON。

验证：

```powershell
cd frontend
npm run build
```

commit：

```powershell
& 'C:\Users\M\AppData\Local\Programs\Git\cmd\git.exe' add frontend/lib/tool-ai-types.ts frontend/app/api/ai/tool-chat/route.ts frontend/.env.example
& 'C:\Users\M\AppData\Local\Programs\Git\cmd\git.exe' commit -m "feat: add toolbox ai chat route"
```

## 8. 阶段四：共用 AI 对话框组件

创建 `frontend/components/BioMentorToolChat.tsx`。

Props：

- `tool`
- `title`
- `context`
- `contextKey`
- `emptyState`
- `quickQuestions`
- `autoGenerate?`

内部状态：

- `messages`
- `input`
- `isLoading`
- `errorText`
- `initialCacheRef: Map<contextKey, messages>`

行为：

1. `context` 存在且 `contextKey` 变化时，自动请求 `/api/ai/tool-chat`，`mode=initial`。
2. 如果同一个 `contextKey` 已经生成过初始讲解，直接用缓存。
3. 用户发送文本或点击快捷问题时，请求 `mode=question`。
4. 失败时显示友好消息，不显示技术错误。

视觉：

- 外层：`liquid-card p-5 xl:sticky xl:top-24 h-fit`
- 标题：`BioMentor AI` + 工具助手名
- assistant 气泡：白色半透明
- user 气泡：深色
- 快捷问题：小圆角按钮
- 底部输入框 + 发送按钮

验证并 commit：

```powershell
cd frontend
npm run build
& 'C:\Users\M\AppData\Local\Programs\Git\cmd\git.exe' add frontend/components/BioMentorToolChat.tsx
& 'C:\Users\M\AppData\Local\Programs\Git\cmd\git.exe' commit -m "feat: add shared toolbox ai chat panel"
```

## 9. 阶段五：蛋白工具

### 9.1 新增搜索 route

创建 `frontend/app/api/bio-tools/protein/search/route.ts`。

`GET /api/bio-tools/protein/search?query=...`

候选字段：

- `id`
- `label`
- `geneName`
- `accession`
- `pdbId`
- `organism`
- `reviewed`
- `sourceKind`: `experimental | predicted | metadata-only`
- `sourceLabel`
- `confidence`
- `teachingFocus`
- `structureUrl`
- `alphaFoldUrl`
- `alphaFoldApiUrl`
- `uniprotUrl`
- `rcsbUrl`
- `matchType`

搜索逻辑：

1. PDB ID：直接返回 RCSB PDB 候选，结构 URL 为 `https://files.rcsb.org/download/{PDB}.pdb`。
2. UniProt accession：请求 `https://rest.uniprot.org/uniprotkb/{ACCESSION}.json`，提取名称、基因、物种、reviewed、PDB 交叉引用。
3. 普通关键词：请求 UniProt search，字段包含 accession、id、protein_name、gene_names、organism_name、reviewed、xref_pdb。
4. 排序：reviewed 优先、人类优先、有 PDB 优先、有 AlphaFold 优先。
5. 失败时返回友好空候选，不暴露错误。

### 9.2 修改蛋白页面

`frontend/app/tools/protein/page.tsx`：

- 搜索走 `/api/bio-tools/protein/search`。
- 搜索后只显示候选，不自动选首项。
- 用户点击候选后才加载结构。
- `metadata-only` 显示“暂未找到可直接显示的结构”的用户文案。
- 右侧替换为 `BioMentorToolChat`。

AI context：

- title：蛋白名
- subtitle：基因名 + 物种
- facts：UniProt、PDB、物种、结构来源、Reviewed
- highlights：teachingFocus
- warnings：预测结构时提示置信度需谨慎理解

验证：

- 搜 `GFP`：出现候选，不自动加载。
- 点击 GFP：结构和 AI 初始讲解出现。
- 搜 `4HHB`：PDB 候选可加载。
- 搜 `EGFR`：UniProt 候选出现。

commit：

```powershell
& 'C:\Users\M\AppData\Local\Programs\Git\cmd\git.exe' add frontend/app/api/bio-tools/protein/search/route.ts frontend/app/tools/protein/page.tsx frontend/lib/biotools.mjs frontend/lib/biotools.mjs.d.ts frontend/lib/biotools.test.mjs
& 'C:\Users\M\AppData\Local\Programs\Git\cmd\git.exe' commit -m "feat: connect protein search and ai tutor"
```

## 10. 阶段六：质粒工具

修改 `frontend/app/tools/plasmid/page.tsx`。

要求：

1. 可选新增 `pcDNA3.1` 教学示例。
2. 使用 `detectPlasmidInputKind` 区分 GenBank / FASTA / raw / unknown。
3. 保留中间环形图谱、元件列表、当前元件本地解释。
4. 右侧替换为 `BioMentorToolChat`。
5. 选择质粒后自动生成 AI 初始讲解。
6. 点击元件只更新本地解释和上下文，不自动反复调用 AI。

AI context：

- title：质粒名或上传文件名
- subtitle：长度 + 上传类型
- facts：长度、宿主、元件数、当前元件
- highlights：示例说明或上传文件名 + 当前元件解释
- warnings：FASTA/raw 时提示无功能注释，不能推断 ori、抗性基因、promoter

验证：

- pET-28a 显示 T7 promoter、His-tag、KanR、ori。
- 点击 KanR，本地解释更新。
- 上传 FASTA，只显示未注释质粒环。
- 上传 GenBank，解析 FEATURES。

commit：

```powershell
& 'C:\Users\M\AppData\Local\Programs\Git\cmd\git.exe' add frontend/app/tools/plasmid/page.tsx frontend/lib/biotools.mjs frontend/lib/biotools.mjs.d.ts frontend/lib/biotools.test.mjs
& 'C:\Users\M\AppData\Local\Programs\Git\cmd\git.exe' commit -m "feat: add plasmid ai tutor and upload states"
```

## 11. 阶段七：序列工具

修改 `frontend/app/tools/sequence/page.tsx`。

要求：

1. 支持上传 `.fa/.fasta/.txt`。
2. 使用 `calculateProteinStats`。
3. 区分核酸和蛋白：
   - 核酸显示 bp、GC%、ORF、酶切、引物；
   - 蛋白显示 aa、粗略分子量、疏水性比例、氨基酸组成。
4. 蛋白输入时不要显示误导性的 DNA 转录、反向互补、翻译、ORF、酶切、引物结果。
5. 右侧替换为 `BioMentorToolChat`。

AI context 核酸版：

- 类型、长度、GC%、ORF 数量、检出的酶切位点。

AI context 蛋白版：

- 类型、长度、粗略分子量、疏水性比例。
- highlight 提示结构预测请使用蛋白结构查看器。

验证：

- 粘贴含 `GAATTC/GCGGCCGC/GTCGAC` 的 DNA，EcoRI/NotI/SalI 被检测。
- 粘贴蛋白序列，显示蛋白统计。
- 上传 FASTA，header 被清理。

commit：

```powershell
& 'C:\Users\M\AppData\Local\Programs\Git\cmd\git.exe' add frontend/app/tools/sequence/page.tsx frontend/lib/biotools.mjs frontend/lib/biotools.mjs.d.ts frontend/lib/biotools.test.mjs
& 'C:\Users\M\AppData\Local\Programs\Git\cmd\git.exe' commit -m "feat: enhance sequence analysis and ai tutor"
```

## 12. 阶段八：通路工具

### 12.1 新增搜索 route

创建 `frontend/app/api/bio-tools/pathway/search/route.ts`。

`GET /api/bio-tools/pathway/search?query=...`

逻辑：

1. 校验 query。
2. 先用 `matchLocalPathway(query)` 找本地教学通路。
3. 命中本地通路时，把本地候选放第一位。
4. 请求 Reactome：`https://reactome.org/ContentService/search/query?query=<query>&species=Homo%20sapiens&pageSize=8`
5. 归一化候选字段：
   - id
   - name
   - species
   - source：local/reactome
   - description
   - localKey
   - reactomeUrl
6. Reactome 失败时仍返回本地候选，不暴露错误。

### 12.2 修改通路页面

`frontend/app/tools/pathway/page.tsx`：

- 搜索框请求新 route。
- 显示候选列表。
- local 候选标记“教学图谱”。
- Reactome 候选标记“公共候选”。
- 点击 local：渲染 Cytoscape 本地图。
- 点击 Reactome-only：显示详情卡，不强行画复杂图。
- 保留节点/边点击、高亮、学习路径、思维导图入口。
- 右侧替换为 `BioMentorToolChat`。

Reactome-only 文案：

“该候选来自公共通路数据库，当前先展示候选详情与 AI 机制解释；若需要高质量教学图，请选择内置精选通路。”

AI context：

- title：通路名
- subtitle：物种或 focus
- sourceLabel：精选教学图谱 / 公共通路候选
- selectedItemLabel：当前节点 / 当前边 / 整体通路
- facts：通路、当前选择、学习重点
- warnings：Reactome-only 时提示尚未整理为教学图谱

验证：

- 搜 `EGFR`：MAPK 本地候选靠前。
- 选择 MAPK：图谱渲染。
- 点击 ERK：上下游高亮。
- 点击 MEK -> ERK：关系解释更新。
- 搜 `apoptosis`：本地凋亡通路可用。
- 搜罕见词：公共候选详情不崩溃。

commit：

```powershell
& 'C:\Users\M\AppData\Local\Programs\Git\cmd\git.exe' add frontend/app/api/bio-tools/pathway/search/route.ts frontend/app/tools/pathway/page.tsx frontend/lib/biotools.mjs frontend/lib/biotools.mjs.d.ts frontend/lib/biotools.test.mjs
& 'C:\Users\M\AppData\Local\Programs\Git\cmd\git.exe' commit -m "feat: add pathway search and ai tutor"
```

## 13. 统一 UI 检查

四个工具右侧必须统一：

- BioMentor AI
- 蛋白结构助手 / 质粒实验助手 / 序列分析助手 / 通路机制助手
- 自动初始讲解
- 快捷问题
- 用户追问

搜索公开页面开发者词：

```powershell
cd frontend
Select-String -Path .\app\tools\**\*.tsx,.\components\BioMentorToolChat.tsx -Pattern "fallback|API|api|route|backend|后端|接口错误|环境变量|DEEPSEEK|key|Key|stack|trace"
```

如果匹配出现在用户可见文案里，必须改掉。

## 14. 最终测试

```powershell
cd frontend
node --test .\lib\biotools.test.mjs
npm run build
npm run dev
```

手动打开：

- `http://localhost:3000/tools/protein`
- `http://localhost:3000/tools/plasmid`
- `http://localhost:3000/tools/sequence`
- `http://localhost:3000/tools/pathway`

验收矩阵：

| 页面 | 测试 | 预期 |
|---|---|---|
| Protein | 搜 GFP | 出现候选，不自动加载 |
| Protein | 点 GFP | 结构 + AI 初始讲解 |
| Protein | 搜 4HHB | PDB 候选可加载 |
| Protein | 搜 EGFR | UniProt 候选出现 |
| Plasmid | 选 pET-28a | 图谱 + AI 初始讲解 |
| Plasmid | 点 KanR | 本地元件解释更新 |
| Plasmid | 上传 FASTA | 未注释质粒环，不伪造元件 |
| Sequence | 粘贴含 GAATTC/GCGGCCGC/GTCGAC 的 DNA | EcoRI/NotI/SalI 检出 |
| Sequence | 粘贴蛋白 | 显示蛋白统计 |
| Pathway | 搜 EGFR | MAPK 教学候选靠前 |
| Pathway | 点 ERK | 上下游高亮，AI context 更新 |
| Pathway | 搜罕见词 | 公共候选详情不崩溃 |

## 15. 部署

push 分支：

```powershell
& 'C:\Users\M\AppData\Local\Programs\Git\cmd\git.exe' push -u origin codex/toolbox-real-ai-integration
```

合并到 master 后，Vercel 配置环境变量并部署。

公网检查：

- `https://frontend-eta-nine-7rvsekcz80.vercel.app/tools/protein`
- `https://frontend-eta-nine-7rvsekcz80.vercel.app/tools/plasmid`
- `https://frontend-eta-nine-7rvsekcz80.vercel.app/tools/sequence`
- `https://frontend-eta-nine-7rvsekcz80.vercel.app/tools/pathway`

## 16. 完成标准

1. 四个工具右侧都换成 BioMentor AI 对话框。
2. 选择/分析对象后自动生成第一条讲解。
3. 支持快捷问题和追问。
4. DeepSeek Key 只存在 `.env.local` 和 Vercel 环境变量。
5. 蛋白工具能真实查 UniProt/RCSB/AlphaFold。
6. 质粒工具不伪造 FASTA 注释。
7. 序列工具能处理 DNA/RNA/Protein。
8. 通路工具能查本地教学图谱和公共候选。
9. `node --test frontend/lib/biotools.test.mjs` 通过。
10. `npm run build` 通过。
11. 公网部署可访问。

## 17. 给 DeepSeek / Trae 的启动提示词

```text
你现在在 BioMentor Agent 项目中执行工具箱真实接入任务。请严格阅读并执行 docs/12_TOOLBOX_DEVELOPMENT_PATH_FOR_DEEPSEEK.md。不要自由发挥，不要改首页，不要改知识图谱/思维导图，不要提交真实 API Key。每完成一个 major task 都运行文档中的测试命令并 commit。当前目标是：四个工具箱页面接入真实搜索/解析能力，并统一右侧 BioMentor AI 对话框。请先从 Task 0 和 Task 1 开始，先写测试，再实现。
```
