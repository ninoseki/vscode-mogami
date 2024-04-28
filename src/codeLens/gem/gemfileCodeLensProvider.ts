import { gemfileRegExp, parse } from "@/format/gemfile";

import { BaseGemCodeLensProvider } from "./baseGemCodeLensProvider";

export class GemfileCodelensProvider extends BaseGemCodeLensProvider {
  constructor() {
    super({
      documentSelector: {
        pattern: "**/Gemfile",
        scheme: "file",
      },
      regExp: gemfileRegExp,
      parse: parse,
    });
  }
}
