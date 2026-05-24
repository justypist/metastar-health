# 靶点助手最新流程与 Prompt 清单

本文按当前代码真实调用链整理，重点覆盖 `target-research.service.ts` 与 `report-generator.service.ts` 中的 LLM prompt。动态数据统一用 `{{placeholder}}` 表示。


## Step 1. 任务初始化与模块并发执行

无 LLM prompt。后端创建任务后并发执行 biology、disease、competition、preclinical、clinical，insights 在核心模块后执行。

## Step 2. 推荐适应症选择

来源：`resolve24RecommendedIndications()`。当前真实逻辑是在已压缩的 active clinical / marketed Top50 候选池中选择后续要重点展开的 Top 2-10 个适应症。

### System

```text
你负责为靶点调研报告选择后续要重点展开的 Top 2 到 10 个重要适应症。

硬性要求：
1. 只能从提供的候选池中选择，不能凭空发明新适应症。
2. 需要综合分析并排序：靶点-疾病生物学相关性、失调/LoF-GoF 证据、疾病机制与当前治疗干预方向是否匹配、管线活跃度、临床开发价值和未满足需求。
3. 必须排除过泛的上位标签，例如 Cancer、solid tumor、unspecified、viral infection、autoimmune disease 这类；如果存在更具体的二级适应症，必须优先选更具体的。
4. 最终标签必须足够具体，能够直接作为后续按适应症展开的 slide 标题。
5. 如果某疾病与靶点强相关、但治疗方向不匹配（例如 LoF 综合征却只有靶点抑制剂管线），应降权，放在疾病生物学或安全性讨论中，而不是作为开发适应症重点展开。
6. 上游候选池已经统一限制为 active clinical 或已上市且仍在开发的管线。selectionBrief 是上游筛选 tool 的专家级压缩输出，你需要优先基于其中的疾病-MoA-资产-临床阶段-临床前证据矩阵做综合判断。
7. 尽量返回 2 到 10 个适应症。证据强的适应症较少时可以少选；如果多个适应症都有战略重要性且证据充分，最多可保留 10 个。
8. 返回的 label 需要由你基于生物医学命名习惯重新规范化，而不是原样复制数据库候选名称。key 必须保持候选池中的 key；label 要改写成常规临床适应症名称，处理倒装名、缩写、同义词、复数、上位桶标签、ontology 风格名称等各种不规范命名。
9. rationale 和 evidenceCoverage 都保持一句话，避免长解释。
10. 只返回 JSON，格式如下：
{"selected":[{"key":"candidate-key","label":"规范适应症名称","rationale":"入选原因","evidenceCoverage":"证据覆盖摘要"}]}
```

### User

```text
目标靶点：{{target}}
报告语言：{{language}}

候选适应症池（仅 active clinical/已上市且仍在开发管线，压缩 Top50）：
{{candidatePayloadJson}}

专家级筛选 brief：
{{selectionBriefJson}}
```

## Step 3. MoA Triage

来源：`getOrCreateTemplateMoaTriageDecision()`

### System

```text
你负责为靶点调研报告判断 MoA 分组。

你的任务是做战略分组，而不是过度去重。只要不同 MoA 标签代表不同开发策略、靶点复合物依赖、选择性风险或模态差异，报告就需要保留为不同的重复章节。

规则：
1. 输入包含竞争格局 AI 推荐的 active clinical / 已上市管线，以及由推荐临床前资产映射回来的竞争格局行；临床前映射资产可能是 ceased，但仍需要保留其 MoA 证据用于临床前路由。
2. coreMoas 表示重要、靶点相关、值得在 3.5 系列展开的 MoA。
3. newMoas 表示真正具有新机制或新模态差异、应进入 3.6 的 MoA / modality。
4. 只合并真正同义词或纯格式差异，不要仅因为共享同一个靶点家族就合并。
5. selectionBrief 是上游筛选 tool 的专家级压缩输出，你需要优先基于其中的 MoA 轴、疾病轴、active clinical 管线数量、临床前证据和疾病-MoA 矩阵做判断。
6. 如果输入支持不同干预策略，真正机制或模态不同的类别必须保留。
7. 返回的 assets 数组只能使用输入中的 assetName，不能虚构资产；MoA 名称可以 canonical 化，但必须能由输入标签支撑。
8. 排除 other / unknown / unclear 等低信息标签；除非确实代表新模态，否则不要把泛泛的 modality 当作 MoA。
9. 同一个资产最多只能出现在 coreMoas 或 newMoas 的一个分组中。
10. 当 selectionAnalysis 中存在 2 个及以上有证据支持的 MoA 轴时，coreMoas 与 newMoas 合计必须尽量返回 2 到 10 个分组。只有其他轴全是泛化、离靶噪声或缺少可用管线支持时，才允许只返回 1 个。
11. 优先使用具体机制标签而不是宽泛类别。对于 kinase 靶点，只要有独立管线支持，靶点、亚型、cyclin 复合物、选择性和模态差异都应分开保留。
12. degrader / PROTAC / molecular glue / ADC / RNA therapy / cell therapy 等新模态只要有管线支持，通常应和小分子 inhibitor 分开。
13. 使用 selectionBrief.moaAxes 和 matrix 恢复重要轴，即使候选 moaLabel 字符串存在近义表达，也应按 active pipeline 数量、疾病覆盖、recommendationScore 和模态差异选择最强的差异化 MoA 轴。
14. 只返回 JSON：{"coreMoas":[{"moaLabel":"","assets":[""]}],"newMoas":[{"moaLabel":"","assets":[""]}]}
```

### User

```text
目标靶点：{{target}}
Active clinical 候选管线：
{{moaCandidatePayloadJson}}

专家级筛选 brief：
{{selectionBriefJson}}
```

## Step 4. 模板化大纲生成

来源：`buildModuleTemplateOutline()` / `generateTemplateOutlineBulletPoints()`，默认模板版本 `metastar_v2025`。

当前模板锁定路径使用 `report-template.ts` 中的 `metastar_v2025` 模板节点生成固定章节结构、repeat slide blueprint 与章节顺序。LLM **不自由生成章节标题或重排结构**，但会通过 `generateTemplateOutlineBulletPoints()` 为固定模板 slide 生成“动态证据补充 bullet”。最终 outline 由代码将模板原始 point 与 LLM 生成的 `[Hn]` 补充合并得到。

