import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const frontendRoot = join(__dirname, "..");

function readFrontend(...parts) {
  return readFileSync(join(frontendRoot, ...parts), "utf8");
}

test("research homepage no longer exposes the default task pool", () => {
  const page = readFrontend("app/research/page.tsx");

  assert.doesNotMatch(page, /\/api\/research\/tasks/);
  assert.doesNotMatch(page, /slice\(0,\s*8\)/);
  assert.match(page, /科研实战入口状态/);
  assert.match(page, /进入产业案例库/);
  assert.match(page, /window\.scrollTo\(\{ top: 0/);
  assert.match(page, /scrollTo === "evidence"/);
  assert.match(page, /scrollTo === "tasks"/);
});

test("research tutor can answer before a task is selected", () => {
  const page = readFrontend("app/research/page.tsx");
  const api = readFrontend("lib/researchApi.ts");
  const tutorRoute = readFrontend("app/api/research/tutor/route.ts");
  const service = readFileSync(join(frontendRoot, "../backend/app/services/grounded_generation_service.py"), "utf8");

  assert.doesNotMatch(page, /if \(!question \|\| !selectedTask \|\| loading\) return/);
  assert.doesNotMatch(page, /disabled=\{!selectedTask \|\| loading\}/);
  assert.doesNotMatch(page, /placeholder=\{selectedTask \? "围绕当前任务提问\.\.\." : "请先选择一个科研训练任务"\}/);
  assert.match(page, /你可以直接输入研究问题/);
  assert.match(page, /selected_task: selectedTask \|\| null/);
  assert.match(api, /selected_task\?: ResearchTaskItem \| null/);
  assert.match(api, /拆成研究方向、关键词、证据来源和可生成的训练任务/);
  assert.match(api, /产业实例/);
  assert.match(api, /哈哈哈/);
  assert.match(api, /有哪些产业案例可参考/);
  assert.match(tutorRoute, /10000/);
  assert.match(tutorRoute, /buildLocalTutorFallback/);
  assert.match(tutorRoute, /产业实例/);
  assert.match(tutorRoute, /哈哈哈/);
  assert.doesNotMatch(service, /if not selected_task:\s*\n\s*return fallback/);
});

test("local fallback tasks are tailored to case 004, 035 and 036", () => {
  const api = readFrontend("lib/researchApi.ts");

  assert.match(api, /培养细胞食品生产流程梳理/);
  assert.match(api, /食品安全性评价路径分析/);
  assert.match(api, /规模化生产与质量控制方案/);
  assert.match(api, /产业化边界与监管证据分析/);
  assert.match(api, /mRNA\/LNP 递送机制文献梳理/);
  assert.match(api, /内体逃逸与免疫反应机制解释/);
  assert.match(api, /AlphaFold DB 结构预测证据解读/);
  assert.match(api, /模型置信度与结构功能关系分析/);
});

test("generate-task route fills topic from case fields before forwarding", () => {
  const route = readFrontend("app/api/research/generate-task/route.ts");
  const api = readFrontend("lib/researchApi.ts");

  assert.match(route, /topicCandidate/);
  assert.match(route, /body\?\.case_title/);
  assert.match(route, /body\?\.core_question/);
  assert.match(route, /body\?\.caseTitle/);
  assert.match(route, /body\?\.coreQuestion/);
  assert.match(route, /case_title:/);
  assert.match(route, /core_question:/);
  assert.doesNotMatch(route, /typeof body\.topic !== "string"/);

  assert.match(api, /resolveResearchTopic/);
  assert.match(api, /params\.case_title/);
  assert.match(api, /params\.core_question/);
});

test("evidence panel shows grouped literature counts and external expansion", () => {
  const panel = readFrontend("components/EvidenceLinkPanel.tsx");

  assert.match(panel, /本地精选文献（\{localResults\.length\} 篇）/);
  assert.match(panel, /公开文献补充（\{externalResults\.length\} 篇）/);
  assert.match(panel, /当前共展示 \{allResults\.length\} 篇/);
  assert.match(panel, /已选择 \{selectedCount\} 篇参考文献/);
  assert.match(panel, /查看更多公开文献/);
  assert.match(panel, /收起公开文献/);
  assert.match(panel, /暂未检索到更多公开文献，可调整关键词后重试/);
  assert.match(panel, /检索公开文献/);
});

test("industry question aliases and showcase wording are product ready", () => {
  const data = readFrontend("data/industryCases.ts");
  const industryApi = readFrontend("lib/industryApi.ts");
  const answerRoute = readFrontend("app/api/industry/answer/route.ts");
  const casesPage = readFrontend("app/cases/page.tsx");
  const caseCard = readFrontend("components/IndustryCaseCard.tsx");

  for (const expected of [
    /"case-002": \["car-t", "cart", "嵌合抗原受体"/,
    /"case-004": \["mrna", "lnp"/,
    /"case-035": \["alphafold", "蛋白结构预测"/,
    /"case-036": \["培养细胞食品", "cultured meat", "upside"/,
  ]) {
    assert.match(data, expected);
    assert.match(industryApi, expected);
    assert.match(answerRoute, expected);
  }

  assert.doesNotMatch(casesPage, /精选案例推荐/);
  assert.doesNotMatch(casesPage, /精选案例：以下案例适合作为展示与科研训练入口/);
  assert.match(caseCard, /精选案例/);
  assert.doesNotMatch(casesPage, /优先体验|推荐演示案例/);
  assert.doesNotMatch(caseCard, /优先体验/);
  assert.doesNotMatch(answerRoute, /LLM 不可用/);
});
