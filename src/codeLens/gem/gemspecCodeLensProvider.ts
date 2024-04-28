import { gemspecRegExp } from "@/format/gemspec";
import { parse } from "@/format/gemspec";

import { BaseGemCodeLensProvider } from "./baseGemCodeLensProvider";

export class GemspecCodelensProvider extends BaseGemCodeLensProvider {
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
