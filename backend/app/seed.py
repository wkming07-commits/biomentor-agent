"""
Seed demo data for BioMentor Agent.

Ports the existing frontend mock data (12 papers, 15 concepts, 8 tasks, 6 cases, etc.)
into real database records so the backend is immediately usable after startup.
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models import (
    User,
    UserRole,
    Course,
    Chapter,
    KnowledgePoint,
    ResearchPaper,
    IndustryCase,
    Question,
    QuestionType,
    QuestionStatus,
    KnowledgeNode,
    KnowledgeEdge,
    NodeType,
    RelationType,
    PromptTemplate,
)


def _utcnow():
    return datetime.now(timezone.utc)


def seed_demo_data(db: Session):
    """Seed all demo data. Idempotent — skips if data already exists."""
    if db.query(Course).count() > 0:
        return

    print("[seed] Creating demo data...")

    # Use merge to be idempotent on re-runs
    _seed_users(db)
    _seed_courses(db)
    _seed_papers(db)
    _seed_industry_cases(db)
    _seed_questions(db)
    _seed_knowledge_graph(db)
    _seed_prompt_templates(db)

    db.commit()
    print("[seed] Demo data created successfully.")


def _seed_users(db: Session):
    db.add_all([
        User(id=1, name="张同学", role=UserRole.student, avatar_url=""),
        User(id=2, name="李老师", role=UserRole.teacher, avatar_url=""),
    ])
    db.flush()


def _seed_courses(db: Session):
    course = Course(
        id=1,
        name="生物制造前沿技术",
        name_en="Advanced Biomanufacturing Technologies",
        description="面向生物制造课程，涵盖基因编辑、合成生物学、mRNA技术、蛋白质工程等前沿领域的基础知识和研究进展。",
        teacher_name="李老师",
    )
    db.add(course)
    db.flush()

    chapters = [
        Chapter(id=1, course_id=1, title="基因编辑技术", order=1, description="CRISPR-Cas系统、Prime Editing、碱基编辑等精准基因编辑技术"),
        Chapter(id=2, course_id=1, title="单细胞与AI组学", order=2, description="单细胞基础模型、基因重要性评分、模型解释性"),
        Chapter(id=3, course_id=1, title="mRNA技术与递送", order=3, description="mRNA治疗、LNP递送系统、组织选择性递送"),
        Chapter(id=4, course_id=1, title="蛋白质工程与结构生物学", order=4, description="蛋白质结构预测、AI辅助蛋白质设计、定向进化"),
        Chapter(id=5, course_id=1, title="合成生物学与产业应用", order=5, description="代谢工程、细胞工厂、生物基材料、产业转化"),
    ]
    db.add_all(chapters)
    db.flush()

    kps = [
        # Ch1
        KnowledgePoint(id=1, chapter_id=1, name="CRISPR-Cas9", name_en="CRISPR-Cas9", order=1, category="前沿技术",
                       definition="CRISPR-Cas9是一种RNA引导的DNA内切酶系统，可在特定基因组位点产生双链断裂。",
                       explanation="CRISPR-Cas9系统由Cas9蛋白和sgRNA组成。sgRNA通过碱基互补配对识别目标DNA序列，Cas9在PAM序列附近切割双链。细胞通过NHEJ或HDR途径修复断裂，实现基因敲除或精准编辑。",
                       bloom_level="understand", difficulty="medium",
                       prerequisites=["分子生物学基础", "DNA结构与功能"],
                       common_misunderstandings=["CRISPR只能在细菌中使用", "基因编辑一定导致脱靶突变"]),
        KnowledgePoint(id=2, chapter_id=1, name="Prime Editing", name_en="Prime Editing", order=2, category="前沿技术",
                       definition="Prime Editing是一种精准基因编辑技术，不产生双链断裂即可实现碱基替换、插入和删除。",
                       explanation="Prime Editing使用Cas9切口酶与逆转录酶融合蛋白，通过pegRNA同时指定靶位点和编辑模板，在DNA修复过程中将所需编辑写入基因组。",
                       bloom_level="understand", difficulty="hard"),
        KnowledgePoint(id=3, chapter_id=1, name="碱基编辑", name_en="Base Editing", order=3, category="前沿技术",
                       definition="碱基编辑器可在不切割DNA双链的情况下实现C-to-T或A-to-G的碱基替换。",
                       explanation="胞嘧啶碱基编辑器(CBE)和腺嘌呤碱基编辑器(ABE)通过融合脱氨酶与Cas9切口酶，在ssDNA暴露区域内催化碱基脱氨反应。",
                       bloom_level="understand", difficulty="medium"),
        # Ch2
        KnowledgePoint(id=4, chapter_id=2, name="单细胞基础模型", name_en="Single-Cell Foundation Model", order=4, category="AI模型",
                       definition="单细胞基础模型是通过大规模scRNA-seq数据预训练的深度学习模型。",
                       explanation="这些模型在海量单细胞转录组数据上通过自监督学习训练，能够学习基因共表达模式、细胞类型特征和生物学过程的无监督表征。",
                       bloom_level="understand", difficulty="hard",
                       prerequisites=["机器学习基础", "单细胞转录组学"]),
        KnowledgePoint(id=5, chapter_id=2, name="模型解释性", name_en="Model Interpretability", order=5, category="AI模型",
                       definition="模型解释性是指从黑箱机器学习模型中提取人类可理解信号的方法论。",
                       explanation="在生物学中，模型解释性方法（如注意力权重分析、SHAP值、特征归因）可用于识别模型决策的关键基因和生物通路。",
                       bloom_level="apply", difficulty="medium"),
        # Ch3
        KnowledgePoint(id=6, chapter_id=3, name="LNP递送系统", name_en="Lipid Nanoparticle Delivery", order=6, category="应用方向",
                       definition="脂质纳米颗粒（LNP）是目前最成熟的mRNA体内递送载体。",
                       explanation="LNP由可电离阳离子脂质、辅助脂质、胆固醇和PEG化脂质组成。进入体内后通过ApoE-LDLR途径被肝脏摄取，在内涵体酸性环境中释放mRNA。",
                       bloom_level="understand", difficulty="medium"),
        KnowledgePoint(id=7, chapter_id=3, name="mRNA治疗", name_en="mRNA Therapeutics", order=7, category="应用方向",
                       definition="mRNA治疗通过递送编码治疗性蛋白的mRNA分子到体内靶细胞，使其表达目标蛋白以治疗疾病。",
                       explanation="mRNA药物不进入细胞核，无基因组整合风险。已应用于疫苗、蛋白质替代治疗、癌症免疫治疗和基因编辑等领域。",
                       bloom_level="apply", difficulty="medium"),
        # Ch4
        KnowledgePoint(id=8, chapter_id=4, name="蛋白质结构预测", name_en="Protein Structure Prediction", order=8, category="AI模型",
                       definition="AlphaFold等深度学习模型可从氨基酸序列高精度预测蛋白质三维结构。",
                       explanation="AlphaFold利用多序列比对和注意力机制，学习氨基酸间共进化信号和几何约束，预测蛋白质的原子级三维结构。pLDDT评分衡量每个残基的预测置信度。",
                       bloom_level="understand", difficulty="hard"),
        KnowledgePoint(id=9, chapter_id=4, name="定向进化", name_en="Directed Evolution", order=9, category="实验方法",
                       definition="定向进化通过在实验室中模拟自然选择来改进蛋白质功能。",
                       explanation="通过反复的突变库构建和筛选/选择循环，定向进化可以在不需要结构信息的情况下优化酶的活性、稳定性和底物特异性。AI可以加速这一过程。",
                       bloom_level="apply", difficulty="medium"),
        # Ch5
        KnowledgePoint(id=10, chapter_id=5, name="合成生物学", name_en="Synthetic Biology", order=10, category="基础概念",
                       definition="合成生物学是将工程学原理应用于生物学，设计和构建具有新功能的生物系统。",
                       explanation="合成生物学采用DBT（设计-构建-测试）工程循环，利用标准化生物部件（启动子、RBS、CDS、终止子）构建基因线路，实现可预测的细胞行为编程。",
                       bloom_level="understand", difficulty="medium"),
        KnowledgePoint(id=11, chapter_id=5, name="代谢工程", name_en="Metabolic Engineering", order=11, category="应用方向",
                       definition="代谢工程通过基因操作优化细胞代谢网络，提高目标产物的产量和产率。",
                       explanation="通过过表达限速酶、敲除竞争途径、改造调控网络等手段，重新定向代谢流量，实现化学品的微生物高效生产。",
                       bloom_level="apply", difficulty="medium"),
    ]
    db.add_all(kps)
    db.flush()


def _seed_papers(db: Session):
    papers = [
        {
            "id": 1, "title": "Scoring Gene Importance by Interpreting Single-Cell Foundation Models",
            "title_zh": "通过解释单细胞基础模型对基因重要性进行评分",
            "direction": "单细胞基因组学 / 模型解释性", "venue": "Nature Methods", "year": 2025,
            "source_type": "学术文献",
            "keywords": ["单细胞", "基础模型", "基因重要性", "模型解释性", "scRNA-seq"],
            "core_problem": "如何从单细胞基础模型的内部表征中提取基因重要性的生物学可解释信号",
            "method_summary": "利用可解释性方法（注意力权重分析和特征归因）解析单细胞基础模型的内部表征，将模型对基因的关注度映射为基因重要性评分。",
            "key_finding": "单细胞基础模型在未明确训练的情况下自动学习到基因重要性的层次化表征，其评分与CRISPR筛选和GWAS结果高度一致。",
            "teaching_value": "适合用于讲解'模型解释性'和'单细胞组学'交叉领域，帮助学生理解AI模型如何从数据中自动发现生物学规律。",
            "research_value": "为单细胞数据分析和基因功能注释提供了一种无需额外训练的计算方法。",
            "evidence_level": "high", "reading_difficulty": "medium", "suggested_reading_order": 1,
            "selectable": True, "can_support_demo": True,
            "related_concepts": ["单细胞基础模型", "模型解释性", "基因重要性"],
            "recommended_for": ["实验学习", "答辩材料", "知识图谱"],
            "experiment_learning_value": "学生可学习如何从AI模型中提取生物学信号并进行功能验证。",
            "defense_value": "展示了AI+生物学的交叉创新，从黑箱模型中提取生物学知识的方法学通用性强。",
            "demo_questions": ["为什么单细胞基础模型能够'学会'基因重要性？"],
        },
        {
            "id": 2, "title": "AI-Guided Redesign of Laboratory-Evolved Reverse Transcriptases Enhances Prime Editing",
            "title_zh": "AI引导的实验室进化逆转录酶重设计增强先导编辑效率",
            "direction": "基因编辑 / 蛋白质工程", "venue": "Nature Biotechnology", "year": 2025,
            "source_type": "学术文献",
            "keywords": ["Prime editing", "逆转录酶", "AI蛋白质设计", "定向进化", "基因编辑"],
            "core_problem": "野生型MMLV逆转录酶在Prime editing中的效率限制了临床应用",
            "method_summary": "结合实验室定向进化数据和AI蛋白质结构预测模型，对逆转录酶进行系统性重设计。",
            "key_finding": "AI重设计的逆转录酶变体在Prime editing中的编辑效率提升了3-8倍。",
            "teaching_value": "完美的'AI+实验'交叉案例，完整展示了计算与实验的闭环。",
            "research_value": "建立了通用的'AI辅助蛋白质工程'工作流程，可推广到其他酶家族。",
            "evidence_level": "high", "reading_difficulty": "medium", "suggested_reading_order": 2,
            "selectable": True, "can_support_demo": True,
            "related_concepts": ["Prime Editing", "定向进化", "蛋白质结构预测"],
            "recommended_for": ["实验学习", "答辩材料", "科研任务"],
            "experiment_learning_value": "展示了AI辅助蛋白质工程的完整流程，适合设计蛋白质工程实验课程。",
            "defense_value": "AI+实验闭环的典型案例，适合在答辩中展示交叉创新能力。",
        },
        {
            "id": 3, "title": "RNA Stabilization Elements Enhance Prime Editing Efficiency by Protecting pegRNA from Exonucleolytic Degradation",
            "title_zh": "RNA稳定元件通过保护pegRNA免受核酸外切酶降解增强Prime Editing效率",
            "direction": "基因编辑 / RNA工程", "venue": "Nature Communications", "year": 2025,
            "source_type": "学术文献",
            "keywords": ["Prime editing", "pegRNA", "RNA稳定元件", "定向进化", "核酸外切酶"],
            "core_problem": "pegRNA的细胞内快速降解是限制Prime Editing效率的主要瓶颈之一",
            "method_summary": "通过定向进化筛选出保护pegRNA的RNA稳定元件，并将其融合到pegRNA末端。",
            "key_finding": "添加RNA稳定元件的pegRNA在细胞内的半衰期延长了5-10倍，Prime Editing效率提升2-4倍。",
            "teaching_value": "展示了RNA工程在基因编辑优化中的关键作用。",
            "research_value": "RNA稳定元件策略可推广到其他依赖RNA的治疗和编辑工具。",
            "evidence_level": "high", "reading_difficulty": "medium", "suggested_reading_order": 3,
            "selectable": True, "can_support_demo": True,
            "related_concepts": ["Prime Editing", "定向进化", "RNA稳定元件"],
        },
        {
            "id": 4, "title": "CRISPR-Cas12a Variants with Engineered DNA Guides Target Cellular RNAs",
            "title_zh": "工程化DNA引导的CRISPR-Cas12a变体靶向细胞内RNA",
            "direction": "基因编辑 / RNA靶向", "venue": "Science", "year": 2025,
            "source_type": "学术文献",
            "keywords": ["CRISPR-Cas12", "DNA引导", "RNA靶向", "基因编辑", "蛋白质工程"],
            "core_problem": "Cas12a传统上只能靶向DNA，如何改造使其识别RNA",
            "method_summary": "对Cas12a进行结构引导的蛋白质工程改造，改变其核酸识别口袋，使其能够利用DNA引导链靶向RNA。",
            "key_finding": "改造后的Cas12a变体可利用DNA引导链高效靶向和切割细胞内RNA。",
            "teaching_value": "展示了蛋白质工程如何突破酶的自然底物限制。",
            "research_value": "拓展了CRISPR工具箱在RNA靶向领域的应用可能性。",
            "evidence_level": "high", "reading_difficulty": "hard", "suggested_reading_order": 4,
            "selectable": True, "can_support_demo": False,
            "related_concepts": ["CRISPR-Cas9", "蛋白质结构预测", "RNA靶向"],
        },
        {
            "id": 5, "title": "Single-Dose mRNA-LNP Therapy Reshapes Tumor Microenvironment via IRF8 and NIK Pathways",
            "title_zh": "单剂量mRNA-LNP治疗通过IRF8和NIK通路重塑肿瘤微环境",
            "direction": "mRNA治疗 / 肿瘤免疫", "venue": "Nature Cancer", "year": 2025,
            "source_type": "学术文献",
            "keywords": ["mRNA治疗", "LNP", "肿瘤微环境", "IRF8", "NIK", "免疫重塑"],
            "core_problem": "如何通过mRNA使肿瘤微环境从免疫抑制转变为免疫激活",
            "method_summary": "设计编码IRF8和NIK的mRNA-LNP，静脉注射后在肿瘤细胞中表达，重塑免疫微环境。",
            "key_finding": "单剂量mRNA-LNP显著增强了抗肿瘤免疫，肿瘤生长减缓60-80%。",
            "teaching_value": "展示了mRNA技术从疫苗到肿瘤免疫治疗的拓展应用。",
            "research_value": "开辟了基于mRNA的肿瘤免疫治疗新策略。",
            "evidence_level": "high", "reading_difficulty": "medium", "suggested_reading_order": 5,
            "selectable": True, "can_support_demo": True,
            "related_concepts": ["mRNA治疗", "LNP递送系统", "肿瘤微环境"],
            "recommended_for": ["实验学习", "答辩材料", "产业案例"],
            "defense_value": "mRNA技术产业化的前沿案例，可支撑'从基础研究到临床转化'的答辩主题。",
        },
        {
            "id": 6, "title": "Organ-Selective Lipid Nanoparticles for Precise mRNA Delivery Beyond the Liver",
            "title_zh": "器官选择性脂质纳米颗粒实现超越肝脏的精准mRNA递送",
            "direction": "药物递送 / mRNA技术", "venue": "Nature Nanotechnology", "year": 2025,
            "source_type": "学术文献",
            "keywords": ["mRNA", "LNP", "组织选择性递送", "脂质纳米颗粒"],
            "core_problem": "传统LNP天然在肝脏积累，如何实现肺、脾、骨髓等器官的选择性递送",
            "method_summary": "通过高通量筛选脂质分子库，利用组合化学方法优化LNP组成以改变其体内分布特性。",
            "key_finding": "开发出了分别靶向肺、脾和骨髓的LNP配方，器官选择性提升了10-50倍。",
            "teaching_value": "展示了配方优化对药物递送效率的革命性影响。",
            "research_value": "使mRNA治疗从'肝脏优先'进化为'器官定制'。",
            "evidence_level": "high", "reading_difficulty": "medium", "suggested_reading_order": 6,
            "selectable": True, "can_support_demo": True,
            "related_concepts": ["LNP递送系统", "mRNA治疗", "组织选择性递送"],
        },
        {
            "id": 7, "title": "TxPert: A Foundation Model for Transcriptomic Perturbation Prediction",
            "title_zh": "TxPert：转录组扰动预测的基础模型",
            "direction": "AI模型 / 转录组学", "venue": "Nature Machine Intelligence", "year": 2025,
            "source_type": "学术文献",
            "keywords": ["TxPert", "转录组", "扰动预测", "基础模型", "药物发现"],
            "core_problem": "如何在化合物处理前准确预测全基因组转录变化",
            "method_summary": "在大规模转录组扰动数据上训练Transformer模型，学习化合物-基因表达关系的通用表征。",
            "key_finding": "TxPert能在新化合物和新细胞系上进行零样本转录组扰动预测，准确率超过传统方法35%。",
            "teaching_value": "展示了AI模型如何进行'虚拟筛选'和'计算机内实验'。",
            "research_value": "可大幅加速药物发现和毒理学评估过程。",
            "evidence_level": "high", "reading_difficulty": "hard", "suggested_reading_order": 7,
            "selectable": True, "can_support_demo": False,
            "related_concepts": ["单细胞基础模型", "模型解释性", "药物发现"],
        },
        {
            "id": 8, "title": "De Novo TCR Discovery Using Zero-Shot Peptide-MHC Binding Prediction",
            "title_zh": "使用零样本肽段-MHC结合预测进行TCR De Novo发现",
            "direction": "免疫学 / AI方法", "venue": "Nature Immunology", "year": 2025,
            "source_type": "学术文献",
            "keywords": ["TCR", "抗原发现", "de novo", "零样本", "免疫"],
            "core_problem": "如何在不依赖已知训练数据的情况下预测新的抗原-TCR相互作用",
            "method_summary": "利用大规模预训练模型学习肽段-MHC结合和TCR识别的通用规律。",
            "key_finding": "零样本方法成功预测了多个新型肿瘤抗原TCR，其中3个在实验中验证有效。",
            "teaching_value": "展示了AI在免疫学中的前沿应用，适合高级课程讨论。",
            "research_value": "为个性化癌症疫苗和TCR-T细胞治疗提供了新工具。",
            "evidence_level": "medium", "reading_difficulty": "hard", "suggested_reading_order": 8,
            "selectable": True, "can_support_demo": False,
            "related_concepts": ["单细胞基础模型", "AI蛋白质设计", "免疫治疗"],
        },
        {
            "id": 9, "title": "Engineering Yeast Cell Factories for Sustainable PHA Biopolymer Production",
            "title_zh": "工程化酵母细胞工厂实现可持续PHA生物聚合物生产",
            "direction": "合成生物学 / 代谢工程", "venue": "Metabolic Engineering", "year": 2025,
            "source_type": "学术文献",
            "keywords": ["合成生物学", "代谢工程", "PHA", "酵母", "生物聚合物"],
            "core_problem": "PHA的生产成本限制了其商业化应用",
            "method_summary": "在酵母中异源表达PHA合成通路，通过代谢工程优化碳流量和辅因子平衡。",
            "key_finding": "工程化酵母的PHA产量达到细胞干重的65%，生产成本较细菌发酵降低40%。",
            "teaching_value": "完整的代谢工程案例，适合讲解从基因到产品过程的课程设计。",
            "research_value": "为生物基可降解塑料的工业化生产提供了可行路线。",
            "evidence_level": "high", "reading_difficulty": "medium", "suggested_reading_order": 9,
            "selectable": True, "can_support_demo": True,
            "related_concepts": ["代谢工程", "合成生物学", "生物基材料"],
            "recommended_for": ["实验学习", "产业案例"],
            "experiment_learning_value": "适合设计代谢工程实验课程，学生可学习碳流量分析和菌株优化策略。",
        },
        {
            "id": 10, "title": "Digital Twin of Plant Functional Genomics for Crop Improvement",
            "title_zh": "植物功能基因组学数字孪生用于作物改良",
            "direction": "数字孪生 / 植物基因组学", "venue": "Nature Plants", "year": 2025,
            "source_type": "学术文献",
            "keywords": ["数字孪生", "功能基因组", "植物", "作物改良"],
            "core_problem": "如何从海量多组学数据中整合信息指导育种决策",
            "method_summary": "构建多尺度计算模型整合基因组、转录组、蛋白组和表型数据。",
            "key_finding": "数字孪生模型成功预测了多个基因编辑组合对作物产量的累加效应。",
            "teaching_value": "展示了'系统生物学'思维和数字孪生技术在农业中的应用。",
            "research_value": "为智能育种和精准农业提供了新范式。",
            "evidence_level": "medium", "reading_difficulty": "hard", "suggested_reading_order": 10,
            "selectable": True, "can_support_demo": False,
            "related_concepts": ["数字孪生", "功能基因组", "作物改良"],
        },
        {
            "id": 11, "title": "TCR-T Cell Therapy Targeting Neoantigens in Solid Tumors",
            "title_zh": "靶向实体瘤新抗原的TCR-T细胞治疗",
            "direction": "免疫治疗 / 细胞治疗", "venue": "New England Journal of Medicine", "year": 2025,
            "source_type": "学术文献",
            "keywords": ["TCR-T", "实体瘤", "新抗原", "免疫治疗", "个性化医疗"],
            "core_problem": "CAR-T在实体瘤中的效果有限，TCR-T能否突破这一瓶颈",
            "method_summary": "通过多组学分析鉴定患者特异性新抗原，筛选高亲和力TCR，制备个性化TCR-T细胞。",
            "key_finding": "个性化TCR-T治疗使60%的晚期实体瘤患者出现客观缓解。",
            "teaching_value": "展示了从基因组学到细胞治疗的个性化医疗全流程。",
            "research_value": "标志着实体瘤细胞治疗的重要突破。",
            "evidence_level": "high", "reading_difficulty": "medium", "suggested_reading_order": 11,
            "selectable": True, "can_support_demo": True,
            "related_concepts": ["细胞治疗", "免疫治疗", "个性化医疗"],
        },
        {
            "id": 12, "title": "Enzymatic Cascade for Sustainable Biocatalytic Synthesis of Pharmaceuticals",
            "title_zh": "酶级联反应用于可持续的生物催化药物合成",
            "direction": "酶工程 / 绿色化学", "venue": "Nature Catalysis", "year": 2025,
            "source_type": "学术文献",
            "keywords": ["酶催化", "级联反应", "绿色化学", "药物合成"],
            "core_problem": "传统化学合成药物能耗高、污染大，如何用酶催化替代",
            "method_summary": "设计多酶级联反应，在温和条件下实现复杂药物分子的全合成。",
            "key_finding": "15步酶级联反应成功合成了FDA批准的两种药物，总收率超过化学合成2倍。",
            "teaching_value": "展示绿色化学和酶工程在制药工业中的应用前景。",
            "research_value": "为药物制造的绿色转型提供了技术路线。",
            "evidence_level": "high", "reading_difficulty": "medium", "suggested_reading_order": 12,
            "selectable": True, "can_support_demo": True,
            "related_concepts": ["酶催化", "定向进化", "绿色化学"],
            "recommended_for": ["实验学习", "产业案例"],
            "experiment_learning_value": "适合设计酶催化实验课程，展示绿色化学理念。",
        },
    ]

    for p in papers:
        db.add(ResearchPaper(**p))
    db.flush()


def _seed_industry_cases(db: Session):
    cases = [
        {
            "id": 1, "case_key": "case-001",
            "title": "细胞凋亡与抗肿瘤药物研发",
            "subtitle": "从线粒体凋亡通路到靶向抗癌药物",
            "industry_direction": "药物研发",
            "background": "细胞凋亡（apoptosis）是机体维持组织稳态的核心程序性死亡机制。线粒体途径（内源性凋亡通路）受Bcl-2家族蛋白精确调控：抗凋亡蛋白（BCL-2、BCL-XL、MCL-1）与促凋亡蛋白（BAX、BAK）之间的动态平衡决定细胞命运。在多种血液肿瘤中，肿瘤细胞通过高表达BCL-2来逃避凋亡，形成对BCL-2的「凋亡成瘾」。这一发现使BCL-2成为极具吸引力的抗肿瘤靶点。",
            "core_problem": "如何基于凋亡信号通路开发选择性诱导肿瘤细胞凋亡的小分子药物",
            "research_foundation": "线粒体外膜通透化（MOMP）机制研究揭示Bcl-2家族蛋白在凋亡调控中的核心作用，抗凋亡蛋白BCL-2、BCL-XL、MCL-1通过结合并抑制促凋亡效应蛋白BAX/BAK维持线粒体完整性。结构生物学解析了BH3结构域与BCL-2疏水沟槽的结合模式，为BH3模拟物设计提供了分子蓝图。",
            "application_value": "Venetoclax（ABT-199）作为首个获批的BCL-2选择性抑制剂，已用于慢性淋巴细胞白血病（CLL）和急性髓系白血病（AML）治疗，单药及联合方案均显示显著疗效，全球年销售额超20亿美元。",
            "knowledge_points": ["细胞凋亡", "caspase家族", "线粒体途径", "Bcl-2家族", "p53信号通路"],
            "required_abilities": ["机制解释能力", "实验设计能力", "数据分析能力"],
            "recommended_keywords": ["apoptosis", "BH3 mimetics", "mitochondrial priming", "drug resistance", "combination therapy"],
            "linked_research_task": "BH3 profiling实验设计",
            "evidence_level": "high",
            "source_type": "academic",
            "application_scenario": "Venetoclax研发历程是结构生物学驱动药物设计的经典范式：从Abbott实验室的片段筛选获得初始苗头化合物，通过基于NMR和X射线晶体学的结构优化逐步提高亲和力和选择性，最终研发出口服生物利用度良好的BCL-2选择性抑制剂。",
            "display_focus": "BCL-2蛋白结构解析 → BH3模拟物分子设计 → 临床试验与伴随诊断",
            "migration_path": {
                "textbookBase": ["细胞凋亡的分子机制", "线粒体结构与功能", "蛋白质-蛋白质相互作用"],
                "researchFrontier": ["BCL-2家族蛋白结构解析", "BH3模拟物药物设计", "凋亡启动概念"],
                "industryApplication": ["Venetoclax(ABT-199)获FDA批准", "BH3 profiling伴随诊断", "BCL-2/MCL-1双靶联合治疗"],
            },
            "references": [
                {"title": "Venetoclax FDA Approval (CLL)", "url": "https://www.fda.gov/drugs/resources-information-approved-drugs/venetoclax", "type": "FDA"},
                {"title": "ABT-199, a potent and selective BCL-2 inhibitor", "url": "https://doi.org/10.1038/nm.3048", "type": "DOI"},
                {"title": "Mitochondrial priming and BH3 profiling in cancer therapy", "url": "https://pubmed.ncbi.nlm.nih.gov/27767093/", "type": "PubMed"},
            ],
            "difficulty": "medium", "is_featured": True,
        },
        {
            "id": 2, "case_key": "case-002",
            "title": "CAR-T 细胞治疗与肿瘤免疫",
            "subtitle": "从T细胞识别机制到工程化免疫细胞药物",
            "industry_direction": "细胞治疗",
            "background": "T细胞通过TCR识别MHC呈递的抗原来杀伤靶细胞，但肿瘤细胞常下调MHC逃避免疫识别。CAR-T技术通过基因工程将抗体衍生的单链可变区（scFv）与T细胞激活信号域融合，使T细胞不依赖MHC即可识别肿瘤表面抗原。CD19因在B细胞谱系中特异性高表达而成为首个成功的CAR-T靶点。",
            "core_problem": "如何设计和制备嵌合抗原受体T细胞（CAR-T）实现血液肿瘤的精准杀伤，并突破实体瘤治疗瓶颈",
            "research_foundation": "CAR结构从第一代（仅CD3ζ信号域）演进到第四代（TRUCK/装甲CAR），共刺激域（CD28、4-1BB）的引入显著增强了T细胞增殖和持久性。CAR-T制备涉及患者T细胞采集、体外激活、慢病毒载体转导和扩增、回输前清淋预处理等关键工艺环节。",
            "application_value": "CD19 CAR-T产品（Kymriah、Yescarta、Tecartus、Breyanzi）已被FDA批准用于多种B细胞恶性肿瘤，总体缓解率达70-90%。BCMA CAR-T用于多发性骨髓瘤。全球CAR-T市场预计2030年超200亿美元。",
            "knowledge_points": ["T细胞受体", "免疫突触", "CAR结构域设计", "细胞因子信号", "肿瘤免疫微环境"],
            "required_abilities": ["机制解释能力", "实验设计能力", "证据判断能力"],
            "recommended_keywords": ["CAR-T", "immunotherapy", "chimeric antigen receptor", "CRS", "solid tumor", "allogeneic"],
            "linked_research_task": "CAR结构域功能分析与优化",
            "evidence_level": "high",
            "source_type": "clinical_trial",
            "application_scenario": "CAR-T治疗流程：患者外周血分离T细胞 → 体外T细胞激活（抗CD3/CD28磁珠）→ 慢病毒载体转导CAR基因 → 体外扩增至治疗剂量 → 清淋预处理 → CAR-T回输 → 监测细胞因子释放综合征（CRS）和神经毒性。",
            "display_focus": "CAR结构域工程 → 细胞制备工艺 → 临床疗效与安全性管理",
            "migration_path": {
                "textbookBase": ["T细胞活化与信号转导", "抗原-抗体特异性识别", "细胞培养与基因转导"],
                "researchFrontier": ["CAR结构域迭代优化(CD28/4-1BB)", "CRS机制与IL-6阻断策略", "实体瘤微环境免疫逃逸"],
                "industryApplication": ["CD19 CAR-T(Kymriah/Yescarta)", "BCMA CAR-T治疗多发性骨髓瘤", "通用型CAR-T与CAR-NK研发"],
            },
            "references": [
                {"title": "Kymriah FDA Approval", "url": "https://www.fda.gov/vaccines-blood-biologics/cellular-gene-therapy-products/kymriah", "type": "FDA"},
                {"title": "Chimeric Antigen Receptor T Cells for Sustained Remissions in Leukemia", "url": "https://doi.org/10.1056/NEJMoa1407222", "type": "DOI"},
            ],
            "difficulty": "hard", "is_featured": True,
        },
        {
            "id": 3, "case_key": "case-003",
            "title": "PD-1/PD-L1 免疫检查点抑制剂",
            "subtitle": "从免疫耐受机制到广谱抗肿瘤免疫药物",
            "industry_direction": "药物研发",
            "background": "免疫检查点是维持免疫耐受、防止自身免疫的关键机制。1992年日本科学家本庶佑发现PD-1分子，后续研究揭示肿瘤细胞通过高表达PD-L1劫持这一通路来逃避免疫攻击。PD-1抑制剂的成功标志着肿瘤治疗从化疗、靶向治疗迈入免疫治疗时代。",
            "core_problem": "如何通过阻断PD-1/PD-L1免疫检查点通路恢复肿瘤微环境中T细胞的杀伤功能",
            "research_foundation": "PD-1是T细胞表面的免疫抑制性受体，其配体PD-L1/PD-L2在多种肿瘤细胞和肿瘤浸润免疫细胞上高表达。PD-1/PD-L1结合后通过SHP-2磷酸酶去磷酸化TCR信号通路关键分子，抑制T细胞增殖和效应功能。阻断这一相互作用的单克隆抗体可解除免疫抑制，恢复抗肿瘤免疫。",
            "application_value": "PD-1抑制剂（Pembrolizumab/Keytruda、Nivolumab/Opdivo）和PD-L1抑制剂（Atezolizumab/Tecentriq）已被批准用于黑色素瘤、非小细胞肺癌、肾细胞癌、霍奇金淋巴瘤等20余种肿瘤适应症。Keytruda年销售额超250亿美元。",
            "knowledge_points": ["T细胞活化", "共刺激信号", "免疫检查点", "肿瘤抗原呈递", "T细胞耗竭"],
            "required_abilities": ["机制解释能力", "文献检索能力", "证据判断能力"],
            "recommended_keywords": ["PD-1", "PD-L1", "immune checkpoint", "immunotherapy", "Keytruda", "TMB", "MSI-H"],
            "linked_research_task": "肿瘤突变负荷（TMB）与免疫治疗响应预测",
            "evidence_level": "high",
            "source_type": "academic",
            "display_focus": "PD-1通路发现 → 抗体药物开发 → 生物标志物伴随诊断 → 泛癌种适应症扩展",
            "migration_path": {
                "textbookBase": ["T细胞活化与共信号调控", "免疫耐受与自身免疫", "抗体结构与功能"],
                "researchFrontier": ["PD-1/PD-L1结构解析与阻断", "肿瘤突变负荷(TMB)预测", "免疫联合治疗策略"],
                "industryApplication": ["Keytruda获批MSI-H泛实体瘤", "PD-L1 IHC伴随诊断试剂", "LAG-3/TIGIT新一代靶点"],
            },
            "difficulty": "medium", "is_featured": True,
        },
        {
            "id": 4, "case_key": "case-004",
            "title": "mRNA 疫苗递送技术",
            "subtitle": "从核酸化学修饰到脂质纳米颗粒疫苗平台",
            "industry_direction": "疫苗研发",
            "background": "mRNA疫苗的概念早在1990年代即被提出，但长期受困于mRNA不稳定性和强免疫原性。Katalin Karikó和Drew Weissman在2005年发现将假尿苷掺入mRNA可显著降低TLR介导的固有免疫识别，这一突破性发现使他们获得2023年诺贝尔生理学或医学奖。",
            "core_problem": "如何设计稳定的mRNA分子和高效LNP递送系统，使外源mRNA在体内安全高效地表达抗原蛋白并诱导保护性免疫",
            "research_foundation": "mRNA疫苗技术的核心突破包括：(1) 假尿苷修饰降低mRNA的固有免疫刺激，提高翻译效率；(2) 可电离阳离子脂质设计使LNP在生理pH下呈中性而在内体酸性环境中质子化（促进内体逃逸）；(3) 5'帽结构和3' poly(A)尾优化增强mRNA稳定性和翻译。",
            "application_value": "Pfizer-BioNTech和Moderna的COVID-19 mRNA疫苗在疫情中展现>90%保护效力，全球接种超百亿剂。mRNA技术平台正迅速拓展至流感、RSV、CMV等传染病疫苗以及个性化肿瘤疫苗领域。",
            "knowledge_points": ["中心法则", "mRNA翻译", "核酸化学", "脂质纳米颗粒", "抗原呈递"],
            "required_abilities": ["机制解释能力", "文献检索能力", "数据分析能力"],
            "recommended_keywords": ["mRNA vaccine", "LNP", "lipid nanoparticle", "pseudouridine", "nucleoside modification", "ionizable lipid"],
            "linked_research_task": "mRNA序列优化与抗原表达效率评估",
            "evidence_level": "high",
            "source_type": "academic",
            "display_focus": "mRNA化学修饰(Ψ) → LNP递送系统 → 快速响应式疫苗平台 → 肿瘤新抗原疫苗",
            "migration_path": {
                "textbookBase": ["中心法则与蛋白质翻译", "核酸结构与化学修饰", "脂质双分子层与纳米颗粒"],
                "researchFrontier": ["假尿苷修饰降低免疫原性", "可电离脂质设计与内体逃逸", "自扩增RNA(saRNA)"],
                "industryApplication": ["COVID-19 mRNA疫苗(Pfizer/Moderna)", "个性化肿瘤新抗原疫苗", "mRNA治疗性蛋白表达"],
            },
            "difficulty": "medium", "is_featured": True,
        },
        {
            "id": 5, "case_key": "case-005",
            "title": "CRISPR 基因编辑治疗",
            "subtitle": "从细菌适应性免疫到精准人类基因修复",
            "industry_direction": "细胞治疗",
            "background": "CRISPR是细菌和古菌的适应性免疫系统。2012年Jennifer Doudna和Emmanuelle Charpentier证明CRISPR-Cas9可作为可编程的基因编辑工具，两人于2020年获诺贝尔化学奖。CRISPR技术相比ZFN和TALEN具有设计简便、效率高、可多路编辑等革命性优势。",
            "core_problem": "如何利用CRISPR基因编辑技术实现安全高效的人类细胞基因修复，治疗遗传性疾病和肿瘤",
            "research_foundation": "CRISPR-Cas9系统由sgRNA和Cas9核酸内切酶组成。sgRNA通过20nt的间隔序列与靶DNA互补配对，引导Cas9在PAM序列上游3bp处产生DNA双链断裂（DSB），随后通过非同源末端连接（NHEJ）或同源定向修复（HDR）完成基因编辑。",
            "application_value": "CRISPR编辑的CTX001（Casgevy）用于镰刀细胞贫血和β地中海贫血的体外基因编辑疗法获FDA和EMA批准，是首个获批的CRISPR疗法。体内基因编辑、CRISPR编辑CAR-T等数十项临床试验正在进行中。",
            "knowledge_points": ["CRISPR-Cas9", "DNA修复机制", "基因表达调控", "sgRNA设计", "脱靶效应"],
            "required_abilities": ["文献检索能力", "实验设计能力", "证据判断能力"],
            "recommended_keywords": ["CRISPR-Cas9", "sgRNA design", "HDR", "prime editing", "off-target", "gene therapy", "base editor"],
            "linked_research_task": "sgRNA靶点设计与脱靶分析",
            "evidence_level": "high",
            "source_type": "clinical_trial",
            "display_focus": "Cas9-sgRNA复合体机制 → 递送策略(AAV/LNP) → 脱靶检测与安全性 → 临床适应症拓展",
            "migration_path": {
                "textbookBase": ["DNA双链断裂与修复", "中心法则与基因表达", "核酸酶的结构与功能"],
                "researchFrontier": ["CRISPR-Cas9机制与PAM识别", "碱基编辑器与先导编辑器", "脱靶检测方法(GUIDE-seq)"],
                "industryApplication": ["Casgevy(CTX001)镰刀细胞贫血", "体内基因编辑(Intellia NTLA-2001)", "CRISPR编辑CAR-T实体瘤"],
            },
            "references": [
                {"title": "Casgevy FDA Approval", "url": "https://www.fda.gov/vaccines-blood-biologics/casgevy", "type": "FDA"},
                {"title": "A Programmable Dual-RNA–Guided DNA Endonuclease in Adaptive Bacterial Immunity", "url": "https://doi.org/10.1126/science.1225829", "type": "DOI"},
            ],
            "difficulty": "hard", "is_featured": True,
        },
    ]

    for c in cases:
        db.add(IndustryCase(**c))
    db.flush()


def _seed_questions(db: Session):
    questions = [
        {
            "id": 1, "course_id": 1, "knowledge_point_ids": ["1"],
            "type": QuestionType.choice, "stem": "CRISPR-Cas9系统中负责识别靶序列的关键组成是？",
            "options": [
                {"label": "A", "text": "gRNA"},
                {"label": "B", "text": "葡萄糖"},
                {"label": "C", "text": "脂滴"},
                {"label": "D", "text": "核糖体"},
            ],
            "answer": "A",
            "explanation": "gRNA（引导RNA）通过碱基互补配对识别目标DNA序列，将Cas9蛋白引导到特定的基因组位点进行切割。",
            "difficulty": "easy", "status": QuestionStatus.published, "created_by": "manual",
        },
        {
            "id": 2, "course_id": 1, "knowledge_point_ids": ["1"],
            "type": QuestionType.truefalse, "stem": "CRISPR-Cas9切割DNA后，细胞只能通过NHEJ途径修复。（判断对错）",
            "answer": "错误",
            "explanation": "细胞修复DNA双链断裂有两条主要途径：非同源末端连接（NHEJ）和同源定向修复（HDR）。在有模板链存在时，HDR可实现精准修复或插入。",
            "difficulty": "easy", "status": QuestionStatus.published, "created_by": "manual",
        },
        {
            "id": 3, "course_id": 1, "knowledge_point_ids": ["2"],
            "type": QuestionType.choice, "stem": "Prime Editing与经典CRISPR-Cas9相比，以下哪项是其主要优势？",
            "options": [
                {"label": "A", "text": "不需要gRNA"},
                {"label": "B", "text": "不产生DNA双链断裂，可实现精准碱基替换"},
                {"label": "C", "text": "编辑效率始终为100%"},
                {"label": "D", "text": "可以在任意细胞中自主进入核内"},
            ],
            "answer": "B",
            "explanation": "Prime Editing使用Cas9切口酶和逆转录酶融合蛋白，不产生DNA双链断裂，避免了NHEJ修复引入的随机indel，能够实现精准的碱基替换、小片段插入和删除。",
            "difficulty": "medium", "status": QuestionStatus.published, "created_by": "manual",
        },
        {
            "id": 4, "course_id": 1, "knowledge_point_ids": ["6", "7"],
            "type": QuestionType.choice, "stem": "脂质纳米颗粒（LNP）递送mRNA药物时，哪种组分在内涵体酸性环境中发挥关键作用？",
            "options": [
                {"label": "A", "text": "PEG化脂质"},
                {"label": "B", "text": "胆固醇"},
                {"label": "C", "text": "可电离阳离子脂质"},
                {"label": "D", "text": "辅助脂质"},
            ],
            "answer": "C",
            "explanation": "可电离阳离子脂质在低pH（内涵体环境）时质子化带正电，促进LNP膜与内涵体膜的融合，释放mRNA到细胞质中。",
            "difficulty": "medium", "status": QuestionStatus.published, "created_by": "manual",
        },
        {
            "id": 5, "course_id": 1, "knowledge_point_ids": ["7"],
            "type": QuestionType.truefalse, "stem": "mRNA药物进入体内后可能整合到宿主细胞基因组中。（判断对错）",
            "answer": "错误",
            "explanation": "mRNA不进入细胞核，只在细胞质中进行翻译，因此不存在基因组整合的风险。这是mRNA药物相比DNA载体的重要安全优势。",
            "difficulty": "easy", "status": QuestionStatus.published, "created_by": "manual",
        },
        {
            "id": 6, "course_id": 1, "knowledge_point_ids": ["4"],
            "type": QuestionType.short_answer, "stem": "请说明单细胞基础模型如何用于识别重要基因。",
            "answer": "单细胞基础模型通过自监督预训练在海量数据中学习基因共表达模式。模型内部的注意力权重可反映基因在不同细胞状态下的相对重要性，高注意力基因往往与细胞功能密切相关。通过可解释性方法（如特征归因和注意力分析）可以提取基因重要性排名，并与CRISPR筛选等实验数据交叉验证。",
            "explanation": "考查学生对AI模型在生物学发现中应用的理解。",
            "rubric": [
                {"dimension": "预训练原理", "max_score": 3, "description": "是否理解自监督学习的基本原理"},
                {"dimension": "解释性方法", "max_score": 4, "description": "是否说明如何提取重要性信号"},
                {"dimension": "验证逻辑", "max_score": 3, "description": "是否提到实验验证的必要性"},
            ],
            "difficulty": "hard", "status": QuestionStatus.published, "created_by": "manual",
        },
        {
            "id": 7, "course_id": 1, "knowledge_point_ids": ["1", "2"],
            "type": QuestionType.research, "stem": "如果要进一步提升Prime editing的编辑效率，可以从哪些分子元件或实验条件入手？请结合文献研究思路回答。",
            "answer": "可以从以下维度入手：（1）逆转录酶改造——利用AI辅助蛋白质设计优化RT的催化效率和持续合成能力；（2）pegRNA优化——通过定向进化筛选RNA稳定元件，延长pegRNA在细胞内的半衰期；（3）两者协同——改造型RT加稳定化pegRNA的组合有望产生叠加效应。",
            "explanation": "考查学生能否将多个文献的研究策略进行整合思考，提出系统性的优化方案。",
            "rubric": [
                {"dimension": "多维度分析", "max_score": 4, "description": "是否从多个角度分析优化策略"},
                {"dimension": "文献整合", "max_score": 3, "description": "是否引用相关文献支撑论点"},
                {"dimension": "创新性", "max_score": 3, "description": "是否提出有见地的组合策略"},
            ],
            "difficulty": "hard", "status": QuestionStatus.published, "created_by": "manual",
        },
        {
            "id": 8, "course_id": 1, "knowledge_point_ids": ["10", "11"],
            "type": QuestionType.industry, "stem": "合成生物学制造的生物基产品在商业化过程中面临哪些主要挑战？请从技术、成本和监管三个角度分析。",
            "answer": "技术方面：需要提高菌株的产量、产率和稳定性，实现从实验室到工厂的规模化放大。成本方面：需要降低原料成本（如使用廉价碳源），优化发酵和下游纯化工艺。监管方面：基因工程菌的安全性评估、产品审批路径和市场准入。",
            "explanation": "考查学生的产业思维和技术转化意识。",
            "rubric": [
                {"dimension": "技术分析", "max_score": 3, "description": "是否准确识别关键技术瓶颈"},
                {"dimension": "成本意识", "max_score": 3, "description": "是否有经济可行性考量"},
                {"dimension": "监管理解", "max_score": 4, "description": "是否了解生物制品的监管框架"},
            ],
            "difficulty": "medium", "status": QuestionStatus.published, "created_by": "manual",
        },
    ]

    for q in questions:
        db.add(Question(**q))
    db.flush()


def _seed_knowledge_graph(db: Session):
    nodes = [
        KnowledgeNode(id="conc-crispr", label="CRISPR-Cas9", node_type=NodeType.concept, description="RNA引导的DNA内切酶系统", category="前沿技术"),
        KnowledgeNode(id="conc-pe", label="Prime Editing", node_type=NodeType.concept, description="精准基因编辑技术", category="前沿技术"),
        KnowledgeNode(id="conc-scfm", label="单细胞基础模型", node_type=NodeType.concept, description="单细胞转录组预训练模型", category="AI模型"),
        KnowledgeNode(id="conc-mrna", label="mRNA治疗", node_type=NodeType.concept, description="mRNA药物和治疗性蛋白表达", category="应用方向"),
        KnowledgeNode(id="conc-lnp", label="LNP递送系统", node_type=NodeType.concept, description="脂质纳米颗粒递送载体", category="应用方向"),
        KnowledgeNode(id="conc-synbio", label="合成生物学", node_type=NodeType.concept, description="工程化生物系统设计", category="基础概念"),
        KnowledgeNode(id="conc-af", label="蛋白质结构预测", node_type=NodeType.concept, description="AlphaFold蛋白质三维结构预测", category="AI模型"),

        KnowledgeNode(id="paper-001", label="单细胞基因重要性评分", node_type=NodeType.paper, description="从单细胞基础模型提取基因重要性", category="单细胞基因组学"),
        KnowledgeNode(id="paper-002", label="AI重设计逆转录酶", node_type=NodeType.paper, description="AI辅助蛋白质工程增强PE效率", category="基因编辑"),
        KnowledgeNode(id="paper-005", label="mRNA-LNP重塑肿瘤微环境", node_type=NodeType.paper, description="单剂量mRNA-LNP治疗", category="mRNA治疗"),
        KnowledgeNode(id="paper-006", label="器官选择性LNP", node_type=NodeType.paper, description="超越肝脏的精准mRNA递送", category="药物递送"),

        KnowledgeNode(id="tool-protein", label="蛋白结构查看器", node_type=NodeType.tool, description="3D蛋白质结构可视化", category="工具平台"),
        KnowledgeNode(id="tool-sequence", label="序列分析工具", node_type=NodeType.tool, description="DNA/RNA序列分析", category="工具平台"),
        KnowledgeNode(id="tool-pathway", label="通路图谱浏览", node_type=NodeType.tool, description="生物通路可视化", category="工具平台"),

        KnowledgeNode(id="case-mrna-vax", label="mRNA疫苗产业化", node_type=NodeType.case, description="42天从序列到疫苗", category="mRNA疫苗"),
        KnowledgeNode(id="case-pha", label="PHA生物基塑料", node_type=NodeType.case, description="合成生物学制造可降解塑料", category="合成生物学"),
    ]
    db.add_all(nodes)
    db.flush()

    edges = [
        KnowledgeEdge(from_node_id="conc-crispr", to_node_id="conc-pe", relation_type=RelationType.improves, note="PE是CRISPR的改进型"),
        KnowledgeEdge(from_node_id="conc-scfm", to_node_id="paper-001", relation_type=RelationType.references_paper, note="核心论文"),
        KnowledgeEdge(from_node_id="conc-pe", to_node_id="paper-002", relation_type=RelationType.references_paper, note="技术优化论文"),
        KnowledgeEdge(from_node_id="conc-mrna", to_node_id="conc-lnp", relation_type=RelationType.prerequisite, note="mRNA需要LNP递送"),
        KnowledgeEdge(from_node_id="conc-lnp", to_node_id="paper-006", relation_type=RelationType.references_paper, note="递送系统"),
        KnowledgeEdge(from_node_id="conc-mrna", to_node_id="paper-005", relation_type=RelationType.references_paper, note="mRNA治疗"),
        KnowledgeEdge(from_node_id="conc-mrna", to_node_id="case-mrna-vax", relation_type=RelationType.links_case, note="产业应用"),
        KnowledgeEdge(from_node_id="conc-synbio", to_node_id="case-pha", relation_type=RelationType.links_case, note="PHA生产"),
        KnowledgeEdge(from_node_id="conc-af", to_node_id="tool-protein", relation_type=RelationType.uses_tool, note="结构可视化"),
        KnowledgeEdge(from_node_id="conc-crispr", to_node_id="tool-sequence", relation_type=RelationType.uses_tool, note="序列分析"),
    ]
    db.add_all(edges)
    db.flush()


def _seed_prompt_templates(db: Session):
    templates = [
        {
            "id": 1, "name": "question_generation_v1", "version": "1.0",
            "template_type": "question_generation",
            "system_prompt": "你是一位生物制造领域的教育专家。请根据提供的知识点和参考材料，生成高质量的测评题目。",
            "user_prompt_template": "知识点：{knowledge_points}\n参考材料：{evidence}\n题目类型：{question_types}\n数量：{count}\n难度：{difficulty}\n\n请生成JSON格式的题目列表，每道题包含：stem, options(选择题), answer, explanation, rubric(主观题)。",
            "input_schema": {"knowledge_points": "list[str]", "evidence": "str", "question_types": "list[str]", "count": "int", "difficulty": "str"},
            "output_schema": {"questions": "list[object]"},
        },
        {
            "id": 2, "name": "grading_v1", "version": "1.0",
            "template_type": "subjective_grading",
            "system_prompt": "你是一位严格的生物制造课程评分专家。请根据评分标准对学生的答案进行分项评分。",
            "user_prompt_template": "题目：{question_stem}\n参考答案：{reference_answer}\n评分标准：{rubric}\n学生答案：{student_answer}\n\n请给出分项评分、总得分、失分要点和针对性反馈。",
            "input_schema": {"question_stem": "str", "reference_answer": "str", "rubric": "list[object]", "student_answer": "str"},
            "output_schema": {"score_breakdown": "list[object]", "total_score": "float", "missing_points": "list[str]", "feedback": "str", "confidence": "float"},
        },
        {
            "id": 3, "name": "diagnosis_v1", "version": "1.0",
            "template_type": "knowledge_diagnosis",
            "system_prompt": "你是一位学习诊断专家。请分析学生的答题记录，识别知识薄弱点和错误类型。",
            "user_prompt_template": "学生答题记录：{attempt_data}\n知识体系：{knowledge_structure}\n\n请识别：(1)薄弱知识点 (2)常见错误类型 (3)个性化学习建议。",
        },
    ]

    for t in templates:
        db.add(PromptTemplate(**t))
    db.flush()
