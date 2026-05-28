import { NextRequest, NextResponse } from "next/server";
import { matchLocalPathway, pathwayCatalog } from "@/lib/biotools.mjs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query || !query.trim()) {
    return NextResponse.json({ candidates: [] }, { status: 200 });
  }

  const trimmed = query.trim();
  const results: Array<{
    id: string;
    name: string;
    species: string;
    source: "local" | "reactome";
    description: string;
    localKey?: string;
    reactomeUrl?: string;
  }> = [];

  const localKey = matchLocalPathway(trimmed) as keyof typeof pathwayCatalog | null;
  if (localKey && pathwayCatalog[localKey]) {
    const entry = pathwayCatalog[localKey];
    results.push({
      id: `local-${localKey}`,
      name: entry.name,
      species: "Homo sapiens",
      source: "local",
      description: `精选教学图谱：${entry.focus}`,
      localKey,
    });
  }

  const otherLocalKeys = ["cell-cycle", "apoptosis", "mapk", "glycolysis", "dna-repair"] as const;
  for (const key of otherLocalKeys) {
    if (key !== localKey && pathwayCatalog[key]) {
      const entry = pathwayCatalog[key];
      const q = trimmed.toLowerCase();
      if (entry.name.toLowerCase().includes(q) || entry.focus.toLowerCase().includes(q)) {
        results.push({
          id: `local-${key}`,
          name: entry.name,
          species: "Homo sapiens",
          source: "local",
          description: `精选教学图谱：${entry.focus}`,
          localKey: key,
        });
      }
    }
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const reactomeRes = await fetch(
      `https://reactome.org/ContentService/search/query?query=${encodeURIComponent(trimmed)}&species=Homo%20sapiens&pageSize=8`,
      { signal: controller.signal },
    );
    clearTimeout(timeout);

    if (reactomeRes.ok) {
      const data = await reactomeRes.json();
      const hits = data?.results || [];
      for (const hit of hits) {
        if (hit.type === "Pathway" || hit.type === "TopLevelPathway") {
          results.push({
            id: `reactome-${hit.stId || hit.dbId}`,
            name: hit.name || hit.displayName || "",
            species: hit.species || "Homo sapiens",
            source: "reactome",
            description: hit.summary || hit.description || "公共通路线路数据库候选",
            reactomeUrl: hit.stId
              ? `https://reactome.org/content/detail/${hit.stId}`
              : undefined,
          });
        }
      }
    }
  } catch {
    // Reactome unavailable, return local results only
  }

  return NextResponse.json({ candidates: results });
}
