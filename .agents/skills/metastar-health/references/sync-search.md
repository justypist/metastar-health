# 同步查询 API

覆盖论文搜索、实体补全、药物搜索、文献临床前数据检索、文献全文存在性查询、HPA 靶点画像、GBD 查询和 v1.8.0 通用检索工具。

以下示例只展示调用形状，不应在未准备认证和用户输入时自动执行。

## 函数清单

- `searchPapers(params, options?)`：按疾病、药物、靶点或公司检索论文。
- `getPapersHealth(options?)`：检查论文搜索服务健康状态。
- `autocompleteEntities(params, options?)`：补全疾病、药物、靶点或公司实体。
- `searchDrugs(params, options?)`：按实体、阶段和治疗方式检索药物管线表。
- `searchPreclinicalLiterature(params, options?)`：按靶点、疾病或公司检索文献来源临床前数据。
- `lookupLiteratureFulltext(params, options?)`：通过 PMID 或 DOI 查询平台本地 PubMed 全文 chunks 是否存在。
- `getHpaProfile(params, options?)`：查询 HPA 靶点表达和疾病 panel 画像。
- `searchGbdData(params, options?)`：查询 GBD 疾病负担数据。
- `executeTool(toolName, params, options?)`：调用 v1.8.0 通用工具同步 execute 接口。
- `submitToolTask(toolName, params, options?)`、`getToolTaskResult(taskId, options?)`、`pollToolTaskResult(taskId, options?)`：长耗时工具的 submit + 轮询。
- 工具便捷函数：`searchPreclinicalFromPatent`、`searchPatentCore`、`searchClinicalTrialRegistrations`、`searchClinicalTrialResults`、`searchDrugDeals`、`analyzeTargetCompetition`、`searchPharmaNews`、`searchPubMed`、`searchMedwatch`、`searchClinicalTrials`、`searchPatents`、`searchWeb`、`searchReviewLiterature`、`searchConferencePosters`、`searchConferencePresentations`。

## 通用调用约定

- `options` 使用 `OpenApiRequestOptions`，可传入认证、base URL、fetch 覆盖或请求配置。
- 同步查询函数返回 Promise，但远端请求完成后直接返回业务数据，不需要 submit/result 轮询。
- v1.8.0 工具既可同步 `execute`，也可异步 `submit` 后用 `pollToolTaskResult` 轮询；除非用户要求后台任务或请求可能很慢，优先使用同步便捷函数。
- 建议显式设置分页或数量上限，例如 `limit`、`page` / `pageSize`，避免一次请求返回过多数据。

```ts
// 仅在用户提供查询条件并授权访问开放 API 后手动调用。
const result = await searchPapers({ disease: "lung cancer", target: "EGFR", limit: 10 });
```

## 论文搜索

`searchPapers` 适用于按研究实体检索相关论文。

关键参数：

- `disease?: string`：疾病名称。
- `drug?: string`：药物名称。
- `target?: string`：靶点名称。
- `company?: string`：公司名称。
- `limit?: number`：返回数量上限。

返回结构要点：

- `data: PaperRecord[]`：论文记录列表，包含标题、PMID、DOI、期刊、摘要、实体命中字段和 URL。
- `total: number`：匹配总数。
- `query`：服务端归一化后的查询条件。

`getPapersHealth` 仅用于服务健康检查，返回 `status`、`timestamp`、`service` 和 `elasticsearch` 等字段。

## 实体补全

`autocompleteEntities` 适用于用户输入不完整实体名时先获取候选实体。

关键参数：

- `query: string`：用户输入的关键词，必填。
- `size?: number`：候选数量。
- `type?: EntityType`：限制实体类型，可用于疾病、药物、靶点或公司等场景。

返回结构要点：

- `suggestions: AutocompleteEntity[]`：候选实体。
- `total: number`：候选总数。
- `query: string`：实际查询词。

## 药物搜索

`searchDrugs` 适用于按疾病、药物、靶点、公司、研发阶段或治疗方式检索药物管线。

关键参数：

- `diseases?: EntityInput[]`、`drugs?: EntityInput[]`、`targets?: EntityInput[]`、`companies?: EntityInput[]`：实体数组。
- `statuses?: string[]`：研发或适应症阶段过滤。
- `modalities?: string[]`：治疗方式过滤。
- `limit?: number`：返回数量上限。

返回结构要点：

- `data.columns`：表格列定义。
- `data.rows`：药物记录，包含 `genericDrugName`、`company`、`disease`、`target`、`modality`、`highestPipelineStage` 等字段。
- `query`：服务端归一化后的查询条件。

## 文献临床前数据检索

`searchPreclinicalLiterature` 适用于按靶点、疾病、公司组合检索文献来源临床前 tool 数据。只在用户提供实体条件并授权访问开放 API 后调用。v1.9 起返回结果按文档对象分页，不展开 `model_info` / `study`。

关键参数：

- `targets?: EntityInput[]`、`diseases?: EntityInput[]`、`companies?: EntityInput[]`：至少提供一类实体。
- `page?: number`：页码，从 1 开始，默认 1。
- `pageSize?: number`：每页返回文档对象数量，默认 50，单页最多 100。

返回结构要点：