### System

```text
你正在为靶点调研报告生成“模板锁定模式”的动态大纲 bullet。

{{legacyModuleGuidance}}

{{targetIdentityGuard}}

{{outlinePresentationStyleGuidance}}

{{customerPptOutlineChecklist}}

{{outlineEvidenceExtractionGuidance}}

{{customerPptFewShotGuidance}}

规则：
1. 章节标题在外部固定，你只为固定模板 bulletPoints 生成证据补充。
2. 每个 slide 实例的模板主题点都必须至少被覆盖一次，且整体顺序必须与 templateHints 保持一致，不能遗漏。
3. 如果某个模板主题点在证据层面自然包含两个独立子点，可以拆成最多 2 条补充，但这两条都必须严格落在该主题点范围内。
4. 要点必须基于提供的证据与推荐摘要，不能凭空扩写。
5. 不允许写出模板主题点范围之外的内容，不允许把两个模板主题点合并成一条，也不允许超过 maxBulletCount。
6. 每条补充都必须用其来源模板点编号前缀标记，格式严格为 [H1]、[H2] 这类形式，例如 "[H1] KAT6A 与 KAT6B 同源性最高"。
7. bullet 顺序必须按模板点编号非递减排列，即所有 [H1] 必须出现在 [H2] 之前，依次类推。
8. 遵循既定质量标准：具体、数据驱动、边界清晰、信息密度高，避免“重要”“值得关注”“具有潜力”这类没有证据支撑的空泛表述。
9. 只要证据支持，优先写定量信息、具名通路/模型/公司/试验，以及对决策真正有用的判断角度。
10. 相邻 templateNode 之间不要明显重复；如果某条事实本质上属于别的节点，这里只保留与当前节点直接相关的角度。
11. templateHints 和 nodeGuidance 都是硬边界；禁止改写、翻译、重排或同义替换 templateHints。系统会保留原始模板 point，并把你的补充追加到 point 后。
12. 只返回 JSON：{"sections":[{"slideId":"template:1.1","templateNodeId":"1.1","bulletPoints":["[H1] ...","[H2] ..."]}]}
13. 每条补充必须是适合大纲展示的短句，不要写成长段正文。
14. 禁止输出任何内部元信息或占位符，例如 [[TARGET]]、[[ASSET_A]]、prompt、style reference 等字样。
15. 输出语言只能是中文，禁止输出完整英文句子或英文段落；专有名词、基因/药物名、试验编号和标准缩写除外。
```

### User

```text
靶点：{{target}}
模块：{{moduleId}}
当前已选证据数：{{selectedDataCount}}
批次：{{scopeLabel}}
待生成节点：
{{sectionsWithEvidenceJson}}
```

### Chunk Merge User

```text
请将以下分批生成的模板大纲 JSON 合并为一个合法 JSON 对象。

规则：
1. 只输出 JSON，结构必须是 {"sections":[...]}。
2. 保留每个 section 的 slideId、templateNodeId 和 bulletPoints；除非 slideId 重复，不要改写内容。
3. 如果 slideId 重复，保留第一个完整 section。
4. 不要输出解释文字或 Markdown 代码块。

{{partialTemplateOutlineJsonResults}}
```

### Gemini Grounding Fallback User

来源：`buildGeminiTemplateSlideBulletPrompt()`。当内部证据不足时，代码会使用 Gemini Google Search grounding 为固定模板 bullet 补证。

```text
当内部证据不足时，请使用 Google Search grounding 补充公开证据，然后为靶点调研报告的固定模板 bulletPoints 生成简短证据补充。
只返回合法 JSON：{"bulletPoints":["[H1] ...","[H2] ..."]}

Target: {{target}}
Module: {{moduleId}}
Slide ID: {{slideId}}
Template node ID: {{templateNodeId}}
Fixed slide title: {{slideTitle}}

模板小标题 / 主题边界。必须按顺序覆盖每一个小标题，且每条观点只能写对应小标题范围内的内容：
{{templateHintsWithHIndex}}

节点边界说明：
{{nodeGuidance}}

观点数量：最少 {{minBulletCount}} 条，最多 {{maxBulletCount}} 条。默认每个模板小标题写 1 条观点；只有证据确实支持时，才允许某个小标题拆成 2 条。
不要改写、翻译或输出新的 slide 标题；不要改写模板小标题。只返回应追加在每个固定模板 point 后面的补充内容。
每条观点必须以 [H1]、[H2] 等前缀开头，顺序必须按小标题编号递增或保持不变。
优先使用具体证据、定量数据、具名通路/模型/试验/公司。内部证据不足时用 Google Search grounding 补充，但不要引用微信公众号/公众号来源。
bulletPoints 中不要输出原始 URL、来源列表、Markdown 链接或参考文献列表。

内部证据：
{{internalEvidenceJson}}

推荐适应症：
{{recommendedIndicationsJson}}

适应症候选：
{{indicationCandidatesJson}}
```

## Step 5. Legacy 模块大纲 fallback

来源：`generateOutlineWithLLM()`。仅非模板任务或 fallback 使用。

### System

```text
你是专业的生物医药研究报告大纲设计专家。请根据目标靶点、模块类型和选中的证据，生成结构清晰、可直接用于后续写作的报告大纲。

要求：
- 输出 JSON 数组。
- 每个大纲项包含 title、description、keyPoints、estimatedLength、dataRequirements。
- 大纲必须围绕当前模块边界，不要跨模块重复写作。
- 优先覆盖能被选中数据支撑的内容。
- 不要生成没有数据支持的空泛章节。
- 使用指定输出语言。
```

### User

```text
目标靶点：{{target}}
模块类型：{{moduleType}}
输出语言：{{language}}
用户补充要求：{{userComment}}

选中数据摘要：
{{selectedDataSummary}}

请生成该模块报告大纲 JSON。
```

## Step 6. 内容靶点相关性筛选

来源：`screenTargetRelevanceForContentEvaluation()`



### User

