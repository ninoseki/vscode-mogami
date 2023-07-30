import { gemspecMapper } from "@/utils/gem";
import { gemspecRegexp } from "@/utils/regexps";

import { BaseGemCodeLensProvider } from "./baseGemCodeLensProvider";

export class GemspecCodelensProvider extends BaseGemCodeLensProvider {
  constructor() {
    super({
      documentSelector: {
        pattern: "**/*.gemspec",
        scheme: "file",
      },
      regexp: gemspecRegexp,
      mapper: gemspecMapper,
    });
  }
}
