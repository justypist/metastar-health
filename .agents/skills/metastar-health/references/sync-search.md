# 同步查询 API

覆盖论文搜索、实体补全、药物搜索、HPA 靶点画像和 GBD 查询。

以下示例只展示调用形状，不应在未准备认证和用户输入时自动执行。

## 函数清单

- `searchPapers(params, options?)`：按疾病、药物、靶点或公司检索论文。
- `getPapersHealth(options?)`：检查论文搜索服务健康状态。
- `autocompleteEntities(params, options?)`：补全疾病、药物、靶点或公司实体。
- `searchDrugs(params, options?)`：按实体、阶段和治疗方式检索药物管线表。
- `getHpaProfile(params, options?)`：查询 HPA 靶点表达和疾病 panel 画像。
- `searchGbdData(params, options?)`：查询 GBD 疾病负担数据。

## 通用调用约定

- `options` 使用 `OpenApiRequestOptions`，可传入认证、base URL、fetch 覆盖或请求配置。
- 同步查询函数返回 Promise，但远端请求完成后直接返回业务数据，不需要 submit/result 轮询。
- 建议显式设置 `limit`，避免一次请求返回过多数据。

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