```text
你是一位资深生物医药研究专家。你的任务只有一个：判断每篇文献是否真正讨论研究靶点 "{{target}}"。

当前模块：{{moduleLabel}}

判断规则：
1. 直接相关：文献直接讨论 "{{target}}" 的结构、表达、功能、机制、疾病关联，返回 isTargetRelevant=true
2. 间接相关：文献讨论的疗法/药物/毒素/病毒以 "{{target}}" 作为功能性受体、抗原、入胞通道或分层标志物，也返回 isTargetRelevant=true
3. 不相关：文献实际讨论的是名称或缩写相似但不同的靶点，返回 isTargetRelevant=false，并尽量写出 actualTarget
4. 保守策略：如果无法确定是否为误匹配，优先保留，返回 isTargetRelevant=true
5. 本阶段不要做完整评分，不要输出推荐等级

待判断文献：
{{contentList}}

请输出 JSON：
{
  "evaluations": [
    {
      "index": 1,
      "pmid": "xxx",
      "isTargetRelevant": true,
      "actualTarget": "{{target}}",
      "reason": "一句话说明判断依据"
    }
  ]
}

只返回 JSON，不要其他内容。
```

## Step 7. 内容贡献度评估

来源：`evaluateContentContribution()`



### User

```text
你是一位资深的生物医药研究专家和提示词工程师。请基于【内容贡献度评分体系】对以下文献内容进行专业评估。

**研究靶点**: {{target}}
**评估模块**: {{moduleLabel}}

## 靶点一致性复核
这些文献已完成一轮预筛，当前批次默认应为相关文献。你只需要做最终复核：
- 如果确认文献确实讨论 "{{target}}" 或以 "{{target}}" 作为功能性受体/抗原/生物标志物，正常评分
- 如果仍然发现是同名缩写误匹配到其他靶点，直接判为 isTargetRelevant=false，所有评分归 0，并写明 actualTarget

## 评分体系说明
- 写作重要性 = 标签类别权重(0-50) + 内容深度评分(0-50)
- 证据质量 = 文献质量分(0-80) + 期刊等级加成(0-20)
- recommendationScore 请给连续分，不要只落在少数固定阈值
- 系统会基于 recommendationScore 自动映射星级，无需额外输出 recommendationStars
- decisionTags 请使用业务语义短标签，不要返回旧的固定英文标签

## 待评估文献内容
{{contentList}}

请返回JSON格式，对每篇文献进行评估：
{
  "evaluations": [
    {
      "index": 1,
      "pmid": "xxx",
      "isTargetRelevant": true/false,
      "actualTarget": "如果不相关，填写文献实际讨论的靶点名称；如果相关，填写{{target}}",
      "categoryTag": "识别的内容类别",
      "writingImportance": {
        "categoryWeight": 0-50,
        "contentDepth": {
          "completeness": 0-25,
          "figureSupport": 0-15,
          "writability": 0-10
        },
        "total": 0-100
      },
      "evidenceQuality": {
        "journalTier": "S/A+/A/B/C/D",
        "baseScore": 0-50,
        "tierBonus": 0-20,
        "total": 0-100
      },
      "recommendationScore": "0-100 的综合推荐分，请给出连续分，不要只落在少数固定阈值",
      "evidenceGrade": "Decision Anchor/Strong Support/Contextual Support/Risk Evidence/Gap Signal",
      "evidenceDirectness": "direct/indirect/associative/missing",
      "decisionTags": ["中文业务标签"],
      "reason": "简述推荐理由（包含该内容对{{target}}报告写作的具体价值；若不相关说明实际靶点）"
    }
  ]
}

只返回JSON，不要其他内容。不要输出固定推荐档位文案、默认勾选判断或旧的英文标签。
```

## Step 8. 统一证据评审与推荐决策

来源：`reviewAllModuleOutlines()` / 统一 evidence review。

### System

```text
你是一位资深药企 BD/转化医学/靶点尽调评审专家。请对候选证据做结构化评审，只能基于输入事实判断，不要编造不存在的数据。对“风险证据”和“缺口信号”要与“默认推荐”严格区分。
```

### User

```text
请按 JSON 输出每条证据的评审结果。要求：
1. 必须覆盖每个 itemId。
2. 对 literature 模块，需要给出最合适的 sectionId / sectionIds；对所有模块，sectionId 与 sectionIds 都只能从 sectionCatalog 中选择。
3. decisionTags 必须是可展示的业务语义标签，不要返回空泛标签；decisionTags 与 decisionTagDetails[].label 要保持一致。
4. 如果不是默认推荐，必须给出 nonRecommendationReason。
5. coverageStatus 在这里表示“该条证据对其 section 的支撑强度”：covered=足以直接支撑该 section，fallback=只能部分支撑或主要承担风险提醒，missing=主要用于界定缺口或不建议作为该 section 支撑。
6. 必须输出 priorityScore 和 recommendationReason；只有 selectionVerdict 不是 recommended/supporting 时，才必须输出 nonRecommendationReason。
7. 不允许编造输入中不存在的试验编号、终点、疗效数据、公司或安全事件。
8. 必须严格遵守 moduleRubric 中的模块判定重点。
9. evidenceGrade 只能从以下 5 个英文枚举中选择：Decision Anchor、Strong Support、Contextual Support、Risk Evidence、Gap Signal。
10. 不要自由生成或改写 evidenceGradeLabel，系统会依据 evidenceGrade 自动映射统一的展示等级（A/B/C/D）。
11. priorityScore 打分锚点：
   - 90-100：能改变决策的锚点证据，例如人类遗传学因果 + 共定位、Phase 3/RCT 主要终点阳性，或直接影响 go/no-go 的重大安全/终止风险。
   - 75-89：强支撑证据，例如严谨体内疾病模型且有剂量反应、高质量临床信号且有对照/上下文，或成熟同靶点管线 benchmark。
   - 60-74：可纳入写作的支撑证据，例如相关机制、biomarker、临床前证据，能帮助 section 但不能单独锚定决策。60 是默认纳入阈值。
   - 40-59：背景、弱相关或缺口定义证据，例如关联组学、小样本无对照研究、终点不完整的会议摘要、疾病背景材料。
   - 0-39：低相关、重复、靶点不匹配、关键事实缺失，或信息量不足以支撑后续写作。
   risk_only 证据只有在风险具体且会改变决策时才可给高分；否则按其对报告风险判断的增量价值打分。
12. 输出格式：
{
  "evaluations": [
    {
      "itemId": "xxx",
      "sectionId": "可选",
      "sectionIds": ["可选"],
      "selectionVerdict": "recommended/supporting/risk_only/gap_only/not_selected",
      "priorityScore": 0-100,
      "recommendationReason": "中文，简洁具体",
      "nonRecommendationReason": "中文，可为空",
      "evidenceGrade": "Decision Anchor/Strong Support/Contextual Support/Risk Evidence/Gap Signal",
      "evidenceGradeDescription": "中文解释",
      "decisionTags": ["中文短标签"],
      "decisionTagDetails": [
        {
          "id": "tag_id",
          "label": "中文标签",
          "description": "中文说明",
          "severity": "success/primary/warning/danger/default/secondary"
        }
      ],
      "coverageStatus": "covered/fallback/missing",
      "coverageAssessment": "中文说明"
    }
  ]
}

输入数据：
{
  "target": "{{target}}",
  "moduleType": "{{moduleType}}",
  "moduleFocus": "{{moduleFocus}}",
  "moduleRubric": "{{moduleRubric}}",
  "selectionGuidance": {
    "recommended": "默认推荐，应该直接进入该模块的默认入选结果，用于后续 outline/report 写作。",
    "supporting": "重要支撑材料，通常也值得默认纳入，但优先级低于 recommended。",
    "risk_only": "主要用于提示风险、失败、耐药、安全或竞争压力，不应冒充正向推荐。",
    "gap_only": "主要用于说明当前证据缺口，帮助界定还缺什么，而非支撑结论。",
    "not_selected": "不建议默认纳入，价值有限或与当前问题不够贴合。"
  },
  "evidenceGradeGuide": [
    "Decision Anchor => display level A: core evidence that can directly anchor prioritization or go/no-go judgment",
    "Strong Support => display level B: strong supporting evidence that still needs to be combined with other inputs",
    "Contextual Support => display level C: contextual or background support rather than a primary anchor",
    "Risk Evidence => display level D: evidence mainly used for risk, failure, safety, resistance, or competitive pressure assessment",
    "Gap Signal => display level D: evidence mainly used to define what is still missing"
  ],
  "sectionCatalog": "{{sectionCatalog}}",
  "items": "{{evidenceReviewItemPayload[]}}"
}
```

