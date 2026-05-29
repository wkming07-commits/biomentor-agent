"""
Knowledge Graph Service — node/edge CRUD, graph construction, visualization data.
"""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.models import (
    KnowledgeNode,
    KnowledgeEdge,
    NodeType,
    RelationType,
    ResearchPaper,
    IndustryCase,
    KnowledgePoint,
)


class KnowledgeGraphService:

    def __init__(self, db: Session):
        self.db = db

    # ----- Node CRUD -----

    def list_nodes(self, node_type: str | None = None) -> list[KnowledgeNode]:
        q = self.db.query(KnowledgeNode)
        if node_type:
            q = q.filter(KnowledgeNode.node_type == node_type)
        return q.all()

    def get_node(self, node_id: str) -> KnowledgeNode | None:
        return self.db.query(KnowledgeNode).filter(KnowledgeNode.id == node_id).first()

    def upsert_node(self, node_id: str, data: dict) -> KnowledgeNode:
        node = self.get_node(node_id)
        if node:
            for k, v in data.items():
                if hasattr(node, k):
                    setattr(node, k, v)
        else:
            node = KnowledgeNode(id=node_id, **data)
            self.db.add(node)
        self.db.commit()
        self.db.refresh(node)
        return node

    # ----- Edge CRUD -----

    def list_edges(self, node_id: str | None = None) -> list[KnowledgeEdge]:
        q = self.db.query(KnowledgeEdge)
        if node_id:
            q = q.filter(
                (KnowledgeEdge.from_node_id == node_id)
                | (KnowledgeEdge.to_node_id == node_id)
            )
        return q.all()

    def create_edge(self, from_id: str, to_id: str, rel_type: str, note: str = "") -> KnowledgeEdge:
        edge = KnowledgeEdge(
            from_node_id=from_id,
            to_node_id=to_id,
            relation_type=RelationType(rel_type),
            note=note,
        )
        self.db.add(edge)
        self.db.commit()
        self.db.refresh(edge)
        return edge

    def delete_edge(self, edge_id: int) -> bool:
        edge = self.db.query(KnowledgeEdge).filter(KnowledgeEdge.id == edge_id).first()
        if not edge:
            return False
        self.db.delete(edge)
        self.db.commit()
        return True

    # ----- Full Graph -----

    def get_full_graph(self) -> dict[str, Any]:
        nodes = self.db.query(KnowledgeNode).all()
        edges = self.db.query(KnowledgeEdge).all()

        # Circular layout
        import math
        cx, cy, radius = 400, 260, 180
        n = len(nodes)

        node_list = []
        for i, node in enumerate(nodes):
            angle = (2 * math.pi * i / max(n, 1)) - math.pi / 2
            x = cx + radius * math.cos(angle)
            y = cy + radius * math.sin(angle)
            node_list.append({
                "id": node.id,
                "label": node.label,
                "type": node.node_type.value,
                "description": node.description,
                "category": node.category,
                "x": x,
                "y": y,
                "r": 26 if node.node_type == NodeType.paper else 30,
                "color": self._color_for_type(node.node_type.value),
            })

        edge_list = [
            {
                "from": e.from_node_id,
                "to": e.to_node_id,
                "type": e.relation_type.value,
                "label": e.note,
            }
            for e in edges
        ]

        return {"nodes": node_list, "edges": edge_list}

    @staticmethod
    def _color_for_type(node_type: str) -> str:
        colors = {
            "concept": "#2563eb",
            "paper": "#059669",
            "tool": "#7c3aed",
            "task": "#dc2626",
            "case": "#f59e0b",
        }
        return colors.get(node_type, "#4a4a6a")

    def get_subgraph(self, center_id: str) -> dict[str, Any]:
        """Subgraph centered on a node, including its direct neighbors."""
        edges = (
            self.db.query(KnowledgeEdge)
            .filter(
                (KnowledgeEdge.from_node_id == center_id)
                | (KnowledgeEdge.to_node_id == center_id)
            )
            .all()
        )

        node_ids = {center_id}
        for e in edges:
            node_ids.add(e.from_node_id)
            node_ids.add(e.to_node_id)

        nodes = self.db.query(KnowledgeNode).filter(KnowledgeNode.id.in_(node_ids)).all()

        import math
        cx, cy = 300, 200
        n = len(nodes)
        radius = min(150, n * 16)

        node_list = []
        for i, node in enumerate(nodes):
            angle = (2 * math.pi * i / max(n, 1)) - math.pi / 2
            x = cx + radius * math.cos(angle)
            y = cy + radius * math.sin(angle)
            is_center = node.id == center_id
            node_list.append({
                "id": node.id,
                "label": node.label,
                "type": node.node_type.value,
                "description": node.description,
                "category": node.category,
                "x": x,
                "y": y,
                "r": 38 if is_center else 24,
                "color": "#f59e0b" if is_center else self._color_for_type(node.node_type.value),
            })

        edge_list = [
            {
                "from": e.from_node_id,
                "to": e.to_node_id,
                "type": e.relation_type.value,
                "label": e.note,
            }
            for e in edges
        ]

        return {"nodes": node_list, "edges": edge_list, "center_id": center_id}

    def get_node_detail(self, node_id: str) -> dict[str, Any]:
        node = self.get_node(node_id)
        if not node:
            return {"error": "Node not found"}

        edges = self.list_edges(node_id)
        related_ids = []
        for e in edges:
            if e.from_node_id != node_id:
                related_ids.append(e.from_node_id)
            if e.to_node_id != node_id:
                related_ids.append(e.to_node_id)

        related_nodes = (
            self.db.query(KnowledgeNode).filter(KnowledgeNode.id.in_(related_ids)).all()
            if related_ids
            else []
        )

        return {
            "id": node.id,
            "label": node.label,
            "type": node.node_type.value,
            "description": node.description,
            "category": node.category,
            "related_nodes": [
                {"id": rn.id, "label": rn.label, "type": rn.node_type.value}
                for rn in related_nodes
            ],
            "metadata": node.metadata_,
        }
