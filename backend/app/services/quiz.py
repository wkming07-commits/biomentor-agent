"""
Quiz Service — quiz CRUD, publish, attempt management.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session, joinedload

from app.models import (
    Quiz,
    QuizQuestion,
    QuizStatus,
    Question,
    Attempt,
    AttemptStatus,
    Response,
    GraderType,
)

def _utcnow():
    return datetime.now(timezone.utc)


class QuizService:

    def __init__(self, db: Session):
        self.db = db

    # ----- Quiz CRUD -----

    def list_quizzes(
        self, course_id: int | None = None, status: str | None = None, page: int = 1, page_size: int = 20
    ) -> tuple[list[Quiz], int]:
        q = self.db.query(Quiz)
        if course_id is not None:
            q = q.filter(Quiz.course_id == course_id)
        if status:
            q = q.filter(Quiz.status == status)

        total = q.count()
        items = q.order_by(Quiz.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
        return items, total

    def get_quiz(self, quiz_id: int) -> Quiz | None:
        return (
            self.db.query(Quiz)
            .options(joinedload(Quiz.quiz_questions).joinedload(QuizQuestion.question))
            .filter(Quiz.id == quiz_id)
            .first()
        )

    def create_quiz(self, data: dict) -> Quiz:
        question_ids: list[int] = data.pop("question_ids", [])
        quiz = Quiz(**data)

        total_score = 0.0
        for i, qid in enumerate(question_ids):
            question = self.db.query(Question).filter(Question.id == qid).first()
            if question:
                score = 1.0
                qq = QuizQuestion(quiz=quiz, question_id=qid, order=i, score=score)
                self.db.add(qq)
                total_score += score

        quiz.total_score = total_score
        self.db.add(quiz)
        self.db.commit()
        self.db.refresh(quiz)
        return quiz

    def publish_quiz(self, quiz_id: int) -> Quiz | None:
        quiz = self.get_quiz(quiz_id)
        if not quiz:
            return None
        quiz.status = QuizStatus.published
        quiz.published_at = _utcnow()
        self.db.commit()
        self.db.refresh(quiz)
        return quiz

    def close_quiz(self, quiz_id: int) -> Quiz | None:
        quiz = self.get_quiz(quiz_id)
        if not quiz:
            return None
        quiz.status = QuizStatus.closed
        self.db.commit()
        self.db.refresh(quiz)
        return quiz

    def delete_quiz(self, quiz_id: int) -> bool:
        quiz = self.get_quiz(quiz_id)
        if not quiz:
            return False
        self.db.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz_id).delete()
        self.db.delete(quiz)
        self.db.commit()
        return True

    # ----- Attempt -----

    def start_attempt(self, quiz_id: int, user_id: int) -> Attempt:
        attempt = Attempt(quiz_id=quiz_id, user_id=user_id, status=AttemptStatus.in_progress)
        self.db.add(attempt)
        self.db.commit()
        self.db.refresh(attempt)
        return attempt

    def submit_attempt(self, attempt_id: int, responses_data: list[dict]) -> Attempt:
        attempt = (
            self.db.query(Attempt)
            .options(joinedload(Attempt.responses))
            .filter(Attempt.id == attempt_id)
            .first()
        )
        if not attempt:
            raise ValueError(f"Attempt {attempt_id} not found")

        total_score = 0.0
        max_score = 0.0

        for rd in responses_data:
            question_id = rd.get("question_id")
            answer_text = rd.get("answer_text", "")

            question = self.db.query(Question).filter(Question.id == question_id).first()
            if not question:
                continue

            qq = (
                self.db.query(QuizQuestion)
                .filter(QuizQuestion.quiz_id == attempt.quiz_id, QuizQuestion.question_id == question_id)
                .first()
            )
            q_score = qq.score if qq else 1.0
            max_score += q_score

            is_correct = None
            score = 0.0
            grader = GraderType.auto

            if question.type.value in ("choice", "truefalse"):
                is_correct = answer_text.strip().upper() == question.answer.strip().upper()
                score = q_score if is_correct else 0.0
            else:
                grader = GraderType.ai

            response = Response(
                attempt_id=attempt_id,
                question_id=question_id,
                answer_text=answer_text,
                is_correct=is_correct,
                score=score,
                max_score=q_score,
                grader_type=grader,
            )
            total_score += score
            self.db.add(response)

        attempt.status = AttemptStatus.submitted
        attempt.submitted_at = _utcnow()
        attempt.total_score = total_score
        attempt.max_score = max_score
        self.db.commit()
        self.db.refresh(attempt)
        return attempt

    def get_attempt(self, attempt_id: int) -> Attempt | None:
        return (
            self.db.query(Attempt)
            .options(joinedload(Attempt.responses))
            .filter(Attempt.id == attempt_id)
            .first()
        )

    def list_attempts(self, user_id: int | None = None, quiz_id: int | None = None) -> list[Attempt]:
        q = self.db.query(Attempt).options(joinedload(Attempt.responses))
        if user_id is not None:
            q = q.filter(Attempt.user_id == user_id)
        if quiz_id is not None:
            q = q.filter(Attempt.quiz_id == quiz_id)
        return q.order_by(Attempt.started_at.desc()).all()