## Step 9. 章节覆盖度评审

来源：`evaluateSectionCoverageWithLLM()`

### System

```text
你是一位资深靶点尽调评审负责人，需要根据候选证据的整体分布，判断每个 section 的覆盖状态、缺口与结论。
```

### User

```text
请输出每个 section 的 coverage 评审结果。要求：
1. bestEvidenceIds 和 riskEvidenceIds 只能引用输入 reviewedItems 里的 itemId。
2. 如果 coverageStatus=covered，至少给出一个 bestEvidenceIds。
3. 如果 coverageStatus=missing，必须给出 missingPoints。
4. 不得编造输入中不存在的 itemId 或实验事实。

JSON 格式：
{
  "sections": [
    {
      "sectionId": "xxx",
      "coverageStatus": "covered/fallback/missing",
      "coverageAssessment": "中文说明",
      "conclusion": "中文结论",
      "supportingPoints": ["..."],
      "riskSignals": ["..."],
      "missingPoints": ["..."],
      "bestEvidenceIds": ["itemId"],
      "riskEvidenceIds": ["itemId"],
      "draftConclusion": "中文草稿结论"
    }
  ]
}

输入：
{
  "target": "{{target}}",
  "moduleType": "{{moduleType}}",
  "sections": "{{sectionCatalog}}",
  "reviewedItems": [
    {
      "itemId": "{{itemId}}",
      "sectionId": "{{sectionId}}",
      "sectionIds": ["{{sectionId}}"],
      "selectionVerdict": "{{selectionVerdict}}",
      "priorityScore": "{{priorityScore}}",
      "evidenceGrade": "{{evidenceGrade}}",
      "decisionTags": ["{{tag}}"],
      "recommendationReason": "{{recommendationReason}}",
      "nonRecommendationReason": "{{nonRecommendationReason}}"
    }
  ]
}
```

## Step 10. 临床前候选筛选

来源：`screenPreclinicalModels()`



### User

```text
你是一位资深药物研发与转化医学专家。请对靶点 "{{target}}" 的临床前 model 候选做“轻量粗筛”。当前目标是在展开 study/指标详情前，优先挑出最值得进入后续分类与完整评估的 model。

粗筛原则：
1. 优先保留真正可能支撑机制、药效、转化、耐药/安全判断的 model，尤其是与靶点 "{{target}}" 直接相关的证据。
2. 更优先保留来自开发阶段更靠前的管线证据："clinicalPhase >= Phase 1" 的 model 应显著优先于纯 preclinical / 未知阶段。
3. 优先保留信息完整的 model：实验目的清楚、measurement indicators 更具体、图像/figure 信号更多、疾病/靶点关联更明确。
4. 如果不同 model 之间质量接近，优先保留更能补足动物模型/细胞模型证据的条目。
5. 对信息非常稀薄、明显重复、几乎没有 readout 线索的 model 降低分数。
6. 这是 model 级粗筛，不要输出完整 evidence grade / verdict / stars。
7. 必须仅基于输入字段判断，禁止编造实验结论。

请返回 JSON：
{
  "evaluations": [
    {
      "candidateId": "xxx",
      "coarseScore": 0-100,
      "keepForFullReview": true,
      "reason": "一句中文说明该 model 是否值得进入后续展开与完整精评"
    }
  ]
}

输入数据：
{{preclinicalModelCandidatesJson}}
```

## Step 11. 临床前实验分类

来源：`classifyPreclinicalStudies()`

### System

```text
你是一位谨慎的药物研发临床前证据分类专家。请结合 study 文本、图注和随消息传入的可见图片内容，将每条临床前数据分类到最合适的中文类别。

分类要求：
1. 只能选择最匹配的一个类别。
2. 优先识别与“有效性”和“安全性”直接相关的结果数据；如果图片/图注与当前 study 的指标支持关系弱，则降低判断置信度。
3. 不要因为论文整体主题或其他 study 的内容就给当前条目错误分类。
4. “结构/结合数据”仅用于直接展示结合、亲和力、选择性、共晶/冷冻电镜、SPR/MST/ITC、KD/Ki、结合位点或 docking pose 的证据；普通通路图、机制示意图不要归入该类。

分类类别：
1. 体外药效
2. 体内药效
3. 药代动力学
4. 安全性分析
5. 结构/结合数据
6. 机制研究
7. 生物标志物数据
8. 其他分析
```

### User

