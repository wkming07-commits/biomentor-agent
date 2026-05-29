import { NextRequest, NextResponse } from "next/server";
import {
  buildUniProtKeywordSearchUrl,
  mapUniProtEntryToProteinCandidate,
  searchProteinCandidates,
} from "@/lib/biotools.mjs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query || !query.trim()) {
    return NextResponse.json(
      { candidates: [] },
      { status: 200 },
    );
  }

  const trimmed = query.trim();

  try {
    if (/^[0-9][A-Za-z0-9]{3}$/.test(trimmed)) {
      const pdbId = trimmed.toUpperCase();
      return NextResponse.json({
        candidates: [
          {
            id: `pdb-${pdbId}`,
            label: `PDB: ${pdbId}`,
            pdbId,
            structureUrl: `https://files.rcsb.org/download/${pdbId}.pdb`,
            rcsbUrl: `https://www.rcsb.org/structure/${pdbId}`,
            sourceKind: "experimental" as const,
            sourceLabel: "RCSB PDB",
            matchType: "pdb" as const,
            teachingFocus: "X 射线晶体学 / 冷冻电镜解析实验结构",
          },
        ],
      });
    }

    if (/^[OPQ][0-9][A-Z0-9]{3}[0-9]$|^[A-NR-Z][0-9]([A-Z][A-Z0-9]{2}[0-9]){1,2}$/.test(trimmed)) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const uniRes = await fetch(
          `https://rest.uniprot.org/uniprotkb/${trimmed}.json`,
          { signal: controller.signal },
        );
        clearTimeout(timeout);

        if (uniRes.ok) {
          const data = await uniRes.json();
          return NextResponse.json({
            candidates: [mapUniProtEntryToProteinCandidate(data)],
          });
        }
      } catch {
        // UniProt unavailable, fall through to local candidates
      }
    }

    const localResults = searchProteinCandidates(trimmed);
    if (localResults.length > 0) {
      return NextResponse.json({
        candidates: localResults,
      });
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const searchRes = await fetch(buildUniProtKeywordSearchUrl(trimmed), { signal: controller.signal });
      clearTimeout(timeout);

      if (searchRes.ok) {
        const data = await searchRes.json();
        const candidates = Array.isArray(data?.results)
          ? data.results.map(mapUniProtEntryToProteinCandidate).filter((item: { accession?: string }) => item.accession)
          : [];

        if (candidates.length > 0) {
          return NextResponse.json({ candidates });
        }
      }
    } catch {
      // Remote search unavailable, return local empty result below.
    }

    return NextResponse.json({
      candidates: [],
    });
  } catch {
    return NextResponse.json({
      candidates: searchProteinCandidates(trimmed),
    });
  }
}
