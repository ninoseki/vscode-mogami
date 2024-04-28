import { gemfileRegExp, parse } from "@/format/gemfile";

import { BaseGemHoverProvider } from "./baseGemHoverProvider";

export class GemfileHoverProvider extends BaseGemHoverProvider {
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