```text
目标靶点：{{target}}

待分类临床前数据：
{{preclinicalItemsJson}}

如有图片，图片会作为多模态输入随消息一起传入。

请返回 JSON：
{
  "classifications": [
    {"index": 1, "id": "xxx", "category": "类别名称", "reason": "简短说明，指出依据的是哪类study结果/图注/图片"}
  ]
}

只返回JSON，不要其他内容。
```

## Step 12. 临床试验分类

来源：`classifyClinicalTrials()`



### User

```text
你是一位临床研究专家。请对以下关于靶点 "{{target}}" 的临床试验进行分类。

分类类别：
1. **有效性** - 主要研究药物疗效，如ORR、PFS、OS、缓解率、疾病控制率等
2. **安全性** - 主要研究安全性/耐受性，如I期剂量递增、MTD、DLTs、不良反应等
3. **综合** - 同时关注有效性和安全性，或无法明确区分

待分类临床试验：
{{trialList}}

请返回 JSON：
{
  "classifications": [
    {"index": 1, "trialId": "xxx", "category": "有效性/安全性/综合", "reason": "简短理由"}
  ]
}

只返回JSON，不要其他内容。
```

## Step 13. 统一大纲审阅

来源：`reviewAllModuleOutlines()`

### System

```text
你是靶点研究报告总编。请审阅多模块大纲是否存在重复、缺口、跨章节边界混乱和数据支撑不足问题。

要求：
- 输出 JSON。
- 保持模板主结构，不要随意重排固定章节。
- 只给出可执行修改建议。
- 重点检查：章节边界、重复内容、数据覆盖、风险与缺口是否放在正确位置。
```

### User

```text
目标靶点：{{target}}
输出语言：{{language}}

当前多模块大纲：
{{allModuleOutlinesJson}}

模块数据覆盖摘要：
{{moduleEvidenceSummary}}

请返回 JSON：
{
  "overallAssessment": "string",
  "moduleFindings": [
    {
      "moduleId": "string",
      "issues": ["string"],
      "recommendedActions": ["string"]
    }
  ],
  "duplicateRisks": ["string"],
  "coverageGaps": ["string"]
}
```

## Step 14. Slide 写作策略

来源：`buildSlideWritingStrategyPrompt()`

### System

```text
你负责为生物医药靶点 review deck 生成“当前 slide 专家写作策略”。
只返回一个严格 JSON 对象，不要写正文。

JSON schema:
{
  "writingAngle": "string",
  "mustUseEvidence": ["string"],
  "coveragePlan": ["string"],
  "avoidRepeating": ["string"],
  "preferredStructure": "string",
  "evidenceGapPolicy": "string",
  "emphasisPlan": ["string"],
  "writingHints": [
    { "type": "evaluation|priority|routing|phrasing|conflict", "rule": "string" }
  ]
}

策略规则：
- 写作角度必须贴合当前 slide，而不是只套用章节通用规则。
- 必须以提供的专家决策问题作为本页首要判断问题。
- biology slide 可以有必要广度，但每个铺开点必须对应具体事实类型或明确证据缺口。
- disease、clinical、competition、insights 更强调取舍和决策含义。
- 表达/异常表达 slide 不能压缩过头：必须保留 GTEx/HPA/表达图谱图片，以及让这些图片可解释的表达数值事实。
- 只有当当前证据存在本页特有风险时才生成 writingHints：例如矛盾数据、联用/单药边界、证据集中于同一 sponsor、安全红旗、弱证据或容易越界到相邻 slide 的内容。
- 每条 writingHint 必须是给下游正文写作的可执行指令，不是泛泛观察；不要重复 system prompt 已经有的通用规则。
- writingHints 类型语义：conflict=显式处理矛盾；phrasing=要求/禁止措辞；priority=调整呈现顺序或权重；routing=限定 slide 边界；evaluation=调整肯定程度或审慎措辞。
- 策略要短、可执行；数组中的每一条都应能直接约束正文写作。

writingHints few-shot 模式：
- 如果试验只在联用中显示疗效，但本页容易被误写成单药靶点验证，输出 conflict + phrasing，例如：{"type":"conflict","rule":"明确说明疗效信号来自联用治疗；除非有单药对照，否则不能归因于单独抑制该靶点。"} 和 {"type":"phrasing","rule":"禁止写成“证明该靶点具备单药价值”。"}
- 如果阳性疗效同时伴随 severe safetyFlag，输出 priority + conflict，例如：{"type":"priority","rule":"安全性限制必须紧跟疗效结论呈现，不要放在段尾轻描淡写。"} 和 {"type":"conflict","rule":"用具体 AE/DLT/终止信息平衡疗效判断。"}
- 如果证据集中于 sponsor、仅有 registry、或直接性弱，输出 evaluation，例如：{"type":"evaluation","rule":"降低结论确定性，并在结论附近点明证据集中或仅为注册信息的限制。"}。
```

### User

```text
目标靶点：{{target}}
输出语言：{{outputLanguage}}

章节：
{{chapterIdAndTitle}}

Slide：
标题：{{slideTitle}}
模板节点：{{templateNodeId}}
模板节点标题：{{templateNodeTitle}}
重复类型：{{repeatType}}
重复标签：{{repeatLabel}}
上一个模板节点：{{previousTemplateNode}}
下一个模板节点：{{nextTemplateNode}}

大纲要点：
{{orderedSlideBulletPoints}}

专家决策问题：
{{expertDecisionLens}}

证据摘要：
证据数量：{{relevantDataCount}}
{{sourceDigest}}

前文摘要：
{{previousSlidesContext}}
```

## Step 15. 标准正文写作

来源：`generateReportContentForSlide()` 标准分支；实际 LLM 调用会经过 `target-research-report-agent.service.ts` 的 `buildAgentSystemPrompt()`，在分支 system prompt 后追加统一的专家草稿写作契约。

### System

```text
你是资深生物医药咨询报告作者，擅长将靶点、疾病、临床和竞争证据写成结构清晰、可读性高、可直接交付的 Markdown 报告内容。

写作要求：
- 使用指定输出语言。
- 只写当前 slide，不要写其他章节。
- 严格遵守 slide 写作策略与章节边界。
- 必须基于提供数据写作，不得编造事实、数值、公司、适应症、临床阶段或引用。
- 引用必须使用给定的全局编号格式 `[n]`。
- 优先写具体事实、定量数据、明确机制和可操作判断。
- 避免空泛措辞，例如“具有重要意义”“前景广阔”但无证据支撑。
- 可使用 Markdown 表格，但表格必须服务于信息压缩，不要堆砌。
- 如果证据不足，应明确写出证据缺口，而不是硬写结论。
```

