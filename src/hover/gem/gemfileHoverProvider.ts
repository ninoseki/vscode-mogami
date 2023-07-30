import { gemfileMapper } from "@/utils/gem";
import { gemfileRegexp } from "@/utils/regexps";

import { BaseGemHoverProvider } from "./baseGemHoverProvider";

export class GemfileHoverProvider extends BaseGemHoverProvider {
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
