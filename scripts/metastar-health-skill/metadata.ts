import type { CapabilityMetadata } from "./types.ts";

export const capabilityMetadata = [
  {
    moduleName: "autocomplete",
    title: "实体补全",
    category: "sync-search",
    referenceFile: "references/sync-search.md",
    descriptionTopic: "实体补全",
  },
  {
    moduleName: "drugs",
    title: "药物搜索",
    category: "sync-search",
    referenceFile: "references/sync-search.md",
    descriptionTopic: "药物搜索",
  },
  {
    moduleName: "gbd",
    title: "GBD 疾病负担查询",
    category: "sync-search",
    referenceFile: "references/sync-search.md",
    descriptionTopic: "GBD 查询",
  },
  {
    moduleName: "hpa",
    title: "HPA 靶点画像",
    category: "sync-search",
    referenceFile: "references/sync-search.md",
    descriptionTopic: "HPA 画像",
  },
  {
    moduleName: "literature-fulltext",
    title: "文献全文存在性查询",
    category: "sync-search",
    referenceFile: "references/sync-search.md",
    descriptionTopic: "文献全文存在性查询",
  },
  {
    moduleName: "literature-process",
    title: "文献解析",
    category: "async-doc-processing",
    referenceFile: "references/async-doc-processing.md",
    descriptionTopic: "文献解析",
  },
  {
    moduleName: "ocr",
    title: "OCR 文档识别",
    category: "async-doc-processing",
    referenceFile: "references/async-doc-processing.md",
    descriptionTopic: "OCR",
  },
  {
    moduleName: "papers",
    title: "论文搜索",
    category: "sync-search",
    referenceFile: "references/sync-search.md",
    descriptionTopic: "论文搜索",
  },
  {
    moduleName: "preclinical-literature",
    title: "文献临床前数据检索",
    category: "sync-search",
    referenceFile: "references/sync-search.md",
    descriptionTopic: "文献临床前数据检索",
  },
  {
    moduleName: "target-assistant",
    title: "靶点助手",
    category: "target-workflows",
    referenceFile: "references/target-workflows.md",
    descriptionTopic: "靶点助手",
  },
  {
    moduleName: "target-quick-assessment",
    title: "靶点快速评估",
    category: "target-workflows",
    referenceFile: "references/target-workflows.md",
    descriptionTopic: "靶点快速评估",
  },
  {
    moduleName: "text-extraction",
    title: "临床前文本提取",
    category: "async-doc-processing",
    referenceFile: "references/async-doc-processing.md",
    descriptionTopic: "临床前文本提取",
  },
  {
    moduleName: "tools",
    title: "通用检索工具",
    category: "sync-search",
    referenceFile: "references/sync-search.md",
    descriptionTopic: "专利、临床试验、药物交易、资讯、PubMed、网页、会议和公司演示文稿检索",
  },
] as const satisfies readonly CapabilityMetadata[];

export const infrastructureModuleNames = new Set(["client", "config", "polling", "types", "upload"]);

export const capabilityMetadataByModule: ReadonlyMap<string, CapabilityMetadata> = new Map(
  capabilityMetadata.map((metadata): [string, CapabilityMetadata] => [metadata.moduleName, metadata]),
);
