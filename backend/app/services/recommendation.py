"""
Recommendation Service — personalized learning path generation, remediation suggestions, case recommendations.
"""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.models import (
    Recommendation,
    RecommendationType,
    LearningPath,
    StudentKnowledgeState,
    KnowledgePoint,
    Question,
    IndustryCase,
    ResearchPaper,
)


class RecommendationService:

    def __init__(self, db: Session):
        self.db = db

    def generate_recommendations(self, user_id: int) -> list[Recommendation]:
        """Generate personalized recommendations based on knowledge states."""
        states = (
            self.db.query(StudentKnowledgeState)
            .filter(StudentKnowledgeState.user_id == user_id)
            .all()
        )

        if not states:
            return self._onboarding_recommendations(user_id)

        recs: list[Recommendation] = []

        # 1. Knowledge remediation — weak points with lowest mastery
        weak_states = sorted(states, key=lambda s: s.mastery_level)[:3]
        for rank, ws in enumerate(weak_states, start=1):
            if ws.mastery_level < 60:
                kp = self.db.query(KnowledgePoint).filter(KnowledgePoint.id == ws.knowledge_point_id).first()
                reason = f"知识点「{kp.name if kp else ws.knowledge_point_id}」掌握度为 {ws.mastery_level:.0f}%，建议优先复习"
                rec = Recommendation(
                    user_id=user_id,
                    type=RecommendationType.knowledge,
                    target_id=str(ws.knowledge_point_id),
                    reason=reason,
                    priority=rank,
                )
                self.db.add(rec)
                recs.append(rec)

        # 2. Quiz recommendation — find questions for weak points
        for ws in weak_states[:2]:
            if ws.mastery_level < 70:
                kp_id_str = str(ws.knowledge_point_id)
                questions = (
                    self.db.query(Question)
                    .filter(Question.knowledge_point_ids.contains(kp_id_str))
                    .limit(3)
                    .all()
                )
                if questions:
                    rec = Recommendation(
                        user_id=user_id,
                        type=RecommendationType.quiz,
                        target_id=str(questions[0].id),
                        reason=f"针对薄弱知识点的练习（共 {len(questions)} 道可用题目）",
                        priority=5,
                    )
                    self.db.add(rec)
                    recs.append(rec)

        # 3. Case recommendation — relevant cases for strong points
        strong_states = sorted(states, key=lambda s: -s.mastery_level)[:2]
        for ss in strong_states:
            if ss.mastery_level >= 70:
                kp = self.db.query(KnowledgePoint).filter(KnowledgePoint.id == ss.knowledge_point_id).first()
                if kp:
                    cases = (
                        self.db.query(IndustryCase)
                        .filter(IndustryCase.title.contains(kp.name[:4]))
                        .limit(2)
                        .all()
                    )
                    for case in cases:
                        rec = Recommendation(
                            user_id=user_id,
                            type=RecommendationType.case,
                            target_id=str(case.id),
                            reason=f"基于你已掌握的「{kp.name}」，可以探索产业案例「{case.title}」",
                            priority=3,
                        )
                        self.db.add(rec)
                        recs.append(rec)

        # 4. Paper recommendation
        if strong_states:
            kp = self.db.query(KnowledgePoint).filter(
                KnowledgePoint.id == strong_states[0].knowledge_point_id
            ).first()
            if kp:
                papers = (
                    self.db.query(ResearchPaper)
                    .filter(ResearchPaper.title_zh.contains(kp.name[:6]))
                    .limit(2)
                    .all()
                )
                for paper in papers:
                    rec = Recommendation(
                        user_id=user_id,
                        type=RecommendationType.paper,
                        target_id=str(paper.id),
                        reason=f"推荐阅读相关文献「{paper.title_zh or paper.title}」以拓展知识深度",
                        priority=2,
                    )
                    self.db.add(rec)
                    recs.append(rec)

        self.db.commit()
        return recs

    def _onboarding_recommendations(self, user_id: int) -> list[Recommendation]:
        """Default recommendations for new users."""
        recs = [
            Recommendation(
                user_id=user_id,
                type=RecommendationType.knowledge,
                target_id="1",
                reason="欢迎使用 BioMentor Agent！建议从基础知识探索开始。",
                priority=1,
            ),
            Recommendation(
                user_id=user_id,
                type=RecommendationType.tool,
                target_id="protein",
                reason="试试蛋白结构查看器，直观了解生物大分子的三维结构。",
                priority=2,
            ),
        ]
        for rec in recs:
            self.db.add(rec)
        self.db.commit()
        return recs

    def get_recommendations(self, user_id: int, consumed: bool | None = None) -> list[Recommendation]:
        q = self.db.query(Recommendation).filter(Recommendation.user_id == user_id)
        if consumed is not None:
            q = q.filter(Recommendation.is_consumed == consumed)
        return q.order_by(Recommendation.priority).limit(20).all()

    # ----- Learning Path -----

    def generate_learning_path(self, user_id: int) -> LearningPath:
        """Generate a structured learning path based on diagnosis."""
        states = (
            self.db.query(StudentKnowledgeState)
            .filter(StudentKnowledgeState.user_id == user_id)
            .all()
        )

        if not states:
            steps = [
                {"order": 1, "title": "基础知识探索", "action": "前往知识探索中心，选择一个感兴趣的生物学概念开始学习", "type": "explore"},
                {"order": 2, "title": "使用生物工具箱", "action": "在蛋白结构、质粒图谱、序列分析和通路图谱中选择一个工具动手操作", "type": "tool"},
                {"order": 3, "title": "完成一次测评", "action": "在测评中心完成一套基础题目，了解当前知识水平", "type": "assessment"},
            ]
        else:
            weak = sorted(states, key=lambda s: s.mastery_level)[:3]
            steps = []
            for i, ws in enumerate(weak, start=1):
                kp = self.db.query(KnowledgePoint).filter(KnowledgePoint.id == ws.knowledge_point_id).first()
                name = kp.name if kp else str(ws.knowledge_point_id)
                steps.append({
                    "order": i,
                    "title": f"强化 {name}",
                    "action": f"复习 {name} 相关概念，完成针对性练习",
                    "type": "review",
                    "mastery": ws.mastery_level,
                })
            steps.append({
                "order": len(steps) + 1,
                "title": "科研拓展",
                "action": "尝试一个科研实战任务，将所学知识应用于实际问题解决",
                "type": "research",
            })

        path = LearningPath(
            user_id=user_id,
            title="个性化学习路径",
            description="根据你的知识掌握情况自动生成的学习计划",
            steps=steps,
            status="active",
        )
        self.db.add(path)
        self.db.commit()
        self.db.refresh(path)
        return path

    def get_active_learning_path(self, user_id: int) -> LearningPath | None:
        return (
            self.db.query(LearningPath)
            .filter(LearningPath.user_id == user_id, LearningPath.status == "active")
            .order_by(LearningPath.created_at.desc())
            .first()
        )
