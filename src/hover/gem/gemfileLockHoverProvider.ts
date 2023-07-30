import { GemDependency } from "@/types";
import { extractDependencyByMapper, gemfileLockMapper } from "@/utils/gem";
import { gemfileLockRegexp } from "@/utils/regexps";

import { BaseGemHoverProvider } from "./baseGemHoverProvider";

export function extractDependency(line: string): GemDependency | undefined {
  return extractDependencyByMapper(line, gemfileLockMapper);
}

export class GemfileLockHoverProvider extends BaseGemHoverProvider {
  constructor() {
    super({
      documentSelector: {
        pattern: "**/Gemfile.lock",
        scheme: "file",
      },
      regexp: gemfileLockRegexp,
      mapper: gemfileLockMapper,
    });
  }
}
