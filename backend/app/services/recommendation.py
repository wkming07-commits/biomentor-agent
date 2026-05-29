"""
Recommendation Service — LLM-powered personalized learning recommendations & path generation.
"""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.models import Recommendation, RecommendationType, LearningPath, StudentKnowledgeState, KnowledgePoint
from app.services.llm import get_llm
from app.services.prompts import (
    RECOMMENDATION_SYSTEM, RECOMMENDATION_USER, RECOMMENDATION_SCHEMA,
    LEARNING_PATH_SYSTEM, LEARNING_PATH_USER, LEARNING_PATH_SCHEMA,
)


class RecommendationService:

    def __init__(self, db: Session):
        self.db = db
        self.llm = get_llm()

    # ── LLM-Powered Recommendations ──────────────────────────────

    def generate_recommendations(self, user_id: int) -> list[Recommendation]:
        states = self.db.query(StudentKnowledgeState).filter(StudentKnowledgeState.user_id == user_id).all()

        if not states:
            return self._onboarding_recommendations(user_id)

        if self.llm.available:
            try:
                return self._llm_recommendations(user_id, states)
            except Exception:
                pass

        return self._rule_recommendations(user_id, states)

    def _llm_recommendations(self, user_id: int, states: list[StudentKnowledgeState]) -> list[Recommendation]:
        weak = sorted(states, key=lambda s: s.mastery_level)[:5]
        strong = sorted(states, key=lambda s: -s.mastery_level)[:5]

        def _kp_name(kp_id: int) -> str:
            kp = self.db.query(KnowledgePoint).filter(KnowledgePoint.id == kp_id).first()
            return kp.name if kp else str(kp_id)

        user_prompt = RECOMMENDATION_USER.format(
            weak_points=", ".join(f"{_kp_name(s.knowledge_point_id)}({s.mastery_level:.0f}%)" for s in weak),
            strengths=", ".join(_kp_name(s.knowledge_point_id) for s in strong),
            error_patterns="需更多答题数据",
            ability_profile="请参考知识状态数据",
            learned_topics=", ".join(_kp_name(s.knowledge_point_id) for s in states),
        )
        result = self.llm.generate_json(
            system_prompt=RECOMMENDATION_SYSTEM, user_prompt=user_prompt,
            schema=RECOMMENDATION_SCHEMA, temperature=0.4,
        )

        recs: list[Recommendation] = []
        for r in result.get("recommendations", [])[:10]:
            rec = Recommendation(
                user_id=user_id, type=RecommendationType(r["type"]),
                target_id="", reason=r.get("reason", ""),
                priority=r.get("priority", 5),
            )
            self.db.add(rec)
            recs.append(rec)
        self.db.commit()
        return recs

    def _rule_recommendations(self, user_id: int, states: list[StudentKnowledgeState]) -> list[Recommendation]:
        weak = sorted(states, key=lambda s: s.mastery_level)[:3]
        recs: list[Recommendation] = []
        for rank, ws in enumerate(weak, 1):
            if ws.mastery_level < 60:
                kp = self.db.query(KnowledgePoint).filter(KnowledgePoint.id == ws.knowledge_point_id).first()
                rec = Recommendation(user_id=user_id, type=RecommendationType.knowledge,
                                     target_id=str(ws.knowledge_point_id),
                                     reason=f"知识点「{kp.name if kp else ws.knowledge_point_id}」掌握度{ws.mastery_level:.0f}%，建议优先复习",
                                     priority=rank)
                self.db.add(rec)
                recs.append(rec)
        self.db.commit()
        return recs

    def _onboarding_recommendations(self, user_id: int) -> list[Recommendation]:
        recs = [
            Recommendation(user_id=user_id, type=RecommendationType.knowledge, target_id="1",
                           reason="欢迎使用 BioMentor Agent！建议从基础知识探索开始。", priority=1),
            Recommendation(user_id=user_id, type=RecommendationType.tool, target_id="protein",
                           reason="试试蛋白结构查看器，直观了解生物大分子的三维结构。", priority=2),
        ]
        for r in recs: self.db.add(r)
        self.db.commit()
        return recs

    def get_recommendations(self, user_id: int, consumed: bool | None = None) -> list[Recommendation]:
        q = self.db.query(Recommendation).filter(Recommendation.user_id == user_id)
        if consumed is not None: q = q.filter(Recommendation.is_consumed == consumed)
        return q.order_by(Recommendation.priority).limit(20).all()

    # ── LLM-Powered Learning Path ─────────────────────────────────

    def generate_learning_path(self, user_id: int) -> LearningPath:
        states = self.db.query(StudentKnowledgeState).filter(StudentKnowledgeState.user_id == user_id).all()

        if self.llm.available and states:
            try:
                return self._llm_learning_path(user_id, states)
            except Exception:
                pass

        return self._rule_learning_path(user_id, states)

    def _llm_learning_path(self, user_id: int, states: list[StudentKnowledgeState]) -> LearningPath:
        weak = sorted(states, key=lambda s: s.mastery_level)[:5]
        strong = sorted(states, key=lambda s: -s.mastery_level)[:5]

        def _kp_name(kp_id: int) -> str:
            kp = self.db.query(KnowledgePoint).filter(KnowledgePoint.id == kp_id).first()
            return kp.name if kp else str(kp_id)

        user_prompt = LEARNING_PATH_USER.format(
            weak_points=", ".join(f"{_kp_name(s.knowledge_point_id)}({s.mastery_level:.0f}%)" for s in weak),
            strengths=", ".join(_kp_name(s.knowledge_point_id) for s in strong),
            error_patterns="需更多答题数据",
            ability_profile="{}",
        )
        result = self.llm.generate_json(
            system_prompt=LEARNING_PATH_SYSTEM, user_prompt=user_prompt,
            schema=LEARNING_PATH_SCHEMA, temperature=0.5,
        )

        path = LearningPath(
            user_id=user_id,
            title=result.get("title", "个性化学习路径"),
            description=result.get("description", "根据你的知识掌握情况自动生成"),
            steps=result.get("steps", []),
            status="active",
        )
        self.db.add(path)
        self.db.commit()
        self.db.refresh(path)
        return path

    def _rule_learning_path(self, user_id: int, states: list[StudentKnowledgeState]) -> LearningPath:
        if not states:
            steps = [
                {"order": 1, "title": "基础知识探索", "action": "前往知识探索中心，选择一个感兴趣的生物学概念开始学习", "type": "explore"},
                {"order": 2, "title": "使用生物工具箱", "action": "在蛋白结构、质粒图谱、序列分析和通路图谱中选择一个工具动手操作", "type": "tool"},
                {"order": 3, "title": "完成一次测评", "action": "在测评中心完成一套基础题目，了解当前知识水平", "type": "assessment"},
            ]
        else:
            weak = sorted(states, key=lambda s: s.mastery_level)[:3]
            steps = []
            for i, ws in enumerate(weak, 1):
                kp = self.db.query(KnowledgePoint).filter(KnowledgePoint.id == ws.knowledge_point_id).first()
                steps.append({"order": i, "title": f"强化 {kp.name if kp else ws.knowledge_point_id}",
                              "action": f"复习相关概念并完成针对性练习", "type": "review", "mastery": ws.mastery_level})
            steps.append({"order": len(steps) + 1, "title": "科研拓展", "action": "尝试科研实战任务", "type": "research"})

        path = LearningPath(user_id=user_id, title="个性化学习路径",
                            description="根据你的知识掌握情况自动生成的学习计划", steps=steps, status="active")
        self.db.add(path)
        self.db.commit()
        self.db.refresh(path)
        return path

    def get_active_learning_path(self, user_id: int) -> LearningPath | None:
        return self.db.query(LearningPath).filter(
            LearningPath.user_id == user_id, LearningPath.status == "active"
        ).order_by(LearningPath.created_at.desc()).first()
