from pydantic import BaseModel
from fastapi import APIRouter

from app.services.bio_tools import (
    analyze_sequence,
    external_tool_status,
    parse_plasmid_features,
    pathway_record,
    resolve_protein_structure,
)


router = APIRouter(prefix="/api/bio-tools", tags=["bio-tools"])


class SequenceRequest(BaseModel):
    sequence: str


class PlasmidRequest(BaseModel):
    content: str
    sequence_length: int | None = None


@router.get("/status")
def status():
    return external_tool_status()


@router.get("/protein/resolve")
def protein_resolve(query: str):
    return resolve_protein_structure(query)


@router.post("/sequence/analyze")
def sequence_analyze(payload: SequenceRequest):
    return analyze_sequence(payload.sequence)


@router.post("/plasmid/annotate")
def plasmid_annotate(payload: PlasmidRequest):
    return {
        "features": parse_plasmid_features(payload.content, payload.sequence_length),
        "engine": "pLannotate" if external_tool_status()["pLannotate"] else "GenBank parser fallback",
    }


@router.get("/pathways/{key}")
def pathway(key: str):
    return pathway_record(key)
