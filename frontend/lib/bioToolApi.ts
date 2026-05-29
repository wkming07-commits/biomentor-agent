const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function fetchBioTool<T>(path: string, init?: RequestInit): Promise<T | null> {
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

// Bio tools — connected to real backend
export async function resolveProteinViaApi(query: string) {
  return fetchBioTool<Record<string, unknown>>(`/api/bio-tools/protein/resolve?query=${encodeURIComponent(query)}`);
}

export async function analyzeSequenceViaApi(sequence: string) {
  return fetchBioTool<Record<string, unknown>>("/api/bio-tools/sequence/analyze", {
    method: "POST",
    body: JSON.stringify({ sequence }),
  });
}

export async function annotatePlasmidViaApi(content: string, sequenceLength?: number) {
  return fetchBioTool<{ features: unknown[]; engine: string }>("/api/bio-tools/plasmid/annotate", {
    method: "POST",
    body: JSON.stringify({ content, sequence_length: sequenceLength }),
  });
}

export async function fetchPathwayViaApi(key: string) {
  return fetchBioTool<Record<string, unknown>>(`/api/bio-tools/pathways/${encodeURIComponent(key)}`);
}

export async function fetchBioToolStatus() {
  return fetchBioTool<Record<string, unknown>>("/api/bio-tools/status");
}

// Knowledge base & RAG — connected to real backend
export async function searchKnowledgeViaApi(query: string, courseId?: number, topK: number = 5) {
  const params = new URLSearchParams({ q: query, top_k: String(topK) });
  if (courseId) params.set("course_id", String(courseId));
  return fetchBioTool<Record<string, unknown>>(`/api/rag/knowledge?${params}`);
}

export async function ragSearchViaApi(query: string, collection: string = "course_materials", courseId?: number) {
  return fetchBioTool<Record<string, unknown>>("/api/rag/search", {
    method: "POST",
    body: JSON.stringify({ query, collection, course_id: courseId, top_k: 5 }),
  });
}

// Knowledge graph — connected to real backend
export async function fetchKnowledgeGraphViaApi(centerId?: string) {
  if (centerId) {
    return fetchBioTool<Record<string, unknown>>(`/api/knowledge-graph/subgraph/${centerId}`);
  }
  return fetchBioTool<Record<string, unknown>>("/api/knowledge-graph/");
}

export async function fetchGraphNodeDetailViaApi(nodeId: string) {
  return fetchBioTool<Record<string, unknown>>(`/api/knowledge-graph/nodes/${nodeId}`);
}

// Research papers — connected to real backend
export async function fetchPapersViaApi(params?: { direction?: string; difficulty?: string; page?: number }) {
  const searchParams = new URLSearchParams();
  if (params?.direction) searchParams.set("direction", params.direction);
  if (params?.difficulty) searchParams.set("difficulty", params.difficulty);
  if (params?.page) searchParams.set("page", String(params.page));
  return fetchBioTool<Record<string, unknown>>(`/api/research/papers?${searchParams}`);
}

export async function searchPapersViaApi(query: string) {
  return fetchBioTool<unknown[]>(`/api/research/papers/search?q=${encodeURIComponent(query)}`);
}

export async function fetchDemoPapersViaApi() {
  return fetchBioTool<unknown[]>("/api/research/papers/demo");
}

export async function fetchPaperLearningPlanViaApi(paperId: number) {
  return fetchBioTool<Record<string, unknown>>(`/api/research/papers/${paperId}/learning-plan`);
}

export async function buildDefenseOutlineViaApi(paperIds: number[]) {
  return fetchBioTool<Record<string, unknown>>("/api/research/papers/defense-outline", {
    method: "POST",
    body: JSON.stringify(paperIds),
  });
}

// Courses — connected to real backend
export async function fetchCoursesViaApi() {
  return fetchBioTool<unknown[]>("/api/courses/");
}

export async function fetchChaptersViaApi(courseId: number) {
  return fetchBioTool<unknown[]>(`/api/courses/${courseId}/chapters`);
}

export async function fetchAllKnowledgePointsViaApi() {
  return fetchBioTool<unknown[]>("/api/courses/knowledge-points");
}

// Questions & Quiz — connected to real backend
export async function fetchQuestionsViaApi(params?: Record<string, string>) {
  const searchParams = new URLSearchParams(params || {});
  return fetchBioTool<Record<string, unknown>>(`/api/questions?${searchParams}`);
}

export async function aiGenerateQuestionsViaApi(data: {
  knowledge_points: string[];
  evidence_text?: string;
  question_types?: string[];
  count?: number;
  difficulty?: string;
  course_id?: number;
}) {
  return fetchBioTool<Record<string, unknown>>("/api/questions/ai-generate", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function fetchQuizzesViaApi(params?: Record<string, string>) {
  const searchParams = new URLSearchParams(params || {});
  return fetchBioTool<Record<string, unknown>>(`/api/quiz?${searchParams}`);
}

export async function createQuizViaApi(data: Record<string, unknown>) {
  return fetchBioTool<Record<string, unknown>>("/api/quiz/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Attempts — connected to real backend
export async function startAttemptViaApi(quizId: number, userId: number) {
  return fetchBioTool<Record<string, unknown>>(`/api/attempts/start?quiz_id=${quizId}&user_id=${userId}`, {
    method: "POST",
  });
}

export async function submitAttemptViaApi(attemptId: number, responses: { question_id: number; answer_text: string }[]) {
  return fetchBioTool<Record<string, unknown>>(`/api/attempts/${attemptId}/submit`, {
    method: "POST",
    body: JSON.stringify({ responses }),
  });
}

export async function fetchAttemptsViaApi(params?: Record<string, string>) {
  const searchParams = new URLSearchParams(params || {});
  return fetchBioTool<unknown[]>(`/api/attempts?${searchParams}`);
}

// Diagnosis — connected to real backend
export async function fetchDiagnosisProfileViaApi(userId: number) {
  return fetchBioTool<Record<string, unknown>>(`/api/diagnosis/profile/${userId}`);
}

export async function processAttemptDiagnosisViaApi(attemptId: number) {
  return fetchBioTool<Record<string, unknown>>(`/api/diagnosis/process-attempt/${attemptId}`, {
    method: "POST",
  });
}

// Photo Learning — connected to real backend
export async function analyzePhotoTextViaApi(text: string, imageBase64?: string) {
  return fetchBioTool<Record<string, unknown>>("/api/photo-learning/analyze", {
    method: "POST",
    body: JSON.stringify({ text, image_base64: imageBase64 || null }),
  });
}

// Health check
export async function checkApiHealth() {
  return fetchBioTool<Record<string, unknown>>("/api/health");
}
