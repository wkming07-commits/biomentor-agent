from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import KnowledgeNode, KnowledgeEdge, NodeType, RelationType
from app.services.graph import KnowledgeGraphService

router = APIRouter(prefix="/api/knowledge-graph", tags=["knowledge-graph"])


# ---- Full Graph ----

@router.get("/")
def get_full_graph(db: Session = Depends(get_db)):
    service = KnowledgeGraphService(db)
    return service.get_full_graph()


@router.get("/subgraph/{center_id}")
def get_subgraph(center_id: str, db: Session = Depends(get_db)):
    service = KnowledgeGraphService(db)
    return service.get_subgraph(center_id)


# ---- Nodes ----

@router.get("/nodes")
def list_nodes(node_type: str | None = Query(None), db: Session = Depends(get_db)):
    service = KnowledgeGraphService(db)
    return service.list_nodes(node_type)


@router.get("/nodes/{node_id}")
def get_node(node_id: str, db: Session = Depends(get_db)):
    service = KnowledgeGraphService(db)
    node = service.get_node(node_id)
    if not node:
        raise HTTPException(404, "Node not found")
    return service.get_node_detail(node_id)


@router.post("/nodes", status_code=201)
def upsert_node(data: dict, db: Session = Depends(get_db)):
    service = KnowledgeGraphService(db)
    node_id = data.pop("id")
    return service.upsert_node(node_id, data)


# ---- Edges ----

@router.get("/edges")
def list_edges(node_id: str | None = Query(None), db: Session = Depends(get_db)):
    service = KnowledgeGraphService(db)
    return service.list_edges(node_id)


@router.post("/edges", status_code=201)
def create_edge(data: dict, db: Session = Depends(get_db)):
    service = KnowledgeGraphService(db)
    return service.create_edge(
        from_id=data["from_node_id"],
        to_id=data["to_node_id"],
        rel_type=data["relation_type"],
        note=data.get("note", ""),
    )


@router.delete("/edges/{edge_id}")
def delete_edge(edge_id: int, db: Session = Depends(get_db)):
    service = KnowledgeGraphService(db)
    if not service.delete_edge(edge_id):
        raise HTTPException(404, "Edge not found")
    return {"detail": "deleted"}
