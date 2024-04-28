import { gemspecRegExp, parse } from "@/format/gemspec";

import { BaseGemHoverProvider } from "./baseGemHoverProvider";

export class GemspecHoverProvider extends BaseGemHoverProvider {
  constructor() {
    super({
      documentSelector: {
        pattern: "**/*.gemspec",
        scheme: "file",
      },
      regExp: gemspecRegExp,
      parse: parse,
    });
  }
}
