from __future__ import annotations

import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    Table,
)
from sqlalchemy.orm import relationship

from app.database import Base


def _utcnow():
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class UserRole(str, enum.Enum):
    student = "student"
    teacher = "teacher"


class QuestionType(str, enum.Enum):
    choice = "choice"
    truefalse = "truefalse"
    short_answer = "short_answer"
    essay = "essay"
    research = "research"
    industry = "industry"


class QuestionStatus(str, enum.Enum):
    draft = "draft"
    reviewed = "reviewed"
    published = "published"
    archived = "archived"


class QuizStatus(str, enum.Enum):
    draft = "draft"
    published = "published"
    closed = "closed"


class AttemptStatus(str, enum.Enum):
    in_progress = "in_progress"
    submitted = "submitted"
    graded = "graded"


class GraderType(str, enum.Enum):
    auto = "auto"
    ai = "ai"
    manual = "manual"


class MaterialStatus(str, enum.Enum):
    uploading = "uploading"
    processing = "processing"
    done = "done"
    error = "error"


class Difficulty(str, enum.Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"


class BloomLevel(str, enum.Enum):
    remember = "remember"
    understand = "understand"
    apply = "apply"
    analyze = "analyze"
    evaluate = "evaluate"
    create = "create"


class EvidenceLevel(str, enum.Enum):
    high = "high"
    medium = "medium"
    developing = "developing"


class SourceType(str, enum.Enum):
    academic = "学术文献"
    industry_report = "产业报告"
    patent = "专利文献"
    clinical_trial = "临床试验"
    regulatory = "监管文件"


class NodeType(str, enum.Enum):
    concept = "concept"
    paper = "paper"
    tool = "tool"
    task = "task"
    case = "case"


class RelationType(str, enum.Enum):
    belongs_to = "belongs_to"
    prerequisite = "prerequisite"
    related = "related"
    improves = "improves"
    applied_in = "applied_in"
    explains = "explains"
    validates = "validates"
    references_paper = "references_paper"
    uses_tool = "uses_tool"
    links_case = "links_case"


class RecommendationType(str, enum.Enum):
    knowledge = "knowledge"
    quiz = "quiz"
    case = "case"
    paper = "paper"
    tool = "tool"


class WorkflowStatus(str, enum.Enum):
    pending = "pending"
    running = "running"
    completed = "completed"
    failed = "failed"


# ---------------------------------------------------------------------------
# User (simplified, no auth — single-user demo or multi-user later)
# ---------------------------------------------------------------------------

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(120), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.student, nullable=False)
    avatar_url = Column(String(500), default="")
    created_at = Column(DateTime, default=_utcnow)

    attempts = relationship("Attempt", back_populates="user")
    knowledge_states = relationship("StudentKnowledgeState", back_populates="user")
    error_events = relationship("ErrorEvent", back_populates="user")
    wrong_questions = relationship("WrongQuestionEntry", back_populates="user")
    learning_paths = relationship("LearningPath", back_populates="user")
    recommendations = relationship("Recommendation", back_populates="user")
    grades = relationship("Grade", back_populates="reviewer")


# ---------------------------------------------------------------------------
# Course & Knowledge Structure
# ---------------------------------------------------------------------------

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(300), nullable=False)
    name_en = Column(String(300), default="")
    description = Column(Text, default="")
    cover_url = Column(String(500), default="")
    teacher_name = Column(String(120), default="")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)

    chapters = relationship("Chapter", back_populates="course", order_by="Chapter.order")
    materials = relationship("Material", back_populates="course")
    questions = relationship("Question", back_populates="course")
    quizzes = relationship("Quiz", back_populates="course")


class Chapter(Base):
    __tablename__ = "chapters"

    id = Column(Integer, primary_key=True, autoincrement=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    title = Column(String(300), nullable=False)
    order = Column(Integer, default=0)
    description = Column(Text, default="")
    learning_objectives = Column(JSON, default=list)
    created_at = Column(DateTime, default=_utcnow)

    course = relationship("Course", back_populates="chapters")
    knowledge_points = relationship("KnowledgePoint", back_populates="chapter", order_by="KnowledgePoint.order")


class KnowledgePoint(Base):
    __tablename__ = "knowledge_points"

    id = Column(Integer, primary_key=True, autoincrement=True)
    chapter_id = Column(Integer, ForeignKey("chapters.id"), nullable=False)
    name = Column(String(300), nullable=False)
    name_en = Column(String(300), default="")
    order = Column(Integer, default=0)
    category = Column(String(60), default="基础概念")
    definition = Column(Text, default="")
    explanation = Column(Text, default="")
    bloom_level = Column(Enum(BloomLevel), default=BloomLevel.understand)
    difficulty = Column(Enum(Difficulty), default=Difficulty.medium)
    prerequisites = Column(JSON, default=list)
    common_misunderstandings = Column(JSON, default=list)
    learning_path = Column(JSON, default=list)
    metadata_ = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime, default=_utcnow)

    chapter = relationship("Chapter", back_populates="knowledge_points")
    states = relationship("StudentKnowledgeState", back_populates="knowledge_point")
    error_events = relationship("ErrorEvent", back_populates="knowledge_point")


