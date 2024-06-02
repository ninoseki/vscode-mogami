import {
  PackageClientType,
  ParseFnType,
  ProjectFormatType,
  ProjectType,
} from "@/schemas";

export abstract class AbstractProject {
  dependencies: string[];
  source?: string;
  format: ProjectFormatType;

  constructor({ dependencies, source, format }: ProjectType) {
    this.dependencies = dependencies;
    this.source = source;
    this.format = format;
  }

  abstract getClient(): PackageClientType;
  abstract getRegex(): RegExp;
  abstract getParseFn(): ParseFnType;
}
