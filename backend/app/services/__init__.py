from app.services.bio_tools import (
    analyze_sequence,
    external_tool_status,
    parse_plasmid_features,
    pathway_record,
    resolve_protein_structure,
)
from app.services.knowledge import KnowledgeService
from app.services.questions import QuestionService
from app.services.quiz import QuizService
from app.services.grading import GradingService
from app.services.diagnosis import DiagnosisService
from app.services.recommendation import RecommendationService
from app.services.cases import IndustryCaseService
from app.services.ingestion import IngestionService
from app.services.graph import KnowledgeGraphService
from app.services.agent import AgentOrchestrator
from app.services.photo_learning import PhotoLearningService
from app.services.papers import PaperService
