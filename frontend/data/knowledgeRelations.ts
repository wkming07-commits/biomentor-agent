// ============================================================
// BioMentor Agent — Knowledge Relations
// 知识关系：至少 35 条关系，连接 concepts、papers、tools、tasks
// ============================================================

import type { KnowledgeRelation } from "@/lib/knowledgeTypes";

export const knowledgeRelations: KnowledgeRelation[] = [
  // ---- 概念间关系 ----
  { id: "rel-001", fromId: "conc-004", toId: "conc-005", type: "依赖", note: "Prime editing 依赖 逆转录酶改造" },
  { id: "rel-002", fromId: "conc-004", toId: "conc-006", type: "改进", note: "Prime editing 改进 RNA 稳定元件" },
  { id: "rel-003", fromId: "conc-007", toId: "conc-008", type: "应用于", note: "CRISPR-Cas12 应用于 RNA 靶向" },
  { id: "rel-004", fromId: "conc-001", toId: "conc-003", type: "解释", note: "单细胞基础模型 解释 基因重要性" },
  { id: "rel-005", fromId: "conc-002", toId: "conc-001", type: "解释", note: "模型解释性 解释 单细胞基础模型" },
  { id: "rel-006", fromId: "conc-011", toId: "conc-012", type: "应用于", note: "LNP 递送 应用于 mRNA 治疗" },
  { id: "rel-007", fromId: "conc-013", toId: "conc-014", type: "应用于", note: "TCR 特异性 应用于 抗原发现" },
  { id: "rel-008", fromId: "conc-015", toId: "conc-001", type: "依赖", note: "知识图谱扰动预测 依赖 单细胞基础模型" },
  { id: "rel-009", fromId: "conc-001", toId: "conc-002", type: "依赖", note: "单细胞基础模型 依赖 模型解释性" },

  // ---- 概念-文献关系 ----
  { id: "rel-010", fromId: "paper-001", toId: "conc-001", type: "关联文献", note: "paper-001 关联 单细胞基础模型" },
  { id: "rel-011", fromId: "paper-001", toId: "conc-002", type: "关联文献", note: "paper-001 关联 模型解释性" },
  { id: "rel-012", fromId: "paper-001", toId: "conc-003", type: "关联文献", note: "paper-001 关联 基因重要性" },
  { id: "rel-013", fromId: "paper-002", toId: "conc-004", type: "关联文献", note: "paper-002 关联 Prime editing" },
  { id: "rel-014", fromId: "paper-002", toId: "conc-005", type: "关联文献", note: "paper-002 关联 逆转录酶改造" },
  { id: "rel-015", fromId: "paper-003", toId: "conc-004", type: "关联文献", note: "paper-003 关联 Prime editing" },
  { id: "rel-016", fromId: "paper-003", toId: "conc-006", type: "关联文献", note: "paper-003 关联 RNA 稳定元件" },
  { id: "rel-017", fromId: "paper-004", toId: "conc-009", type: "关联文献", note: "paper-004 关联 de novo peptide sequencing" },
  { id: "rel-018", fromId: "paper-004", toId: "conc-010", type: "关联文献", note: "paper-004 关联 翻译后修饰" },
  { id: "rel-019", fromId: "paper-005", toId: "conc-007", type: "关联文献", note: "paper-005 关联 CRISPR-Cas12" },
  { id: "rel-020", fromId: "paper-005", toId: "conc-008", type: "关联文献", note: "paper-005 关联 RNA 靶向" },
  { id: "rel-021", fromId: "paper-006", toId: "conc-007", type: "关联文献", note: "paper-006 关联 CRISPR-Cas12" },
  { id: "rel-022", fromId: "paper-006", toId: "conc-008", type: "关联文献", note: "paper-006 关联 RNA 靶向" },
  { id: "rel-023", fromId: "paper-007", toId: "conc-011", type: "关联文献", note: "paper-007 关联 LNP 递送" },
  { id: "rel-024", fromId: "paper-007", toId: "conc-012", type: "关联文献", note: "paper-007 关联 mRNA 治疗" },
  { id: "rel-025", fromId: "paper-008", toId: "conc-012", type: "关联文献", note: "paper-008 关联 mRNA 治疗" },
  { id: "rel-026", fromId: "paper-008", toId: "conc-014", type: "关联文献", note: "paper-008 关联 抗原发现" },
  { id: "rel-027", fromId: "paper-009", toId: "conc-013", type: "关联文献", note: "paper-009 关联 TCR 特异性" },
  { id: "rel-028", fromId: "paper-009", toId: "conc-014", type: "关联文献", note: "paper-009 关联 抗原发现" },
  { id: "rel-029", fromId: "paper-010", toId: "conc-001", type: "关联文献", note: "paper-010 关联 单细胞基础模型" },
  { id: "rel-030", fromId: "paper-010", toId: "conc-003", type: "关联文献", note: "paper-010 关联 基因重要性" },
  { id: "rel-031", fromId: "paper-011", toId: "conc-011", type: "关联文献", note: "paper-011 关联 LNP 递送" },
  { id: "rel-032", fromId: "paper-011", toId: "conc-012", type: "关联文献", note: "paper-011 关联 mRNA 治疗" },
  { id: "rel-033", fromId: "paper-012", toId: "conc-015", type: "关联文献", note: "paper-012 关联 知识图谱扰动预测" },
  { id: "rel-034", fromId: "paper-012", toId: "conc-001", type: "关联文献", note: "paper-012 关联 单细胞基础模型" },
  { id: "rel-035", fromId: "paper-012", toId: "conc-002", type: "关联文献", note: "paper-012 关联 模型解释性" },

  // ---- 工具-概念关系 ----
  { id: "rel-036", fromId: "tool-001", toId: "conc-004", type: "关联工具", note: "序列分析工具 关联 Prime editing" },
  { id: "rel-037", fromId: "tool-002", toId: "conc-005", type: "关联工具", note: "蛋白结构查看器 关联 逆转录酶改造" },
  { id: "rel-038", fromId: "tool-003", toId: "conc-004", type: "关联工具", note: "质粒图谱查看器 关联 Prime editing" },
  { id: "rel-039", fromId: "tool-004", toId: "conc-015", type: "关联工具", note: "通路知识图谱 关联 知识图谱扰动预测" },

  // ---- 概念-产业案例关系 ----
  { id: "rel-040", fromId: "conc-001", toId: "case-005", type: "关联产业案例", note: "单细胞基础模型 关联 分子诊断案例" },
  { id: "rel-041", fromId: "conc-004", toId: "case-002", type: "关联产业案例", note: "Prime editing 关联 细胞治疗案例" },
  { id: "rel-042", fromId: "conc-007", toId: "case-004", type: "关联产业案例", note: "CRISPR-Cas12 关联 合成生物制造案例" },
  { id: "rel-043", fromId: "conc-011", toId: "case-006", type: "关联产业案例", note: "LNP 递送 关联 疫苗研发案例" },
  { id: "rel-044", fromId: "conc-012", toId: "case-006", type: "关联产业案例", note: "mRNA 治疗 关联 疫苗研发案例" },
  { id: "rel-045", fromId: "conc-014", toId: "case-001", type: "关联产业案例", note: "抗原发现 关联 药物研发案例" },
];
