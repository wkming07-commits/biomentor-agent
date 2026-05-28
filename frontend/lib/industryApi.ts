import type { IndustryCase, IndustryAnswer } from "@/data/industryCases";
import { industryCases as mockCases, getMockAnswer } from "@/data/industryCases";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

/**
 * 获取所有产业案例
 *
 * TODO: 后期接入真实API
 *  - GET /api/industry/cases
 *  - 返回 IndustryCase[]
 *  - 支持分页、排序、筛选
 */
export async function fetchIndustryCases(): Promise<IndustryCase[]> {
  // TODO: 替换为真实 API 调用
  // const data = await apiFetch<IndustryCase[]>("/api/industry/cases");
  // if (data) return data;
  return mockCases;
}

/**
 * 搜索产业案例
 *
 * TODO: 后期接入真实API
 *  - GET /api/industry/cases/search?q=xxx
 *  - 支持全文搜索、关键词匹配
 */
export async function searchIndustryCases(query: string): Promise<IndustryCase[]> {
  // TODO: 替换为真实 API 调用
  // const data = await apiFetch<IndustryCase[]>(`/api/industry/cases/search?q=${encodeURIComponent(query)}`);
  // if (data) return data;
  const lower = query.toLowerCase();
  return mockCases.filter(
    (c) =>
      c.title.toLowerCase().includes(lower) ||
      c.industryDirection.toLowerCase().includes(lower) ||
      c.relatedKnowledgePoints.some((k) => k.toLowerCase().includes(lower)) ||
      c.recommendedKeywords.some((k) => k.toLowerCase().includes(lower)),
  );
}

/**
 * 获取产业综合问答
 *
 * 优先调用服务端 API Route (POST /api/industry/answer)
 * 如果 API Key 未配置或请求失败，自动 fallback 到本地 mock
 *
 * 后续可升级为 RAG 架构：
 *  - PubMed / NCBI E-utilities：文献检索
 *  - 后端向量数据库（Milvus/Pinecone）：语义检索
 *  - LLM + RAG：生成带来源引用的回答
 */
export async function getIndustryAnswer(query: string): Promise<IndustryAnswer> {
  try {
    const response = await fetch("/api/industry/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    if (response.ok) {
      const data = await response.json();
      if (!data.error) {
        return data as IndustryAnswer;
      }
    }
  } catch {
    // API 不可达，静默 fallback 到 mock
  }
  return getMockAnswer(query);
}

/**
 * 获取案例关联的科研实战任务
 *
 * TODO: 后期接入真实API
 *  - GET /api/industry/cases/:id/tasks
 *  - 返回该案例相关的科研任务列表
 *  - 可连接到 /research 模块的实验设计任务
 */
export async function getRelatedResearchTasks(caseId: string): Promise<string[]> {
  // TODO: 替换为真实 API 调用
  // const data = await apiFetch<string[]>(`/api/industry/cases/${caseId}/tasks`);
  // if (data) return data;
  const found = mockCases.find((c) => c.id === caseId);
  return found ? [found.linkedResearchTask] : [];
}

/**
 * 获取单个案例详情
 *
 * TODO: 后期接入真实API
 *  - GET /api/industry/cases/:id
 *  - 返回完整案例信息，包括扩展文献引用
 */
export async function getIndustryCaseById(caseId: string): Promise<IndustryCase | null> {
  // TODO: 替换为真实 API 调用
  // const data = await apiFetch<IndustryCase>(`/api/industry/cases/${caseId}`);
  // if (data) return data;
  return mockCases.find((c) => c.id === caseId) || null;
}