# ---------------------------------------------------------------------------
# Materials (uploaded course docs) & RAG Chunks
# ---------------------------------------------------------------------------

class Material(Base):
    __tablename__ = "materials"

    id = Column(Integer, primary_key=True, autoincrement=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)
    chapter_id = Column(Integer, ForeignKey("chapters.id"), nullable=True)
    filename = Column(String(500), nullable=False)
    file_type = Column(String(20), nullable=False)  # pdf, docx, txt
    file_size_bytes = Column(Integer, default=0)
    storage_path = Column(String(1000), default="")
    content_text = Column(Text, default="")
    status = Column(Enum(MaterialStatus), default=MaterialStatus.uploading)
    error_message = Column(Text, default="")
    chunk_count = Column(Integer, default=0)
    metadata_ = Column("metadata", JSON, default=dict)
    uploaded_at = Column(DateTime, default=_utcnow)

    course = relationship("Course", back_populates="materials")
    chapter = relationship("Chapter")
    chunks = relationship("MaterialChunk", back_populates="material")


class MaterialChunk(Base):
    __tablename__ = "material_chunks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    chunk_index = Column(Integer, default=0)
    content = Column(Text, nullable=False)
    token_count = Column(Integer, default=0)
    embedding_id = Column(String(200), default="")
    metadata_ = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime, default=_utcnow)

    material = relationship("Material", back_populates="chunks")


# ---------------------------------------------------------------------------
# Research Papers
# ---------------------------------------------------------------------------

class ResearchPaper(Base):
    __tablename__ = "research_papers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(600), nullable=False)
    title_zh = Column(String(600), default="")
    direction = Column(String(200), default="")
    venue = Column(String(300), default="")
    year = Column(Integer, default=2024)
    source_type = Column(String(60), default="学术文献")
    keywords = Column(JSON, default=list)
    abstract = Column(Text, default="")
    core_problem = Column(Text, default="")
    method_summary = Column(Text, default="")
    key_finding = Column(Text, default="")
    teaching_value = Column(Text, default="")
    research_value = Column(Text, default="")
    evidence_level = Column(Enum(EvidenceLevel), default=EvidenceLevel.medium)
    reading_difficulty = Column(Enum(Difficulty), default=Difficulty.medium)
    suggested_reading_order = Column(Integer, default=0)
    selectable = Column(Boolean, default=True)
    can_support_demo = Column(Boolean, default=False)
    demo_scenarios = Column(JSON, default=list)
    demo_questions = Column(JSON, default=list)
    discussion_prompts = Column(JSON, default=list)
    recommended_for = Column(JSON, default=list)
    experiment_learning_value = Column(Text, default="")
    defense_value = Column(Text, default="")
    related_concepts = Column(JSON, default=list)
    related_tools = Column(JSON, default=list)
    related_cases = Column(JSON, default=list)
    metadata_ = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime, default=_utcnow)


# ---------------------------------------------------------------------------
# Industry Cases
# ---------------------------------------------------------------------------

class IndustryCase(Base):
    __tablename__ = "industry_cases"

    id = Column(Integer, primary_key=True, autoincrement=True)
    case_key = Column(String(50), unique=True, nullable=False, index=True)
    title = Column(String(400), nullable=False)
    subtitle = Column(String(400), default="")
    industry_direction = Column(String(200), default="")
    company = Column(String(200), default="")
    category = Column(String(200), default="")
    real_product_or_technology = Column(String(400), default="")
    background = Column(Text, default="")
    core_problem = Column(Text, default="")
    problem_statement = Column(Text, default="")
    research_foundation = Column(Text, default="")
    application_value = Column(Text, default="")
    data_description = Column(Text, default="")
    knowledge_points = Column(JSON, default=list)
    required_abilities = Column(JSON, default=list)
    guide_questions = Column(JSON, default=list)
    references = Column(JSON, default=list)
    evaluation_dimensions = Column(JSON, default=list)
    analysis_text = Column(Text, default="")
    difficulty = Column(Enum(Difficulty), default=Difficulty.medium)
    recommended_keywords = Column(JSON, default=list)
    related_papers = Column(JSON, default=list)
    related_concepts = Column(JSON, default=list)
    linked_research_task = Column(String(200), default="")
    evidence_level = Column(Enum(EvidenceLevel), default=EvidenceLevel.medium)
    source_type = Column(Enum(SourceType), default=SourceType.academic)
    application_scenario = Column(Text, default="")
    display_focus = Column(String(500), default="")
    migration_path = Column(JSON, default=dict)
    source_urls = Column(JSON, default=list)
    is_featured = Column(Boolean, default=False)
    metadata_ = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime, default=_utcnow)


