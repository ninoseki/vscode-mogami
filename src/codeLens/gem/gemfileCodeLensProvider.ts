import { gemfileMapper } from "@/utils/gem";
import { gemfileRegexp } from "@/utils/regexps";

import { BaseGemCodeLensProvider } from "./baseGemCodeLensProvider";

export class GemfileCodelensProvider extends BaseGemCodeLensProvider {
  constructor() {
    super({
      documentSelector: {
        pattern: "**/Gemfile",
        scheme: "file",
      },
      regexp: gemfileRegexp,
      mapper: gemfileMapper,
    });
  }
}
