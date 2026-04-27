export type CapabilityCategory = "sync-search" | "async-doc-processing" | "target-workflows";

export interface CapabilityMetadata {
  moduleName: string;
  title: string;
  category: CapabilityCategory;
  referenceFile: string;
  descriptionTopic: string;
}

export interface ModuleExportInfo {
  moduleName: string;
  exportPath: string;
  functions: string[];
}

export interface ApiCapabilityScanResult {
  exportedModules: ModuleExportInfo[];
  businessCapabilities: Array<CapabilityMetadata & { functions: string[] }>;
  infrastructureModules: ModuleExportInfo[];
  modulesWithoutMetadata: ModuleExportInfo[];
}

export interface SkillGenerationResult {
  checked: boolean;
  changedFiles: string[];
}

export interface SkillStructureValidationResult {
  checkedFiles: string[];
}

export interface SkillFileOptions {
  cwd?: string;
  skillDir?: string;
}