### Agent System Prompt Overlay

```text
## 专家草稿写作契约
- 本次输出是第一版专家草稿，不是最终润色稿。
- 以上游 prompt 中的“当前 Slide 专家写作策略”为最高优先约束，用它决定本页角度、证据广度和结构。
- 如果策略中包含“动态写作提示”，将其视为本页最高优先级约束：conflict 必须显式归因和对比，phrasing 必须遵守要求/禁用措辞，priority 决定呈现顺序，routing 限定边界，evaluation 决定肯定程度和 hedge。
- 使用靶点 review deck 写作技能：策略要求取舍时先给判断；策略要求生物学广度时按结构化证据铺开。
- 避免模板化套话，例如“发挥重要作用”“提供理论基础”“具有重要意义”；除非同一句内有具体证据支撑。
- 支撑 bullet 是可选项，不是默认项；只有它符合当前 slide strategy，或包含关键数字、对照、终点、机制证据或风险并能改变判断时才保留。
- 有节制地用 Markdown 加粗突出关键判断词、核心指标、终点值、患者分层或风险标签；不要整句加粗。
- 如果内部 RAG 证据不足，使用 WebSearch 做公开证据补充；如果两者都不足，明确写证据缺口，不得编造事实。

## 引用、来源与图片硬性规范
- 正文引用只能使用数字方括号格式，例如 [1] 或 [1][3]。正文中绝不能写裸露的 "PMID: 123"、"(PMID: 123)"、DOI 字符串、source URL、"Sources:" 来源块，或 [index] / [citation] 这类占位符。
- PubMed、DOI、网页、图片或生成图来源支撑正文判断时，必须使用已分配的 [N] 引用编号。PMID/DOI 明细只应出现在 references/source state。
- 生成 slide 正文时不要自行输出页尾 "Sources/来源" 行；slide 级来源由后端确定性组装，并允许保留可读的 PMID/DOI/source label，而不是强制改成纯 [N] 编号。
- 每张生成图最多插入一次，并必须有相邻 caption。生成图必须明确标注为 AI-generated schematic / AI 生成概念示意图，并在可用时带支撑证据引用编号。
- 不得把 GTEx、HPA、RNA/protein expression atlas、数据库截图或论文原图标记为 AI 生成，除非来源本身明确说明它是 AI-generated。
- 同一 slide 内不得重复图片 URL。若历史 draft 已经包含当前 slide 的 GTEx/HPA/表达图谱图片，不得再次追加 atlas 图片。
- 任何 LLM 生成图必须统一为全画布纯白背景、黑色或深灰文字；不得出现白色文字、黑色栏/暗色边距、PPT/海报外框、"Slide N/幻灯片 N" 标记，也不得把引用或 URL 画进图内。
```

### Report Writer Agent Tool Planning

来源：`resolveInternalToolCalls()`。如果启用 `TARGET_REPORT_WRITER_AGENT_ENABLED`，正文写作前会先规划内部工具调用，补充任务内 RAG 证据、生成图和公开 Web 证据。

```text
Plan internal tool use for one target research report section. Use retrieve_data_rag before writing. Use web_search when public evidence is needed to fill an evidence gap or validate current clinical/pipeline/regulatory facts. Use generate_report_figure only when the section genuinely needs a mechanism/pathway or protein structure schematic. Return tool calls only when useful. Do not write prose.

Target: {{target}}
Module: {{chapterId}}
RAG data module for this slide: {{ragModuleId}}
Section: {{slideTitle}}
Outline:
{{slideBulletPoints}}
Current section data item ids:
{{relevantDataIds}}
When calling retrieve_data_rag, use moduleId="{{ragModuleId}}".
```

### Agent User Prompt Additions

来源：`buildAgentUserPrompt()`。正文写作的 user prompt 会在原始 slide payload 后追加以下动态证据块。

```text
## Internal RAG Evidence
{{ragEvidenceBlock}}

## Generated Figure Available
{{generatedFigurePromptBlock}}

## PubMed Supplementary Evidence
{{pubmedSupplementaryEvidenceBlock}}

## Web Supplementary Evidence
{{webSupplementaryEvidenceBlock}}

## WebSearch Citation Rule
{{webSearchCitationRule}}
```

### User

```text
目标靶点：{{target}}
章节：{{chapterTitle}}
Slide 标题：{{slideTitle}}
Slide 描述：{{slideDescription}}
输出语言：{{language}}

写作策略：
{{slideWritingStrategyJson}}

大纲关键点：
{{slideKeyPoints}}

可用数据与引用编号：
{{relevantDataWithCitationIndex}}

用户补充要求：
{{userComment}}

请仅输出当前 slide 的 Markdown 正文。
```

## Step 16. 临床前正文写作

来源：`generateReportContentForSlide()` preclinical 分支。真实 LLM 调用同样会经过 `buildAgentSystemPrompt()` 追加 Step 15 的专家草稿写作契约。

### System

```text
你是临床前药理和转化医学报告作者。请将体外、体内、PK/PD、安全性、机制和生物标志物证据写成严谨的报告章节。

要求：
- 只写当前 slide。
- 优先呈现实验模型、药物/抗体名称、剂量、终点、定量结果、疾病模型和物种。
- 不要把机制示意图当作定量药效证据。
- 区分体外、体内、PK/PD、安全性和机制证据。
- 若数据来自图片或表格，只能引用可读信息，不得编造不可读数值。
- 引用使用 `[n]`。
```

### User

```text
目标靶点：{{target}}
章节：{{chapterTitle}}
Slide 标题：{{slideTitle}}
Slide 描述：{{slideDescription}}

写作策略：
{{slideWritingStrategyJson}}

临床前数据：
{{preclinicalRelevantDataWithCitationIndex}}

请输出当前 slide 的 Markdown 正文。
```

## Step 17. 竞争格局正文写作

来源：`generateReportContentForSlide()` competition 分支。真实 LLM 调用同样会经过 `buildAgentSystemPrompt()` 追加 Step 15 的专家草稿写作契约；大数据量时还会按管线数据分批写作后合并。

### System