# ---------------------------------------------------------------------------
# Questions
# ---------------------------------------------------------------------------

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)
    knowledge_point_ids = Column(JSON, default=list)
    type = Column(Enum(QuestionType), nullable=False)
    stem = Column(Text, nullable=False)
    options = Column(JSON, default=list)
    answer = Column(Text, default="")
    explanation = Column(Text, default="")
    rubric = Column(JSON, default=list)
    source_refs = Column(JSON, default=list)
    bloom_level = Column(Enum(BloomLevel), default=BloomLevel.understand)
    difficulty = Column(Enum(Difficulty), default=Difficulty.medium)
    status = Column(Enum(QuestionStatus), default=QuestionStatus.draft)
    created_by = Column(String(60), default="manual")  # "ai" or "manual"
    creator_note = Column(Text, default="")
    ai_confidence = Column(Float, default=0.0)
    needs_review = Column(Boolean, default=True)
    tag_list = Column(JSON, default=list)
    metadata_ = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)

    course = relationship("Course", back_populates="questions")
    quiz_questions = relationship("QuizQuestion", back_populates="question")
    responses = relationship("Response", back_populates="question")


# ---------------------------------------------------------------------------
# Quiz
# ---------------------------------------------------------------------------

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)
    title = Column(String(400), nullable=False)
    description = Column(Text, default="")
    time_limit_minutes = Column(Integer, default=0)
    total_score = Column(Float, default=0.0)
    status = Column(Enum(QuizStatus), default=QuizStatus.draft)
    knowledge_point_ids = Column(JSON, default=list)
    metadata_ = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime, default=_utcnow)
    published_at = Column(DateTime, nullable=True)
    due_at = Column(DateTime, nullable=True)

    course = relationship("Course", back_populates="quizzes")
    quiz_questions = relationship("QuizQuestion", back_populates="quiz", order_by="QuizQuestion.order")
    attempts = relationship("Attempt", back_populates="quiz")


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    order = Column(Integer, default=0)
    score = Column(Float, default=1.0)

    quiz = relationship("Quiz", back_populates="quiz_questions")
    question = relationship("Question", back_populates="quiz_questions")


# ---------------------------------------------------------------------------
# Attempt & Response
# ---------------------------------------------------------------------------

class Attempt(Base):
    __tablename__ = "attempts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(AttemptStatus), default=AttemptStatus.in_progress)
    total_score = Column(Float, default=0.0)
    max_score = Column(Float, default=0.0)
    started_at = Column(DateTime, default=_utcnow)
    submitted_at = Column(DateTime, nullable=True)
    graded_at = Column(DateTime, nullable=True)
    metadata_ = Column("metadata", JSON, default=dict)

    quiz = relationship("Quiz", back_populates="attempts")
    user = relationship("User", back_populates="attempts")
    responses = relationship("Response", back_populates="attempt")


class Response(Base):
    __tablename__ = "responses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    attempt_id = Column(Integer, ForeignKey("attempts.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    answer_text = Column(Text, default="")
    is_correct = Column(Boolean, nullable=True)
    score = Column(Float, default=0.0)
    max_score = Column(Float, default=1.0)
    grader_type = Column(Enum(GraderType), default=GraderType.auto)
    graded_at = Column(DateTime, nullable=True)
    metadata_ = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime, default=_utcnow)

    attempt = relationship("Attempt", back_populates="responses")
    question = relationship("Question", back_populates="responses")
    grade = relationship("Grade", uselist=False, back_populates="response")


class Grade(Base):
    __tablename__ = "grades"

    id = Column(Integer, primary_key=True, autoincrement=True)
    response_id = Column(Integer, ForeignKey("responses.id"), nullable=False, unique=True)
    rubric_scores = Column(JSON, default=list)
    score_breakdown = Column(JSON, default=list)
    missing_points = Column(JSON, default=list)
    feedback = Column(Text, default="")
    confidence = Column(Float, default=0.0)
    needs_review = Column(Boolean, default=False)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    metadata_ = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime, default=_utcnow)

    response = relationship("Response", back_populates="grade")
    reviewer = relationship("User", back_populates="grades")


# ---------------------------------------------------------------------------
# Student Knowledge & Diagnosis
# ---------------------------------------------------------------------------

