const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function fetchBioTool<T>(
  path: string,
  init?: RequestInit,
): Promise<T | null> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function resolveProteinViaApi(query: string) {
  return fetchBioTool<Record<string, unknown>>(
    `/api/bio-tools/protein/resolve?query=${encodeURIComponent(query)}`,
  );
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
