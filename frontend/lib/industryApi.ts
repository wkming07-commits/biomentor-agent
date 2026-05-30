import type { IndustryCase, IndustryAnswer } from "@/data/industryCases";
import { industryCases as mockCases, getMockAnswer } from "@/data/industryCases";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const response = await fetch(path, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export interface ApiIndustryCase {
  id: number;
  case_key: string;
  title: string;
  subtitle: string;
  industry_direction: string;
  category: string;
  real_product_or_technology: string;
  background: string;
  core_problem: string;
  research_foundation: string;
  application_value: string;
  knowledge_points: string[];
  required_abilities: string[];
  recommended_keywords: string[];
  linked_research_task: string;
  evidence_level: string;
  source_type: string;
  application_scenario: string;
  display_focus: string;
  migration_path: {
    textbookBase: string[];
    researchFrontier: string[];
    industryApplication: string[];
  };
  references: Array<{ title: string; url: string; type: string }>;
  source_urls: string[];
}

export function convertApiCaseToFrontend(apiCase: ApiIndustryCase): IndustryCase {
  return {
    id: apiCase.case_key,
    title: apiCase.title,
    subtitle: apiCase.subtitle,
    category: apiCase.category || "",
    realProductOrTechnology: apiCase.real_product_or_technology || "",
    relatedKnowledgePoints: apiCase.knowledge_points || [],
    industryDirection: apiCase.industry_direction,
    coreProblem: apiCase.core_problem,
    researchFoundation: apiCase.research_foundation,
    applicationValue: apiCase.application_value,
    requiredAbilities: apiCase.required_abilities || [],
    recommendedKeywords: apiCase.recommended_keywords || [],
    linkedResearchTask: apiCase.linked_research_task,
    evidenceLevel: apiCase.evidence_level === "high" ? "高" : apiCase.evidence_level === "medium" ? "中" : "发展中",
    sourceType: apiCase.source_type === "academic" ? "学术文献" : apiCase.source_type === "clinical_trial" ? "临床试验" : apiCase.source_type === "patent" ? "专利文献" : apiCase.source_type === "regulatory" ? "监管文件" : "产业报告",
    background: apiCase.background,
    applicationScenario: apiCase.application_scenario,
    displayFocus: apiCase.display_focus,
    migrationPath: apiCase.migration_path || { textbookBase: [], researchFrontier: [], industryApplication: [] },
    references: Array.isArray(apiCase.references) ? apiCase.references.map(r => ({
      title: r.title,
      url: r.url,
      type: r.type as "FDA" | "PubMed" | "DOI" | "NCI" | "Label" | "Review" | "Other",
    })) : [],
    sourceUrls: apiCase.source_urls || [],
  };
}

export async function fetchIndustryCases(): Promise<IndustryCase[]> {
  const data = await apiFetch<{ items: ApiIndustryCase[] }>("/api/industry/cases?page_size=100");
  if (data?.items && data.items.length > 0) {
    return data.items.map(convertApiCaseToFrontend);
  }
  return mockCases;
}

export async function searchIndustryCases(query: string): Promise<IndustryCase[]> {
  const data = await apiFetch<ApiIndustryCase[]>(`/api/industry/cases/search?q=${encodeURIComponent(query)}`);
  if (data && data.length > 0) {
    return data.map(convertApiCaseToFrontend);
  }
  const lower = query.toLowerCase();
  return mockCases.filter(
    (c) =>
      c.title.toLowerCase().includes(lower) ||
      c.industryDirection.toLowerCase().includes(lower) ||
      c.category.toLowerCase().includes(lower) ||
      c.relatedKnowledgePoints.some((k) => k.toLowerCase().includes(lower)) ||
      c.recommendedKeywords.some((k) => k.toLowerCase().includes(lower)) ||
      c.coreProblem.toLowerCase().includes(lower),
  );
}

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
        return {
          query: data.query,
          answer: data.answer,
          relatedKnowledgePoints: data.relatedKnowledgePoints || [],
          researchFrontiers: data.researchFrontiers || [],
          industryApplications: data.industryApplications || [],
          abilityDirections: [],
          recommendedKeywords: data.recommendedKeywords || [],
          researchTasks: [],
        };
      }
    }
  } catch {
    // API 不可达，静默 fallback 到 mock
  }
  return getMockAnswer(query);
}

export async function getIndustryCaseById(caseId: string): Promise<IndustryCase | null> {
  const data = await apiFetch<ApiIndustryCase>(`/api/industry/cases/${caseId}`);
  if (data) {
    return convertApiCaseToFrontend(data);
  }
  return mockCases.find((c) => c.id === caseId) || null;
}

export async function getRelatedResearchTasks(caseId: string): Promise<string[]> {
  const data = await apiFetch<{ tasks: string[] }>(`/api/industry/cases/${caseId}/research-tasks`);
  if (data?.tasks) {
    return data.tasks;
  }
  const found = mockCases.find((c) => c.id === caseId);
  return found ? [found.linkedResearchTask] : [];
}