class StudentKnowledgeState(Base):
    __tablename__ = "student_knowledge_states"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    knowledge_point_id = Column(Integer, ForeignKey("knowledge_points.id"), nullable=False)
    mastery_level = Column(Float, default=0.0)
    total_attempts = Column(Integer, default=0)
    correct_count = Column(Integer, default=0)
    last_assessed_at = Column(DateTime, nullable=True)
    error_types = Column(JSON, default=list)
    metadata_ = Column("metadata", JSON, default=dict)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)

    user = relationship("User", back_populates="knowledge_states")
    knowledge_point = relationship("KnowledgePoint", back_populates="states")


class ErrorEvent(Base):
    __tablename__ = "error_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    knowledge_point_id = Column(Integer, ForeignKey("knowledge_points.id"), nullable=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=True)
    error_type = Column(String(200), default="")
    description = Column(Text, default="")
    context = Column(JSON, default=dict)
    created_at = Column(DateTime, default=_utcnow)

    user = relationship("User", back_populates="error_events")
    knowledge_point = relationship("KnowledgePoint", back_populates="error_events")


class WrongQuestionEntry(Base):
    __tablename__ = "wrong_question_entries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=True)
    attempt_id = Column(Integer, ForeignKey("attempts.id"), nullable=True)
    knowledge_point_ids = Column(JSON, default=list)
    error_type = Column(String(200), default="")
    review_count = Column(Integer, default=0)
    mastery_status = Column(String(60), default="not_mastered")
    last_reviewed_at = Column(DateTime, nullable=True)
    next_review_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=_utcnow)

    user = relationship("User", back_populates="wrong_questions")


# ---------------------------------------------------------------------------
# Learning Path & Recommendation
# ---------------------------------------------------------------------------

class LearningPath(Base):
    __tablename__ = "learning_paths"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(400), nullable=False)
    description = Column(Text, default="")
    steps = Column(JSON, default=list)
    status = Column(String(60), default="active")
    metadata_ = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)

    user = relationship("User", back_populates="learning_paths")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(Enum(RecommendationType), nullable=False)
    target_id = Column(String(200), default="")
    reason = Column(Text, default="")
    evidence = Column(JSON, default=list)
    priority = Column(Integer, default=0)
    is_consumed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=_utcnow)

    user = relationship("User", back_populates="recommendations")


# ---------------------------------------------------------------------------
# Knowledge Graph
# ---------------------------------------------------------------------------

class KnowledgeNode(Base):
    __tablename__ = "knowledge_nodes"

    id = Column(String(200), primary_key=True)
    label = Column(String(400), nullable=False)
    node_type = Column(Enum(NodeType), nullable=False)
    description = Column(Text, default="")
    category = Column(String(200), default="")
    metadata_ = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime, default=_utcnow)


class KnowledgeEdge(Base):
    __tablename__ = "knowledge_edges"

    id = Column(Integer, primary_key=True, autoincrement=True)
    from_node_id = Column(String(200), ForeignKey("knowledge_nodes.id"), nullable=False)
    to_node_id = Column(String(200), ForeignKey("knowledge_nodes.id"), nullable=False)
    relation_type = Column(Enum(RelationType), nullable=False)
    note = Column(String(500), default="")
    metadata_ = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime, default=_utcnow)


# ---------------------------------------------------------------------------
# Prompt Templates & Agent Runs
# ---------------------------------------------------------------------------

class PromptTemplate(Base):
    __tablename__ = "prompt_templates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    version = Column(String(30), default="1.0")
    template_type = Column(String(60), default="")
    system_prompt = Column(Text, default="")
    user_prompt_template = Column(Text, default="")
    input_schema = Column(JSON, default=dict)
    output_schema = Column(JSON, default=dict)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=_utcnow)


class AgentRun(Base):
    __tablename__ = "agent_runs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    workflow_name = Column(String(200), nullable=False)
    input_summary = Column(Text, default="")
    output_summary = Column(Text, default="")
    input_data = Column(JSON, default=dict)
    output_data = Column(JSON, default=dict)
    status = Column(Enum(WorkflowStatus), default=WorkflowStatus.pending)
    error_message = Column(Text, default="")
    tokens_used = Column(Integer, default=0)
    duration_ms = Column(Integer, default=0)
    metadata_ = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime, default=_utcnow)


# ---------------------------------------------------------------------------
# Evaluation Records
# ---------------------------------------------------------------------------

class EvaluationRecord(Base):
    __tablename__ = "evaluation_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    eval_type = Column(String(100), nullable=False)
    target_id = Column(String(200), default="")
    metric_name = Column(String(200), nullable=False)
    score = Column(Float, default=0.0)
    details = Column(JSON, default=dict)
    metadata_ = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime, default=_utcnow)