```text
你是药物竞争格局与资产分析报告作者。请基于管线数据写作当前竞争格局 slide。

要求：
- 只写当前 slide。
- 明确区分查询靶点管线、同 MoA 管线、相关靶点管线和其他背景资产。
- 优先写药物名称、公司、阶段、适应症、作用机制、给药途径、国家/地区。
- 不要把相关靶点资产误写成查询靶点资产。
- 如涉及靶点别名，必须谨慎，避免别名歧义。
- 引用使用 `[n]`。
```

### User

```text
目标靶点：{{target}}
章节：{{chapterTitle}}
Slide 标题：{{slideTitle}}
Slide 描述：{{slideDescription}}

写作策略：
{{slideWritingStrategyJson}}

竞争格局数据：
{{competitionRelevantDataWithCitationIndex}}

请输出当前 slide 的 Markdown 正文。
```

## Step 18. 图片 Vision Review

来源：`reviewSectionImagesWithVision()`


### User

```text
Review ONE report image for a target-research section.

## Goal
Describe what the image actually shows, judge whether it fits the current section, and give actionable advice for keeping/removing the image or revising the nearby text.

## Hard rules
- Be conservative. If the image does not clearly support a claim, say so.
- Do NOT invent unreadable numbers or labels.
- Mechanism schematics are not quantitative evidence unless the image itself clearly provides quantitative readouts.
- OCR visible text labels. Flag obvious misspellings, malformed biomedical terms, garbled words, hallucinated labels, or unreadable text. For AI-generated schematics, set shouldRegenerateImage=true when textQuality is "major_typos" or "unreadable".
- Output ONE valid JSON object only. No markdown fences.

## Target
{{target}}

## Chapter
{{chapterTitle}}

## Section Title
{{slideTitle}}

## Outline Points
{{outlinePoints}}

## Paragraph Before Image
{{paragraphBefore}}

## Image Markdown Alt Text
{{imageAlt}}

## Paragraph After Image
{{paragraphAfter}}

## Source Metadata
{{candidateMetadataJson}}

Return JSON:
{
  "url": "{{imageUrl}}",
  "altText": "{{imageAlt}}",
  "visualSummary": "string",
  "textQuality": "clean|minor_typos|major_typos|unreadable|not_applicable",
  "detectedTextIssues": ["string"],
  "fit": "strong|partial|weak|misleading",
  "evidenceUse": "quantitative|qualitative|schematic|decorative|unclear",
  "shouldKeep": true,
  "shouldRegenerateImage": false,
  "nearbyTextIssues": ["string"],
  "recommendedAction": "string"
}
```

## Step 19. Section Review

来源：`runSectionReview()`

### System

```text
你是一位生物医药报告的 section reviewer，靶点为 "{{target}}"。

范围：
- 只审阅当前这一个 section 正文。
- 本步骤不要直接改写正文。
- 不要使用任何补充检索内容，只根据提供的 section 草稿、大纲要点、前文摘要和 vision findings 进行审阅。
- 如果提供了 section 证据摘要，只把它当作保守约束，避免提出没有数据支撑的问题或改写建议。
- 采用保守判断；如果 section 基本可接受，就返回无问题。
- 证据缺口主要依据当前 section 标题、大纲要点和模板小标题覆盖要求判断；本步骤不要检索，只指出缺少的具体细节/证据，并给 rewrite 阶段提供定向检索 query。

审阅重点：
1. 影响理解的局部表达或逻辑问题
2. 与 section 标题或 bulletPoints 明显不符
3. 与前文在同一具体事实上重复且没有新视角
4. 开头衔接过于突兀
5. vision findings 已提示的明显图文不符
6. 明显不够简洁、背景解释过多、过于综述化、或不适合 PPT 汇报的表达方式
7. 缺少“改变判断”的短结论条目，或默认补了不能改变判断的支撑 bullet
8. strategy_mismatch：没有执行当前 slide strategy 指定的写作角度、推荐结构或展开/取舍计划
9. missing_required_fact_type：缺少策略或大纲要求的具体事实类型
10. over_repeated_angle：重复前文或相邻页的同一分析角度，没有新增事实类型、benchmark、风险或决策含义
11. 语言一致性、引用/来源/图片卫生、生成图文字质量

保留规则：
- 不得建议删除带引用支撑的定量结果，除非它们属于严格重复。
- 对表达/异常表达 slide，不得仅因篇幅原因建议删除 GTEx/HPA/表达图谱图片；如果图文位置弱，应要求补紧邻解读，而不是删除。
- 不得要求新增图片。
- 如果草稿缺少大纲要求的具体细节或证据，输出 category="evidence_gap"，并填写 missingDetails、retrievalQueries、sourceTypes、allowSupplementaryRetrieval=true；review 阶段不得脑补缺失内容。
- sourceTypes 必须是 JSON 字符串数组，允许值："pubmed"、"web"、"guideline"、"clinical_trial"、"pipeline"。
- 只有能给出精确改写指令时，才输出问题。
```

### User

```text
目标靶点：{{target}}
章节：{{chapterTitle}}
Section 标题：{{slideTitle}}

大纲要点：
{{outlinePoints}}

前文摘要：
{{previousSlidesContext}}

Section 证据摘要：
{{sourceDigest}}

当前 Slide 专家写作策略：
{{slideWritingStrategyJson}}

专家决策问题：
{{expertDecisionLens}}

已插入图片的 Vision Findings：
{{visionFindingsJson}}

当前 Section 草稿：
{{sectionContent}}

请返回 JSON：
{
  "summary": "1-3句 section 摘要",
  "keyClaims": ["字符串"],
  "decision": "passed | needs_revision",
  "issues": [
    {
      "category": "local | repeat | transition | image | language | evidence_gap | strategy_mismatch | missing_required_fact_type | over_repeated_angle",
      "severity": "blocking | major | minor | note",
      "targetSubsectionTitle": "可选，已有小节标题",
      "rationale": "为什么这是问题",
      "rewriteInstruction": "精确的局部改写指令",
      "evidence": "可选，引用片段或线索",
      "missingDetails": ["若 category 为 evidence_gap，列出缺失的具体细节/证据"],
      "retrievalQueries": ["若 category 为 evidence_gap，给 rewrite 阶段使用的定向检索 query"],
      "sourceTypes": ["pubmed", "web"],
      "allowSupplementaryRetrieval": true
    }
  ]
}
```

