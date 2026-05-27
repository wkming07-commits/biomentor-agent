from fastapi.testclient import TestClient

from app.main import app
from app.services.bio_tools import (
    analyze_sequence,
    parse_plasmid_features,
    resolve_protein_structure,
)


client = TestClient(app)


def test_resolve_protein_structure_prefers_real_structure_sources():
    record = resolve_protein_structure("GFP")
    assert record["accession"] == "P42212"
    assert record["pdb_id"] == "1GFL"
    assert record["structure_url"] == "https://files.rcsb.org/download/1GFL.pdb"
    assert record["alphafold_url"].endswith("/AF-P42212-F1-model_v4.pdb")


def test_sequence_analysis_computes_stats_translation_primers_and_sites():
    result = analyze_sequence("ATGGCCGTGAAGCTGGAATTCGGATCCTAA")
    assert result["length"] == 30
    assert result["gc_percent"] == 50.0
    assert result["translation"].startswith("MAVK")
    assert result["restriction_sites"]["EcoRI"] == [16]
    assert result["restriction_sites"]["BamHI"] == [22]
    assert result["primers"]["forward"]["sequence"] == "ATGGCCGTGAAGCTG"


def test_parse_plasmid_features_reads_genbank_qualifiers():
    gb = """FEATURES             Location/Qualifiers
     rep_origin      2530..3130
                     /label="pMB1 ori"
     CDS             complement(3290..4150)
                     /gene="AmpR"
"""
    features = parse_plasmid_features(gb, 4361)
    assert [feature["label"] for feature in features] == ["pMB1 ori", "AmpR"]
    assert features[1]["direction"] == "reverse"


def test_bio_tools_api_endpoints_are_mounted():
    protein = client.get("/api/bio-tools/protein/resolve", params={"query": "4hhb"})
    assert protein.status_code == 200
    assert protein.json()["pdb_id"] == "4HHB"

    sequence = client.post(
        "/api/bio-tools/sequence/analyze",
        json={"sequence": "ATGGCCGTGAAGCTGGAATTCGGATCCTAA"},
    )
    assert sequence.status_code == 200
    assert sequence.json()["restriction_sites"]["EcoRI"] == [16]

    pathway = client.get("/api/bio-tools/pathways/cell-cycle")
    assert pathway.status_code == 200
    assert pathway.json()["reactome_id"] == "R-HSA-1640170"
