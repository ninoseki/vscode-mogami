import { parse } from "@/format/gemspec";

import { BaseGemCodeLensProvider } from "./baseGemCodeLensProvider";

export class GemspecCodelensProvider extends BaseGemCodeLensProvider {
  constructor() {
    super(
      {
        pattern: "**/*.gemspec",
        scheme: "file",
      },
      {
        parse,
      },
    );
  }
}
