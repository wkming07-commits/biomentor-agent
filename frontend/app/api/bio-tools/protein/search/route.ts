import { NextRequest, NextResponse } from "next/server";
import { searchProteinCandidates } from "@/lib/biotools.mjs";

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
          const name = data?.proteinDescription?.recommendedName?.fullName?.value || trimmed;
          const gene = data?.genes?.[0]?.geneName?.value || "";
          const organism = data?.organism?.scientificName || "";
          const reviewed = data?.entryAudit === "reviewed";
          const pdbRefs = data?.uniProtKBCrossReferences?.filter(
            (r: { database: string }) => r.database === "PDB",
          ) || [];
          const pdbId = pdbRefs.length > 0 ? pdbRefs[0].id : "";

          return NextResponse.json({
            candidates: [
              {
                id: `uniprot-${trimmed}`,
                label: name,
                geneName: gene,
                accession: trimmed,
                pdbId: pdbId || undefined,
                organism,
                reviewed,
                sourceKind: reviewed ? "experimental" : "predicted",
                sourceLabel: reviewed ? "UniProtKB/Swiss-Prot" : "UniProtKB/TrEMBL",
                matchType: "uniprot" as const,
                teachingFocus: reviewed
                  ? "经过人工审阅的参考蛋白条目"
                  : "计算机预测的蛋白条目，部分注释可能未经实验验证",
                structureUrl: pdbId ? `https://files.rcsb.org/download/${pdbId}.pdb` : undefined,
                alphaFoldUrl: `https://alphafold.ebi.ac.uk/files/AF-${trimmed}-F1-model_v4.pdb`,
                uniprotUrl: `https://www.uniprot.org/uniprotkb/${trimmed}/entry`,
                rcsbUrl: pdbId ? `https://www.rcsb.org/structure/${pdbId}` : undefined,
              },
            ],
          });
        }
      } catch {
        // UniProt unavailable, fall through to local candidates
      }
    }

    const localResults = searchProteinCandidates(trimmed);

    return NextResponse.json({
      candidates: localResults,
    });
  } catch {
    return NextResponse.json({
      candidates: searchProteinCandidates(trimmed),
    });
  }
}
