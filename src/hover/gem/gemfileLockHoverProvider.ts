import { gemfileLockRegExp, parse } from "@/format/gemfileLock";

import { BaseGemHoverProvider } from "./baseGemHoverProvider";

export class GemfileLockHoverProvider extends BaseGemHoverProvider {
  constructor() {
    super({
      documentSelector: {
        pattern: "**/Gemfile.lock",
        scheme: "file",
      },
      regExp: gemfileLockRegExp,
      parse: parse,
    });
  }
}