- `data.status`：同步成功时为 `completed`。
- `data.result`：文献级记录数组，常见字段包括 `PMID`、`title`、`Target`、`Antibody_Name`、`Clinical_Phase`、`source_type`、`pubdate`、`indication`、`model_info`。
- `data.count`、`data.page`、`data.pageSize`、`data.hasMore`、`data.nextPage`：分页信息。
- `model_info` 保留原始模型详情；该同步接口暂不返回 `image_info` / `full_text`。

## 文献全文存在性查询

`lookupLiteratureFulltext` 适用于在做 RAG、证据追溯或全文阅读前，通过 PMID 或 DOI 判断平台本地全文库是否已有 PubMed 全文 chunks。只有用户明确提供 PMID/DOI 并授权访问开放 API 后才调用。

关键参数：

- `pmid?: string`：PubMed ID；已知 PMID 时优先传该字段。
- `doi?: string`：DOI；当 DOI 未被平台摘要库收录时可能无法命中。
- `limit?: number`：返回 chunk 数量上限，默认 100，范围 1-1000。

返回结构要点：

- `data.fulltextExists`：平台全文库是否返回至少一个 chunk。
- `data.article`：摘要库命中后的文献基础信息，包含 `pmid`、`doi`、`title`、`journalName`、`pubdate`。
- `data.chunks`：全文 chunk 数组，常见字段包括 `chunkId`、`parentPmid`、`chunkType`、`sectionKey`、`order`、`content`。
- `data.total`、`data.limit`：本次返回 chunk 数量和实际生效上限。
- 未命中或无本地全文时仍是成功响应，但 `fulltextExists=false`、`chunks=[]`；不要把未命中直接理解为文献不存在。

## HPA 靶点画像

`getHpaProfile` 适用于查询靶点表达、蛋白功能、组织表达和推荐疾病 panel。

关键参数：

- `target: string`：靶点名，必填。
- `aliases?: string | string[]`：靶点别名；数组会以分号拼接后作为查询参数发送。

返回结构要点：

- `data: HpaProfile | null`：命中时包含表达概览、蛋白功能、细胞定位、疾病 panel 和目标名列表。
- `query.target` 与 `query.aliases`：服务端使用的查询条件。

## GBD 查询

`searchGbdData` 适用于查询疾病负担、流行病学指标和年份范围数据。

关键参数：

- `causeName?: string`：疾病或原因名称。
- `measureName?: string`：指标，例如发病、死亡或 DALYs。
- `locationName?: string`：地区。
- `sexName?: "Male" | "Female" | "Both"`：性别。
- `metricName?: string`：数值指标类型。
- `year?: number` 或 `startYear?: number`、`endYear?: number`：年份过滤。
- `limit?: number`：返回数量上限。

返回结构要点：

- `data.rows`：包含 `causeName`、`measureName`、`locationName`、`sexName`、`ageName`、`metricName`、`year`、`value`、`upper`、`lower` 等字段。
- `data.total`：匹配总数。
- `query`：请求查询条件。

## v1.8.0 通用检索工具

通用工具位于 `/api/v1/tools/<toolName>`，同步调用返回 `ToolExecuteResponse`，异步调用先返回 `taskId`，完成后 `data.result` 与同步结构一致。异步失败时 `data.error` 可能是字符串或包含 `code/message` 的对象。

工具名与便捷函数：

- `preclinical_from_patent`：`searchPreclinicalFromPatent`，专利临床前数据。
- `zhy_api_synapse_patent_core_search`：`searchPatentCore`，智慧芽专利核心库。
- `zhy_api_synapse_clinical_trial_search`：`searchClinicalTrialRegistrations`，临床试验注册。
- `zhy_api_synapse_ct_result_search`：`searchClinicalTrialResults`，临床试验结果。
- `zhy_api_synapse_drug_deal_search`：`searchDrugDeals`，药物交易。
- `zhy_api_synapse_target_analysis`：`analyzeTargetCompetition`，靶点竞争分析。
- `zhy_api_synapse_news_search`：`searchPharmaNews`，医药行业资讯。
- `search_pubmed`：`searchPubMed`，医学文献。
- `search_medwatch`：`searchMedwatch`，企业动态。
- `search_trial`：`searchClinicalTrials`，临床试验全域。
- `search_patent`：`searchPatents`，专利综合。
- `search_engine`：`searchWeb`，实时网页。
- `search_review_combine`：`searchReviewLiterature`，靶点综述文献。
- `search_conference_posters`：`searchConferencePosters`，会议洞察。
- `search_conference_presentations`：`searchConferencePresentations`，公司演示文稿。

常见参数模式：

- 智慧芽关键词类工具使用 `keyword: string | string[]`、`searchType?: "drug" | "target" | "disease" | "organization" | "company"`、`limit?: number`。
- 实体集合类工具使用 `targets?`、`diseases?`、`drugs?`、`companies?`、`topics?`、`limit?`。
- PubMed 使用 `query` 和 `maxArticles`。
- 实时网页使用 `query`、`engines` 和 `maxResults`。

```ts
// 同步检索。
const pubmed = await searchPubMed({ query: "EGFR lung cancer resistance", maxArticles: 20 });

// 长耗时场景可显式异步提交。
const submission = await submitToolTask("search_engine", { query: "EGFR exon 20 latest trial" });
const task = await pollToolTaskResult(submission.taskId, { intervalMs: 5000, timeoutMs: 120000 });
```
