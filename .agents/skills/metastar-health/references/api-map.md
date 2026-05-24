# API 能力表

<!-- BEGIN GENERATED api-map -->
| 业务模块 | 能力 | 参考文档 | 公共函数 |
| --- | --- | --- | --- |
| `autocomplete` | 实体补全 | `references/sync-search.md` | `autocompleteEntities` |
| `drugs` | 药物搜索 | `references/sync-search.md` | `searchDrugs` |
| `gbd` | GBD 疾病负担查询 | `references/sync-search.md` | `searchGbdData` |
| `hpa` | HPA 靶点画像 | `references/sync-search.md` | `getHpaProfile` |
| `literature-process` | 文献解析 | `references/async-doc-processing.md` | `submitLiteratureProcessTask`, `getLiteratureProcessResult`, `pollLiteratureProcessResult` |
| `ocr` | OCR 文档识别 | `references/async-doc-processing.md` | `submitOcrTask`, `getOcrResult`, `pollOcrResult` |
| `papers` | 论文搜索 | `references/sync-search.md` | `searchPapers`, `getPapersHealth` |
| `preclinical-literature` | 文献临床前数据检索 | `references/sync-search.md` | `searchPreclinicalLiterature` |
| `target-assistant` | 靶点助手 | `references/target-workflows.md` | `submitTargetAssistantTask`, `getTargetAssistantResult`, `pollTargetAssistantResult`, `askTargetAssistantReport`, `searchTargetAssistantRag` |
| `target-quick-assessment` | 靶点快速评估 | `references/target-workflows.md` | `submitTargetQuickAssessmentTask`, `getTargetQuickAssessmentResult`, `pollTargetQuickAssessmentResult` |
| `text-extraction` | 临床前文本提取 | `references/async-doc-processing.md` | `submitTextExtractionTask`, `getTextExtractionResult`, `pollTextExtractionResult` |
| `tools` | 通用检索工具 | `references/sync-search.md` | `executeTool`, `submitToolTask`, `getToolTaskResult`, `pollToolTaskResult`, `searchPreclinicalFromPatent`, `searchPatentCore`, `searchClinicalTrialRegistrations`, `searchClinicalTrialResults`, `searchDrugDeals`, `analyzeTargetCompetition`, `searchPharmaNews`, `searchPubMed`, `searchMedwatch`, `searchClinicalTrials`, `searchPatents`, `searchWeb`, `searchReviewLiterature`, `searchConferencePosters`, `searchConferencePresentations` |
<!-- END GENERATED api-map -->