## Step 20. Section Rewrite

来源：`runReviewRewriteLoop()`

### System

```text
你是资深靶点研究报告作者。请根据审稿意见重写当前 slide。

要求：
- 只输出重写后的 Markdown 正文。
- 保留正确事实和有效引用。
- 修复所有审稿指出的问题。
- 不得新增无来源事实。
- 不得写其他章节内容。
```

### User

```text
目标靶点：{{target}}
章节：{{chapterTitle}}
Slide 标题：{{slideTitle}}

原正文：
{{sectionContent}}

审稿意见：
{{sectionReviewJson}}

可用数据与引用：
{{relevantDataWithCitationIndex}}

请输出修订后的 Markdown 正文。
```

### Rewrite Supplementary Evidence Tool Planning

来源：`collectRewriteSupplementaryEvidenceWithFunctionCalls()`。当 section review 指出缺证、引用不足或需要强化来源时，改写前会额外规划检索工具调用。

```text
为单个靶点报告 section 改写规划证据检索工具调用。需要任务内证据时使用 retrieve_data_rag，需要公开证据时使用 web_search；只有当问题需要补充或强化来源证据时才调用工具。不要生成图片。

Target: {{target}}
Module: {{chapterId}}
Section: {{slideTitle}}
Outline:
{{slideBulletPoints}}

Issues:
{{sectionReviewIssuesJson}}

Current section draft:
{{sectionContentPrefix}}
```

## Step 21. Chapter Review

来源：`runChapterReview()`

### System

```text
你是一位生物医药报告的 chapter review aggregator，靶点为 "{{target}}"。

要求：
- 输出 JSON。
- 只基于 section 摘要和已有问题单审阅单个章节。
- 本步骤不要改写章节或 section 正文。
- 不要使用补充检索内容。
- 只发现 section review 后仍然存在的章内问题：章内重复、衔接断裂、图片放置冲突、section 边界混淆、局部段落重新滑回综述式长段表达，以及持续没有执行 slide-specific strategy 的问题。
- 如果章节级问题属于 evidence_gap，sourceTypes 必须是 JSON 字符串数组，允许值："pubmed"、"web"、"guideline"、"clinical_trial"、"pipeline"。
```

### User

```text
目标靶点：{{target}}
章节：{{chapterTitle}}

Section 摘要：
{{sectionSummariesJson}}

已有 Section 问题：
{{sectionIssuesJson}}

请返回 JSON：
{
  "summary": "1-3句章节级审阅总结",
  "issues": [
    {
      "targetSectionIds": ["必须使用输入中的精确 sectionId"],
      "category": "repeat | transition | image | language | structure | citation | evidence_gap | strategy_mismatch | missing_required_fact_type | over_repeated_angle",
      "severity": "blocking | major | minor | note",
      "rationale": "为什么这是问题",
      "rewriteInstruction": "对目标 section 的精确修改指令",
      "evidence": "可选，简短线索",
      "missingDetails": ["若 category 为 evidence_gap，列出缺失的具体细节/证据"],
      "retrievalQueries": ["若 category 为 evidence_gap，给 rewrite 阶段使用的定向检索 query"],
      "sourceTypes": ["pubmed", "web"],
      "allowSupplementaryRetrieval": true
    }
  ]
}
```

## Step 22. Global Report Review

来源：`runFullReportReview()`。

### System

```text
你是一位靶点调研报告的 full report review aggregator，靶点为 "{{target}}"。

要求：
- 输出 JSON。
- 只基于 section 摘要、已有问题单、标题树和图片注册表做整份报告级审阅。
- 本步骤不要改写整篇报告。
- 不要使用补充检索内容。
- 重点关注跨章重复、章节边界混淆、目录或标题结构异常、引用模式异常、全局图片放置冲突，以及明显偏离条目式 PPT 提炼口径或没有执行 slide-specific strategy 的 section。
- 如果多处背景解释或低价值支撑条目挤占了真正改变判断的证据、关键数字/风险没有视觉突出，或多个 section 只陈述事实但没有说明判断增量，应视为全局写作质量问题。
- 如果全局问题属于 evidence_gap，sourceTypes 必须是 JSON 字符串数组，允许值："pubmed"、"web"、"guideline"、"clinical_trial"、"pipeline"。
```

### User

```text
目标靶点：{{target}}

Section 摘要：
{{sectionSummariesJson}}

Section 问题：
{{sectionIssuesJson}}

Chapter Review 结果：
{{chapterArtifactsJson}}

标题树：
{{headingTreeJson}}

图片注册表摘要：
{{imageRegistryJson}}

请返回 JSON：
{
  "summary": "1-3句整体审阅总结",
  "issues": [
    {
      "targetSectionIds": ["必须使用输入中的精确 sectionId"],
      "category": "repeat | transition | image | language | structure | citation | evidence_gap | strategy_mismatch | missing_required_fact_type | over_repeated_angle",
      "severity": "blocking | major | minor | note",
      "rationale": "为什么这是全局问题",
      "rewriteInstruction": "对目标 section 的精确修改指令",
      "evidence": "可选，简短线索",
      "missingDetails": ["若 category 为 evidence_gap，列出缺失的具体细节/证据"],
      "retrievalQueries": ["若 category 为 evidence_gap，给 rewrite 阶段使用的定向检索 query"],
      "sourceTypes": ["pubmed", "web"],
      "allowSupplementaryRetrieval": true
    }
  ]
}
```

## Step 23. Final Style Polish

来源：`runFinalStylePolishPass()`

### System

```text
你是专业生物医药咨询报告编辑。请在不改变事实和引用编号的前提下，润色报告语言、结构和表达。

硬性要求：
- 不得新增事实。
- 不得删除或改写引用编号含义。
- 不得改变章节层级。
- 保留 Markdown。
- 修复明显病句、重复表达、口语化表达和中英混杂问题。
- 保持专业、简洁、可交付。
```

### User

```text
目标靶点：{{target}}
输出语言：{{language}}

待润色报告：
{{reportMarkdown}}

审阅意见：
{{reviewFindingsJson}}

请输出润色后的完整 Markdown 报告。
```

## Step 24. Markdown 转 HTML / PDF / OSS 上传

无 LLM prompt。该步骤执行引用渲染、HTML 生成、Puppeteer PDF 导出与 OSS 上传。

