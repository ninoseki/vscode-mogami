import { gemspecMapper } from "@/utils/gem";
import { gemspecRegexp } from "@/utils/regexps";

import { BaseGemHoverProvider } from "./baseGemHoverProvider";

export class GemspecHoverProvider extends BaseGemHoverProvider {
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
