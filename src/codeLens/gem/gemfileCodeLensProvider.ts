import { parse } from "@/format/gemfile";

import { BaseGemCodeLensProvider } from "./baseGemCodeLensProvider";

export class GemfileCodelensProvider extends BaseGemCodeLensProvider {
  constructor() {
    super(
      {
        pattern: "**/Gemfile",
        scheme: "file",
      },
      {
        parse,
      },
    );
  }
}
